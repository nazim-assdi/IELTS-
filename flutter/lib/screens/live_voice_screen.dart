import 'dart:async';
import 'dart:convert';
import 'package:audio_stream_player/audio_stream_player.dart';
import 'package:flutter/material.dart';
import 'package:record/record.dart';
import 'package:web_socket_channel/web_socket_channel.dart';

class LiveVoiceScreen extends StatefulWidget {
  const LiveVoiceScreen({super.key, required this.baseUrl, required this.initialPart});
  final String baseUrl;
  final String initialPart;

  @override
  State<LiveVoiceScreen> createState() => _LiveVoiceScreenState();
}

class _LiveVoiceScreenState extends State<LiveVoiceScreen> {
  final recorder = AudioRecorder();
  WebSocketChannel? channel;
  StreamSubscription<dynamic>? socketSubscription;
  StreamSubscription<dynamic>? audioSubscription;
  AudioStreamPlayer? player;
  Future<void> audioQueue = Future<void>.value();
  final List<Map<String, String>> transcript = [];
  String part = 'Part 1';
  String status = 'Not connected';
  bool connecting = false, connected = false, microphoneOn = false, examinerSpeaking = false;

  @override
  void initState() {
    super.initState();
    part = widget.initialPart;
  }

  void _notice(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  Uri _liveUri() {
    final base = Uri.parse(widget.baseUrl.trim());
    return base.replace(
      scheme: base.scheme == 'https' ? 'wss' : 'ws',
      path: '/api/live',
      queryParameters: {'part': part},
    );
  }

  Future<void> connect() async {
    if (connecting || connected) return;
    setState(() { connecting = true; status = 'Connecting to Gemini Live…'; transcript.clear(); });
    try {
      final ws = WebSocketChannel.connect(_liveUri());
      channel = ws;
      socketSubscription = ws.stream.listen(
        (event) => unawaited(_handleServerMessage(event)),
        onError: (Object error) {
          if (mounted) {
            setState(() { connected = false; connecting = false; status = 'Connection error'; });
            _notice('Live voice connection error: $error');
          }
        },
        onDone: () {
          if (mounted) {
            setState(() { connected = false; connecting = false; microphoneOn = false; status = 'Disconnected'; });
          }
        },
      );
      await ws.ready.timeout(const Duration(seconds: 20));
      if (mounted) setState(() => status = 'Connected to server. Starting live AI…');
    } catch (error) {
      if (mounted) setState(() { connecting = false; status = 'Could not connect'; });
      _notice('Could not connect to the live server: $error');
      await disconnect();
    }
  }

  Future<void> _handleServerMessage(dynamic event) async {
    try {
      final payload = jsonDecode(event.toString()) as Map<String, dynamic>;
      final type = payload['type']?.toString();
      if (type == 'ready') {
        player ??= await AudioStreamPlayer.create(
          sampleRate: 24000,
          channels: 1,
          format: PcmFormat.s16le,
        );
        await player!.play();
        if (!mounted) return;
        setState(() {
          connecting = false;
          connected = true;
          status = 'Live • ${payload['model'] ?? 'Gemini'} • ${payload['part'] ?? part}';
        });
        await startMicrophone();
      } else if (type == 'audio') {
        final bytes = base64Decode(payload['data']?.toString() ?? '');
        // Ignore tiny/invalid fragments; PCM16 audio must contain complete samples.
        if (bytes.length < 32) return;
        audioQueue = audioQueue.then((_) async {
          final activePlayer = player;
          if (activePlayer != null && bytes.isNotEmpty) {
            await activePlayer.feed(bytes);
          }
        }).catchError((_) {});
        if (mounted) setState(() => examinerSpeaking = true);
      } else if (type == 'input_transcript') {
        _addTranscript('You', payload['text']?.toString() ?? '');
      } else if (type == 'output_transcript') {
        _addTranscript('Examiner', payload['text']?.toString() ?? '');
      } else if (type == 'turn_complete') {
        if (mounted) setState(() => examinerSpeaking = false);
      } else if (type == 'interrupted') {
        await player?.stop();
        if (mounted) setState(() => examinerSpeaking = false);
      } else if (type == 'session_limit') {
        _notice(payload['message']?.toString() ?? 'The live session has ended.');
        await disconnect();
      } else if (type == 'error') {
        _notice(payload['message']?.toString() ?? 'Gemini Live returned an error.');
      } else if (type == 'closed') {
        if (mounted) setState(() => status = payload['message']?.toString() ?? 'Live session closed');
      }
    } catch (error) {
      _notice('Could not process a live audio response: $error');
    }
  }

  void _addTranscript(String speaker, String text) {
    if (text.trim().isEmpty || !mounted) return;
    setState(() {
      transcript.add({'speaker': speaker, 'text': text.trim()});
      if (transcript.length > 80) transcript.removeAt(0);
    });
  }

  Future<void> startMicrophone() async {
    if (!connected || microphoneOn) return;
    try {
      final allowed = await recorder.hasPermission();
      if (!allowed) {
        _notice('Please allow microphone permission to start the live conversation.');
        return;
      }
      final stream = await recorder.startStream(const RecordConfig(
        encoder: AudioEncoder.pcm16bits,
        sampleRate: 16000,
        numChannels: 1,
        autoGain: true,
        echoCancel: true,
        noiseSuppress: true,
      ));
      audioSubscription = stream.listen((chunk) {
        final ws = channel;
        if (microphoneOn && connected && ws != null) {
          ws.sink.add(jsonEncode({'type': 'audio', 'data': base64Encode(chunk)}));
        }
      }, onError: (Object error) {
        _notice('Microphone stream error: $error');
      });
      if (mounted) setState(() { microphoneOn = true; status = 'Listening • Speak naturally'; });
    } catch (error) {
      _notice('Could not start microphone: $error');
    }
  }

  Future<void> stopMicrophone() async {
    await audioSubscription?.cancel();
    audioSubscription = null;
    try { await recorder.stop(); } catch (_) {}
    // Tell Gemini that the current microphone stream has ended so VAD can close the turn.
    final ws = channel;
    if (connected && ws != null) {
      try { ws.sink.add(jsonEncode({'type': 'audio_stream_end'})); } catch (_) {}
    }
    if (mounted) setState(() { microphoneOn = false; if (connected) status = 'Connected • Microphone paused'; });
  }

  Future<void> disconnect() async {
    await stopMicrophone();
    final ws = channel;
    channel = null;
    try { await ws?.sink.close(); } catch (_) {}
    await socketSubscription?.cancel();
    socketSubscription = null;
    try { await player?.stop(); } catch (_) {}
    try { await player?.dispose(); } catch (_) {}
    player = null;
    if (mounted) setState(() {
      connected = false;
      connecting = false;
      examinerSpeaking = false;
      status = 'Not connected';
    });
  }

  @override
  void dispose() {
    unawaited(stopMicrophone());
    unawaited(socketSubscription?.cancel() ?? Future<void>.value());
    unawaited(channel?.sink.close() ?? Future<void>.value());
    unawaited(player?.dispose() ?? Future<void>.value());
    unawaited(recorder.dispose());
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(title: const Text('Real-time IELTS Voice Chat')),
    body: Column(children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 10),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('Talk naturally with your AI IELTS examiner. The AI listens and answers with live voice; you can speak over it to interrupt.', style: TextStyle(height: 1.45)),
          const SizedBox(height: 12),
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'Part 1', label: Text('Part 1')),
              ButtonSegment(value: 'Part 2', label: Text('Part 2')),
              ButtonSegment(value: 'Part 3', label: Text('Part 3')),
            ],
            selected: {part},
            onSelectionChanged: connected || connecting ? null : (values) => setState(() => part = values.first),
          ),
          const SizedBox(height: 10),
          Row(children: [
            Icon(connected ? Icons.cloud_done : connecting ? Icons.sync : Icons.cloud_off, color: connected ? Colors.green : Colors.orange),
            const SizedBox(width: 8),
            Expanded(child: Text(status, style: const TextStyle(fontWeight: FontWeight.w700))),
            if (examinerSpeaking) const Padding(padding: EdgeInsets.only(left: 8), child: Icon(Icons.graphic_eq, color: Color(0xFF059669))),
          ]),
        ]),
      ),
      const Divider(height: 1),
      Expanded(
        child: transcript.isEmpty
            ? Center(child: Padding(
                padding: const EdgeInsets.all(28),
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  Icon(Icons.record_voice_over_rounded, size: 64, color: Theme.of(context).colorScheme.primary),
                  const SizedBox(height: 12),
                  const Text('Your live conversation will appear here.', textAlign: TextAlign.center, style: TextStyle(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 5),
                  const Text('Tap Start Live Chat and answer the examiner aloud.', textAlign: TextAlign.center),
                ]),
              ))
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: transcript.length,
                itemBuilder: (context, index) {
                  final item = transcript[index];
                  final isUser = item['speaker'] == 'You';
                  return Align(
                    alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                    child: Container(
                      constraints: const BoxConstraints(maxWidth: 620),
                      margin: const EdgeInsets.only(bottom: 10),
                      padding: const EdgeInsets.all(13),
                      decoration: BoxDecoration(
                        color: isUser ? Theme.of(context).colorScheme.primaryContainer : Theme.of(context).colorScheme.surfaceContainerHighest,
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(item['speaker']!.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
                        const SizedBox(height: 5),
                        Text(item['text']!),
                      ]),
                    ),
                  );
                },
              ),
      ),
      SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(16, 10, 16, 14),
          child: Column(children: [
            if (connected) ...[
              FilledButton.tonalIcon(
                onPressed: microphoneOn ? stopMicrophone : startMicrophone,
                icon: Icon(microphoneOn ? Icons.pause_circle_outline : Icons.mic),
                label: Text(microphoneOn ? 'Pause microphone' : 'Resume microphone'),
              ),
              const SizedBox(height: 8),
            ],
            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: connecting ? null : connected ? disconnect : connect,
                icon: Icon(connected ? Icons.call_end : Icons.mic),
                label: Text(connecting ? 'Connecting…' : connected ? 'End Live Chat' : 'Start Live Chat'),
                style: FilledButton.styleFrom(
                  backgroundColor: connected ? Colors.red.shade700 : null,
                  foregroundColor: connected ? Colors.white : null,
                  padding: const EdgeInsets.symmetric(vertical: 15),
                ),
              ),
            ),
            const SizedBox(height: 6),
            const Text('Internet required • Practice sessions are limited to 5 minutes each.', style: TextStyle(fontSize: 11), textAlign: TextAlign.center),
          ]),
        ),
      ),
    ]),
  );
}

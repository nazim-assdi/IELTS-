import 'dart:async';
import 'dart:convert';
import 'package:audio_stream_player/audio_stream_player.dart';
import 'package:flutter/material.dart';
import 'package:record/record.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/gemini_api.dart';
import '../services/progress_store.dart';
import 'package:web_socket_channel/web_socket_channel.dart';
import '../theme/ielts_theme.dart';
import '../widgets/premium_ui.dart';

class LiveVoiceScreen extends StatefulWidget {
  const LiveVoiceScreen({super.key, required this.baseUrl, required this.initialPart, required this.prefs});
  final String baseUrl;
  final String initialPart;
  final SharedPreferences prefs;

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
  int playbackGeneration = 0;
  bool playerStarted = false;
  final List<Map<String, String>> transcript = [];
  String part = 'Part 1';
  String status = 'Not connected';
  bool connecting = false, connected = false, microphoneOn = false, examinerSpeaking = false, evaluating = false;

  @override
  void initState() {
    super.initState();
    part = widget.initialPart;
  }

  void _notice(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _evaluateTranscript() async {
    if (evaluating) return;
    final sample = transcript
        .where((item) => item['speaker'] == 'You')
        .map((item) => item['text'] ?? '')
        .join(' ')
        .trim();
    if (sample.length < 20) {
      _notice('Complete a longer spoken answer before requesting feedback.');
      return;
    }
    setState(() => evaluating = true);
    try {
      final result = await GeminiApi(baseUrl: widget.baseUrl).evaluate(
        speech: sample.length > 7000 ? sample.substring(sample.length - 7000) : sample,
        part: part,
      );
      await ProgressStore(widget.prefs).recordSpeakingEvaluation(result);
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (dialogContext) => AlertDialog(
          title: Text('AI speaking estimate: ${result['overallBand'] ?? '—'}'),
          content: SingleChildScrollView(child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(result['assessmentType']?.toString() ?? 'Practice estimate only; not an official IELTS result.', style: const TextStyle(color: IeltsPalette.muted, fontSize: 11, height: 1.4)),
              const SizedBox(height: 12),
              _evaluationLine('Fluency & coherence', result['fluencyCoherence']),
              _evaluationLine('Lexical resource', result['lexicalResource']),
              _evaluationLine('Grammar', result['grammaticalRangeAccuracy']),
              _evaluationLine('Pronunciation', result['pronunciation']),
              if (result['strengths'] is List) ...[
                const SizedBox(height: 7),
                const Text('Strengths', style: TextStyle(fontWeight: FontWeight.w900)),
                ...((result['strengths'] as List).map((item) => Text('• ${item.toString()}', style: const TextStyle(fontSize: 12)))),
              ],
              if (result['improvements'] is List) ...[
                const SizedBox(height: 7),
                const Text('Next improvements', style: TextStyle(fontWeight: FontWeight.w900)),
                ...((result['improvements'] as List).map((item) => Text('• ${item.toString()}', style: const TextStyle(fontSize: 12)))),
              ],
            ],
          )),
          actions: [TextButton(onPressed: () => Navigator.pop(dialogContext), child: const Text('Close'))],
        ),
      );
    } catch (error) {
      if (mounted) _notice('Could not evaluate this conversation: ${error.toString().replaceFirst('Exception: ', '')}');
    } finally {
      if (mounted) setState(() => evaluating = false);
    }
  }

  Widget _evaluationLine(String title, dynamic value) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(title, style: const TextStyle(color: IeltsPalette.emerald, fontWeight: FontWeight.w900, fontSize: 11)),
      const SizedBox(height: 2),
      Text(value?.toString() ?? 'Not assessed', style: const TextStyle(fontSize: 12, height: 1.4)),
    ]),
  );

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
      // Prepare the output player directly from the user's Start tap. The server sends
      // its greeting as soon as the Live session is ready, so waiting until the first
      // audio packet can drop the opening words on slower devices.
      await _prepareAudioPlayer();
      final ws = WebSocketChannel.connect(_liveUri());
      channel = ws;
      socketSubscription = ws.stream.listen(
        (event) => unawaited(_handleServerMessage(event)),
        onError: (Object error) {
          if (mounted) {
            setState(() { connected = false; connecting = false; microphoneOn = false; status = 'Connection lost'; });
            _notice('Live voice connection error: $error');
            unawaited(disconnect());
          }
        },
        onDone: () {
          if (mounted) {
            setState(() { connected = false; connecting = false; microphoneOn = false; status = 'Disconnected'; });
            unawaited(stopMicrophone());
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

  Future<void> _prepareAudioPlayer() async {
    player ??= await AudioStreamPlayer.create(
      sampleRate: 24000,
      channels: 1,
      format: PcmFormat.s16le,
    );
    if (!playerStarted) {
      await player!.play();
      playerStarted = true;
    }
  }

  Future<void> _finishAudioTurn() async {
    final generation = playbackGeneration;
    audioQueue = audioQueue.then((_) async {
      if (generation != playbackGeneration) return;
      final activePlayer = player;
      if (activePlayer == null || !playerStarted) return;
      try {
        await activePlayer.endOfStream();
      } finally {
        if (generation == playbackGeneration) playerStarted = false;
      }
    }).catchError((_) {
      if (generation == playbackGeneration) playerStarted = false;
    });
    await audioQueue;
    if (mounted && generation == playbackGeneration) {
      setState(() => examinerSpeaking = false);
    }
  }

  Future<void> _handleServerMessage(dynamic event) async {
    try {
      final payload = jsonDecode(event.toString()) as Map<String, dynamic>;
      final type = payload['type']?.toString();
      if (type == 'ready') {
        await _prepareAudioPlayer();
        if (!mounted) return;
        setState(() {
          connecting = false;
          connected = true;
          status = 'Live • ${payload['model'] ?? 'Gemini'} • ${payload['part'] ?? part}';
        });
        await startMicrophone();
      } else if (type == 'audio') {
        final bytes = base64Decode(payload['data']?.toString() ?? '');
        if (bytes.isEmpty) return;
        final generation = playbackGeneration;
        audioQueue = audioQueue.then((_) async {
          if (generation != playbackGeneration) return;
          if (generation != playbackGeneration) return;
          await _prepareAudioPlayer();
          final activePlayer = player;
          if (activePlayer == null || generation != playbackGeneration) return;
          // Each completed utterance drains the player back to idle. A following
          // response must start playback again before feeding its first PCM chunk.
          await activePlayer.feed(bytes);
        }).catchError((_) {});
        if (mounted) setState(() => examinerSpeaking = true);
      } else if (type == 'input_transcript') {
        _addTranscript('You', payload['text']?.toString() ?? '');
      } else if (type == 'output_transcript') {
        _addTranscript('Examiner', payload['text']?.toString() ?? '');
      } else if (type == 'turn_complete') {
        // The player needs an explicit end marker to drain this utterance and return
        // to idle. Without it, subsequent examiner turns can remain silent.
        await _finishAudioTurn();
      } else if (type == 'interrupted') {
        // Stop immediately: queuing stop behind endOfStream would make barge-in wait
        // until the entire current spoken answer had drained.
        playbackGeneration++;
        playerStarted = false;
        final previousAudioQueue = audioQueue;
        audioQueue = Future<void>.value();
        try {
          await player?.stop();
        } catch (_) {}
        unawaited(previousAudioQueue.catchError((_) {}));
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
        // 1,280 bytes at 16 kHz mono PCM16 = 40 ms per packet.
        // Small packets reduce conversational latency without starving the Live model.
        streamBufferSize: 1280,
      ));
      if (!mounted) {
        await recorder.stop();
        return;
      }
      setState(() { microphoneOn = true; status = 'Listening • Speak naturally'; });
      audioSubscription = stream.listen((chunk) {
        final ws = channel;
        if (microphoneOn && connected && ws != null && chunk.isNotEmpty) {
          try {
            ws.sink.add(jsonEncode({'type': 'audio', 'data': base64Encode(chunk)}));
          } catch (error) {
            _notice('Could not send microphone audio: $error');
          }
        }
      }, onError: (Object error) {
        _notice('Microphone stream error: $error');
        unawaited(stopMicrophone());
      });
    } catch (error) {
      if (mounted) setState(() { microphoneOn = false; status = 'Microphone unavailable'; });
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
    playbackGeneration++;
    playerStarted = false;
    final pendingAudio = audioQueue;
    audioQueue = Future<void>.value();
    // Flush current playback before waiting for queued feed/end-of-stream work.
    try { await player?.stop(); } catch (_) {}
    try { await pendingAudio; } catch (_) {}
    try { await player?.dispose(); } catch (_) {}
    player = null;
    if (mounted) setState(() {
      connected = false;
      connecting = false;
      examinerSpeaking = false;
      status = 'Not connected';
    });
  }

  Future<void> _releaseResources() async {
    try { await audioSubscription?.cancel(); } catch (_) {}
    audioSubscription = null;
    try { await recorder.stop(); } catch (_) {}
    try { await socketSubscription?.cancel(); } catch (_) {}
    socketSubscription = null;
    try { await channel?.sink.close(); } catch (_) {}
    channel = null;

    final pendingAudio = audioQueue;
    audioQueue = Future<void>.value();
    try { await player?.stop(); } catch (_) {}
    try { await pendingAudio.timeout(const Duration(seconds: 2)); } catch (_) {}
    try { await player?.dispose(); } catch (_) {}
    player = null;
    playerStarted = false;
    try { await recorder.dispose(); } catch (_) {}
  }

  @override
  void dispose() {
    playbackGeneration++;
    unawaited(_releaseResources());
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
    appBar: AppBar(
      title: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text('LIVE SPEAKING STUDIO', style: TextStyle(color: IeltsPalette.emerald, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1.2)),
        Text('Real-time voice chat', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
      ]),
      actions: [
        Padding(
          padding: const EdgeInsets.only(right: 15),
          child: Center(child: PremiumChip(connected ? 'LIVE' : connecting ? 'CONNECTING' : 'OFFLINE',
            icon: connected ? Icons.circle : connecting ? Icons.sync_rounded : Icons.circle_outlined,
            color: connected ? IeltsPalette.emerald : IeltsPalette.gold)),
        ),
      ],
    ),
    body: Column(children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 13),
        child: Container(
          padding: const EdgeInsets.all(17),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [Color(0xFF17364A), Color(0xFF1B5D57)],
            ),
            borderRadius: BorderRadius.circular(22),
          ),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Container(
                height: 42, width: 42,
                decoration: BoxDecoration(color: Colors.white.withValues(alpha: .13), borderRadius: BorderRadius.circular(14)),
                child: Icon(examinerSpeaking ? Icons.graphic_eq_rounded : Icons.headset_mic_rounded, color: const Color(0xFFE7C887), size: 22),
              ),
              const SizedBox(width: 11),
              const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('DR. ARTHUR JAMES', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 13)),
                SizedBox(height: 3),
                Text('Your AI speaking examiner', style: TextStyle(color: Colors.white70, fontSize: 10)),
              ])),
              if (examinerSpeaking) const PremiumChip('SPEAKING', color: Color(0xFFB7E5D2)),
            ]),
            const SizedBox(height: 14),
            Text(status, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 11)),
            const SizedBox(height: 11),
            SegmentedButton<String>(
              segments: const [
                ButtonSegment(value: 'Part 1', label: Text('Part 1')),
                ButtonSegment(value: 'Part 2', label: Text('Part 2')),
                ButtonSegment(value: 'Part 3', label: Text('Part 3')),
              ],
              selected: {part},
              onSelectionChanged: connected || connecting ? null : (values) => setState(() => part = values.first),
              style: SegmentedButton.styleFrom(
                selectedBackgroundColor: Colors.white,
                selectedForegroundColor: IeltsPalette.emeraldDeep,
                foregroundColor: Colors.white,
                side: BorderSide(color: Colors.white.withValues(alpha: .25)),
                visualDensity: VisualDensity.compact,
              ),
            ),
          ]),
        ),
      ),
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: 18),
        child: Row(children: [
          const Text('Conversation', style: TextStyle(color: IeltsPalette.ink, fontWeight: FontWeight.w900, fontSize: 14)),
          const Spacer(),
          Text('${transcript.length} messages', style: const TextStyle(color: IeltsPalette.muted, fontSize: 10, fontWeight: FontWeight.w700)),
        ]),
      ),
      const SizedBox(height: 8),
      Expanded(
        child: transcript.isEmpty
          ? Center(child: Padding(
              padding: const EdgeInsets.all(28),
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                Container(
                  height: 84, width: 84,
                  decoration: BoxDecoration(color: IeltsPalette.mint, borderRadius: BorderRadius.circular(28)),
                  child: const Icon(Icons.record_voice_over_rounded, size: 39, color: IeltsPalette.emerald),
                ),
                const SizedBox(height: 15),
                const Text('Your conversation starts here', style: TextStyle(color: IeltsPalette.ink, fontWeight: FontWeight.w900, fontSize: 16)),
                const SizedBox(height: 6),
                const Text('Start the live session, listen to the examiner and answer naturally. Your transcript will appear in this space.', textAlign: TextAlign.center, style: TextStyle(color: IeltsPalette.muted, fontSize: 11, height: 1.5)),
              ]),
            ))
          : ListView.builder(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 14),
              itemCount: transcript.length,
              itemBuilder: (context, index) {
                final item = transcript[index];
                final isUser = item['speaker'] == 'You';
                return Align(
                  alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    constraints: const BoxConstraints(maxWidth: 620),
                    margin: const EdgeInsets.only(bottom: 10),
                    padding: const EdgeInsets.fromLTRB(14, 12, 14, 13),
                    decoration: BoxDecoration(
                      color: isUser ? IeltsPalette.mint : Colors.white,
                      borderRadius: BorderRadius.only(
                        topLeft: const Radius.circular(18),
                        topRight: const Radius.circular(18),
                        bottomLeft: Radius.circular(isUser ? 18 : 5),
                        bottomRight: Radius.circular(isUser ? 5 : 18),
                      ),
                      border: Border.all(color: isUser ? const Color(0xFFD1E9E0) : IeltsPalette.line),
                    ),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(mainAxisSize: MainAxisSize.min, children: [
                        Icon(isUser ? Icons.person_rounded : Icons.school_rounded, size: 13, color: IeltsPalette.emerald),
                        const SizedBox(width: 5),
                        Text(isUser ? 'YOU' : 'EXAMINER', style: const TextStyle(color: IeltsPalette.emerald, fontWeight: FontWeight.w900, fontSize: 9, letterSpacing: 1)),
                      ]),
                      const SizedBox(height: 6),
                      Text(item['text']!, style: const TextStyle(color: IeltsPalette.ink, height: 1.45, fontSize: 13)),
                    ]),
                  ),
                );
              },
            ),
      ),
      SafeArea(
        top: false,
        child: Container(
          padding: const EdgeInsets.fromLTRB(16, 11, 16, 13),
          decoration: const BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: IeltsPalette.line))),
          child: Column(children: [
            if (connected) ...[
              Row(children: [
                Expanded(child: OutlinedButton.icon(
                  onPressed: microphoneOn ? stopMicrophone : startMicrophone,
                  icon: Icon(microphoneOn ? Icons.pause_circle_outline_rounded : Icons.mic_rounded),
                  label: Text(microphoneOn ? 'Pause microphone' : 'Resume microphone'),
                )),
                const SizedBox(width: 9),
                Expanded(child: FilledButton.icon(
                  onPressed: disconnect,
                  style: FilledButton.styleFrom(backgroundColor: const Color(0xFFB84F45)),
                  icon: const Icon(Icons.call_end_rounded, size: 18),
                  label: const Text('End session'),
                )),
              ]),
            ] else ...[
              if (transcript.any((item) => item['speaker'] == 'You')) ...[
                SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: evaluating ? null : _evaluateTranscript,
                    icon: evaluating
                        ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                        : const Icon(Icons.analytics_rounded),
                    label: Text(evaluating ? 'Analysing your answers…' : 'Evaluate this conversation'),
                  ),
                ),
                const SizedBox(height: 8),
              ],
              SizedBox(
                width: double.infinity,
                child: OutlinedButton.icon(
                  onPressed: connecting ? null : connect,
                  icon: connecting
                    ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                    : const Icon(Icons.mic_rounded),
                  label: Text(connecting ? 'Connecting securely…' : 'Start live conversation'),
                ),
              ),
            ],
            const SizedBox(height: 7),
            const Text('Use a headset for clearer audio and fewer microphone echoes.', style: TextStyle(fontSize: 9, color: IeltsPalette.muted)),
          ]),
        ),
      ),
    ]),
  );
}

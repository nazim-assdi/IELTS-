import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import '../services/gemini_api.dart';

class VoiceScreen extends StatefulWidget {
  const VoiceScreen({super.key, required this.prefs});
  final SharedPreferences prefs;
  @override
  State<VoiceScreen> createState() => _VoiceScreenState();
}

class _VoiceScreenState extends State<VoiceScreen> {
  late GeminiApi api;
  final speech = stt.SpeechToText();
  final tts = FlutterTts();
  final input = TextEditingController();
  final messages = <Map<String, String>>[];
  String part = 'Part 1';
  String transcript = '';
  String apiUrl = '';
  bool listening = false, loading = false, speechReady = false, speaking = false;

  @override
  void initState() {
    super.initState();
    apiUrl = widget.prefs.getString('ielts_api_url') ?? const String.fromEnvironment('IELTS_API_URL');
    api = GeminiApi(baseUrl: apiUrl);
    _initSpeech();
    _initTts();
    messages.add({'role': 'examiner', 'text': 'Good day. My name is Dr. Arthur James, and I will be your IELTS speaking examiner today. Could you start by stating your full name and where you are from?'});
  }

  Future<void> _initTts() async {
    await tts.setLanguage('en-GB');
    await tts.setSpeechRate(0.46);
    tts.setStartHandler(() { if (mounted) setState(() => speaking = true); });
    tts.setCompletionHandler(() { if (mounted) setState(() => speaking = false); });
    tts.setErrorHandler((_) { if (mounted) setState(() => speaking = false); });
  }

  Future<void> _initSpeech() async {
    try {
      speechReady = await speech.initialize(
        onStatus: (status) {
          if ((status == 'notListening' || status == 'done') && mounted) {
            setState(() => listening = false);
          }
        },
        onError: (error) {
          if (mounted) {
            setState(() => listening = false);
            _notice('Microphone error: ${error.errorMsg}');
          }
        },
      );
    } catch (_) {
      speechReady = false;
    }
    if (mounted) setState(() {});
  }

  Future<void> _startListening() async {
    if (listening) return;
    if (!speechReady) await _initSpeech();
    if (!speechReady) {
      _notice('Speech recognition is unavailable. Enable microphone permission and install/enable Google Speech Services on Android.');
      return;
    }
    try {
      final locales = await speech.locales();
      String? localeId;
      for (final locale in locales) {
        if (locale.localeId.toLowerCase() == 'en_gb' || locale.localeId.toLowerCase() == 'en-gb') {
          localeId = locale.localeId;
          break;
        }
      }
      if (localeId == null) {\n        for (final locale in locales) {\n          if (locale.localeId.toLowerCase().startsWith('en')) { localeId = locale.localeId; break; }\n        }\n      }
      setState(() => listening = true);
      await speech.listen(
        listenOptions: stt.SpeechListenOptions(
          localeId: localeId,
          listenFor: const Duration(minutes: 2),
          pauseFor: const Duration(seconds: 5),
          partialResults: true,
          cancelOnError: false,
          listenMode: stt.ListenMode.dictation,
        ),
        onResult: (result) {
          if (mounted) setState(() => transcript = result.recognizedWords);
        },
      );
    } catch (error) {
      if (mounted) setState(() => listening = false);
      _notice('Could not start microphone: $error');
    }
  }

  Future<void> _send() async {
    final message = input.text.trim().isNotEmpty ? input.text.trim() : transcript.trim();
    if (message.isEmpty || loading) return;
    if (listening) await speech.stop();
    input.clear();
    final history = messages.map((item) => {'role': item['role']!, 'text': item['text']!}).toList();
    setState(() {
      messages.add({'role': 'candidate', 'text': message});
      transcript = '';
      listening = false;
      loading = true;
    });
    try {
      final reply = await api.examinerReply(history: history, message: message, part: part);
      if (!mounted) return;
      setState(() => messages.add({'role': 'examiner', 'text': reply}));
      await tts.speak(reply);
    } catch (error) {
      if (mounted) _notice(error.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> _evaluate() async {
    final sample = messages.where((item) => item['role'] == 'candidate').map((item) => item['text']).join(' ');
    if (sample.trim().isEmpty) {
      _notice('Complete at least one speaking response first.');
      return;
    }
    setState(() => loading = true);
    try {
      final result = await api.evaluate(speech: sample, part: part);
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (dialogContext) => AlertDialog(
          title: Text('Estimated IELTS band: ${result['overallBand'] ?? '—'}'),
          content: SingleChildScrollView(child: Text(const JsonEncoder.withIndent('  ').convert(result))),
          actions: [TextButton(onPressed: () => Navigator.pop(dialogContext), child: const Text('Close'))],
        ),
      );
    } catch (error) {
      if (mounted) _notice(error.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Future<void> _configureServer() async {
    final controller = TextEditingController(text: apiUrl);
    final value = await showDialog<String>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Connect AI Examiner'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Paste your deployed IELTS HERO API HTTPS address. Do not paste a Gemini API key here.'),
            const SizedBox(height: 12),
            TextField(
              controller: controller,
              keyboardType: TextInputType.url,
              decoration: const InputDecoration(labelText: 'API URL', hintText: 'https://your-ielts-api.example.com'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(dialogContext), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(dialogContext, controller.text.trim()), child: const Text('Save')),
        ],
      ),
    );
    controller.dispose();
    if (value == null) return;
    final cleaned = value.replaceAll(RegExp(r'/+$'), '');
    if (cleaned.isNotEmpty && !cleaned.startsWith('https://') && !cleaned.startsWith('http://10.0.2.2')) {
      _notice('For security, use an HTTPS API address.');
      return;
    }
    await widget.prefs.setString('ielts_api_url', cleaned);
    if (!mounted) return;
    setState(() {
      apiUrl = cleaned;
      api = GeminiApi(baseUrl: cleaned);
    });
    _notice(cleaned.isEmpty ? 'AI server address cleared.' : 'AI server address saved.');
  }

  void _notice(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  void dispose() {
    input.dispose();
    speech.stop();
    tts.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final connected = api.configured;
    return Column(children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 12, 12),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            const CircleAvatar(radius: 25, backgroundColor: Color(0xFFE5F5EF), child: Icon(Icons.school_rounded, color: Color(0xFF047857), size: 28)),
            const SizedBox(width: 10),
            const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Dr. Arthur James', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 17)),
              Text('AI IELTS Speaking Examiner'),
            ])),
            Icon(connected ? Icons.cloud_done_rounded : Icons.cloud_off_rounded, color: connected ? Colors.green : Colors.orange),
            IconButton(tooltip: 'AI server settings', onPressed: _configureServer, icon: const Icon(Icons.settings_outlined)),
          ]),
          const SizedBox(height: 6),
          Text(connected ? 'AI server address saved • Check your connection by sending an answer.' : 'AI examiner server not connected. Set up the API address to enable AI replies.', style: Theme.of(context).textTheme.bodySmall),
          const SizedBox(height: 12),
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'Part 1', label: Text('Part 1')),
              ButtonSegment(value: 'Part 2', label: Text('Part 2')),
              ButtonSegment(value: 'Part 3', label: Text('Part 3')),
            ],
            selected: {part},
            onSelectionChanged: (values) => setState(() => part = values.first),
          ),
          Align(alignment: Alignment.centerRight, child: TextButton.icon(onPressed: loading ? null : _evaluate, icon: const Icon(Icons.assessment_outlined), label: const Text('Evaluate my speaking'))),
        ]),
      ),
      const Divider(height: 1),
      Expanded(
        child: ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: messages.length + (loading ? 1 : 0),
          itemBuilder: (context, index) {
            if (index == messages.length) {
              return const Align(alignment: Alignment.centerLeft, child: Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator()));
            }
            final message = messages[index];
            final isCandidate = message['role'] == 'candidate';
            return Align(
              alignment: isCandidate ? Alignment.centerRight : Alignment.centerLeft,
              child: Container(
                constraints: const BoxConstraints(maxWidth: 600),
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: isCandidate ? Theme.of(context).colorScheme.primaryContainer : Theme.of(context).colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(18),
                ),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(isCandidate ? 'YOU' : 'EXAMINER', style: const TextStyle(fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1)),
                  const SizedBox(height: 5),
                  Text(message['text']!),
                  if (!isCandidate) Align(
                    alignment: Alignment.centerRight,
                    child: IconButton(onPressed: () async { await tts.stop(); await tts.speak(message['text']!); }, icon: const Icon(Icons.volume_up_outlined, size: 19)),
                  ),
                ]),
              ),
            );
          },
        ),
      ),
      if (transcript.isNotEmpty)
        Padding(padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4), child: Text('Recognised: $transcript', maxLines: 2, overflow: TextOverflow.ellipsis)),
      SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 10),
          child: Row(children: [
            IconButton.filledTonal(
              tooltip: listening ? 'Stop recording' : 'Start speaking',
              onPressed: listening ? () async { await speech.stop(); if (mounted) setState(() => listening = false); } : _startListening,
              icon: Icon(listening ? Icons.stop : Icons.mic),
            ),
            const SizedBox(width: 8),
            Expanded(child: TextField(
              controller: input,
              minLines: 1,
              maxLines: 3,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(hintText: 'Type your answer…', border: OutlineInputBorder(), isDense: true),
              onSubmitted: (_) => _send(),
            )),
            const SizedBox(width: 8),
            IconButton.filled(onPressed: loading ? null : _send, icon: const Icon(Icons.send)),
          ]),
        ),
      ),
    ]);
  }
}

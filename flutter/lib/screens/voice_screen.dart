import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import '../services/gemini_api.dart';

class VoiceScreen extends StatefulWidget {
  const VoiceScreen({super.key});
  @override
  State<VoiceScreen> createState() => _VoiceScreenState();
}

class _VoiceScreenState extends State<VoiceScreen> {
  final api = GeminiApi();
  final speech = stt.SpeechToText();
  final tts = FlutterTts();
  final input = TextEditingController();
  final messages = <Map<String, String>>[];
  String part = 'Part 1';
  String transcript = '';
  bool listening = false, loading = false, speechReady = false;

  @override
  void initState() {
    super.initState();
    _initSpeech();
  }

  Future<void> _initSpeech() async {
    speechReady = await speech.initialize(
      onStatus: (status) { if (status == 'notListening' && mounted) setState(() => listening = false); },
      onError: (_) { if (mounted) setState(() => listening = false); },
    );
    if (mounted) setState(() {});
  }

  Future<void> _startListening() async {
    if (!speechReady) await _initSpeech();
    if (!speechReady) { _notice('Speech recognition is not available on this device.'); return; }
    setState(() => listening = true);
    await speech.listen(
      localeId: 'en_GB',
      onResult: (result) => setState(() => transcript = result.recognizedWords),
    );
  }

  Future<void> _send() async {
    final message = input.text.trim().isNotEmpty ? input.text.trim() : transcript.trim();
    if (message.isEmpty || loading) return;
    input.clear();
    setState(() {
      messages.add({'role': 'candidate', 'text': message});
      transcript = '';
      loading = true;
    });
    try {
      final history = messages.take(messages.length - 1).map((item) => {'role': item['role']!, 'text': item['text']!}).toList();
      final reply = await api.examinerReply(history: history, message: message, part: part);
      if (!mounted) return;
      setState(() => messages.add({'role': 'examiner', 'text': reply}));
      await tts.setLanguage('en-GB');
      await tts.speak(reply);
    } catch (error) {
      if (mounted) _notice(error.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  void _notice(String message) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));

  Future<void> _evaluate() async {
    final sample = messages.where((item) => item['role'] == 'candidate').map((item) => item['text']).join(' ');
    if (sample.trim().isEmpty) { _notice('Complete a speaking response first.'); return; }
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

  @override
  void dispose() {
    input.dispose();
    speech.stop();
    tts.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [
            const CircleAvatar(radius: 27, backgroundColor: Color(0xFFE5F5EF), child: Icon(Icons.school_rounded, color: Color(0xFF047857), size: 30)),
            const SizedBox(width: 12),
            const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Dr. Arthur James', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 17)),
              Text('AI IELTS Speaking Examiner'),
            ])),
            const Icon(Icons.circle, color: Colors.green, size: 10),
            const SizedBox(width: 4),
            const Text('Ready'),
          ]),
          const SizedBox(height: 14),
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'Part 1', label: Text('Part 1')),
              ButtonSegment(value: 'Part 2', label: Text('Part 2')),
              ButtonSegment(value: 'Part 3', label: Text('Part 3')),
            ],
            selected: {part},
            onSelectionChanged: (values) => setState(() => part = values.first),
          ),
          const SizedBox(height: 8),
          Text('Practise a realistic IELTS speaking interview. AI feedback requires your own secure Gemini-enabled server.', style: Theme.of(context).textTheme.bodySmall),
          Align(alignment: Alignment.centerRight, child: TextButton.icon(onPressed: loading ? null : _evaluate, icon: const Icon(Icons.assessment_outlined), label: const Text('Evaluate my speaking'))),
        ]),
      ),
      const Divider(height: 1),
      Expanded(
        child: messages.isEmpty
            ? Center(child: Padding(
                padding: const EdgeInsets.all(28),
                child: Column(mainAxisSize: MainAxisSize.min, children: [
                  const Icon(Icons.record_voice_over_rounded, size: 58, color: Color(0xFF059669)),
                  const SizedBox(height: 12),
                  const Text('Ready for your speaking test?', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900)),
                  const SizedBox(height: 8),
                  const Text('Start by answering the examiner. You can type or use your microphone.', textAlign: TextAlign.center),
                  const SizedBox(height: 18),
                  FilledButton.icon(
                    onPressed: () => setState(() => messages.add({'role': 'examiner', 'text': 'Good day. Let us begin with Part 1. Could you tell me your full name, please?'})),
                    icon: const Icon(Icons.play_arrow), label: const Text('Start interview'),
                  ),
                ]),
              ))
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: messages.length + (loading ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index == messages.length) return const Align(alignment: Alignment.centerLeft, child: Padding(padding: EdgeInsets.all(12), child: CircularProgressIndicator()));
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
                          child: IconButton(onPressed: () => tts.speak(message['text']!), icon: const Icon(Icons.volume_up_outlined, size: 19)),
                        ),
                      ]),
                    ),
                  );
                },
              ),
      ),
      if (transcript.isNotEmpty) Padding(padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 4), child: Text('Recognised: $transcript')),
      SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(12, 8, 12, 10),
          child: Row(children: [
            IconButton.filledTonal(
              onPressed: listening ? () => speech.stop() : _startListening,
              icon: Icon(listening ? Icons.stop : Icons.mic),
            ),
            const SizedBox(width: 8),
            Expanded(child: TextField(
              controller: input,
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

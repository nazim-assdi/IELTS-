import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_tts/flutter_tts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import '../services/gemini_api.dart';
import '../services/progress_store.dart';
import '../theme/ielts_theme.dart';
import 'live_voice_screen.dart';

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
  final messageScrollController = ScrollController();
  String part = 'Part 1';
  String transcript = '';
  String apiUrl = defaultIeltsApiUrl;
  String? chatError;
  String failedMessage = '';
  bool listening = false, loading = false, speechReady = false;

  @override
  void initState() {
    super.initState();
    // Use the official Render backend configured for this IELTS HERO build.
    // This also migrates an older saved API URL to the current service.
    apiUrl = defaultIeltsApiUrl;
    widget.prefs.setString('ielts_api_url', defaultIeltsApiUrl);
    api = GeminiApi(baseUrl: apiUrl);
    _initSpeech();
    _initTts();
    messages.add({
      'role': 'examiner',
      'text': 'Good day. I will be your IELTS speaking examiner today. Could you start by stating your full name and where you are from?',
    });
  }

  Future<void> _initTts() async {
    await tts.setLanguage('en-GB');
    await tts.setSpeechRate(0.42);
    await tts.setPitch(0.96);
    await tts.setVolume(1.0);
  }

  void _scrollChatToLatest() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || !messageScrollController.hasClients) return;
      messageScrollController.animateTo(
        messageScrollController.position.maxScrollExtent,
        duration: const Duration(milliseconds: 240),
        curve: Curves.easeOut,
      );
    });
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
      _notice('Speech recognition is unavailable. Enable microphone permission and Google Speech Services on Android.');
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
      if (localeId == null) {
        for (final locale in locales) {
          if (locale.localeId.toLowerCase().startsWith('en')) {
            localeId = locale.localeId;
            break;
          }
        }
      }
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

  Future<void> _send({String? retryMessage}) async {
    final isRetry = retryMessage != null;
    final message = (retryMessage ?? (input.text.trim().isNotEmpty ? input.text.trim() : transcript.trim())).trim();
    if (message.isEmpty || loading) return;
    if (listening) await speech.stop();
    if (!isRetry) input.clear();

    // On retry, the failed candidate message is already in the transcript.
    final historyMessages = isRetry && messages.isNotEmpty && messages.last['role'] == 'candidate'
        ? messages.take(messages.length - 1)
        : messages;
    final history = historyMessages
        .map((item) => {'role': item['role']!, 'text': item['text']!})
        .toList();

    setState(() {
      if (!isRetry) messages.add({'role': 'candidate', 'text': message});
      transcript = '';
      listening = false;
      loading = true;
      chatError = null;
    });
    _scrollChatToLatest();
    try {
      final reply = (await api.examinerReply(history: history, message: message, part: part)).trim();
      if (!mounted) return;
      if (reply.isEmpty) throw Exception('The examiner returned an empty reply. Please try again.');
      setState(() {
        messages.add({'role': 'examiner', 'text': reply});
        chatError = null;
        failedMessage = '';
      });
      _scrollChatToLatest();
      // A successful AI reply must not be marked as a failed chat turn merely because
      // Android's local TTS engine could not speak it. Keep retry for network/API errors.
      try {
        await tts.speak(reply);
      } catch (voiceError) {
        if (mounted) {
          _notice('The examiner replied, but voice playback failed. Tap the speaker button to try again.');
        }
      }
    } catch (error) {
      if (mounted) {
        setState(() {
          failedMessage = message;
          chatError = error.toString().replaceFirst('Exception: ', '');
        });
        _scrollChatToLatest();
      }
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
      await ProgressStore(widget.prefs).recordSpeakingEvaluation(result);
      if (!mounted) return;
      await showDialog<void>(
        context: context,
        builder: (dialogContext) => AlertDialog(
          title: Text('AI speaking estimate: ${result['overallBand'] ?? '—'}'),
          content: SingleChildScrollView(
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
              Text(result['assessmentType']?.toString() ?? 'AI practice estimate only; not an official IELTS result.', style: const TextStyle(fontSize: 11, color: IeltsPalette.muted, height: 1.4)),
              const SizedBox(height: 13),
              _evaluationItem('Fluency & coherence', result['fluencyCoherence']),
              _evaluationItem('Lexical resource', result['lexicalResource']),
              _evaluationItem('Grammar', result['grammaticalRangeAccuracy']),
              _evaluationItem('Pronunciation', result['pronunciation']),
              if (result['strengths'] is List) ...[
                const SizedBox(height: 8),
                const Text('Strengths', style: TextStyle(fontWeight: FontWeight.w900)),
                ...((result['strengths'] as List).map((item) => Text('• ${item.toString()}', style: const TextStyle(fontSize: 12, height: 1.4)))),
              ],
              if (result['improvements'] is List) ...[
                const SizedBox(height: 8),
                const Text('Next improvements', style: TextStyle(fontWeight: FontWeight.w900)),
                ...((result['improvements'] as List).map((item) => Text('• ${item.toString()}', style: const TextStyle(fontSize: 12, height: 1.4)))),
              ],
              if ((result['improvedSample'] ?? '').toString().isNotEmpty) ...[
                const SizedBox(height: 8),
                const Text('Improved sample', style: TextStyle(fontWeight: FontWeight.w900)),
                SelectableText(result['improvedSample'].toString(), style: const TextStyle(fontSize: 12, height: 1.45)),
              ],
            ]),
          ),
          actions: [TextButton(onPressed: () => Navigator.pop(dialogContext), child: const Text('Close'))],
        ),
      );
    } catch (error) {
      if (mounted) _notice(error.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  Widget _evaluationItem(String title, dynamic value) => Padding(
    padding: const EdgeInsets.only(bottom: 9),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(title, style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w900, color: IeltsPalette.emerald)),
      const SizedBox(height: 2),
      Text(value?.toString() ?? 'Not assessed', style: const TextStyle(fontSize: 12, height: 1.4)),
    ]),
  );

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
            const Text('The API address is already set. Do not paste a Gemini API key here.'),
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
    final nextUrl = cleaned.isEmpty ? defaultIeltsApiUrl : cleaned;
    if (!nextUrl.startsWith('https://') && !nextUrl.startsWith('http://10.0.2.2')) {
      _notice('For security, use an HTTPS API address.');
      return;
    }
    await widget.prefs.setString('ielts_api_url', nextUrl);
    if (!mounted) return;
    setState(() {
      apiUrl = nextUrl;
      api = GeminiApi(baseUrl: nextUrl);
    });
    _notice('AI server address saved.');
  }

  Future<void> _openLiveVoice() async {
    await Navigator.push(context, MaterialPageRoute(
      builder: (_) => LiveVoiceScreen(baseUrl: apiUrl, initialPart: part),
    ));
  }

  void _notice(String message) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  @override
  void dispose() {
    input.dispose();
    messageScrollController.dispose();
    speech.stop();
    tts.stop();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final configured = api.configured;
    return Column(children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(17, 15, 17, 13),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Container(
            padding: const EdgeInsets.all(17),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFF123F4B), Color(0xFF087F68), Color(0xFF0A5C52)],
              ),
              borderRadius: BorderRadius.circular(23),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Container(
                  height: 47, width: 47,
                  decoration: BoxDecoration(color: Colors.white.withValues(alpha: .14), borderRadius: BorderRadius.circular(16)),
                  child: const Icon(Icons.record_voice_over_rounded, color: Colors.white, size: 25),
                ),
                const SizedBox(width: 11),
                const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('YOUR AI EXAMINER', style: TextStyle(color: Color(0xFFB7DDD2), fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1.35)),
                  SizedBox(height: 3),
                  Text('Dr. Arthur James', style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w900)),
                  Text('British IELTS speaking coach', style: TextStyle(color: Colors.white70, fontSize: 11)),
                ])),
                IconButton(
                  tooltip: 'AI server settings',
                  onPressed: _configureServer,
                  icon: const Icon(Icons.settings_rounded, color: Colors.white70),
                ),
              ]),
              const SizedBox(height: 15),
              Row(children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                  decoration: BoxDecoration(color: Colors.white.withValues(alpha: .12), borderRadius: BorderRadius.circular(30)),
                  child: Row(children: [
                    Icon(configured ? Icons.cloud_done_rounded : Icons.cloud_off_rounded, size: 14, color: configured ? const Color(0xFF8BE0B7) : const Color(0xFFFFD08C)),
                    const SizedBox(width: 6),
                    Text(configured ? 'AI server configured' : 'AI server unavailable', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w800, fontSize: 10)),
                  ]),
                ),
                const Spacer(),
                const Text('LIVE PRACTICE', style: TextStyle(color: Color(0xFFD2E8E1), fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
              ]),
              const SizedBox(height: 13),
              SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: _openLiveVoice,
                  style: FilledButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: IeltsPalette.emeraldDeep,
                    padding: const EdgeInsets.symmetric(vertical: 13),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  icon: const Icon(Icons.graphic_eq_rounded, size: 19),
                  label: const Text('Start real-time voice chat'),
                ),
              ),
            ]),
          ),
          const SizedBox(height: 13),
          Row(children: [
            const Expanded(child: Text('Choose speaking part', style: TextStyle(color: IeltsPalette.ink, fontWeight: FontWeight.w900, fontSize: 13))),
            TextButton.icon(
              onPressed: loading ? null : _evaluate,
              icon: const Icon(Icons.analytics_outlined, size: 17),
              label: const Text('Evaluate'),
            ),
          ]),
          SegmentedButton<String>(
            segments: const [
              ButtonSegment(value: 'Part 1', label: Text('Part 1')),
              ButtonSegment(value: 'Part 2', label: Text('Part 2')),
              ButtonSegment(value: 'Part 3', label: Text('Part 3')),
            ],
            selected: {part},
            onSelectionChanged: (values) => setState(() => part = values.first),
            style: SegmentedButton.styleFrom(
              selectedBackgroundColor: IeltsPalette.mint,
              selectedForegroundColor: IeltsPalette.emeraldDeep,
              visualDensity: VisualDensity.compact,
            ),
          ),
        ]),
      ),
      const Divider(height: 1),
      Expanded(
        child: ListView.builder(
          controller: messageScrollController,
          padding: const EdgeInsets.fromLTRB(17, 15, 17, 10),
          itemCount: messages.length + ((loading || chatError != null) ? 1 : 0),
          itemBuilder: (context, index) {
            if (index == messages.length) {
              if (loading) {
                return const Align(
                  alignment: Alignment.centerLeft,
                  child: Padding(
                    padding: EdgeInsets.all(12),
                    child: SizedBox(height: 21, width: 21, child: CircularProgressIndicator(strokeWidth: 2)),
                  ),
                );
              }
              if (chatError != null) {
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(13),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF1ED),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFFF2D6CD)),
                  ),
                  child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const Icon(Icons.cloud_off_rounded, color: Color(0xFFB95B43), size: 18),
                    const SizedBox(width: 9),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      const Text('Could not reach the examiner', style: TextStyle(color: Color(0xFF8C3E2B), fontWeight: FontWeight.w900, fontSize: 11)),
                      const SizedBox(height: 4),
                      Text(chatError!, style: const TextStyle(color: Color(0xFF8C3E2B), fontSize: 10, height: 1.4)),
                      TextButton.icon(
                        onPressed: loading || failedMessage.isEmpty ? null : () => _send(retryMessage: failedMessage),
                        icon: const Icon(Icons.refresh_rounded, size: 16),
                        label: const Text('Retry this answer'),
                      ),
                    ])),
                  ]),
                );
              }
              return const SizedBox.shrink();
            }
            final message = messages[index];
            final isCandidate = message['role'] == 'candidate';
            return Align(
              alignment: isCandidate ? Alignment.centerRight : Alignment.centerLeft,
              child: Container(
                constraints: const BoxConstraints(maxWidth: 620),
                margin: const EdgeInsets.only(bottom: 11),
                padding: const EdgeInsets.fromLTRB(14, 12, 12, 8),
                decoration: BoxDecoration(
                  color: isCandidate ? IeltsPalette.mint : Colors.white,
                  borderRadius: BorderRadius.only(
                    topLeft: const Radius.circular(18),
                    topRight: const Radius.circular(18),
                    bottomLeft: Radius.circular(isCandidate ? 18 : 5),
                    bottomRight: Radius.circular(isCandidate ? 5 : 18),
                  ),
                  border: Border.all(color: isCandidate ? const Color(0xFFD1E9E0) : IeltsPalette.line),
                ),
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(mainAxisSize: MainAxisSize.min, children: [
                    Icon(isCandidate ? Icons.person_rounded : Icons.school_rounded, size: 13, color: IeltsPalette.emerald),
                    const SizedBox(width: 5),
                    Text(isCandidate ? 'YOU' : 'DR. ARTHUR', style: const TextStyle(fontSize: 9, fontWeight: FontWeight.w900, color: IeltsPalette.emerald, letterSpacing: 1)),
                  ]),
                  const SizedBox(height: 6),
                  Text(message['text']!, style: const TextStyle(color: IeltsPalette.ink, height: 1.45, fontSize: 13)),
                  if (!isCandidate) Align(
                    alignment: Alignment.centerRight,
                    child: IconButton(
                      visualDensity: VisualDensity.compact,
                      onPressed: () async { await tts.stop(); await tts.speak(message['text']!); },
                      icon: const Icon(Icons.volume_up_rounded, size: 18, color: IeltsPalette.muted),
                    ),
                  ),
                ]),
              ),
            );
          },
        ),
      ),
      if (transcript.isNotEmpty)
        Container(
          margin: const EdgeInsets.fromLTRB(16, 0, 16, 7),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 9),
          decoration: BoxDecoration(color: const Color(0xFFFFF6E7), borderRadius: BorderRadius.circular(12)),
          child: Row(children: [
            const Icon(Icons.graphic_eq_rounded, size: 16, color: IeltsPalette.gold),
            const SizedBox(width: 8),
            Expanded(child: Text(transcript, maxLines: 2, overflow: TextOverflow.ellipsis, style: const TextStyle(fontSize: 11, color: IeltsPalette.inkSoft))),
          ]),
        ),
      SafeArea(
        top: false,
        child: Container(
          padding: const EdgeInsets.fromLTRB(13, 9, 13, 10),
          decoration: const BoxDecoration(color: Colors.white, border: Border(top: BorderSide(color: IeltsPalette.line))),
          child: Row(children: [
            IconButton.filledTonal(
              tooltip: listening ? 'Stop recording' : 'Start speaking',
              style: IconButton.styleFrom(
                backgroundColor: listening ? const Color(0xFFFFEAE5) : IeltsPalette.mint,
                foregroundColor: listening ? const Color(0xFFBA5338) : IeltsPalette.emerald,
              ),
              onPressed: listening ? () async { await speech.stop(); if (mounted) setState(() => listening = false); } : _startListening,
              icon: Icon(listening ? Icons.stop_rounded : Icons.mic_rounded),
            ),
            const SizedBox(width: 8),
            Expanded(child: TextField(
              controller: input,
              minLines: 1,
              maxLines: 3,
              textCapitalization: TextCapitalization.sentences,
              decoration: const InputDecoration(
                hintText: 'Type your answer here…',
                prefixIcon: Icon(Icons.edit_outlined, size: 19),
                isDense: true,
              ),
              onSubmitted: (_) => _send(),
            )),
            const SizedBox(width: 8),
            IconButton.filled(
              onPressed: loading ? null : _send,
              style: IconButton.styleFrom(backgroundColor: IeltsPalette.emerald, foregroundColor: Colors.white),
              icon: const Icon(Icons.arrow_upward_rounded),
            ),
          ]),
        ),
      ),
    ]);
  }
}

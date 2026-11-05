import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/gemini_api.dart';

class TranslatorScreen extends StatefulWidget {
  const TranslatorScreen({super.key, required this.prefs});
  final SharedPreferences prefs;

  @override
  State<TranslatorScreen> createState() => _TranslatorScreenState();
}

class _TranslatorScreenState extends State<TranslatorScreen> {
  final input = TextEditingController();
  String result = '';
  int direction = 0;
  bool loading = false;

  GeminiApi get api {
    final saved = widget.prefs.getString('ielts_api_url')?.trim() ?? '';
    return GeminiApi(baseUrl: saved.isEmpty ? defaultIeltsApiUrl : saved);
  }

  Future<void> translate() async {
    final text = input.text.trim();
    if (text.isEmpty || loading) return;
    setState(() { loading = true; result = ''; });
    try {
      final translated = await api.translateText(
        text: text,
        targetLanguage: direction == 0 ? 'Bengali' : 'English',
      );
      if (mounted) setState(() => result = translated);
    } catch (error) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(error.toString().replaceFirst('Exception: ', ''))),
        );
      }
    } finally {
      if (mounted) setState(() => loading = false);
    }
  }

  @override
  void dispose() {
    input.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.all(18),
    children: [
      const Text('IELTS Translator', style: TextStyle(fontSize: 23, fontWeight: FontWeight.w900)),
      const SizedBox(height: 5),
      const Text('Translate words, example sentences and IELTS answers with context-aware AI.'),
      const SizedBox(height: 18),
      SegmentedButton<int>(
        segments: const [
          ButtonSegment(value: 0, label: Text('English → বাংলা')),
          ButtonSegment(value: 1, label: Text('বাংলা → English')),
        ],
        selected: {direction},
        onSelectionChanged: loading ? null : (values) => setState(() { direction = values.first; result = ''; }),
      ),
      const SizedBox(height: 14),
      TextField(
        controller: input,
        minLines: 4,
        maxLines: 8,
        maxLength: 5000,
        textCapitalization: TextCapitalization.sentences,
        decoration: InputDecoration(
          labelText: direction == 0 ? 'English text' : 'বাংলা লেখা',
          hintText: direction == 0 ? 'Enter an IELTS word, phrase or sentence…' : 'যে বাক্যটি ইংরেজিতে অনুবাদ করতে চান…',
          border: const OutlineInputBorder(),
          alignLabelWithHint: true,
        ),
      ),
      const SizedBox(height: 12),
      FilledButton.icon(
        onPressed: loading ? null : translate,
        icon: loading
            ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
            : const Icon(Icons.translate_rounded),
        label: Text(loading ? 'Translating…' : 'Translate'),
      ),
      if (result.isNotEmpty) ...[
        const SizedBox(height: 18),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('TRANSLATION', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1, color: Color(0xFF059669))),
              const SizedBox(height: 10),
              SelectableText(result, style: const TextStyle(fontSize: 18, height: 1.55)),
              Align(
                alignment: Alignment.centerRight,
                child: TextButton.icon(
                  onPressed: () {
                    Clipboard.setData(ClipboardData(text: result));
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Translation copied.')));
                  },
                  icon: const Icon(Icons.copy_rounded),
                  label: const Text('Copy'),
                ),
              ),
            ]),
          ),
        ),
      ],
      const SizedBox(height: 8),
      const Text('Tip: Include the full sentence when translating idioms or academic phrases so the meaning stays accurate.'),
    ],
  );
}

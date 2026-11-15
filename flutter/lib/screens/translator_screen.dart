import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/gemini_api.dart';
import '../theme/ielts_theme.dart';
import '../widgets/premium_ui.dart';

class TranslatorScreen extends StatefulWidget {
  const TranslatorScreen({super.key, required this.prefs});
  final SharedPreferences prefs;

  @override
  State<TranslatorScreen> createState() => _TranslatorScreenState();
}

class _TranslatorScreenState extends State<TranslatorScreen> {
  final input = TextEditingController();
  String result = '';
  String errorMessage = '';
  int direction = 0;
  bool loading = false;

  GeminiApi get api {
    final saved = widget.prefs.getString('ielts_api_url')?.trim() ?? '';
    return GeminiApi(baseUrl: saved.isEmpty ? defaultIeltsApiUrl : saved);
  }

  Future<void> translate() async {
    final text = input.text.trim();
    if (text.isEmpty || loading) return;
    setState(() { loading = true; result = ''; errorMessage = ''; });
    try {
      final translated = await api.translateText(
        text: text,
        targetLanguage: direction == 0 ? 'Bengali' : 'English',
      );
      if (mounted) setState(() => result = translated);
    } catch (error) {
      if (mounted) {
        final message = error.toString().replaceFirst('Exception: ', '');
        setState(() => errorMessage = message);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
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
    padding: const EdgeInsets.fromLTRB(18, 18, 18, 30),
    children: [
      PremiumPageIntro(
        eyebrow: 'Language workspace',
        title: 'AI translator',
        subtitle: 'Translate naturally in both directions, with IELTS context in mind.',
        trailing: const PremiumChip('AI POWERED', icon: Icons.auto_awesome_rounded, color: IeltsPalette.gold),
      ),
      Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF17364A), Color(0xFF1B5D57)],
          ),
          borderRadius: BorderRadius.circular(22),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Text('TRANSLATE WITH CONTEXT', style: TextStyle(color: Color(0xFFB7DDD2), fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1.3)),
          const SizedBox(height: 7),
          const Text('Think in one language.\nExpress it in another.', style: TextStyle(color: Colors.white, fontSize: 22, height: 1.1, fontWeight: FontWeight.w900, letterSpacing: -.6)),
          const SizedBox(height: 9),
          const Text('Useful for vocabulary, example sentences and IELTS answers.', style: TextStyle(color: Colors.white70, fontSize: 11, height: 1.4)),
        ]),
      ),
      const SizedBox(height: 19),
      const PremiumSectionHeading('Translation direction'),
      Container(
        padding: const EdgeInsets.all(5),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(17), border: Border.all(color: IeltsPalette.line)),
        child: Row(children: [
          Expanded(child: _languageButton(
            label: direction == 0 ? 'English' : 'বাংলা',
            subtitle: 'FROM',
            target: false,
          )),
          IconButton(
            tooltip: 'Switch languages',
            onPressed: loading ? null : () => setState(() { direction = direction == 0 ? 1 : 0; result = ''; errorMessage = ''; }),
            style: IconButton.styleFrom(backgroundColor: IeltsPalette.mint, foregroundColor: IeltsPalette.emerald),
            icon: const Icon(Icons.swap_horiz_rounded),
          ),
          Expanded(child: _languageButton(
            label: direction == 0 ? 'বাংলা' : 'English',
            subtitle: 'TRANSLATE TO',
            target: true,
          )),
        ]),
      ),
      const SizedBox(height: 15),
      Row(children: [
        const Expanded(child: Text('Your text', style: TextStyle(color: IeltsPalette.ink, fontWeight: FontWeight.w900, fontSize: 14))),
        Text('${input.text.length}/5000', style: const TextStyle(color: IeltsPalette.muted, fontSize: 10, fontWeight: FontWeight.w700)),
      ]),
      const SizedBox(height: 8),
      Container(
        padding: const EdgeInsets.all(13),
        decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: IeltsPalette.line)),
        child: Column(children: [
          TextField(
            controller: input,
            minLines: 5,
            maxLines: 9,
            maxLength: 5000,
            onChanged: (_) => setState(() {}),
            textCapitalization: TextCapitalization.sentences,
            decoration: InputDecoration(
              counterText: '',
              hintText: direction == 0 ? 'Type an English word, phrase or sentence…' : 'এখানে বাংলা শব্দ, বাক্য বা অনুচ্ছেদ লিখুন…',
              border: InputBorder.none,
              filled: false,
              contentPadding: const EdgeInsets.all(4),
              alignLabelWithHint: true,
            ),
          ),
          const Divider(height: 15),
          Row(children: [
            const Icon(Icons.shield_outlined, color: IeltsPalette.muted, size: 15),
            const SizedBox(width: 6),
            const Expanded(child: Text('Your text is sent securely to the IELTS HERO AI server.', style: TextStyle(color: IeltsPalette.muted, fontSize: 9))),
            TextButton(
              onPressed: loading ? null : () { input.clear(); setState(() { result = ''; errorMessage = ''; }); },
              child: const Text('Clear'),
            ),
          ]),
        ]),
      ),
      const SizedBox(height: 13),
      SizedBox(
        width: double.infinity,
        child: FilledButton.icon(
          onPressed: loading || input.text.trim().isEmpty ? null : translate,
          icon: loading
            ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
            : const Icon(Icons.translate_rounded),
          label: Text(loading ? 'Translating your text…' : 'Translate now'),
        ),
      ),
      if (loading) ...[
        const SizedBox(height: 10),
        const Text('The AI may take a little time when the service is busy. Please keep this screen open.', textAlign: TextAlign.center, style: TextStyle(color: IeltsPalette.muted, fontSize: 10)),
      ],
      if (errorMessage.isNotEmpty) ...[
        const SizedBox(height: 14),
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: const Color(0xFFFFF1ED), borderRadius: BorderRadius.circular(17), border: Border.all(color: const Color(0xFFF2D6CD))),
          child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Icon(Icons.error_outline_rounded, color: Color(0xFFB95B43)),
            const SizedBox(width: 10),
            Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('Translation could not be completed', style: TextStyle(color: Color(0xFF8C3E2B), fontWeight: FontWeight.w900, fontSize: 12)),
              const SizedBox(height: 4),
              Text(errorMessage, style: const TextStyle(color: Color(0xFF8C3E2B), fontSize: 11, height: 1.4)),
              TextButton.icon(
                onPressed: loading ? null : translate,
                icon: const Icon(Icons.refresh_rounded, size: 16),
                label: const Text('Try again'),
              ),
            ])),
          ]),
        ),
      ],
      if (result.isNotEmpty) ...[
        const SizedBox(height: 19),
        Row(children: [
          const Expanded(child: Text('Your translation', style: TextStyle(color: IeltsPalette.ink, fontWeight: FontWeight.w900, fontSize: 14))),
          const PremiumChip('COMPLETE', icon: Icons.check_circle_rounded),
        ]),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(17),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: IeltsPalette.emerald.withValues(alpha: .28))),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Container(
                width: 32, height: 32,
                decoration: BoxDecoration(color: IeltsPalette.mint, borderRadius: BorderRadius.circular(11)),
                child: const Icon(Icons.translate_rounded, color: IeltsPalette.emerald, size: 17),
              ),
              const SizedBox(width: 9),
              const Text('IELTS HERO TRANSLATION', style: TextStyle(color: IeltsPalette.emerald, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
            ]),
            const SizedBox(height: 13),
            SelectableText(result, style: const TextStyle(color: IeltsPalette.ink, fontSize: 17, height: 1.6, fontWeight: FontWeight.w600)),
            const Divider(height: 25),
            Align(
              alignment: Alignment.centerRight,
              child: FilledButton.tonalIcon(
                onPressed: () {
                  Clipboard.setData(ClipboardData(text: result));
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Translation copied to clipboard.')));
                },
                icon: const Icon(Icons.copy_rounded, size: 17),
                label: const Text('Copy translation'),
              ),
            ),
          ]),
        ),
      ],
      const SizedBox(height: 19),
      const Text('PRO TIP', style: TextStyle(color: IeltsPalette.gold, fontSize: 9, letterSpacing: 1.2, fontWeight: FontWeight.w900)),
      const SizedBox(height: 5),
      const Text('For idioms and academic expressions, translate the whole sentence rather than a single word. Context helps preserve the intended meaning.', style: TextStyle(color: IeltsPalette.muted, fontSize: 11, height: 1.45)),
    ],
  );

  Widget _languageButton({
    required String label,
    required String subtitle,
    required bool target,
  }) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 11),
    decoration: BoxDecoration(
      color: target ? IeltsPalette.mint : const Color(0xFFF7FAF9),
      borderRadius: BorderRadius.circular(13),
      border: Border.all(color: target ? IeltsPalette.emerald.withValues(alpha: .2) : IeltsPalette.line),
    ),
    child: Column(children: [
      Text(subtitle, style: TextStyle(color: target ? IeltsPalette.emerald : IeltsPalette.muted, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: .8)),
      const SizedBox(height: 4),
      Text(label, style: TextStyle(color: target ? IeltsPalette.emeraldDeep : IeltsPalette.inkSoft, fontWeight: FontWeight.w900, fontSize: 14)),
    ]),
  );
}

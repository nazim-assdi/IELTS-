import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/gemini_api.dart';
import '../theme/ielts_theme.dart';
import '../widgets/premium_ui.dart';

class CueCardsScreen extends StatefulWidget {
  const CueCardsScreen({super.key, required this.prefs});
  final SharedPreferences prefs;
  @override
  State<CueCardsScreen> createState() => _CueCardsScreenState();
}

class _CueCardsScreenState extends State<CueCardsScreen> {
  bool loading = false;
  Map<String, dynamic>? generated;
  GeminiApi get api {
    final saved = widget.prefs.getString('ielts_api_url')?.trim() ?? '';
    final compileTimeUrl = const String.fromEnvironment('IELTS_API_URL').trim();
    final url = saved.isNotEmpty
        ? saved
        : compileTimeUrl.isNotEmpty ? compileTimeUrl : defaultIeltsApiUrl;
    return GeminiApi(baseUrl: url);
  }

  final cards = [
    {
      'category': 'Travel & Journey',
      'title': 'Describe a memorable journey you took by public transport',
      'prompt': 'You should say:\n• Where you went and what transport you took\n• Who accompanied you\n• What occurred during the trip\n• Why it left a lasting impression',
      'vocab': 'picturesque landscape • delayed indefinitely • striking up a conversation • in retrospect',
    },
    {
      'category': 'Technology & Innovation',
      'title': 'Describe a piece of technology you find indispensable in daily life',
      'prompt': 'You should say:\n• What the device or application is\n• How frequently you use it\n• How you learned to use it\n• How your routine would change without it',
      'vocab': 'streamline productivity • ubiquitous presence • steep learning curve • integral component',
    },
    {
      'category': 'Environment & Nature',
      'title': 'Describe an environmental law or initiative you think is effective',
      'prompt': 'You should say:\n• What the policy entails\n• Where and when it was implemented\n• How the public responded\n• Why you consider it effective',
      'vocab': 'curb greenhouse gas emissions • ecological consciousness • stringent enforcement',
    },
  ];

  Future<void> generate() async {
    setState(() => loading = true);
    try {
      generated = await api.generateCueCard('any');
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
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.fromLTRB(18, 18, 18, 30),
    children: [
      PremiumPageIntro(
        eyebrow: 'Speaking practice · Part 2',
        title: 'Cue card studio',
        subtitle: 'Plan your ideas, build a clear story and speak with confidence.',
        trailing: PremiumChip('${cards.length + (generated == null ? 0 : 1)} CARDS', icon: Icons.style_rounded),
      ),
      Container(
        padding: const EdgeInsets.all(19),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [Color(0xFF202F49), Color(0xFF34466C)],
          ),
          borderRadius: BorderRadius.circular(23),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Row(children: [
            Icon(Icons.timelapse_rounded, color: Color(0xFFE7C887), size: 18),
            SizedBox(width: 7),
            Text('THE TWO-MINUTE CHALLENGE', style: TextStyle(color: Color(0xFFE7C887), fontWeight: FontWeight.w900, fontSize: 9, letterSpacing: 1.2)),
          ]),
          const SizedBox(height: 10),
          const Text('Think clearly.\nSpeak naturally.', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 25, height: 1.05, letterSpacing: -.7)),
          const SizedBox(height: 9),
          const Text('1 minute to prepare · Up to 2 minutes to speak', style: TextStyle(color: Colors.white70, fontSize: 11)),
          const SizedBox(height: 15),
          SizedBox(
            width: double.infinity,
            child: FilledButton.icon(
              onPressed: loading ? null : generate,
              style: FilledButton.styleFrom(backgroundColor: const Color(0xFFE8C781), foregroundColor: IeltsPalette.ink),
              icon: loading
                ? const SizedBox(width: 17, height: 17, child: CircularProgressIndicator(strokeWidth: 2))
                : const Icon(Icons.auto_awesome_rounded, size: 18),
              label: Text(loading ? 'Creating your cue card…' : 'Generate a fresh AI cue card'),
            ),
          ),
        ]),
      ),
      if (generated != null)
        cueCard(
          generated!['topic']?.toString() ?? 'AI Cue Card',
          generated!['promptText']?.toString() ?? '',
          (generated!['vocabularyHints'] as List? ?? [])
            .map((e) => e is Map ? e['phrase'].toString() : e.toString())
            .join(' • '),
          isAi: true,
        ),
      const SizedBox(height: 23),
      const PremiumSectionHeading('Practice library'),
      ...cards.asMap().entries.map((entry) {
        final card = entry.value;
        return cueCard(card['title']!, card['prompt']!, card['vocab']!, category: card['category']!);
      }),
      if (loading)
        const Padding(
          padding: EdgeInsets.all(24),
          child: Center(child: CircularProgressIndicator()),
        ),
    ],
  );

  Widget cueCard(String title, String prompt, String vocab, {String category = 'AI GENERATED', bool isAi = false}) {
    final prompts = prompt.split('\n').where((line) => line.trim().isNotEmpty).toList();
    final phrases = vocab.split('•').map((item) => item.trim()).where((item) => item.isNotEmpty).toList();
    return Container(
      margin: const EdgeInsets.only(top: 11),
      padding: const EdgeInsets.all(17),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(21),
        border: Border.all(color: isAi ? IeltsPalette.emerald.withValues(alpha: .45) : IeltsPalette.line),
        boxShadow: [BoxShadow(color: IeltsPalette.ink.withValues(alpha: .025), blurRadius: 13, offset: const Offset(0, 4))],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          PremiumChip(isAi ? 'AI CREATED' : category.toUpperCase(), icon: isAi ? Icons.auto_awesome_rounded : Icons.bookmark_outline_rounded),
          const Spacer(),
          const Icon(Icons.more_horiz_rounded, color: IeltsPalette.muted),
        ]),
        const SizedBox(height: 13),
        Text(title, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: IeltsPalette.ink, height: 1.25, letterSpacing: -.25)),
        const SizedBox(height: 14),
        const Text('YOU SHOULD SAY', style: TextStyle(color: IeltsPalette.emerald, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1.1)),
        const SizedBox(height: 9),
        ...prompts.map((line) {
          final clean = line.replaceFirst(RegExp(r'^[•–-]\s*'), '');
          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Padding(padding: EdgeInsets.only(top: 5), child: Icon(Icons.circle, size: 6, color: IeltsPalette.gold)),
              const SizedBox(width: 9),
              Expanded(child: Text(clean, style: const TextStyle(color: IeltsPalette.inkSoft, fontSize: 12, height: 1.35))),
            ]),
          );
        }),
        if (phrases.isNotEmpty) ...[
          const Divider(height: 22),
          const Text('USEFUL EXPRESSIONS', style: TextStyle(color: IeltsPalette.muted, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
          const SizedBox(height: 9),
          Wrap(spacing: 7, runSpacing: 7, children: phrases.map((phrase) => Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
            decoration: BoxDecoration(color: IeltsPalette.mint, borderRadius: BorderRadius.circular(10)),
            child: Text(phrase, style: const TextStyle(color: IeltsPalette.emeraldDeep, fontSize: 10, fontWeight: FontWeight.w700)),
          )).toList()),
        ],
      ]),
    );
  }
}

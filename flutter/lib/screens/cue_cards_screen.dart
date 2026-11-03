import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/gemini_api.dart';

class CueCardsScreen extends StatefulWidget {
  const CueCardsScreen({super.key, required this.prefs});
  final SharedPreferences prefs;
  @override
  State<CueCardsScreen> createState() => _CueCardsScreenState();
}

class _CueCardsScreenState extends State<CueCardsScreen> {
  bool loading = false;
  Map<String, dynamic>? generated;
  GeminiApi get api => GeminiApi(
    baseUrl: widget.prefs.getString('ielts_api_url') ?? const String.fromEnvironment('IELTS_API_URL'),
  );

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
    padding: const EdgeInsets.all(16),
    children: [
      Row(children: [
        const Expanded(child: Text('IELTS Speaking Part 2', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900))),
        FilledButton.tonalIcon(
          onPressed: loading ? null : generate,
          icon: const Icon(Icons.auto_awesome),
          label: const Text('AI Generate'),
        ),
      ]),
      const SizedBox(height: 5),
      const Text('Practise your 1-minute preparation and 2-minute long turn.'),
      if (generated != null)
        cueCard(
          generated!['topic']?.toString() ?? 'AI Cue Card',
          generated!['promptText']?.toString() ?? '',
          (generated!['vocabularyHints'] as List? ?? [])
              .map((e) => e is Map ? e['phrase'].toString() : e.toString())
              .join(' • '),
        ),
      ...cards.map((card) => cueCard(card['title']!, card['prompt']!, card['vocab']!)),
      if (loading)
        const Center(child: Padding(padding: EdgeInsets.all(20), child: CircularProgressIndicator())),
    ],
  );

  Widget cueCard(String title, String prompt, String vocab) => Card(
    margin: const EdgeInsets.only(top: 14),
    child: Padding(
      padding: const EdgeInsets.all(17),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Row(children: [
          Icon(Icons.timer_outlined, color: Color(0xFF059669)),
          SizedBox(width: 6),
          Text('PREPARE 1 MIN • SPEAK 2 MIN', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11, color: Color(0xFF059669))),
        ]),
        const SizedBox(height: 12),
        Text(title, style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900)),
        const SizedBox(height: 12),
        Text(prompt),
        const Divider(height: 24),
        const Text('BAND 8+ VOCABULARY', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11)),
        const SizedBox(height: 6),
        Text(vocab, style: const TextStyle(color: Color(0xFF059669), fontWeight: FontWeight.w600)),
      ]),
    ),
  );
}

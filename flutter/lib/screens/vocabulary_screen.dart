import 'package:flutter/material.dart';
import '../theme/ielts_theme.dart';
import '../widgets/premium_ui.dart';

class VocabularyScreen extends StatefulWidget {
  const VocabularyScreen({super.key});
  @override
  State<VocabularyScreen> createState() => _VocabularyScreenState();
}

class _VocabularyScreenState extends State<VocabularyScreen> {
  int index = 0;
  bool reveal = false;
  final cards = <({String word, String meaning, String example})>[
    (word: 'Densely populated metropolis', meaning: 'A large, heavily inhabited urban centre.', example: 'The capital has become a densely populated metropolis.'),
    (word: 'Marked disparity', meaning: 'A noticeable and significant difference.', example: 'There is a marked disparity in access to education.'),
    (word: 'Incur significant expenditure', meaning: 'To spend or require substantial financial resources.', example: 'Local councils incur significant expenditure on public transport.'),
    (word: 'Paradoxically enough', meaning: 'Contradicting common expectations.', example: 'Paradoxically enough, technology can make people feel isolated.'),
    (word: 'Hone professional acumen', meaning: 'Sharpen expertise and good workplace judgement.', example: 'The internship helped me hone my professional acumen.'),
    (word: 'Second to none', meaning: 'Unrivalled; better than all others.', example: 'The natural beauty of the region is second to none.'),
  ];

  @override
  Widget build(BuildContext context) {
    final card = cards[index];
    return ListView(
      padding: const EdgeInsets.fromLTRB(18, 18, 18, 30),
      children: [
        PremiumPageIntro(
          eyebrow: 'Lexical resource',
          title: 'Vocabulary lab',
          subtitle: 'Build a sharper vocabulary with useful phrases and natural examples.',
          trailing: PremiumChip('${cards.length} CARDS', icon: Icons.auto_stories_rounded),
        ),
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            border: Border.all(color: IeltsPalette.line),
          ),
          child: Row(children: [
            Container(
              width: 42, height: 42,
              decoration: BoxDecoration(color: const Color(0xFFFFF2D9), borderRadius: BorderRadius.circular(14)),
              child: const Icon(Icons.lightbulb_outline_rounded, color: IeltsPalette.gold),
            ),
            const SizedBox(width: 12),
            const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('Study smarter', style: TextStyle(fontWeight: FontWeight.w900, color: IeltsPalette.ink)),
              SizedBox(height: 3),
              Text('Learn a phrase, understand the meaning and use it in a sentence.', style: TextStyle(color: IeltsPalette.muted, fontSize: 11, height: 1.35)),
            ])),
          ]),
        ),
        const SizedBox(height: 18),
        Row(children: [
          const Text('YOUR FLASHCARD', style: TextStyle(color: IeltsPalette.emerald, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.2)),
          const Spacer(),
          Text('${index + 1} / ${cards.length}', style: const TextStyle(color: IeltsPalette.muted, fontSize: 11, fontWeight: FontWeight.w800)),
        ]),
        const SizedBox(height: 9),
        ClipRRect(
          borderRadius: BorderRadius.circular(30),
          child: LinearProgressIndicator(
            value: (index + 1) / cards.length,
            minHeight: 5,
            color: IeltsPalette.emerald,
            backgroundColor: const Color(0xFFE4ECE9),
          ),
        ),
        const SizedBox(height: 13),
        GestureDetector(
          onTap: () => setState(() => reveal = !reveal),
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 260),
            curve: Curves.easeOutCubic,
            constraints: const BoxConstraints(minHeight: 285),
            padding: const EdgeInsets.all(25),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: reveal
                  ? const [Color(0xFF17364A), Color(0xFF1B5D57)]
                  : const [Color(0xFF0E6D5D), Color(0xFF123B4C), Color(0xFF182D45)],
              ),
              borderRadius: BorderRadius.circular(26),
              boxShadow: [BoxShadow(color: IeltsPalette.ink.withValues(alpha: .12), blurRadius: 22, offset: const Offset(0, 10))],
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Container(
                  width: 36, height: 36,
                  decoration: BoxDecoration(color: Colors.white.withValues(alpha: .13), borderRadius: BorderRadius.circular(12)),
                  child: Icon(reveal ? Icons.menu_book_rounded : Icons.auto_stories_rounded, color: const Color(0xFFE7C887), size: 19),
                ),
                const SizedBox(width: 9),
                Text(reveal ? 'MEANING & EXAMPLE' : 'BAND 8+ EXPRESSION', style: const TextStyle(color: Colors.white70, fontWeight: FontWeight.w900, fontSize: 9, letterSpacing: 1.2)),
                const Spacer(),
                const Icon(Icons.flip_rounded, color: Colors.white70, size: 19),
              ]),
              const SizedBox(height: 28),
              AnimatedSwitcher(
                duration: const Duration(milliseconds: 220),
                child: Column(
                  key: ValueKey('${index}_$reveal'),
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      reveal ? 'DEFINITION' : 'THE EXPRESSION',
                      style: const TextStyle(color: Color(0xFFB7DDD2), fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1.2),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      reveal ? card.meaning : card.word,
                      style: const TextStyle(color: Colors.white, fontSize: 25, fontWeight: FontWeight.w900, letterSpacing: -.65, height: 1.13),
                    ),
                    if (reveal) ...[
                      const SizedBox(height: 23),
                      const Text('IN CONTEXT', style: TextStyle(color: Color(0xFFB7DDD2), fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1.2)),
                      const SizedBox(height: 8),
                      Text(card.example, style: const TextStyle(color: Colors.white, height: 1.5, fontSize: 14)),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 25),
              Row(children: [
                const Icon(Icons.touch_app_rounded, color: Colors.white70, size: 16),
                const SizedBox(width: 6),
                Text(reveal ? 'Tap to see the phrase' : 'Tap to reveal the meaning', style: const TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.w700)),
              ]),
            ]),
          ),
        ),
        const SizedBox(height: 14),
        Row(children: [
          Expanded(child: OutlinedButton.icon(
            onPressed: () => setState(() { index = (index - 1 + cards.length) % cards.length; reveal = false; }),
            icon: const Icon(Icons.arrow_back_rounded, size: 17),
            label: const Text('Previous'),
          )),
          const SizedBox(width: 10),
          Expanded(child: FilledButton.icon(
            onPressed: () => setState(() { index = (index + 1) % cards.length; reveal = false; }),
            icon: const Icon(Icons.arrow_forward_rounded, size: 17),
            label: const Text('Next card'),
          )),
        ]),
        const SizedBox(height: 22),
        const PremiumSectionHeading('Your vocabulary routine'),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: IeltsPalette.line)),
          child: const Column(children: [
            _RoutineLine(icon: Icons.visibility_outlined, title: 'Notice the phrase', detail: 'Understand where and when it sounds natural.'),
            SizedBox(height: 13),
            _RoutineLine(icon: Icons.translate_rounded, title: 'Understand the meaning', detail: 'Connect the phrase to an idea, not only a translation.'),
            SizedBox(height: 13),
            _RoutineLine(icon: Icons.record_voice_over_rounded, title: 'Use it aloud', detail: 'Create your own IELTS-style example.'),
          ]),
        ),
        const SizedBox(height: 18),
        const Text('Mistake-based vocabulary', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 15, color: IeltsPalette.ink)),
        const SizedBox(height: 5),
        const Text('Personalised flashcards from AI speaking feedback can be added when response-history storage is enabled.', style: TextStyle(color: IeltsPalette.muted, fontSize: 11, height: 1.4)),
      ],
    );
  }
}

class _RoutineLine extends StatelessWidget {
  const _RoutineLine({required this.icon, required this.title, required this.detail});
  final IconData icon;
  final String title;
  final String detail;

  @override
  Widget build(BuildContext context) => Row(children: [
    Container(
      width: 34, height: 34,
      decoration: BoxDecoration(color: IeltsPalette.mint, borderRadius: BorderRadius.circular(11)),
      child: Icon(icon, color: IeltsPalette.emerald, size: 17),
    ),
    const SizedBox(width: 11),
    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(title, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w900, color: IeltsPalette.ink)),
      const SizedBox(height: 2),
      Text(detail, style: const TextStyle(fontSize: 10, color: IeltsPalette.muted)),
    ])),
  ]);
}

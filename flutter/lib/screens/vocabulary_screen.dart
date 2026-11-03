import 'package:flutter/material.dart';

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
      padding: const EdgeInsets.all(18),
      children: [
        const Text('Personal Vocabulary Deck', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
        const Text('Review useful Band 8+ collocations and expressions.'),
        const SizedBox(height: 22),
        GestureDetector(
          onTap: () => setState(() => reveal = !reveal),
          child: Container(
            height: 260,
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              gradient: const LinearGradient(colors: [Color(0xFF047857), Color(0xFF0D9488)]),
              boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: .10), blurRadius: 18, offset: const Offset(0, 8))],
            ),
            child: Center(
              child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                Text(reveal ? 'MEANING & EXAMPLE' : 'VOCABULARY CARD ${index + 1}/${cards.length}', style: const TextStyle(color: Colors.white70, fontWeight: FontWeight.bold, letterSpacing: 1)),
                const SizedBox(height: 20),
                Text(reveal ? card.meaning : card.word, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white, fontSize: 25, fontWeight: FontWeight.w900)),
                if (reveal) ...[
                  const SizedBox(height: 16),
                  Text(card.example, textAlign: TextAlign.center, style: const TextStyle(color: Colors.white)),
                ],
                const SizedBox(height: 18),
                const Text('Tap to flip', style: TextStyle(color: Colors.white70)),
              ]),
            ),
          ),
        ),
        const SizedBox(height: 18),
        Row(children: [
          Expanded(child: OutlinedButton.icon(
            onPressed: () => setState(() { index = (index - 1 + cards.length) % cards.length; reveal = false; }),
            icon: const Icon(Icons.arrow_back), label: const Text('Previous'),
          )),
          const SizedBox(width: 10),
          Expanded(child: FilledButton.icon(
            onPressed: () => setState(() { index = (index + 1) % cards.length; reveal = false; }),
            icon: const Icon(Icons.arrow_forward), label: const Text('Next'),
          )),
        ]),
        const SizedBox(height: 24),
        const Text('Mistake-based cards', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 17)),
        const Text('Personalised Gemini flashcards from speaking mistakes will work after the secure AI backend is connected.'),
      ],
    );
  }
}

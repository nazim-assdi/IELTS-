import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../services/progress_store.dart';
import '../theme/ielts_theme.dart';
import '../widgets/premium_ui.dart';

class MistakeReviewScreen extends StatefulWidget {
  const MistakeReviewScreen({super.key, required this.prefs});
  final SharedPreferences prefs;

  @override
  State<MistakeReviewScreen> createState() => _MistakeReviewScreenState();
}

class _MistakeReviewScreenState extends State<MistakeReviewScreen> {
  late final ProgressStore store = ProgressStore(widget.prefs);
  String? expandedId;
  bool dueOnly = true;
  bool saving = false;

  List<Map<String, dynamic>> get items {
    final all = store.mistakeBank;
    if (!dueOnly) return all.where((item) => item['mastered'] != true).toList();
    return store.dueMistakes;
  }

  Future<void> _review(Map<String, dynamic> item, bool remembered) async {
    if (saving) return;
    setState(() => saving = true);
    try {
      await store.reviewMistake(item['id'].toString(), remembered: remembered);
      if (mounted) setState(() => expandedId = null);
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final list = items;
    return Scaffold(
      appBar: AppBar(
        title: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('ADAPTIVE PRACTICE', style: TextStyle(color: IeltsPalette.emerald, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1.2)),
          Text('Mistake review', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w900)),
        ]),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(18, 14, 18, 30),
        children: [
          Container(
            padding: const EdgeInsets.all(18),
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [Color(0xFF0E6D5D), Color(0xFF17364A)], begin: Alignment.topLeft, end: Alignment.bottomRight),
              borderRadius: BorderRadius.circular(22),
            ),
            child: Row(children: [
              const Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Turn mistakes into progress', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900)),
                SizedBox(height: 5),
                Text('Review an answer, recall it, then revisit it at gradually longer intervals.', style: TextStyle(color: Colors.white70, fontSize: 11, height: 1.4)),
              ])),
              const SizedBox(width: 12),
              Column(children: [
                Text('${store.dueMistakeCount}', style: const TextStyle(color: Color(0xFFF0D18A), fontSize: 25, fontWeight: FontWeight.w900)),
                const Text('DUE', style: TextStyle(color: Colors.white70, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
              ]),
            ]),
          ),
          const SizedBox(height: 16),
          Row(children: [
            Expanded(child: ChoiceChip(label: Text('Due now (${store.dueMistakeCount})'), selected: dueOnly, onSelected: (_) => setState(() => dueOnly = true))),
            const SizedBox(width: 8),
            Expanded(child: ChoiceChip(label: Text('All active (${store.activeMistakeCount})'), selected: !dueOnly, onSelected: (_) => setState(() => dueOnly = false))),
          ]),
          const SizedBox(height: 12),
          if (list.isEmpty)
            Container(
              padding: const EdgeInsets.all(22),
              decoration: BoxDecoration(color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(20), border: Border.all(color: IeltsPalette.line)),
              child: Column(children: [
                const Icon(Icons.check_circle_outline_rounded, color: IeltsPalette.emerald, size: 42),
                const SizedBox(height: 10),
                Text(dueOnly ? 'You are all caught up' : 'No active mistakes yet', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                const SizedBox(height: 5),
                Text(dueOnly ? 'New missed questions will appear here when you practise lessons.' : 'When you miss a lesson question, IELTS HERO will add it here for spaced review.', textAlign: TextAlign.center, style: const TextStyle(color: IeltsPalette.muted, fontSize: 12, height: 1.45)),
              ]),
            ),
          ...list.map(_mistakeCard),
          const SizedBox(height: 14),
          const Text('REVIEW SCHEDULE', style: TextStyle(color: IeltsPalette.emerald, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.2)),
          const SizedBox(height: 7),
          const Text('When you remember an answer, its next review moves to 1, 3, 7, 14 and 30 days. Choosing “Need practice” brings it back tomorrow.', style: TextStyle(color: IeltsPalette.muted, fontSize: 11, height: 1.5)),
        ],
      ),
    );
  }

  Widget _mistakeCard(Map<String, dynamic> item) {
    final id = item['id'].toString();
    final open = expandedId == id;
    final dueAt = DateTime.tryParse(item['dueAt']?.toString() ?? '');
    final dueText = dueAt == null ? 'Review due' : 'Due ${dueAt.toLocal().day.toString().padLeft(2, '0')}/${dueAt.toLocal().month.toString().padLeft(2, '0')}';
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(18), border: Border.all(color: IeltsPalette.line)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          PremiumChip((item['skill'] ?? 'Practice').toString().toUpperCase()),
          const Spacer(),
          Text(dueText, style: const TextStyle(color: IeltsPalette.muted, fontSize: 10, fontWeight: FontWeight.w700)),
        ]),
        const SizedBox(height: 10),
        Text(item['prompt']?.toString() ?? 'Review this question', style: const TextStyle(color: IeltsPalette.ink, fontSize: 14, fontWeight: FontWeight.w900, height: 1.35)),
        if (open) ...[
          const SizedBox(height: 12),
          _answerBlock('YOUR ANSWER', item['userAnswer']?.toString() ?? '', const Color(0xFFFFF2E7), const Color(0xFFA15D21)),
          const SizedBox(height: 7),
          _answerBlock('CORRECT ANSWER', item['correctAnswer']?.toString() ?? '', IeltsPalette.mint, IeltsPalette.emeraldDeep),
          if ((item['explanation'] ?? '').toString().trim().isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(item['explanation'].toString(), style: const TextStyle(color: IeltsPalette.muted, fontSize: 11, height: 1.45)),
          ],
          const SizedBox(height: 13),
          Row(children: [
            Expanded(child: OutlinedButton(onPressed: saving ? null : () => _review(item, false), child: const Text('Need practice'))),
            const SizedBox(width: 8),
            Expanded(child: FilledButton(onPressed: saving ? null : () => _review(item, true), child: const Text('I remembered'))),
          ]),
        ] else ...[
          const SizedBox(height: 7),
          Text('${item['wrongCount'] ?? 1} missed attempt(s) · Stage ${(item['stage'] as num? ?? 0) + 1}/5', style: const TextStyle(color: IeltsPalette.muted, fontSize: 10)),
          Align(alignment: Alignment.centerRight, child: TextButton.icon(onPressed: () => setState(() => expandedId = id), icon: const Icon(Icons.visibility_rounded, size: 15), label: const Text('Reveal answer'))),
        ],
      ]),
    );
  }

  Widget _answerBlock(String label, String value, Color background, Color foreground) => Container(
    width: double.infinity,
    padding: const EdgeInsets.all(11),
    decoration: BoxDecoration(color: background, borderRadius: BorderRadius.circular(12)),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(label, style: TextStyle(color: foreground, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: .8)),
      const SizedBox(height: 4),
      Text(value.isEmpty ? '—' : value, style: TextStyle(color: foreground, fontSize: 12, fontWeight: FontWeight.w700)),
    ]),
  );
}

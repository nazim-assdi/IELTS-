import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../services/progress_store.dart';
import '../theme/ielts_theme.dart';
import '../widgets/premium_ui.dart';

class StudyPlannerScreen extends StatefulWidget {
  const StudyPlannerScreen({
    super.key,
    required this.prefs,
    required this.onOpenTab,
  });

  final SharedPreferences prefs;
  final ValueChanged<int> onOpenTab;

  @override
  State<StudyPlannerScreen> createState() => _StudyPlannerScreenState();
}

class _StudyPlannerScreenState extends State<StudyPlannerScreen> {
  late final ProgressStore store = ProgressStore(widget.prefs);
  bool saving = false;

  static const tasks = <_PlanTask>[
    _PlanTask(
      id: 'lesson',
      title: 'Focused lesson',
      subtitle: 'Build one core IELTS skill',
      minutes: 15,
      icon: Icons.menu_book_rounded,
      tab: 0,
      button: 'Open lessons',
    ),
    _PlanTask(
      id: 'speaking',
      title: 'Speaking practice',
      subtitle: 'Answer aloud and develop fluency',
      minutes: 10,
      icon: Icons.graphic_eq_rounded,
      tab: 1,
      button: 'Open speaking',
    ),
    _PlanTask(
      id: 'vocabulary',
      title: 'Vocabulary revision',
      subtitle: 'Review useful words and expressions',
      minutes: 10,
      icon: Icons.auto_stories_rounded,
      tab: 3,
      button: 'Open dictionary',
    ),
    _PlanTask(
      id: 'review',
      title: 'Quick review',
      subtitle: 'Revisit mistakes and yesterday’s notes',
      minutes: 5,
      icon: Icons.refresh_rounded,
      tab: 0,
      button: 'Review lessons',
    ),
  ];

  Future<void> _toggleTask(String id) async {
    if (saving) return;
    setState(() => saving = true);
    try {
      await store.togglePlanTask(id);
      if (mounted) setState(() {});
    } finally {
      if (mounted) setState(() => saving = false);
    }
  }

  Future<void> _setLessonGoal(int value) async {
    await store.setDailyLessonGoal(value);
    if (mounted) setState(() {});
  }

  Future<void> _setMinuteGoal(int value) async {
    await store.setDailyStudyMinutesGoal(value);
    if (mounted) setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    final doneIds = store.todayPlanTaskIds.toSet();
    final completedMinutes = tasks
        .where((task) => doneIds.contains(task.id))
        .fold<int>(0, (sum, task) => sum + task.minutes);
    final goalMinutes = store.dailyStudyMinutesGoal;
    final goalMinutesDone = completedMinutes.clamp(0, goalMinutes).toInt();
    final progress = (goalMinutesDone / goalMinutes).clamp(0.0, 1.0).toDouble();

    return Scaffold(
      appBar: AppBar(
        title: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('YOUR PERSONAL ROUTINE', style: TextStyle(color: IeltsPalette.emerald, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1.2)),
          Text('Study planner', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w900)),
        ]),
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(18, 16, 18, 30),
        children: [
          PremiumPageIntro(
            eyebrow: 'Build a consistent habit',
            title: 'Your next step,\nmade simple.',
            subtitle: 'A practical routine for balanced IELTS preparation. Adjust your targets and tick off each activity as you complete it.',
            trailing: const PremiumChip('PERSONAL PLAN', icon: Icons.event_note_rounded),
          ),
          _todaySummary(progress, goalMinutesDone, goalMinutes, doneIds.length),
          const SizedBox(height: 22),
          const PremiumSectionHeading('Set your daily targets'),
          _goalSettings(),
          const SizedBox(height: 22),
          Row(children: [
            const Expanded(child: PremiumSectionHeading('Today’s study checklist')),
            PremiumChip('${doneIds.length}/${tasks.length} DONE'),
          ]),
          ...tasks.map((task) => _taskCard(task, doneIds.contains(task.id))),
          const SizedBox(height: 22),
          if (store.latestSpeakingEvaluation != null) ...[
            const PremiumSectionHeading('Latest speaking assessment'),
            _latestAssessment(store.latestSpeakingEvaluation!),
            const SizedBox(height: 17),
            if (store.speakingEvaluationHistory.length > 1) ...[
              const PremiumSectionHeading('Band progress history'),
              _assessmentHistory(),
              const SizedBox(height: 3),
            ],
          ],
          const PremiumSectionHeading('Your last 7 days'),
          _weeklyActivity(),
          const SizedBox(height: 18),
          _coachTip(doneIds.length, progress),
        ],
      ),
    );
  }

  Widget _todaySummary(double progress, int minutes, int total, int count) => Container(
    padding: const EdgeInsets.all(19),
    decoration: BoxDecoration(
      gradient: const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF0E6D5D), Color(0xFF123B4C), Color(0xFF182D45)],
      ),
      borderRadius: BorderRadius.circular(24),
      boxShadow: [BoxShadow(color: IeltsPalette.emeraldDeep.withValues(alpha: .13), blurRadius: 18, offset: const Offset(0, 8))],
    ),
    child: Row(children: [
      SizedBox(
        width: 82,
        height: 82,
        child: Stack(alignment: Alignment.center, children: [
          SizedBox.expand(child: CircularProgressIndicator(
            value: progress,
            strokeWidth: 7,
            strokeCap: StrokeCap.round,
            backgroundColor: Colors.white.withValues(alpha: .15),
            valueColor: const AlwaysStoppedAnimation(Color(0xFFE7C887)),
          )),
          Column(mainAxisSize: MainAxisSize.min, children: [
            Text('${(progress * 100).round()}%', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 19)),
            const Text('DONE', style: TextStyle(color: Colors.white70, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: 1)),
          ]),
        ]),
      ),
      const SizedBox(width: 17),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('TODAY’S MOMENTUM', style: TextStyle(color: Color(0xFFB7DDD2), fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1.3)),
        const SizedBox(height: 7),
        Text('$minutes of $total minutes', style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 20, letterSpacing: -.5)),
        const SizedBox(height: 4),
        Text('$count of ${tasks.length} planned activities completed', style: const TextStyle(color: Colors.white70, fontSize: 10)),
      ])),
    ]),
  );

  Widget _goalSettings() => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: IeltsPalette.line)),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('Lessons per day', style: TextStyle(color: IeltsPalette.ink, fontWeight: FontWeight.w900, fontSize: 12)),
      const SizedBox(height: 9),
      Wrap(
        spacing: 8,
        children: [3, 5, 8].map((value) => ChoiceChip(
          label: Text('$value lessons'),
          selected: store.dailyLessonGoal == value,
          onSelected: (_) => _setLessonGoal(value),
          selectedColor: IeltsPalette.mint,
          side: BorderSide(color: store.dailyLessonGoal == value ? IeltsPalette.emerald.withValues(alpha: .35) : IeltsPalette.line),
          labelStyle: TextStyle(color: store.dailyLessonGoal == value ? IeltsPalette.emeraldDeep : IeltsPalette.inkSoft, fontWeight: FontWeight.w800, fontSize: 11),
        )).toList(),
      ),
      const Divider(height: 25),
      const Text('Daily study time', style: TextStyle(color: IeltsPalette.ink, fontWeight: FontWeight.w900, fontSize: 12)),
      const SizedBox(height: 9),
      Wrap(
        spacing: 8,
        children: [20, 30, 40].map((value) => ChoiceChip(
          label: Text('$value min'),
          selected: store.dailyStudyMinutesGoal == value,
          onSelected: (_) => _setMinuteGoal(value),
          selectedColor: IeltsPalette.mint,
          side: BorderSide(color: store.dailyStudyMinutesGoal == value ? IeltsPalette.emerald.withValues(alpha: .35) : IeltsPalette.line),
          labelStyle: TextStyle(color: store.dailyStudyMinutesGoal == value ? IeltsPalette.emeraldDeep : IeltsPalette.inkSoft, fontWeight: FontWeight.w800, fontSize: 11),
        )).toList(),
      ),
    ]),
  );

  Widget _taskCard(_PlanTask task, bool done) => Container(
    margin: const EdgeInsets.only(top: 9),
    padding: const EdgeInsets.all(13),
    decoration: BoxDecoration(
      color: done ? const Color(0xFFF0F8F4) : Colors.white,
      borderRadius: BorderRadius.circular(18),
      border: Border.all(color: done ? IeltsPalette.emerald.withValues(alpha: .25) : IeltsPalette.line),
    ),
    child: Row(children: [
      InkWell(
        onTap: saving ? null : () => _toggleTask(task.id),
        borderRadius: BorderRadius.circular(12),
        child: Container(
          height: 38,
          width: 38,
          decoration: BoxDecoration(color: done ? IeltsPalette.emerald : IeltsPalette.mint, borderRadius: BorderRadius.circular(12)),
          child: Icon(done ? Icons.check_rounded : task.icon, color: done ? Colors.white : IeltsPalette.emerald, size: 19),
        ),
      ),
      const SizedBox(width: 11),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(task.title, style: TextStyle(color: IeltsPalette.ink, fontWeight: FontWeight.w900, fontSize: 12, decoration: done ? TextDecoration.lineThrough : null)),
        const SizedBox(height: 3),
        Text(task.subtitle, style: const TextStyle(color: IeltsPalette.muted, fontSize: 10)),
        const SizedBox(height: 5),
        Text('${task.minutes} minutes', style: const TextStyle(color: IeltsPalette.emerald, fontSize: 9, fontWeight: FontWeight.w900)),
      ])),
      IconButton(
        tooltip: task.button,
        onPressed: () => widget.onOpenTab(task.tab),
        icon: const Icon(Icons.arrow_forward_rounded, color: IeltsPalette.muted, size: 19),
      ),
      Checkbox(
        value: done,
        onChanged: saving ? null : (_) => _toggleTask(task.id),
        activeColor: IeltsPalette.emerald,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(5)),
      ),
    ]),
  );

  Widget _latestAssessment(Map<String, dynamic> result) {
    final band = result['overallBand']?.toString() ?? '—';
    final rawDate = DateTime.tryParse(result['date']?.toString() ?? '');
    final dateLabel = rawDate == null
        ? 'Recent assessment'
        : '${rawDate.day.toString().padLeft(2, '0')}/${rawDate.month.toString().padLeft(2, '0')}/${rawDate.year}';
    final improvements = result['improvements'] is List
        ? (result['improvements'] as List).take(2).map((item) => item.toString()).toList()
        : <String>[];
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(19),
        border: Border.all(color: IeltsPalette.line),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(color: const Color(0xFFECEBFA), borderRadius: BorderRadius.circular(13)),
            child: const Icon(Icons.workspace_premium_rounded, color: Color(0xFF7770B9)),
          ),
          const SizedBox(width: 11),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('AI estimated band', style: TextStyle(color: IeltsPalette.muted, fontSize: 10, fontWeight: FontWeight.w700)),
            Text(band, style: const TextStyle(color: IeltsPalette.ink, fontSize: 21, fontWeight: FontWeight.w900)),
          ])),
          PremiumChip(dateLabel),
        ]),
        if (improvements.isNotEmpty) ...[
          const Divider(height: 22),
          const Text('FOCUS NEXT', style: TextStyle(color: IeltsPalette.gold, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
          const SizedBox(height: 7),
          ...improvements.map((item) => Padding(
            padding: const EdgeInsets.only(bottom: 5),
            child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Icon(Icons.arrow_right_rounded, size: 17, color: IeltsPalette.emerald),
              Expanded(child: Text(item, style: const TextStyle(color: IeltsPalette.inkSoft, fontSize: 10, height: 1.4))),
            ]),
          )),
        ],
        const SizedBox(height: 7),
        const Text('AI estimate only · Not an official IELTS result', style: TextStyle(color: IeltsPalette.muted, fontSize: 9)),
      ]),
    );
  }

  Widget _assessmentHistory() {
    final history = store.speakingEvaluationHistory.take(5).toList();
    final latestBand = (history.first['overallBand'] as num?)?.toDouble();
    final oldestBand = (history.last['overallBand'] as num?)?.toDouble();
    final change = latestBand == null || oldestBand == null ? null : latestBand - oldestBand;
    final trendColor = change == null
        ? IeltsPalette.muted
        : change > 0 ? IeltsPalette.emerald : change < 0 ? const Color(0xFFB95B43) : IeltsPalette.muted;
    final trendText = change == null
        ? 'Recent results'
        : change > 0 ? '+${change.toStringAsFixed(1)} band' : change < 0 ? change.toStringAsFixed(1) : 'No change';

    return Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        const Expanded(child: Text('Most recent assessments first', style: TextStyle(color: IeltsPalette.muted, fontSize: 10))),
        PremiumChip(trendText, icon: change != null && change > 0 ? Icons.trending_up_rounded : Icons.insights_rounded, color: trendColor),
      ]),
      const SizedBox(height: 10),
      SizedBox(
        height: 102,
        child: ListView(
          scrollDirection: Axis.horizontal,
          children: history.map((item) {
            final band = item['overallBand']?.toString() ?? '—';
            final parsed = DateTime.tryParse(item['date']?.toString() ?? '');
            final date = parsed == null
                ? 'Recent'
                : '${parsed.day.toString().padLeft(2, '0')}/${parsed.month.toString().padLeft(2, '0')}';
            return Container(
              width: 106,
              margin: const EdgeInsets.only(right: 9),
              padding: const EdgeInsets.all(13),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(17),
                border: Border.all(color: IeltsPalette.line),
              ),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                const Text('IELTS BAND', style: TextStyle(color: IeltsPalette.muted, fontSize: 8, fontWeight: FontWeight.w900, letterSpacing: .8)),
                const Spacer(),
                Text(band, style: const TextStyle(color: IeltsPalette.ink, fontSize: 23, fontWeight: FontWeight.w900, letterSpacing: -.7)),
                const Spacer(),
                Text(date, style: const TextStyle(color: IeltsPalette.emerald, fontSize: 9, fontWeight: FontWeight.w800)),
              ]),
            );
          }).toList(),
        ),
      ),
    ]);
  }

  Widget _weeklyActivity() {
    final today = DateTime.now();
    final days = List.generate(7, (index) => today.subtract(Duration(days: 6 - index)));
    final counts = days.map((date) =>
      store.lessonCountForDate(date) + store.planTaskIdsForDate(date).length
    ).toList();
    final maxCount = counts.fold<int>(1, (maxValue, value) => value > maxValue ? value : maxValue);
    const labels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

    return Container(
      padding: const EdgeInsets.fromLTRB(15, 17, 15, 13),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20), border: Border.all(color: IeltsPalette.line)),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: List.generate(7, (index) {
          final date = days[index];
          final count = counts[index];
          final isToday = ProgressStore.dateKey(date) == ProgressStore.dateKey(today);
          final height = count == 0 ? 7.0 : 12.0 + (count / maxCount) * 43;
          return Expanded(child: Column(mainAxisSize: MainAxisSize.min, children: [
            Text(count.toString(), style: TextStyle(color: count > 0 ? IeltsPalette.emerald : IeltsPalette.muted, fontSize: 9, fontWeight: FontWeight.w900)),
            const SizedBox(height: 7),
            Container(
              height: height,
              width: 17,
              decoration: BoxDecoration(
                color: count > 0 ? (isToday ? IeltsPalette.emerald : const Color(0xFF8DCDB8)) : const Color(0xFFEAF0F2),
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            const SizedBox(height: 7),
            Text(labels[date.weekday - 1], style: TextStyle(color: isToday ? IeltsPalette.emerald : IeltsPalette.muted, fontSize: 9, fontWeight: FontWeight.w900)),
          ]));
        }),
      ),
    );
  }

  Widget _coachTip(int done, double progress) {
    final title = done == 0
      ? 'Start with one small win'
      : progress >= 1
        ? 'Your plan is complete'
        : 'Keep your momentum';
    final detail = done == 0
      ? 'Begin with a focused lesson, then practise speaking aloud. Consistency is more useful than cramming.'
      : progress >= 1
        ? 'Excellent work. A short review tomorrow will help reinforce what you learned today.'
        : 'You have made a start. Complete one more activity before you finish your study session.';
    return Container(
      padding: const EdgeInsets.all(15),
      decoration: BoxDecoration(color: const Color(0xFFFFF5E4), borderRadius: BorderRadius.circular(17), border: Border.all(color: const Color(0xFFF2E4C6))),
      child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Icon(Icons.tips_and_updates_rounded, color: IeltsPalette.gold, size: 20),
        const SizedBox(width: 10),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('STUDY COACH · $title', style: const TextStyle(color: IeltsPalette.ink, fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: .4)),
          const SizedBox(height: 5),
          Text(detail, style: const TextStyle(color: IeltsPalette.inkSoft, fontSize: 11, height: 1.45)),
        ])),
      ]),
    );
  }
}

class _PlanTask {
  const _PlanTask({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.minutes,
    required this.icon,
    required this.tab,
    required this.button,
  });

  final String id;
  final String title;
  final String subtitle;
  final int minutes;
  final IconData icon;
  final int tab;
  final String button;
}

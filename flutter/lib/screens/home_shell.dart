import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../data/curriculum.dart';
import '../services/progress_store.dart';
import '../theme/ielts_theme.dart';
import '../widgets/premium_ui.dart';
import 'lesson_screen.dart';
import 'voice_screen.dart';
import 'cue_cards_screen.dart';
import 'vocabulary_screen.dart';
import 'translator_screen.dart';
import 'study_planner_screen.dart';
import 'mock_test_screen.dart';
import 'mistake_review_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({
    super.key,
    required this.prefs,
    required this.themeName,
    required this.onThemeChanged,
  });

  final SharedPreferences prefs;
  final String themeName;
  final ValueChanged<String> onThemeChanged;

  @override
  State<HomeShell> createState() => _HomeShellState();
}

class _HomeShellState extends State<HomeShell> {
  late final ProgressStore progress = ProgressStore(widget.prefs);
  int tab = 0;
  int section = 1;

  final titles = const ['Your learning path', 'Speaking studio', 'Cue card library', 'Dictionary', 'AI translator', 'Mock Test Centre'];

  @override
  Widget build(BuildContext context) {
    final pages = <Widget>[
      learningPath(),
      VoiceScreen(prefs: widget.prefs),
      CueCardsScreen(prefs: widget.prefs),
      VocabularyScreen(prefs: widget.prefs),
      TranslatorScreen(prefs: widget.prefs),
      MockTestScreen(prefs: widget.prefs),
    ];

    return Scaffold(
      appBar: AppBar(
        toolbarHeight: 74,
        titleSpacing: 18,
        title: Row(children: [
          Container(
            height: 38,
            width: 38,
            decoration: BoxDecoration(
              gradient: const LinearGradient(colors: [IeltsPalette.emerald, IeltsPalette.emeraldDeep]),
              borderRadius: BorderRadius.circular(13),
            ),
            child: const Icon(Icons.shield_rounded, color: Colors.white, size: 22),
          ),
          const SizedBox(width: 10),
          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, mainAxisSize: MainAxisSize.min, children: [
            const Text('IELTS HERO', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 16, letterSpacing: -.5)),
            Text(titles[tab], style: const TextStyle(color: IeltsPalette.muted, fontSize: 10, fontWeight: FontWeight.w600)),
          ])),
        ]),
        actions: [
          _topMetric(Icons.local_fire_department_rounded, progress.streak.toString(), const Color(0xFFE4863D)),
          _topMetric(Icons.diamond_rounded, progress.gems.toString(), const Color(0xFF448AC4)),
          IconButton(
            tooltip: 'Appearance',
            onPressed: _showTheme,
            icon: const Icon(Icons.tune_rounded, color: IeltsPalette.inkSoft),
          ),
          const SizedBox(width: 5),
        ],
      ),
      body: IndexedStack(index: tab, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: tab,
        onDestinationSelected: (value) => setState(() => tab = value),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.space_dashboard_outlined), selectedIcon: Icon(Icons.space_dashboard_rounded), label: 'Home'),
          NavigationDestination(icon: Icon(Icons.graphic_eq_outlined), selectedIcon: Icon(Icons.graphic_eq_rounded), label: 'Speaking'),
          NavigationDestination(icon: Icon(Icons.style_outlined), selectedIcon: Icon(Icons.style_rounded), label: 'Cue Cards'),
          NavigationDestination(icon: Icon(Icons.auto_stories_outlined), selectedIcon: Icon(Icons.auto_stories_rounded), label: 'Dictionary'),
          NavigationDestination(icon: Icon(Icons.translate_rounded), selectedIcon: Icon(Icons.translate_rounded), label: 'Translate'),
          NavigationDestination(icon: Icon(Icons.fact_check_outlined), selectedIcon: Icon(Icons.fact_check_rounded), label: 'Mock Test'),
        ],
      ),
    );
  }

  Widget _topMetric(IconData icon, String value, Color color) => Padding(
    padding: const EdgeInsets.only(right: 2),
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 7),
      decoration: BoxDecoration(color: color.withValues(alpha: .09), borderRadius: BorderRadius.circular(12)),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 15, color: color),
        const SizedBox(width: 4),
        Text(value, style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w900)),
      ]),
    ),
  );

  Widget learningPath() {
    final completed = progress.completed;
    final units = List.generate(10, (i) => (section - 1) * 10 + i + 1)
        .where((number) => number <= unitTopics.length)
        .toList();
    final doneCount = units.where((number) => List.generate(4, (i) => i + 1)
        .every((lesson) => completed.contains('u$number-l$lesson'))).length;
    final dailyDone = progress.todayCompletedLessons;
    final dailyGoal = progress.dailyLessonGoal;
    final dailyProgress = (dailyDone / dailyGoal).clamp(0.0, 1.0).toDouble();

    return RefreshIndicator(
      color: IeltsPalette.emerald,
      onRefresh: () async => setState(() {}),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(18, 16, 18, 30),
        children: [
          _welcomeHeader(),
          const SizedBox(height: 16),
          _heroCard(),
          const SizedBox(height: 15),
          GridView.count(
            crossAxisCount: 2,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            mainAxisSpacing: 10,
            crossAxisSpacing: 10,
            childAspectRatio: 1.55,
            children: [
              PremiumMetricCard(
                icon: Icons.bolt_rounded,
                label: 'TOTAL EXPERIENCE',
                value: '${progress.xp} XP',
                detail: 'Keep your momentum',
                tint: const Color(0xFFFFF3DB),
                iconColor: const Color(0xFFC28D2B),
              ),
              PremiumMetricCard(
                icon: Icons.local_fire_department_rounded,
                label: 'CURRENT STREAK',
                value: '${progress.streak} days',
                detail: 'Consistency wins',
                tint: const Color(0xFFFFEDE2),
                iconColor: const Color(0xFFE27B42),
              ),
              PremiumMetricCard(
                icon: Icons.menu_book_rounded,
                label: 'LESSONS COMPLETED',
                value: '${completed.length}/400',
                detail: 'One step at a time',
              ),
              PremiumMetricCard(
                icon: Icons.workspace_premium_rounded,
                label: 'PREDICTED BAND',
                value: progress.band == 0 ? 'Not assessed' : progress.band.toStringAsFixed(1),
                detail: 'AI estimate',
                tint: const Color(0xFFECEBFA),
                iconColor: const Color(0xFF7770B9),
              ),
            ],
          ),
          const SizedBox(height: 23),
          PremiumSectionHeading('Your daily target', action: '$dailyDone/$dailyGoal'),
          Container(
            padding: const EdgeInsets.all(17),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(21),
              border: Border.all(color: IeltsPalette.line),
            ),
            child: Column(children: [
              Row(children: [
                Container(
                  height: 42,
                  width: 42,
                  decoration: BoxDecoration(color: IeltsPalette.mint, borderRadius: BorderRadius.circular(14)),
                  child: const Icon(Icons.flag_rounded, color: IeltsPalette.emerald),
                ),
                const SizedBox(width: 12),
                Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text('$dailyGoal focused lessons', style: TextStyle(fontWeight: FontWeight.w900, color: IeltsPalette.ink)),
                  SizedBox(height: 3),
                  Text('Build a study habit that lasts', style: TextStyle(fontSize: 11, color: IeltsPalette.muted)),
                ])),
                PremiumChip(dailyDone >= dailyGoal ? 'GOAL REACHED' : '${(dailyGoal - dailyDone).clamp(0, dailyGoal)} LEFT'),
              ]),
              const SizedBox(height: 16),
              ClipRRect(
                borderRadius: BorderRadius.circular(50),
                child: LinearProgressIndicator(
                  value: dailyProgress,
                  minHeight: 9,
                  backgroundColor: const Color(0xFFEAF0F2),
                  color: IeltsPalette.emerald,
                ),
              ),
              const SizedBox(height: 8),
              Align(
                alignment: Alignment.centerRight,
                child: Text('${(dailyProgress * 100).round()}% completed', style: const TextStyle(fontSize: 10, color: IeltsPalette.muted, fontWeight: FontWeight.w800)),
              ),
            ]),
          ),
          const SizedBox(height: 23),
          const PremiumSectionHeading('Practice at your pace'),
          PremiumFeatureTile(
            icon: Icons.graphic_eq_rounded,
            title: 'Real-time speaking',
            subtitle: 'Talk with your AI IELTS examiner',
            accent: const Color(0xFF0A9276),
            onTap: () => setState(() => tab = 1),
          ),
          const SizedBox(height: 9),
          PremiumFeatureTile(
            icon: Icons.style_rounded,
            title: 'Cue card practice',
            subtitle: 'Prepare for your two-minute long turn',
            accent: const Color(0xFF7D72C4),
            onTap: () => setState(() => tab = 2),
          ),
          const SizedBox(height: 9),
          PremiumFeatureTile(
            icon: Icons.translate_rounded,
            title: 'English · বাংলা translator',
            subtitle: 'Understand phrases and express ideas naturally',
            accent: const Color(0xFF3A8FB5),
            onTap: () => setState(() => tab = 4),
          ),
          const SizedBox(height: 9),
          PremiumFeatureTile(
            icon: Icons.menu_book_rounded,
            title: 'English dictionary',
            subtitle: 'Definitions, IPA, examples and Bangla meanings',
            accent: const Color(0xFFC28D2B),
            onTap: () => setState(() => tab = 3),
          ),
          const SizedBox(height: 9),
          PremiumFeatureTile(
            icon: Icons.fact_check_rounded,
            title: 'IELTS Mock Test Centre',
            subtitle: 'Four-skill diagnostic, saved results and adaptive next steps',
            accent: const Color(0xFF0B806A),
            onTap: () => setState(() => tab = 5),
          ),
          const SizedBox(height: 9),
          PremiumFeatureTile(
            icon: Icons.replay_circle_filled_rounded,
            title: 'Adaptive mistake review',
            subtitle: '${progress.dueMistakeCount} questions due · spaced revision',
            accent: const Color(0xFFC28D2B),
            onTap: _openMistakeReview,
          ),
          const SizedBox(height: 9),
          PremiumFeatureTile(
            icon: Icons.event_note_rounded,
            title: 'Personal study planner',
            subtitle: 'Set daily goals, follow a checklist and review your last 7 days',
            accent: const Color(0xFF5576A7),
            onTap: _openStudyPlanner,
          ),
          const SizedBox(height: 24),
          PremiumSectionHeading('Your learning roadmap', action: '${doneCount}/10 units'),
          SizedBox(
            height: 42,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: List.generate(10, (i) => Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(
                  label: Text('Stage ${i + 1}'),
                  selected: section == i + 1,
                  onSelected: (_) => setState(() => section = i + 1),
                  selectedColor: IeltsPalette.mint,
                  backgroundColor: Colors.white,
                  side: BorderSide(color: section == i + 1 ? IeltsPalette.emerald.withValues(alpha: .35) : IeltsPalette.line),
                  labelStyle: TextStyle(
                    color: section == i + 1 ? IeltsPalette.emerald : IeltsPalette.inkSoft,
                    fontWeight: FontWeight.w800,
                    fontSize: 11,
                  ),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(13)),
                ),
              )),
            ),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(17),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFF17364A), Color(0xFF1B5D57)],
              ),
              borderRadius: BorderRadius.circular(22),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('STAGE ${section.toString().padLeft(2, '0')}', style: const TextStyle(color: Color(0xFFB4D9CE), fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 1.4)),
              const SizedBox(height: 7),
              Text(sectionTitles[section - 1], style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 18, letterSpacing: -.35)),
              const SizedBox(height: 5),
              Text(sectionDescriptions[section - 1], style: const TextStyle(color: Colors.white70, fontSize: 12, height: 1.4)),
              const SizedBox(height: 14),
              ClipRRect(
                borderRadius: BorderRadius.circular(20),
                child: LinearProgressIndicator(
                  value: doneCount / 10,
                  minHeight: 7,
                  color: const Color(0xFF64D4AE),
                  backgroundColor: Colors.white.withValues(alpha: .16),
                ),
              ),
              const SizedBox(height: 7),
              Text('$doneCount of 10 units completed', style: const TextStyle(color: Colors.white70, fontSize: 10, fontWeight: FontWeight.w700)),
            ]),
          ),
          const SizedBox(height: 10),
          ...units.map(_unitTile),
        ],
      ),
    );
  }

  Widget _welcomeHeader() => Row(crossAxisAlignment: CrossAxisAlignment.center, children: [
    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      const Text('WELCOME BACK', style: TextStyle(color: IeltsPalette.emerald, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.5)),
      const SizedBox(height: 4),
      Text('Ready to level up?', style: Theme.of(context).textTheme.headlineSmall?.copyWith(
        fontWeight: FontWeight.w900,
        color: IeltsPalette.ink,
        letterSpacing: -.7,
      )),
      const SizedBox(height: 4),
      const Text('A little practice today makes a big difference.', style: TextStyle(color: IeltsPalette.muted, fontSize: 12)),
    ])),
    Container(
      height: 46,
      width: 46,
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: IeltsPalette.line),
      ),
      child: const Icon(Icons.auto_awesome_rounded, color: IeltsPalette.gold),
    ),
  ]);

  Widget _heroCard() => Container(
    height: 190,
    padding: const EdgeInsets.all(21),
    decoration: BoxDecoration(
      gradient: const LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [Color(0xFF0E6D5D), Color(0xFF123B4C), Color(0xFF182D45)],
      ),
      borderRadius: BorderRadius.circular(26),
      boxShadow: [BoxShadow(color: IeltsPalette.emeraldDeep.withValues(alpha: .16), blurRadius: 22, offset: const Offset(0, 10))],
    ),
    child: Stack(children: [
      Positioned(right: -23, top: -33, child: Container(
        height: 145, width: 145,
        decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: Colors.white.withValues(alpha: .08), width: 24)),
      )),
      Positioned(right: 2, bottom: 0, child: Icon(Icons.school_rounded, size: 78, color: Colors.white.withValues(alpha: .10))),
      Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Row(children: [
          Icon(Icons.stars_rounded, color: Color(0xFFE7C887), size: 16),
          SizedBox(width: 6),
          Text('YOUR IELTS JOURNEY', style: TextStyle(color: Color(0xFFC2DCD6), fontWeight: FontWeight.w900, letterSpacing: 1.3, fontSize: 10)),
        ]),
        const Spacer(),
        const Text('Your next band\nstarts with today.', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 24, letterSpacing: -.8, height: 1.08)),
        const SizedBox(height: 8),
        Text('${progress.completed.length} of 400 lessons completed', style: const TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w600)),
      ]),
      Positioned(right: 2, bottom: 2, child: SizedBox(
        width: 66, height: 66,
        child: Stack(alignment: Alignment.center, children: [
          CircularProgressIndicator(
            value: progress.completed.length / 400,
            strokeWidth: 5,
            backgroundColor: Colors.white.withValues(alpha: .18),
            valueColor: const AlwaysStoppedAnimation(Color(0xFFE5C37B)),
          ),
          Text('${(progress.completed.length / 4).round()}%', style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w900)),
        ]),
      )),
    ]),
  );

  Widget _unitTile(int number) {
    final topic = unitTopics[number - 1];
    final doneLessons = List.generate(4, (i) => i + 1)
        .where((lesson) => progress.completed.contains('u$number-l$lesson')).length;
    final done = doneLessons == 4;
    return Padding(
      padding: const EdgeInsets.only(top: 9),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: IeltsPalette.line),
        ),
        child: ExpansionTile(
          tilePadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 5),
          childrenPadding: const EdgeInsets.only(bottom: 7),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          collapsedShape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          leading: Container(
            height: 42, width: 42,
            decoration: BoxDecoration(
              color: done ? IeltsPalette.emerald : IeltsPalette.mint,
              borderRadius: BorderRadius.circular(14),
            ),
            child: Center(child: done
              ? const Icon(Icons.check_rounded, color: Colors.white)
              : Text(number.toString().padLeft(2, '0'), style: const TextStyle(color: IeltsPalette.emerald, fontWeight: FontWeight.w900, fontSize: 12))),
          ),
          title: Text(topic.title, style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 13, color: IeltsPalette.ink)),
          subtitle: Padding(
            padding: const EdgeInsets.only(top: 4),
            child: Row(children: [
              Expanded(child: Text(topic.badge, style: const TextStyle(color: IeltsPalette.emerald, fontSize: 10, fontWeight: FontWeight.w800))),
              Text('$doneLessons/4 lessons', style: const TextStyle(color: IeltsPalette.muted, fontSize: 10, fontWeight: FontWeight.w700)),
            ]),
          ),
          trailing: Icon(done ? Icons.verified_rounded : Icons.keyboard_arrow_down_rounded, color: done ? IeltsPalette.emerald : IeltsPalette.muted),
          children: [
            _lessonButton(number, 1, 'Foundations', 'Build the core skills'),
            _lessonButton(number, 2, 'Accuracy & structure', 'Develop natural sentences'),
            _lessonButton(number, 3, 'Vocabulary lab', 'Learn words in context'),
            _lessonButton(number, 4, 'Speaking challenge', 'Apply what you have learned'),
          ],
        ),
      ),
    );
  }

  Widget _lessonButton(int number, int lesson, String title, String subtitle) {
    final isDone = progress.completed.contains('u$number-l$lesson');
    return Padding(
      padding: const EdgeInsets.fromLTRB(14, 2, 14, 2),
      child: Material(
        color: const Color(0xFFF7FAF9),
        borderRadius: BorderRadius.circular(14),
        child: InkWell(
          borderRadius: BorderRadius.circular(14),
          onTap: () async {
            await Navigator.push(context, MaterialPageRoute(
              builder: (_) => LessonScreen(unitNumber: number, lessonNumber: lesson, prefs: widget.prefs),
            ));
            if (mounted) setState(() {});
          },
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            child: Row(children: [
              Icon(isDone ? Icons.check_circle_rounded : Icons.play_circle_outline_rounded,
                color: isDone ? IeltsPalette.emerald : IeltsPalette.muted, size: 20),
              const SizedBox(width: 10),
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Lesson $lesson · $title', style: const TextStyle(color: IeltsPalette.ink, fontWeight: FontWeight.w800, fontSize: 12)),
                const SizedBox(height: 2),
                Text(subtitle, style: const TextStyle(color: IeltsPalette.muted, fontSize: 10)),
              ])),
              const Icon(Icons.arrow_forward_ios_rounded, size: 12, color: IeltsPalette.muted),
            ]),
          ),
        ),
      ),
    );
  }

  Future<void> _openMistakeReview() async {
    await Navigator.push(context, MaterialPageRoute(
      builder: (_) => MistakeReviewScreen(prefs: widget.prefs),
    ));
    if (mounted) setState(() {});
  }

  Future<void> _openStudyPlanner() async {
    await Navigator.push(context, MaterialPageRoute(
      builder: (_) => StudyPlannerScreen(
        prefs: widget.prefs,
        onOpenTab: (nextTab) {
          Navigator.pop(context);
          if (mounted) setState(() => tab = nextTab);
        },
      ),
    ));
    if (mounted) setState(() {});
  }

  void _showTheme() {
    showModalBottomSheet<void>(
      context: context,
      backgroundColor: Colors.white,
      showDragHandle: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(28))),
      builder: (sheetContext) => SafeArea(
        child: Padding(
          padding: const EdgeInsets.fromLTRB(18, 5, 18, 18),
          child: Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Personalise your space', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: IeltsPalette.ink)),
            const SizedBox(height: 5),
            const Text('Choose a comfortable look for your study sessions.', style: TextStyle(color: IeltsPalette.muted, fontSize: 12)),
            const SizedBox(height: 12),
            ...[
              ('paper-warm', 'Classic ivory', 'Warm, focused and calm', const Color(0xFFF7F6F2)),
              ('soft-sage', 'Soft sage', 'Fresh and easy on the eyes', const Color(0xFFE8F1EC)),
              ('midnight-slate', 'Midnight', 'A refined dark study space', const Color(0xFF142336)),
            ].map((item) => RadioListTile<String>(
              value: item.$1,
              groupValue: widget.themeName,
              contentPadding: EdgeInsets.zero,
              activeColor: IeltsPalette.emerald,
              title: Text(item.$2, style: const TextStyle(fontWeight: FontWeight.w800)),
              subtitle: Text(item.$3),
              secondary: Container(
                height: 32, width: 32,
                decoration: BoxDecoration(color: item.$4, borderRadius: BorderRadius.circular(10), border: Border.all(color: IeltsPalette.line)),
              ),
              onChanged: (value) {
                if (value != null) {
                  widget.onThemeChanged(value);
                  Navigator.pop(sheetContext);
                }
              },
            )),
          ]),
        ),
      ),
    );
  }
}

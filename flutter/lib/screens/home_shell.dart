import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../data/curriculum.dart';
import '../services/progress_store.dart';
import 'lesson_screen.dart';
import 'voice_screen.dart';
import 'cue_cards_screen.dart';
import 'vocabulary_screen.dart';

class HomeShell extends StatefulWidget {
  const HomeShell({super.key, required this.prefs, required this.themeName, required this.onThemeChanged});
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

  @override
  Widget build(BuildContext context) {
    final pages = <Widget>[
      learningPath(),
      VoiceScreen(prefs: widget.prefs),
      const CueCardsScreen(),
      const VocabularyScreen(),
    ];
    return Scaffold(
      appBar: AppBar(
        titleSpacing: 18,
        title: const Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.shield_moon_rounded, color: Color(0xFF059669)),
          SizedBox(width: 8),
          Text('IELTS HERO', style: TextStyle(fontWeight: FontWeight.w900)),
        ]),
        actions: [
          _statChip(Icons.diamond, '${progress.gems}', const Color(0xFF0EA5E9)),
          _statChip(Icons.local_fire_department, '${progress.streak}', const Color(0xFFF97316)),
          IconButton(tooltip: 'Theme', onPressed: _showTheme, icon: const Icon(Icons.palette_outlined)),
        ],
      ),
      body: IndexedStack(index: tab, children: pages),
      bottomNavigationBar: NavigationBar(
        selectedIndex: tab,
        onDestinationSelected: (value) => setState(() => tab = value),
        destinations: const [
          NavigationDestination(icon: Icon(Icons.route_outlined), selectedIcon: Icon(Icons.route), label: 'Learn'),
          NavigationDestination(icon: Icon(Icons.mic_none), selectedIcon: Icon(Icons.mic), label: 'Voice'),
          NavigationDestination(icon: Icon(Icons.style_outlined), selectedIcon: Icon(Icons.style), label: 'Cue Cards'),
          NavigationDestination(icon: Icon(Icons.auto_stories_outlined), selectedIcon: Icon(Icons.auto_stories), label: 'Vocabulary'),
        ],
      ),
    );
  }

  Widget _statChip(IconData icon, String value, Color color) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: 3),
    child: Chip(avatar: Icon(icon, color: color, size: 17), label: Text(value, style: const TextStyle(fontWeight: FontWeight.bold)), visualDensity: VisualDensity.compact),
  );

  Widget learningPath() {
    final units = List.generate(10, (i) => (section - 1) * 10 + i + 1);
    final doneCount = units.where((n) => progress.completed.contains('u$n-l1') && progress.completed.contains('u$n-l2')).length;
    return RefreshIndicator(
      onRefresh: () async => setState(() {}),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 28),
        children: [
          Container(
            height: 148,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(24),
              gradient: const LinearGradient(begin: Alignment.topLeft, end: Alignment.bottomRight, colors: [Color(0xFF047857), Color(0xFF0D9488), Color(0xFF064E3B)]),
            ),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('YOUR IELTS JOURNEY', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.bold, letterSpacing: 1.2)),
              const Spacer(),
              const Text('Small steps. Big band scores.', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900)),
              Text('${progress.xp} XP earned • ${progress.completed.length}/200 lessons completed', style: const TextStyle(color: Colors.white)),
            ]),
          ),
          const SizedBox(height: 16),
          Row(children: [
            Expanded(child: _statCard('Daily goal', '${widget.prefs.getInt('todayCompletedLessons') ?? 0}/5 lessons', Icons.flag_rounded)),
            const SizedBox(width: 10),
            Expanded(child: _statCard('Predicted band', progress.band == 0 ? 'Not assessed' : progress.band.toStringAsFixed(1), Icons.stars_rounded)),
          ]),
          const SizedBox(height: 20),
          const Text('YOUR LEARNING PATH', style: TextStyle(fontWeight: FontWeight.w900, letterSpacing: 1.1, color: Color(0xFF059669))),
          const SizedBox(height: 8),
          SizedBox(
            height: 48,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: List.generate(10, (i) => Padding(
                padding: const EdgeInsets.only(right: 8),
                child: ChoiceChip(label: Text('Section ${i + 1}'), selected: section == i + 1, onSelected: (_) => setState(() => section = i + 1)),
              )),
            ),
          ),
          Card(
            elevation: 0,
            color: Theme.of(context).colorScheme.surfaceContainerHighest.withValues(alpha: .55),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('SECTION $section', style: const TextStyle(color: Color(0xFF059669), fontWeight: FontWeight.w900)),
                const SizedBox(height: 4),
                Text(sectionTitles[section - 1], style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w800)),
                Text(sectionDescriptions[section - 1]),
                const SizedBox(height: 10),
                LinearProgressIndicator(value: doneCount / 10, minHeight: 7, borderRadius: BorderRadius.circular(8)),
              ]),
            ),
          ),
          ...units.map(_unitTile),
        ],
      ),
    );
  }

  Widget _statCard(String label, String value, IconData icon) => Card(
    elevation: 0,
    child: Padding(
      padding: const EdgeInsets.all(14),
      child: Row(children: [
        Icon(icon, color: const Color(0xFF059669)),
        const SizedBox(width: 10),
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(label, style: Theme.of(context).textTheme.labelMedium),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w800)),
        ])),
      ]),
    ),
  );

  Widget _unitTile(int number) {
    final topic = unitTopics[number - 1];
    final done = progress.completed.contains('u$number-l1') && progress.completed.contains('u$number-l2');
    return Padding(
      padding: const EdgeInsets.only(top: 10),
      child: Card(
        elevation: 0,
        clipBehavior: Clip.antiAlias,
        child: ExpansionTile(
          leading: CircleAvatar(
            backgroundColor: done ? const Color(0xFF059669) : const Color(0xFFE5F5EF),
            foregroundColor: done ? Colors.white : const Color(0xFF047857),
            child: done ? const Icon(Icons.check) : Text('$number', style: const TextStyle(fontWeight: FontWeight.w900)),
          ),
          title: Text(topic.title, style: const TextStyle(fontWeight: FontWeight.w800)),
          subtitle: Text('${topic.badge} • ${topic.description}', maxLines: 2, overflow: TextOverflow.ellipsis),
          children: [
            _lessonButton(number, 1, 'Practice', 'Core Collocations & Accuracy'),
            _lessonButton(number, 2, 'Mastery', 'Examiner Shadowing & Inversions'),
          ],
        ),
      ),
    );
  }

  Widget _lessonButton(int number, int lesson, String title, String subtitle) => ListTile(
    contentPadding: const EdgeInsets.only(left: 76, right: 16),
    leading: Icon(progress.completed.contains('u$number-l$lesson') ? Icons.check_circle : Icons.play_circle_outline, color: const Color(0xFF059669)),
    title: Text('Lesson $lesson: $title'),
    subtitle: Text(subtitle),
    trailing: const Icon(Icons.chevron_right),
    onTap: () async {
      await Navigator.push(context, MaterialPageRoute(builder: (_) => LessonScreen(unitNumber: number, lessonNumber: lesson, prefs: widget.prefs)));
      if (mounted) setState(() {});
    },
  );

  void _showTheme() {
    showModalBottomSheet<void>(
      context: context,
      builder: (sheetContext) => SafeArea(
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          const ListTile(title: Text('Eye comfort theme', style: TextStyle(fontWeight: FontWeight.bold))),
          ...{'paper-warm': 'Paper warm', 'soft-sage': 'Soft sage', 'midnight-slate': 'Midnight slate'}.entries.map((entry) =>
            RadioListTile<String>(
              value: entry.key,
              groupValue: widget.themeName,
              title: Text(entry.value),
              onChanged: (value) {
                if (value != null) {
                  widget.onThemeChanged(value);
                  Navigator.pop(sheetContext);
                }
              },
            ),
          ),
        ]),
      ),
    );
  }
}

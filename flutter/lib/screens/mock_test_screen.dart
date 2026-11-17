import 'dart:async';
import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';

class MockTestScreen extends StatefulWidget {
  const MockTestScreen({super.key, required this.prefs});
  final SharedPreferences prefs;

  @override
  State<MockTestScreen> createState() => _MockTestScreenState();
}

class _MockTestScreenState extends State<MockTestScreen> {
  static const _green = Color(0xFF087F68);
  static const _ink = Color(0xFF183344);
  static const _muted = Color(0xFF71818A);

  static const _listening = [
    _Question('What time does the library close on weekdays?', ['5:00 pm', '6:00 pm', '7:00 pm', '8:00 pm'], 2, 'The speaker says the library stays open until seven on weekdays.'),
    _Question('Which document must new members bring?', ['A passport photograph', 'Proof of address', 'A student card', 'A bank statement'], 1, 'New members are asked to bring proof of their current address.'),
    _Question('How much is the annual student membership?', ['£12', '£15', '£18', '£20'], 1, 'The discounted student membership costs fifteen pounds.'),
    _Question('Where will the photography workshop take place?', ['Room 104', 'The main hall', 'The media centre', 'The garden'], 2, 'The workshop has been moved to the media centre.'),
  ];

  static const _reading = [
    _Question('What is the main purpose of the passage?', ['To describe a new transport project', 'To compare two cities', 'To explain the history of railways', 'To advertise a travel service'], 0, 'The passage focuses on the aims and expected effects of a transport project.'),
    _Question('According to the text, what is a major benefit of urban trees?', ['They eliminate traffic', 'They reduce local temperatures', 'They increase road capacity', 'They prevent all flooding'], 1, 'Trees provide shade and can reduce the urban heat-island effect.'),
    _Question('Why do researchers recommend mixed-use neighbourhoods?', ['They require more parking', 'They separate homes from shops', 'They make daily services easier to reach', 'They reduce public spaces'], 2, 'A mix of homes, shops and services can shorten everyday journeys.'),
    _Question('Which statement best reflects the writer’s view?', ['Technology alone solves every city problem', 'Planning should balance environmental and social needs', 'Public transport is no longer useful', 'Urban growth should always be stopped'], 1, 'The writer argues for balanced planning rather than a single solution.'),
  ];

  final Map<int, int> _answers = {};
  final _writingTask1 = TextEditingController();
  final _writingTask2 = TextEditingController();
  final _speaking = TextEditingController();
  Timer? _timer;
  int _secondsLeft = 35 * 60;
  int _section = 0;
  bool _started = false;
  bool _finished = false;
  Map<String, dynamic>? _result;

  @override
  void dispose() {
    _timer?.cancel();
    _writingTask1.dispose();
    _writingTask2.dispose();
    _speaking.dispose();
    super.dispose();
  }

  void _start() {
    setState(() {
      _started = true;
      _finished = false;
      _secondsLeft = 35 * 60;
      _answers.clear();
      _section = 0;
      _writingTask1.clear();
      _writingTask2.clear();
      _speaking.clear();
    });
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (!mounted || _finished) { timer.cancel(); return; }
      if (_secondsLeft <= 1) {
        timer.cancel();
        _finish();
      } else {
        setState(() => _secondsLeft--);
      }
    });
  }

  int _correct(List<_Question> questions, int offset) {
    var score = 0;
    for (var i = 0; i < questions.length; i++) {
      if (_answers[offset + i] == questions[i].answer) score++;
    }
    return score;
  }

  int get _listeningScore => _correct(_listening, 0);
  int get _readingScore => _correct(_reading, 4);

  Future<void> _finish() async {
    if (_finished) return;
    _timer?.cancel();
    final listening = _listeningScore / _listening.length * 100;
    final reading = _readingScore / _reading.length * 100;
    final writingWords = _wordCount(_writingTask1.text) + _wordCount(_writingTask2.text);
    final speakingWords = _wordCount(_speaking.text);
    final writingComplete = _wordCount(_writingTask1.text) >= 80 && _wordCount(_writingTask2.text) >= 120;
    final speakingComplete = speakingWords >= 60;
    final sections = <String, double>{
      'Listening': listening,
      'Reading': reading,
      'Writing': writingComplete ? 65 : (writingWords > 0 ? 35 : 0),
      'Speaking': speakingComplete ? 65 : (speakingWords > 0 ? 35 : 0),
    };
    final ordered = sections.entries.toList()..sort((a, b) => a.value.compareTo(b.value));
    final record = <String, dynamic>{
      'date': DateTime.now().toIso8601String(),
      'listeningCorrect': _listeningScore,
      'listeningTotal': _listening.length,
      'readingCorrect': _readingScore,
      'readingTotal': _reading.length,
      'writingWords': writingWords,
      'speakingWords': speakingWords,
      'sections': sections,
      'weakestSkill': ordered.first.key,
      'nextAction': _recommendation(ordered.first.key),
    };
    final history = widget.prefs.getStringList('mockTestHistory') ?? <String>[];
    history.insert(0, jsonEncode(record));
    await widget.prefs.setStringList('mockTestHistory', history.take(20).toList());
    await widget.prefs.setString('mockTestLatest', jsonEncode(record));
    if (!mounted) return;
    setState(() {
      _finished = true;
      _result = record;
    });
  }

  String _recommendation(String skill) {
    switch (skill) {
      case 'Listening': return 'Practise numbers, names and distractors with short listening sections.';
      case 'Reading': return 'Review skimming, scanning and evidence-based True/False/Not Given questions.';
      case 'Writing': return 'Practise planning, paragraph structure and developing each main idea with examples.';
      default: return 'Practise speaking for 60–90 seconds, then review fluency, vocabulary and sentence accuracy.';
    }
  }

  int _wordCount(String value) => RegExp(r"\\b[\\w’'-]+\\b").allMatches(value).length;

  String get _timeLabel {
    final minutes = (_secondsLeft ~/ 60).toString().padLeft(2, '0');
    final seconds = (_secondsLeft % 60).toString().padLeft(2, '0');
    return '$minutes:$seconds';
  }

  @override
  Widget build(BuildContext context) {
    if (_finished && _result != null) return _results();
    if (!_started) return _landing();
    return Column(children: [
      _examHeader(),
      Padding(
        padding: const EdgeInsets.fromLTRB(16, 12, 16, 6),
        child: SegmentedButton<int>(
          segments: const [
            ButtonSegment(value: 0, label: Text('Listening'), icon: Icon(Icons.headphones_rounded)),
            ButtonSegment(value: 1, label: Text('Reading'), icon: Icon(Icons.menu_book_rounded)),
            ButtonSegment(value: 2, label: Text('Writing'), icon: Icon(Icons.edit_note_rounded)),
            ButtonSegment(value: 3, label: Text('Speaking'), icon: Icon(Icons.mic_none_rounded)),
          ],
          selected: {_section},
          onSelectionChanged: (value) => setState(() => _section = value.first),
          showSelectedIcon: false,
        ),
      ),
      Expanded(child: IndexedStack(index: _section, children: [
        _objectiveSection('Listening', 'Listen to the short practice briefing, then answer each question.', _listening, 0, 'Practice transcript', 'Welcome to the Riverside Learning Centre. The library closes at seven on weekdays. New members should bring proof of address. Student membership is fifteen pounds per year. Please note that the photography workshop will take place in the media centre.'),
        _objectiveSection('Reading', 'Read the passage carefully and choose the best answer.', _reading, 4, 'Urban spaces for healthier cities', 'Well-designed cities combine reliable public transport, accessible green spaces and neighbourhood services. Urban trees provide shade and help reduce local temperatures. Mixed-use neighbourhoods place homes, shops and services within convenient reach, reducing the need for some car journeys. Researchers argue that successful urban planning must balance environmental goals with the needs of local communities.'),
        _writingSection(),
        _speakingSection(),
      ])),
      _bottomControls(),
    ]);
  }

  Widget _landing() {
    final history = widget.prefs.getStringList('mockTestHistory') ?? [];
    Map<String, dynamic>? latest;
    if (history.isNotEmpty) {
      try { latest = Map<String, dynamic>.from(jsonDecode(history.first)); } catch (_) {}
    }
    return ListView(padding: const EdgeInsets.all(18), children: [
      Container(
        padding: const EdgeInsets.all(22),
        decoration: BoxDecoration(
          gradient: const LinearGradient(colors: [Color(0xFF0B705E), Color(0xFF18374A)], begin: Alignment.topLeft, end: Alignment.bottomRight),
          borderRadius: BorderRadius.circular(26),
        ),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          const Row(children: [Icon(Icons.workspace_premium_rounded, color: Color(0xFFF0D18A)), SizedBox(width: 7), Text('IELTS HERO • TEST CENTRE', style: TextStyle(color: Colors.white70, fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 1))]),
          const SizedBox(height: 18),
          const Text('Measure your progress.\nTrain with a purpose.', style: TextStyle(color: Colors.white, fontSize: 25, height: 1.12, fontWeight: FontWeight.w900)),
          const SizedBox(height: 9),
          const Text('A guided four-skill diagnostic with a personal next-step plan.', style: TextStyle(color: Colors.white70, fontSize: 12, height: 1.5)),
          const SizedBox(height: 18),
          SizedBox(width: double.infinity, child: FilledButton.icon(
            onPressed: _start,
            icon: const Icon(Icons.play_arrow_rounded),
            label: const Text('Start diagnostic test'),
            style: FilledButton.styleFrom(backgroundColor: const Color(0xFFE7C984), foregroundColor: _ink, padding: const EdgeInsets.symmetric(vertical: 15)),
          )),
        ]),
      ),
      const SizedBox(height: 18),
      const Text('TEST FORMAT', style: TextStyle(color: _green, fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 1.2)),
      const SizedBox(height: 10),
      _infoTile(Icons.headphones_rounded, 'Listening', '4 multiple-choice questions • short practice transcript'),
      _infoTile(Icons.menu_book_rounded, 'Reading', '4 multiple-choice questions • one academic-style passage'),
      _infoTile(Icons.edit_note_rounded, 'Writing', 'Two guided writing prompts with word-count checks'),
      _infoTile(Icons.mic_rounded, 'Speaking', 'One long-turn prompt with a written response workspace'),
      const SizedBox(height: 8),
      const Text('35 minutes • Your progress is saved on this device', style: TextStyle(color: _muted, fontSize: 11)),
      if (latest != null) ...[
        const SizedBox(height: 22),
        const Text('YOUR LATEST ATTEMPT', style: TextStyle(color: _green, fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 1.2)),
        const SizedBox(height: 8),
        _latestCard(latest),
      ],
    ]);
  }

  Widget _infoTile(IconData icon, String title, String subtitle) => Container(
    margin: const EdgeInsets.only(bottom: 8),
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(17), border: Border.all(color: const Color(0xFFE5ECE9))),
    child: Row(children: [Icon(icon, color: _green), const SizedBox(width: 12), Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(title, style: const TextStyle(fontWeight: FontWeight.w900, color: _ink)), Text(subtitle, style: const TextStyle(color: _muted, fontSize: 11))]))]),
  );

  Widget _latestCard(Map<String, dynamic> data) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(18), border: Border.all(color: const Color(0xFFE5ECE9))),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text('Focus next: ${data['weakestSkill'] ?? 'Review'}', style: const TextStyle(fontWeight: FontWeight.w900, color: _ink)),
      const SizedBox(height: 5),
      Text(data['nextAction']?.toString() ?? '', style: const TextStyle(color: _muted, fontSize: 12, height: 1.4)),
      const SizedBox(height: 8),
      Text('Listening ${data['listeningCorrect']}/${data['listeningTotal']} • Reading ${data['readingCorrect']}/${data['readingTotal']}', style: const TextStyle(color: _green, fontWeight: FontWeight.w800, fontSize: 11)),
    ]),
  );

  Widget _examHeader() => Padding(
    padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
    child: Row(children: [
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('DIAGNOSTIC IN PROGRESS', style: TextStyle(color: _green, fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 1)),
        Text('Section ${_section + 1} of 4', style: const TextStyle(color: _ink, fontWeight: FontWeight.w900, fontSize: 17)),
      ])),
      Container(padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8), decoration: BoxDecoration(color: _secondsLeft < 300 ? const Color(0xFFFFE9E6) : const Color(0xFFEAF4F0), borderRadius: BorderRadius.circular(12)), child: Row(children: [const Icon(Icons.timer_outlined, size: 16, color: _green), const SizedBox(width: 5), Text(_timeLabel, style: const TextStyle(fontWeight: FontWeight.w900, color: _ink))])),
    ]),
  );

  Widget _objectiveSection(String title, String subtitle, List<_Question> questions, int offset, String passageTitle, String passage) {
    return ListView(padding: const EdgeInsets.all(16), children: [
      Text(title, style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: _ink)),
      const SizedBox(height: 4),
      Text(subtitle, style: const TextStyle(color: _muted, fontSize: 12)),
      const SizedBox(height: 14),
      Container(padding: const EdgeInsets.all(15), decoration: BoxDecoration(color: const Color(0xFFEAF4F0), borderRadius: BorderRadius.circular(17)), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(passageTitle.toUpperCase(), style: const TextStyle(color: _green, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
        const SizedBox(height: 7),
        Text(passage, style: const TextStyle(color: _ink, height: 1.55, fontSize: 13)),
      ])),
      const SizedBox(height: 14),
      ...List.generate(questions.length, (i) {
        final q = questions[i];
        final selected = _answers[offset + i];
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: Theme.of(context).cardColor, borderRadius: BorderRadius.circular(17), border: Border.all(color: const Color(0xFFE5ECE9))),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('QUESTION ${offset + i + 1}', style: const TextStyle(color: _green, fontWeight: FontWeight.w900, fontSize: 9, letterSpacing: 1)),
            const SizedBox(height: 7),
            Text(q.prompt, style: const TextStyle(color: _ink, fontWeight: FontWeight.w800, fontSize: 14)),
            const SizedBox(height: 8),
            ...List.generate(q.options.length, (option) => RadioListTile<int>(
              value: option,
              groupValue: selected,
              dense: true,
              contentPadding: EdgeInsets.zero,
              activeColor: _green,
              title: Text(q.options[option], style: const TextStyle(fontSize: 12)),
              onChanged: (value) => setState(() => _answers[offset + i] = value!),
            )),
          ]),
        );
      }),
    ]);
  }

  Widget _writingSection() => ListView(padding: const EdgeInsets.all(16), children: [
    const Text('Writing practice', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: _ink)),
    const SizedBox(height: 5),
    const Text('Write in your own words. Word counts help you check completion; they are not an automated band score.', style: TextStyle(color: _muted, fontSize: 12, height: 1.4)),
    const SizedBox(height: 14),
    _writingPrompt('TASK 1 • 150 WORDS', 'The table below compares the percentage of commuters using buses, trains and bicycles in three cities in 2010 and 2020. Summarise the main features and make relevant comparisons.'),
    _essayField(_writingTask1, 'Write your Task 1 response…', 6),
    Align(alignment: Alignment.centerRight, child: Text('${_wordCount(_writingTask1.text)} words', style: const TextStyle(color: _green, fontWeight: FontWeight.w800, fontSize: 11))),
    const SizedBox(height: 18),
    _writingPrompt('TASK 2 • 250 WORDS', 'Some people believe that governments should invest more in public transport than in building new roads. To what extent do you agree or disagree? Give reasons and examples.'),
    _essayField(_writingTask2, 'Write your Task 2 essay…', 8),
    Align(alignment: Alignment.centerRight, child: Text('${_wordCount(_writingTask2.text)} words', style: const TextStyle(color: _green, fontWeight: FontWeight.w800, fontSize: 11))),
  ]);

  Widget _writingPrompt(String label, String prompt) => Container(
    padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(color: const Color(0xFFEAF4F0), borderRadius: BorderRadius.circular(16)),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [Text(label, style: const TextStyle(color: _green, fontWeight: FontWeight.w900, fontSize: 9, letterSpacing: 1)), const SizedBox(height: 7), Text(prompt, style: const TextStyle(color: _ink, fontSize: 13, height: 1.5))]),
  );

  Widget _essayField(TextEditingController controller, String hint, int rows) => Padding(
    padding: const EdgeInsets.only(top: 9),
    child: TextField(controller: controller, minLines: rows, maxLines: null, onChanged: (_) => setState(() {}), decoration: InputDecoration(hintText: hint, filled: true, fillColor: Theme.of(context).cardColor, border: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: const BorderSide(color: Color(0xFFE5ECE9))), enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(15), borderSide: const BorderSide(color: Color(0xFFE5ECE9))))),
  );

  Widget _speakingSection() => ListView(padding: const EdgeInsets.all(16), children: [
    const Text('Speaking • Part 2', style: TextStyle(fontSize: 20, fontWeight: FontWeight.w900, color: _ink)),
    const SizedBox(height: 5),
    const Text('Prepare for one minute, then speak for up to two minutes. Type your spoken response here for this diagnostic version.', style: TextStyle(color: _muted, fontSize: 12, height: 1.4)),
    const SizedBox(height: 14),
    _writingPrompt('CUE CARD', 'Describe a skill you learned that has been useful in your life.\n\nYou should say:\n• what the skill is\n• when and how you learned it\n• who helped you learn it\nand explain why it has been useful.'),
    const SizedBox(height: 10),
    _essayField(_speaking, 'Enter your practice response…', 9),
    Align(alignment: Alignment.centerRight, child: Text('${_wordCount(_speaking.text)} words', style: const TextStyle(color: _green, fontWeight: FontWeight.w800, fontSize: 11))),
    const SizedBox(height: 12),
    const Text('For a genuine speaking assessment, use Speaking Studio and its microphone-based examiner. This text entry is only a planning and completion aid.', style: TextStyle(color: _muted, fontSize: 11, height: 1.45)),
  ]);

  Widget _bottomControls() => SafeArea(
    top: false,
    child: Padding(padding: const EdgeInsets.fromLTRB(16, 7, 16, 12), child: Row(children: [
      OutlinedButton(onPressed: _section == 0 ? null : () => setState(() => _section--), child: const Text('Previous')),
      const SizedBox(width: 8),
      Expanded(child: Text('${_answers.length}/8 MCQs answered', textAlign: TextAlign.center, style: const TextStyle(color: _muted, fontSize: 10, fontWeight: FontWeight.w700))),
      const SizedBox(width: 8),
      FilledButton(onPressed: _section == 3 ? _finish : () => setState(() => _section++), style: FilledButton.styleFrom(backgroundColor: _green), child: Text(_section == 3 ? 'Finish test' : 'Next')),
    ])),
  );

  Widget _results() {
    final data = _result!;
    final sections = Map<String, dynamic>.from(data['sections'] as Map);
    final history = widget.prefs.getStringList('mockTestHistory') ?? [];
    return ListView(padding: const EdgeInsets.all(18), children: [
      Container(padding: const EdgeInsets.all(22), decoration: BoxDecoration(gradient: const LinearGradient(colors: [Color(0xFF0B705E), Color(0xFF18374A)]), borderRadius: BorderRadius.circular(24)), child: const Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Icon(Icons.verified_rounded, color: Color(0xFFE7C984), size: 30),
        SizedBox(height: 12),
        Text('Diagnostic complete', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w900, fontSize: 23)),
        SizedBox(height: 5),
        Text('Your next practice is based on the sections that need attention.', style: TextStyle(color: Colors.white70, fontSize: 12)),
      ])),
      const SizedBox(height: 18),
      const Text('SKILL SNAPSHOT', style: TextStyle(color: _green, fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 1)),
      const SizedBox(height: 10),
      ...sections.entries.map((entry) {
        final value = (entry.value as num).toDouble();
        return Padding(padding: const EdgeInsets.only(bottom: 12), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Row(children: [Expanded(child: Text(entry.key, style: const TextStyle(color: _ink, fontWeight: FontWeight.w800))), Text('${value.round()}%', style: const TextStyle(color: _green, fontWeight: FontWeight.w900))]),
          const SizedBox(height: 5),
          ClipRRect(borderRadius: BorderRadius.circular(20), child: LinearProgressIndicator(value: value / 100, minHeight: 8, backgroundColor: const Color(0xFFE9EFEC), color: _green)),
        ]));
      }),
      Container(padding: const EdgeInsets.all(16), decoration: BoxDecoration(color: const Color(0xFFEAF4F0), borderRadius: BorderRadius.circular(18)), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('YOUR ADAPTIVE NEXT STEP', style: TextStyle(color: _green, fontWeight: FontWeight.w900, fontSize: 9, letterSpacing: 1)),
        const SizedBox(height: 7),
        Text('Focus on ${data['weakestSkill']}', style: const TextStyle(color: _ink, fontWeight: FontWeight.w900, fontSize: 18)),
        const SizedBox(height: 5),
        Text(data['nextAction'].toString(), style: const TextStyle(color: _ink, fontSize: 12, height: 1.45)),
      ])),
      const SizedBox(height: 12),
      Text('Listening: ${data['listeningCorrect']}/4 correct • Reading: ${data['readingCorrect']}/4 correct', style: const TextStyle(color: _muted, fontSize: 11)),
      Text('Writing: ${data['writingWords']} words • Speaking practice: ${data['speakingWords']} words', style: const TextStyle(color: _muted, fontSize: 11)),
      Text('${history.length} saved attempt(s) on this device', style: const TextStyle(color: _muted, fontSize: 11)),
      const SizedBox(height: 16),
      FilledButton.icon(onPressed: _start, icon: const Icon(Icons.refresh_rounded), label: const Text('Try another diagnostic'), style: FilledButton.styleFrom(backgroundColor: _green, padding: const EdgeInsets.symmetric(vertical: 14))),
      TextButton(onPressed: () => setState(() { _started = false; _finished = false; }), child: const Text('Back to Test Centre')),
      const Padding(padding: EdgeInsets.only(top: 8), child: Text('This is an IELTS-style learning diagnostic, not an official IELTS test or a certified band score. Writing and Speaking are not automatically graded.', textAlign: TextAlign.center, style: TextStyle(color: _muted, fontSize: 10, height: 1.4))),
    ]);
  }
}

class _Question {
  const _Question(this.prompt, this.options, this.answer, this.explanation);
  final String prompt;
  final List<String> options;
  final int answer;
  final String explanation;
}

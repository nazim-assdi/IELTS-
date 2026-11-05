import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../data/curriculum.dart';
import '../services/gemini_api.dart';
import '../services/progress_store.dart';
import 'translator_screen.dart';

class LessonScreen extends StatefulWidget {
  const LessonScreen({super.key, required this.unitNumber, required this.lessonNumber, required this.prefs});
  final int unitNumber;
  final int lessonNumber;
  final SharedPreferences prefs;

  @override
  State<LessonScreen> createState() => _LessonScreenState();
}

class _LessonScreenState extends State<LessonScreen> {
  int index = 0, score = 0;
  String? selected;
  bool checked = false, finished = false, lessonLoading = false;
  Map<String, dynamic>? aiLesson;
  String? lessonError;
  late final ProgressStore store = ProgressStore(widget.prefs);

  GeminiApi get api => GeminiApi(
    baseUrl: widget.prefs.getString('ielts_api_url') ?? defaultIeltsApiUrl,
  );

  UnitTopic get topic => unitTopics[widget.unitNumber - 1];

  @override
  void initState() {
    super.initState();
    if (widget.lessonNumber >= 3) _loadAiLesson();
  }

  Future<void> _loadAiLesson() async {
    setState(() { lessonLoading = true; lessonError = null; });
    try {
      final data = await api.generateLesson(
        topic: topic.title,
        description: topic.description,
        lessonNumber: widget.lessonNumber,
      );
      if (mounted) setState(() => aiLesson = data);
    } catch (error) {
      if (mounted) setState(() => lessonError = error.toString().replaceFirst('Exception: ', ''));
    } finally {
      if (mounted) setState(() => lessonLoading = false);
    }
  }

  List<Map<String, dynamic>> get questions {
    if (widget.lessonNumber == 1) {
      return [
        {'type':'match','prompt':'Choose the strongest natural academic collocation:','pairs':[['profound','ramifications'],['foster','creative innovation'],['marked','disparity'],['ubiquitous','presence']], 'answer':'profound ramifications'},
        {'type':'choice','prompt':'Select the optimal cohesive connector:','context':'Nuanced analysis is essential; ________.','options':['nonetheless','because','such as','at first'],'answer':'nonetheless','why':'“Nonetheless” introduces a contrast.'},
        {'type':'order','prompt':'Arrange the words into a Band 8+ sentence:','words':['What','strikes','me','most','is','the','sheer','resilience','of','the','community.'],'answer':'What strikes me most is the sheer resilience of the community.'},
      ];
    }
    if (widget.lessonNumber == 2) {
      return [
        {'type':'choice','prompt':'Select the grammatically accurate statement:','options':['From my vantage point, the long-term benefits significantly outweigh the costs.','According to me, benefits are much more than the costs.','In my opinion benefits having more importance than costs.','To my point of view, benefits is bigger than costs.'],'answer':'From my vantage point, the long-term benefits significantly outweigh the costs.','why':'“From my vantage point” is a natural formal expression.'},
        {'type':'shadow','prompt':'Read this sentence aloud with natural British intonation:','sentence':'Were we to prioritise sustainable infrastructure, the ecological dividends would prove monumental.'},
      ];
    }

    final quiz = aiLesson?['quiz'];
    if (quiz is Map) {
      final options = (quiz['options'] as List? ?? []).map((item) => item.toString()).toList();
      if (options.length >= 2) {
        return [{
          'type':'choice',
          'prompt': quiz['question']?.toString() ?? 'Choose the best answer:',
          'options': options,
          'answer': quiz['answer']?.toString() ?? options.first,
          'why': quiz['explanationBn']?.toString() ?? '',
        }];
      }
    }
    return [
      {
        'type':'choice',
        'prompt': widget.lessonNumber == 3
          ? 'Which habit helps you use new IELTS vocabulary accurately?'
          : 'What makes an IELTS speaking answer more convincing?',
        'options': widget.lessonNumber == 3
          ? ['Learn a phrase with its meaning and an example','Memorise long lists without context','Use difficult words in every sentence','Repeat the same idiom in every answer']
          : ['Give a clear idea, explain it and add a relevant example','Speak as quickly as possible','Use unrelated memorised phrases','Avoid giving reasons'],
        'answer': widget.lessonNumber == 3
          ? 'Learn a phrase with its meaning and an example'
          : 'Give a clear idea, explain it and add a relevant example',
        'why': 'নতুন শব্দ বা উত্তর প্রাসঙ্গিক উদাহরণের সঙ্গে অনুশীলন করলে ব্যবহার স্বাভাবিক হয়।',
      },
    ];
  }

  void check() {
    if (checked || selected == null) return;
    final q = questions[index];
    final correct = q['type'] == 'choice'
        ? selected == q['answer']
        : q['type'] == 'match'
            ? selected == q['answer']
            : q['type'] == 'order'
                ? selected?.trim() == q['answer']
                : selected == 'done';
    setState(() { checked = true; if (correct) score++; });
  }

  Future<void> next() async {
    if (index < questions.length - 1) {
      setState(() { index++; selected = null; checked = false; });
      return;
    }
    final id = 'u${widget.unitNumber}-l${widget.lessonNumber}';
    final xp = 20 + (widget.unitNumber ~/ 10) * 5 + (widget.lessonNumber * 2);
    final gems = 8 + (widget.unitNumber ~/ 20) * 2 + widget.lessonNumber;
    await store.complete(id, xp, gems);
    if (mounted) setState(() => finished = true);
  }

  Future<void> _openTranslator() async {
    await Navigator.push(context, MaterialPageRoute(
      builder: (_) => TranslatorScreen(prefs: widget.prefs),
    ));
  }

  Widget _onlineLessonCard() {
    if (lessonLoading && aiLesson == null) {
      return const Card(child: Padding(
        padding: EdgeInsets.all(20),
        child: Row(children: [
          SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2)),
          SizedBox(width: 12),
          Expanded(child: Text('Creating your topic-specific IELTS lesson…')),
        ]),
      ));
    }
    if (aiLesson == null) {
      return Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            const Text('Online AI lesson is unavailable right now.', style: TextStyle(fontWeight: FontWeight.w800)),
            if (lessonError != null) Padding(padding: const EdgeInsets.only(top: 6), child: Text(lessonError!, style: Theme.of(context).textTheme.bodySmall)),
            const SizedBox(height: 8),
            FilledButton.tonalIcon(onPressed: lessonLoading ? null : _loadAiLesson, icon: const Icon(Icons.refresh), label: const Text('Try again')),
          ]),
        ),
      );
    }

    final vocabulary = (aiLesson!['vocabulary'] as List? ?? []);
    return Card(
      margin: const EdgeInsets.only(bottom: 18),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(aiLesson!['lessonTitle']?.toString() ?? 'AI IELTS Lesson', style: const TextStyle(fontSize: 19, fontWeight: FontWeight.w900)),
          const SizedBox(height: 6),
          Text(aiLesson!['learningFocus']?.toString() ?? '', style: Theme.of(context).textTheme.bodyMedium),
          if ((aiLesson!['explanationBn'] ?? '').toString().isNotEmpty) ...[
            const SizedBox(height: 10),
            Text(aiLesson!['explanationBn'].toString(), style: const TextStyle(height: 1.55)),
          ],
          const Divider(height: 26),
          const Text('VOCABULARY & BANGLA MEANINGS', style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF059669), fontSize: 11)),
          const SizedBox(height: 8),
          ...vocabulary.map((item) {
            if (item is! Map) return const SizedBox.shrink();
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(item['phrase']?.toString() ?? '', style: const TextStyle(fontWeight: FontWeight.w900, fontSize: 16)),
                Text(item['meaningBn']?.toString() ?? '', style: const TextStyle(color: Color(0xFF047857), fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Text(item['example']?.toString() ?? ''),
                Text(item['exampleBn']?.toString() ?? '', style: Theme.of(context).textTheme.bodySmall),
              ]),
            );
          }),
          if ((aiLesson!['speakingPrompt'] ?? '').toString().isNotEmpty) ...[
            const Divider(height: 24),
            const Text('SPEAKING PRACTICE', style: TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF059669), fontSize: 11)),
            const SizedBox(height: 6),
            Text(aiLesson!['speakingPrompt'].toString(), style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 16)),
          ],
          if ((aiLesson!['modelAnswer'] ?? '').toString().isNotEmpty) ...[
            const SizedBox(height: 10),
            const Text('MODEL ANSWER', style: TextStyle(fontWeight: FontWeight.w900, fontSize: 11)),
            const SizedBox(height: 4),
            SelectableText(aiLesson!['modelAnswer'].toString(), style: const TextStyle(height: 1.5)),
            if ((aiLesson!['modelAnswerBn'] ?? '').toString().isNotEmpty) ...[
              const SizedBox(height: 8),
              Text(aiLesson!['modelAnswerBn'].toString(), style: const TextStyle(height: 1.5, color: Color(0xFF047857))),
            ],
          ],
          const SizedBox(height: 10),
          OutlinedButton.icon(onPressed: _openTranslator, icon: const Icon(Icons.translate), label: const Text('Translate another sentence')),
        ]),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final q = questions[index];
    return Scaffold(
      appBar: AppBar(
        title: Text('Unit ${widget.unitNumber} • Lesson ${widget.lessonNumber}'),
        actions: [
          Padding(padding: const EdgeInsets.only(right: 16), child: Center(child: Text('${index + 1}/${questions.length}', style: const TextStyle(fontWeight: FontWeight.bold)))),
        ],
      ),
      body: finished
          ? Center(child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                const Icon(Icons.emoji_events_rounded, size: 76, color: Color(0xFFF59E0B)),
                const SizedBox(height: 16),
                const Text('Lesson completed!', style: TextStyle(fontSize: 25, fontWeight: FontWeight.w900)),
                Text('You scored $score/${questions.length} • XP and gems added to your account.'),
                const SizedBox(height: 20),
                FilledButton(onPressed: () => Navigator.pop(context), child: const Text('Continue learning')),
              ]),
            ))
          : ListView(
              padding: const EdgeInsets.all(20),
              children: [
                LinearProgressIndicator(value: (index + 1) / questions.length, minHeight: 7, borderRadius: BorderRadius.circular(10)),
                const SizedBox(height: 22),
                Text(topic.title, style: const TextStyle(color: Color(0xFF059669), fontWeight: FontWeight.w800)),
                const SizedBox(height: 8),
                if (widget.lessonNumber == 3 || widget.lessonNumber == 4) _onlineLessonCard(),
                Text(q['prompt'], style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w900)),
                if (q['context'] != null) Padding(padding: const EdgeInsets.only(top: 12), child: Text(q['context'], style: const TextStyle(fontSize: 17))),
                const SizedBox(height: 22),
                ...buildAnswer(q),
                if (checked && q['why'] != null && q['why'].toString().isNotEmpty)
                  Card(color: Theme.of(context).colorScheme.secondaryContainer, child: Padding(padding: const EdgeInsets.all(14), child: Text(q['why'].toString()))),
                if (checked)
                  Padding(
                    padding: const EdgeInsets.only(top: 12),
                    child: Text(
                      selected == q['answer'] || (q['type'] == 'shadow' && selected == 'done') ? 'Correct! / Well done!' : 'Not quite. Review the correct answer.',
                      style: TextStyle(fontWeight: FontWeight.bold, color: selected == q['answer'] || (q['type'] == 'shadow' && selected == 'done') ? Colors.green : Colors.orange),
                    ),
                  ),
                const SizedBox(height: 28),
                FilledButton(onPressed: checked ? next : check, child: Text(checked ? (index == questions.length - 1 ? 'Finish lesson' : 'Continue') : 'Check answer')),
              ],
            ),
    );
  }

  List<Widget> buildAnswer(Map<String, dynamic> q) {
    if (q['type'] == 'choice') {
      return (q['options'] as List<String>).map((option) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: RadioListTile<String>(
          value: option,
          groupValue: selected,
          onChanged: checked ? null : (value) => setState(() => selected = value),
          title: Text(option),
          tileColor: Theme.of(context).colorScheme.surfaceContainerHighest,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
        ),
      )).toList();
    }
    if (q['type'] == 'match') {
      return (q['pairs'] as List).map<Widget>((pair) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: OutlinedButton(
          onPressed: checked ? null : () => setState(() => selected = '${pair[0]} ${pair[1]}'),
          style: OutlinedButton.styleFrom(
            padding: const EdgeInsets.all(16),
            backgroundColor: selected == '${pair[0]} ${pair[1]}' ? Theme.of(context).colorScheme.secondaryContainer : null,
          ),
          child: Text('${pair[0]}  +  ${pair[1]}'),
        ),
      )).toList();
    }
    if (q['type'] == 'order') {
      return [
        TextField(
          enabled: !checked,
          minLines: 2,
          maxLines: 3,
          decoration: const InputDecoration(hintText: 'Type the complete sentence in the correct order', border: OutlineInputBorder()),
          onChanged: (value) => selected = value,
        ),
        const SizedBox(height: 8),
        const Text('Hint: Start with “What strikes me most…”'),
      ];
    }
    return [
      Card(child: Padding(padding: const EdgeInsets.all(16), child: Text(q['sentence'], style: const TextStyle(fontSize: 18)))),
      const Text('Use the Voice tab for speaking practice. When you have practised the sentence aloud, mark it complete.'),
      CheckboxListTile(
        value: selected == 'done',
        onChanged: checked ? null : (value) => setState(() => selected = value == true ? 'done' : null),
        title: const Text('I practised saying this sentence aloud'),
      ),
    ];
  }
}

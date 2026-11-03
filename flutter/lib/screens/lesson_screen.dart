import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../data/curriculum.dart';
import '../services/progress_store.dart';

class LessonScreen extends StatefulWidget {
  const LessonScreen({super.key, required this.unitNumber, required this.lessonNumber, required this.prefs});
  final int unitNumber, lessonNumber; final SharedPreferences prefs;
  @override State<LessonScreen> createState() => _LessonScreenState();
}
class _LessonScreenState extends State<LessonScreen> {
  int index = 0, score = 0; String? selected; bool checked = false, finished = false;
  late final ProgressStore store = ProgressStore(widget.prefs);
  List<Map<String,dynamic>> get questions => widget.lessonNumber == 1 ? [
    {'type':'match','prompt':'Match the Band 8+ academic pairings:','pairs':[['profound','ramifications'],['foster','creative innovation'],['marked','disparity'],['ubiquitous','presence']], 'answer':'profound ramifications'},
    {'type':'choice','prompt':'Select the optimal cohesive connector:','context':'Nuanced analysis is essential; ________.','options':['nonetheless','because','such as','at first'],'answer':'nonetheless','why':'“Nonetheless” introduces a sophisticated contrast.'},
    {'type':'order','prompt':'Arrange the words into a Band 8.5 sentence:','words':['What','strikes','me','most','is','the','sheer','resilience','of','the','community.'],'answer':'What strikes me most is the sheer resilience of the community.'},
  ] : [
    {'type':'choice','prompt':'Select the grammatically accurate Band 8+ statement:','options':['From my vantage point, the long-term benefits significantly outweigh the costs.','According to me, benefits are much more than the costs.','In my opinion benefits having more importance than costs.','To my point of view, benefits is bigger than costs.'],'answer':'From my vantage point, the long-term benefits significantly outweigh the costs.','why':'“From my vantage point” is a natural formal expression.'},
    {'type':'shadow','prompt':'Read this sentence aloud with natural British intonation:','sentence':'Were we to prioritize sustainable infrastructure, the ecological dividends would prove monumental.'},
  ];
  UnitTopic get topic => unitTopics[widget.unitNumber-1];
  void check() { if (checked) return; final q=questions[index]; bool correct=false; if(q['type']=='choice') correct=selected==q['answer']; if(q['type']=='match') correct=selected==q['answer']; if(q['type']=='order') correct=selected==q['answer']; if(q['type']=='shadow') correct=selected=='done'; setState(() { checked=true; if(correct) score++; }); }
  Future<void> next() async { if(index < questions.length-1) { setState(() { index++; selected=null; checked=false; }); } else { final id='u${widget.unitNumber}-l${widget.lessonNumber}'; final xp=widget.lessonNumber==1?20+(widget.unitNumber~/10)*5:25+(widget.unitNumber~/10)*5; final gems=widget.lessonNumber==1?10+(widget.unitNumber~/20)*2:12+(widget.unitNumber~/20)*2; await store.complete(id,xp,gems); if(mounted) setState(()=>finished=true); } }
  @override Widget build(BuildContext context) {
    final q=questions[index];
    return Scaffold(appBar: AppBar(title: Text('Unit ${widget.unitNumber} • Lesson ${widget.lessonNumber}'), actions:[Padding(padding: const EdgeInsets.only(right:16), child: Center(child: Text('${index+1}/${questions.length}',style: const TextStyle(fontWeight: FontWeight.bold))))]), body: finished ? Center(child: Padding(padding: const EdgeInsets.all(24), child: Column(mainAxisSize: MainAxisSize.min, children:[const Icon(Icons.emoji_events_rounded,size:76,color: Color(0xFFF59E0B)), const SizedBox(height:16), const Text('Lesson completed!',style: TextStyle(fontSize:25,fontWeight:FontWeight.w900)), Text('You scored $score/${questions.length} • XP and gems added to your account.'), const SizedBox(height:20), FilledButton(onPressed:()=>Navigator.pop(context),child:const Text('Continue learning'))]))) : ListView(padding: const EdgeInsets.all(20), children:[LinearProgressIndicator(value:(index+1)/questions.length,minHeight:7,borderRadius:BorderRadius.circular(10)), const SizedBox(height:22), Text(topic.title,style: const TextStyle(color:Color(0xFF059669),fontWeight:FontWeight.w800)), const SizedBox(height:8), Text(q['prompt'],style: const TextStyle(fontSize:22,fontWeight:FontWeight.w900)), if(q['context']!=null) Padding(padding:const EdgeInsets.only(top:12),child:Text(q['context'],style:const TextStyle(fontSize:17))), const SizedBox(height:22), ...buildAnswer(q), if(checked && q['why']!=null) Card(color:Theme.of(context).colorScheme.secondaryContainer,child:Padding(padding:const EdgeInsets.all(14),child:Text(q['why']))), if(checked && q['type']!='shadow') Padding(padding:const EdgeInsets.only(top:12),child:Text(selected==q['answer']?'Correct!':'Not quite. Review the correct answer.',style:TextStyle(fontWeight:FontWeight.bold,color:selected==q['answer']?Colors.green:Colors.orange))), const SizedBox(height:28), FilledButton(onPressed:checked?next:check, child:Text(checked?(index==questions.length-1?'Finish lesson':'Continue'):'Check answer')) ]));
  }
  List<Widget> buildAnswer(Map<String,dynamic> q) {
    if(q['type']=='choice') return (q['options'] as List<String>).map((o)=>Padding(padding:const EdgeInsets.only(bottom:10),child:RadioListTile<String>(value:o,groupValue:selected,onChanged:checked?null:(v)=>setState(()=>selected=v),title:Text(o),tileColor:Theme.of(context).colorScheme.surfaceContainerHighest,shape:RoundedRectangleBorder(borderRadius:BorderRadius.circular(14))))).toList();
    if(q['type']=='match') return (q['pairs'] as List).map<Widget>((p)=>Padding(padding:const EdgeInsets.only(bottom:10),child:OutlinedButton(onPressed:checked?null:()=>setState(()=>selected='${p[0]} ${p[1]}'),style:OutlinedButton.styleFrom(padding:const EdgeInsets.all(16),backgroundColor:selected=='${p[0]} ${p[1]}'?Theme.of(context).colorScheme.secondaryContainer:null),child:Text('${p[0]}  +  ${p[1]}')))).toList();
    if(q['type']=='order') { return [TextField(enabled:!checked, minLines:2, maxLines:3, decoration:const InputDecoration(hintText:'Type the complete sentence in the correct order', border:OutlineInputBorder()), onChanged:(v)=>selected=v), const SizedBox(height:8), const Text('Hint: Start with “What strikes me most…”')]; }
    return [Card(child:Padding(padding:const EdgeInsets.all(16),child:Text(q['sentence'],style:const TextStyle(fontSize:18)))), const Text('Use the Voice tab for microphone-based speaking practice. When you have practised the sentence, mark it complete.'), CheckboxListTile(value:selected=='done',onChanged:checked?null:(v)=>setState(()=>selected=v==true?'done':null),title:const Text('I practised saying this sentence aloud'))];
  }
}

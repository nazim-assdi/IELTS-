import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:ielts_hero/screens/study_planner_screen.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('study planner renders goals and daily activities', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();

    await tester.pumpWidget(MaterialApp(
      home: StudyPlannerScreen(
        prefs: prefs,
        onOpenTab: (_) {},
      ),
    ));
    await tester.pumpAndSettle();

    expect(find.text('Study planner'), findsOneWidget);
    expect(find.text('Lessons per day'), findsOneWidget);
    expect(find.text('Daily study time'), findsOneWidget);
    expect(find.text('Today’s study checklist'), findsOneWidget);
    expect(find.text('Focused lesson'), findsOneWidget);
    expect(find.text('Speaking practice'), findsOneWidget);
    expect(find.text('Vocabulary revision'), findsOneWidget);
    expect(find.text('Quick review'), findsOneWidget);
  });

  testWidgets('study planner checklist persists after rebuilding', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    final key = 'planTasks_${DateTime.now().year.toString().padLeft(4, '0')}-'
        '${DateTime.now().month.toString().padLeft(2, '0')}-'
        '${DateTime.now().day.toString().padLeft(2, '0')}';

    await tester.pumpWidget(MaterialApp(
      home: StudyPlannerScreen(
        prefs: prefs,
        onOpenTab: (_) {},
      ),
    ));
    await tester.pumpAndSettle();

    final lessonCheckbox = find.byType(Checkbox).first;
    await tester.tap(lessonCheckbox);
    await tester.pumpAndSettle();

    expect(prefs.getStringList(key), contains('lesson'));
  });
}

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:ielts_hero/screens/study_planner_screen.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('study planner renders its daily goal controls', (tester) async {
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
    expect(find.text('20 min'), findsOneWidget);
    expect(find.text('30 min'), findsOneWidget);
    expect(find.text('40 min'), findsOneWidget);
  });
}

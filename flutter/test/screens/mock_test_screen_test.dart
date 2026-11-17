import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:ielts_hero/screens/mock_test_screen.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Mock Test Centre landing page renders and starts diagnostic', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    await tester.view.setPhysicalSize(const Size(1080, 1920));
    await tester.view.setDevicePixelRatio(1);

    await tester.pumpWidget(MaterialApp(home: Scaffold(body: MockTestScreen(prefs: prefs))));
    await tester.pumpAndSettle();

    expect(find.text('IELTS HERO • TEST CENTRE'), findsOneWidget);
    expect(find.text('Start diagnostic test'), findsOneWidget);
    await tester.tap(find.text('Start diagnostic test'));
    await tester.pumpAndSettle();
    expect(find.text('DIAGNOSTIC IN PROGRESS'), findsOneWidget);
    expect(find.text('Listening'), findsWidgets);

    await tester.view.resetPhysicalSize();
    await tester.view.resetDevicePixelRatio();
  });
}

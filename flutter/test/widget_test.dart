import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:ielts_hero/main.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('IELTS HERO premium dashboard renders', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();

    await tester.pumpWidget(IeltsHeroApp(prefs: prefs));
    await tester.pumpAndSettle();

    expect(find.text('IELTS HERO'), findsOneWidget);
    expect(find.text('Ready to level up?'), findsOneWidget);
    expect(find.text('Your daily target'), findsOneWidget);
    expect(find.text('Practice at your pace'), findsOneWidget);
    expect(find.text('Dictionary'), findsOneWidget);
  });
}

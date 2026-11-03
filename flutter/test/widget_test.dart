import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:ielts_hero/main.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('IELTS HERO home screen renders', (tester) async {
    SharedPreferences.setMockInitialValues({});
    final prefs = await SharedPreferences.getInstance();
    await tester.pumpWidget(IeltsHeroApp(prefs: prefs));
    await tester.pumpAndSettle();
    expect(find.text('IELTS HERO'), findsOneWidget);
    expect(find.text('YOUR LEARNING PATH'), findsOneWidget);
  });
}

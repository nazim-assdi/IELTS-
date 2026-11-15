import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'screens/home_shell.dart';
import 'theme/ielts_theme.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();
  runApp(IeltsHeroApp(prefs: prefs));
}

class IeltsHeroApp extends StatefulWidget {
  const IeltsHeroApp({super.key, required this.prefs});
  final SharedPreferences prefs;

  @override
  State<IeltsHeroApp> createState() => _IeltsHeroAppState();
}

class _IeltsHeroAppState extends State<IeltsHeroApp> {
  String themeName = 'paper-warm';

  @override
  void initState() {
    super.initState();
    themeName = widget.prefs.getString('ielts_eye_theme') ?? 'paper-warm';
  }

  void setTheme(String value) {
    setState(() => themeName = value);
    widget.prefs.setString('ielts_eye_theme', value);
  }

  @override
  Widget build(BuildContext context) {
    final dark = themeName == 'midnight-slate';
    final background = switch (themeName) {
      'soft-sage' => const Color(0xFFF0F6F3),
      'paper-warm' => const Color(0xFFF7F6F2),
      _ => IeltsPalette.canvas,
    };
    return MaterialApp(
      title: 'IELTS HERO',
      debugShowCheckedModeBanner: false,
      themeMode: dark ? ThemeMode.dark : ThemeMode.light,
      theme: IeltsTheme.light(background: background),
      darkTheme: IeltsTheme.dark(),
      themeAnimationDuration: const Duration(milliseconds: 280),
      home: HomeShell(
        prefs: widget.prefs,
        themeName: themeName,
        onThemeChanged: setTheme,
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'data/curriculum.dart';
import 'screens/home_shell.dart';

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
    const seed = Color(0xFF059669);
    return MaterialApp(
      title: 'IELTS HERO', debugShowCheckedModeBanner: false,
      themeMode: dark ? ThemeMode.dark : ThemeMode.light,
      theme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: seed, brightness: Brightness.light), useMaterial3: true, scaffoldBackgroundColor: themeName == 'soft-sage' ? const Color(0xFFF2F7F4) : const Color(0xFFFAF6EE), fontFamily: 'Roboto'),
      darkTheme: ThemeData(colorScheme: ColorScheme.fromSeed(seedColor: seed, brightness: Brightness.dark), useMaterial3: true),
      home: HomeShell(prefs: widget.prefs, themeName: themeName, onThemeChanged: setTheme),
    );
  }
}

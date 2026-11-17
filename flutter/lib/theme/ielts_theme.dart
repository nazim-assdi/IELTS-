import 'package:flutter/material.dart';

class IeltsPalette {
  static const ink = Color(0xFF14243A);
  static const inkSoft = Color(0xFF243B53);
  static const emerald = Color(0xFF087F68);
  static const emeraldDeep = Color(0xFF075B4C);
  static const mint = Color(0xFFE5F4EF);
  static const gold = Color(0xFFC79A4B);
  static const canvas = Color(0xFFF4F7F9);
  static const paper = Color(0xFFFFFFFF);
  static const muted = Color(0xFF718096);
  static const line = Color(0xFFE4EAF0);
  static const night = Color(0xFF101C2B);
}

class IeltsTheme {
  static ThemeData light({Color? background}) {
    final scheme = ColorScheme.fromSeed(
      seedColor: IeltsPalette.emerald,
      brightness: Brightness.light,
    ).copyWith(
      primary: IeltsPalette.emerald,
      onPrimary: Colors.white,
      secondary: IeltsPalette.gold,
      surface: Colors.white,
      onSurface: IeltsPalette.ink,
      outline: IeltsPalette.line,
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.light,
      colorScheme: scheme,
      scaffoldBackgroundColor: background ?? IeltsPalette.canvas,
      fontFamily: null,
      visualDensity: VisualDensity.standard,
      appBarTheme: const AppBarTheme(
        backgroundColor: Colors.white,
        foregroundColor: IeltsPalette.ink,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        centerTitle: false,
        titleTextStyle: TextStyle(
          color: IeltsPalette.ink,
          fontSize: 18,
          fontWeight: FontWeight.w800,
          letterSpacing: -.35,
        ),
      ),
      cardTheme: CardThemeData(
        color: Colors.white,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(22),
          side: const BorderSide(color: IeltsPalette.line, width: .75),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFFF8FAFC),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
        hintStyle: const TextStyle(color: IeltsPalette.muted, fontSize: 14),
        labelStyle: const TextStyle(color: IeltsPalette.muted),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(17),
          borderSide: const BorderSide(color: IeltsPalette.line),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(17),
          borderSide: const BorderSide(color: IeltsPalette.line),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(17),
          borderSide: const BorderSide(color: IeltsPalette.emerald, width: 1.5),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: IeltsPalette.emerald,
          foregroundColor: Colors.white,
          elevation: 0,
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 15),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          textStyle: const TextStyle(fontWeight: FontWeight.w800, letterSpacing: .05),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: IeltsPalette.ink,
          side: const BorderSide(color: IeltsPalette.line),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          textStyle: const TextStyle(fontWeight: FontWeight.w700),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: IeltsPalette.emerald,
          textStyle: const TextStyle(fontWeight: FontWeight.w800),
        ),
      ),
      dividerTheme: const DividerThemeData(color: IeltsPalette.line, thickness: 1),
      snackBarTheme: SnackBarThemeData(
        behavior: SnackBarBehavior.floating,
        backgroundColor: IeltsPalette.ink,
        contentTextStyle: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Colors.white,
        surfaceTintColor: Colors.transparent,
        indicatorColor: IeltsPalette.mint,
        elevation: 0,
        height: 72,
        labelTextStyle: WidgetStateProperty.resolveWith((states) => TextStyle(
          fontSize: 11,
          fontWeight: states.contains(WidgetState.selected) ? FontWeight.w800 : FontWeight.w600,
          color: states.contains(WidgetState.selected) ? IeltsPalette.emerald : IeltsPalette.muted,
        )),
        iconTheme: WidgetStateProperty.resolveWith((states) => IconThemeData(
          size: 22,
          color: states.contains(WidgetState.selected) ? IeltsPalette.emerald : IeltsPalette.muted,
        )),
      ),
    );
  }

  static ThemeData dark() {
    final scheme = ColorScheme.fromSeed(
      seedColor: IeltsPalette.emerald,
      brightness: Brightness.dark,
    ).copyWith(
      primary: const Color(0xFF56C7A9),
      secondary: const Color(0xFFE1B96F),
      surface: const Color(0xFF172638),
      onSurface: const Color(0xFFEAF1F7),
      outline: const Color(0xFF304459),
    );
    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: scheme,
      scaffoldBackgroundColor: IeltsPalette.night,
      appBarTheme: const AppBarTheme(
        backgroundColor: Color(0xFF142336),
        foregroundColor: Color(0xFFEAF1F7),
        surfaceTintColor: Colors.transparent,
        elevation: 0,
      ),
      cardTheme: CardThemeData(
        color: const Color(0xFF172638),
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(22),
          side: const BorderSide(color: Color(0xFF304459), width: .75),
        ),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: const Color(0xFF1D3045),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(17), borderSide: const BorderSide(color: Color(0xFF304459))),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(17), borderSide: const BorderSide(color: Color(0xFF304459))),
        focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(17), borderSide: const BorderSide(color: Color(0xFF56C7A9), width: 1.5)),
      ),
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: const Color(0xFF142336),
        indicatorColor: const Color(0xFF214B43),
        height: 72,
        labelTextStyle: WidgetStateProperty.all(const TextStyle(fontSize: 11, fontWeight: FontWeight.w700)),
      ),
    );
  }
}

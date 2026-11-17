import 'package:shared_preferences/shared_preferences.dart';

class ProgressStore {
  ProgressStore(this.prefs);
  final SharedPreferences prefs;

  int get xp => prefs.getInt('xp') ?? 0;
  int get gems => prefs.getInt('gems') ?? 50;
  int get streak => prefs.getInt('streak') ?? 1;
  int get hearts => prefs.getInt('hearts') ?? 5;
  double get band => prefs.getDouble('predictedBand') ?? 0;
  List<String> get completed => prefs.getStringList('completedLessons') ?? <String>[];

  String get _todayKey {
    final now = DateTime.now();
    final year = now.year.toString().padLeft(4, '0');
    final month = now.month.toString().padLeft(2, '0');
    final day = now.day.toString().padLeft(2, '0');
    return '$year-$month-$day';
  }

  bool get _isToday => prefs.getString('progressDay') == _todayKey;

  int get todayCompletedLessons =>
      _isToday ? (prefs.getInt('todayCompletedLessons') ?? 0) : 0;

  int get todayPracticeMinutes =>
      _isToday ? (prefs.getInt('todayPracticeMinutes') ?? 0) : 0;

  Future<void> _resetDailyCountersIfNeeded() async {
    if (_isToday) return;
    await prefs.setString('progressDay', _todayKey);
    await prefs.setInt('todayCompletedLessons', 0);
    await prefs.setInt('todayPracticeMinutes', 0);
  }

  Future<void> complete(String id, int earnedXp, int earnedGems) async {
    final ids = completed;
    if (ids.contains(id)) return;

    await _resetDailyCountersIfNeeded();
    ids.add(id);
    await prefs.setStringList('completedLessons', ids);
    await prefs.setInt('xp', xp + earnedXp);
    await prefs.setInt('gems', gems + earnedGems);
    await prefs.setInt('todayCompletedLessons', todayCompletedLessons + 1);
    await prefs.setInt('todayPracticeMinutes', todayPracticeMinutes + 4);
  }

  Future<void> setBand(double value) => prefs.setDouble('predictedBand', value);
}

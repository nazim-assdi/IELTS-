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
  Future<void> complete(String id, int earnedXp, int earnedGems) async {
    final ids = completed;
    if (ids.contains(id)) return;
    ids.add(id);
    await prefs.setStringList('completedLessons', ids);
    await prefs.setInt('xp', xp + earnedXp);
    await prefs.setInt('gems', gems + earnedGems);
    await prefs.setInt('todayCompletedLessons', (prefs.getInt('todayCompletedLessons') ?? 0) + 1);
    await prefs.setInt('todayPracticeMinutes', (prefs.getInt('todayPracticeMinutes') ?? 0) + 4);
  }
  Future<void> setBand(double value) => prefs.setDouble('predictedBand', value);
}

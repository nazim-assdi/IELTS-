import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class ProgressStore {
  ProgressStore(this.prefs);
  final SharedPreferences prefs;

  static const Map<String, int> planTaskMinutes = {
    'lesson': 15,
    'speaking': 10,
    'vocabulary': 10,
    'review': 5,
  };

  int get xp => prefs.getInt('xp') ?? 0;
  int get gems => prefs.getInt('gems') ?? 50;
  int get streak => prefs.getInt('streak') ?? 0;
  int get hearts => prefs.getInt('hearts') ?? 5;
  double get band => prefs.getDouble('predictedBand') ?? 0;
  List<String> get completed => prefs.getStringList('completedLessons') ?? <String>[];

  String get _todayKey => dateKey(DateTime.now());

  static String dateKey(DateTime date) {
    final year = date.year.toString().padLeft(4, '0');
    final month = date.month.toString().padLeft(2, '0');
    final day = date.day.toString().padLeft(2, '0');
    return '$year-$month-$day';
  }

  bool get _isToday => prefs.getString('progressDay') == _todayKey;

  int get todayCompletedLessons =>
      _isToday ? (prefs.getInt('todayCompletedLessons') ?? 0) : 0;

  int get todayPracticeMinutes =>
      _isToday ? (prefs.getInt('todayPracticeMinutes') ?? 0) : 0;

  int get dailyLessonGoal => (prefs.getInt('dailyLessonGoal') ?? 5).clamp(1, 10);
  int get dailyStudyMinutesGoal {
    final value = prefs.getInt('dailyStudyMinutesGoal') ?? 30;
    return const [20, 30, 40].contains(value) ? value : 30;
  }

  List<String> get todayPlanTaskIds => planTaskIdsForDate(DateTime.now());

  List<String> planTaskIdsForDate(DateTime date) =>
      prefs.getStringList('planTasks_${dateKey(date)}') ?? <String>[];

  int get todayPlannedMinutes => todayPlanTaskIds.fold<int>(
    0,
    (total, id) => total + (planTaskMinutes[id] ?? 0),
  );

  int get todayPlanTaskCount => todayPlanTaskIds.length;

  int get todayStudyMinutes =>
      todayPracticeMinutes > todayPlannedMinutes ? todayPracticeMinutes : todayPlannedMinutes;

  Future<void> setDailyLessonGoal(int value) =>
      prefs.setInt('dailyLessonGoal', value.clamp(1, 10));

  Future<void> setDailyStudyMinutesGoal(int value) async {
    if (!const [20, 30, 40].contains(value)) return;
    await prefs.setInt('dailyStudyMinutesGoal', value);
  }

  Future<void> togglePlanTask(String id) async {
    if (!planTaskMinutes.containsKey(id)) return;
    await _resetDailyCountersIfNeeded();
    final tasks = todayPlanTaskIds;
    if (tasks.contains(id)) {
      tasks.remove(id);
    } else {
      tasks.add(id);
      await _recordStudyDay();
    }
    await prefs.setStringList('planTasks_$_todayKey', tasks);
  }

  int lessonCountForDate(DateTime date) =>
      prefs.getInt('studyCount_${dateKey(date)}') ?? 0;

  int planMinutesForDate(DateTime date) => planTaskIdsForDate(date).fold<int>(
    0,
    (total, id) => total + (planTaskMinutes[id] ?? 0),
  );

  Future<void> _recordStudyDay() async {
    final today = DateTime.now();
    final todayKey = dateKey(today);
    final lastStudyDay = prefs.getString('lastStudyDay');

    if (lastStudyDay != todayKey) {
      final yesterdayKey = dateKey(today.subtract(const Duration(days: 1)));
      final nextStreak = lastStudyDay == yesterdayKey ? streak + 1 : 1;
      await prefs.setInt('streak', nextStreak);
      await prefs.setString('lastStudyDay', todayKey);
    }
  }

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
    await _recordStudyDay();
    ids.add(id);
    await prefs.setStringList('completedLessons', ids);
    await prefs.setInt('xp', xp + earnedXp);
    await prefs.setInt('gems', gems + earnedGems);
    await prefs.setInt('todayCompletedLessons', todayCompletedLessons + 1);
    await prefs.setInt('todayPracticeMinutes', todayPracticeMinutes + 4);
    await prefs.setInt('studyCount_$_todayKey', lessonCountForDate(DateTime.now()) + 1);
  }

  List<Map<String, dynamic>> get speakingEvaluationHistory {
    final raw = prefs.getStringList('speakingEvaluationHistory') ?? <String>[];
    return raw.map((item) {
      try {
        final decoded = jsonDecode(item);
        return decoded is Map ? Map<String, dynamic>.from(decoded) : <String, dynamic>{};
      } catch (_) {
        return <String, dynamic>{};
      }
    }).where((item) => item.isNotEmpty).toList();
  }

  Map<String, dynamic>? get latestSpeakingEvaluation {
    final history = speakingEvaluationHistory;
    return history.isEmpty ? null : history.first;
  }

  Future<void> recordSpeakingEvaluation(Map<String, dynamic> result) async {
    final rawBand = result['overallBand'];
    final parsedBand = rawBand is num ? rawBand.toDouble() : double.tryParse('$rawBand');
    if (parsedBand == null || !parsedBand.isFinite || parsedBand < 0 || parsedBand > 9) {
      throw const FormatException('The speaking assessment did not contain a valid band estimate.');
    }

    await setBand(parsedBand);
    await _resetDailyCountersIfNeeded();
    await _recordStudyDay();

    final record = <String, dynamic>{
      'date': DateTime.now().toIso8601String(),
      'overallBand': parsedBand,
      'fluencyCoherence': result['fluencyCoherence'],
      'lexicalResource': result['lexicalResource'],
      'grammaticalRangeAccuracy': result['grammaticalRangeAccuracy'],
      'pronunciation': result['pronunciation'],
      'strengths': result['strengths'] is List ? result['strengths'] : <dynamic>[],
      'improvements': result['improvements'] is List ? result['improvements'] : <dynamic>[],
      'improvedSample': result['improvedSample']?.toString() ?? '',
    };
    final history = prefs.getStringList('speakingEvaluationHistory') ?? <String>[];
    history.insert(0, jsonEncode(record));
    await prefs.setStringList('speakingEvaluationHistory', history.take(20).toList());
  }

  Future<void> setBand(double value) => prefs.setDouble('predictedBand', value);
}

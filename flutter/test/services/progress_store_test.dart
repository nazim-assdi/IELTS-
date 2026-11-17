import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:ielts_hero/services/progress_store.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('ProgressStore daily counters', () {
    test('resets yesterday counters before completing a new lesson', () async {
      SharedPreferences.setMockInitialValues({
        'completedLessons': <String>['u1-l1'],
        'progressDay': '2000-01-01',
        'todayCompletedLessons': 8,
        'todayPracticeMinutes': 32,
        'xp': 40,
        'gems': 55,
      });
      final prefs = await SharedPreferences.getInstance();
      final store = ProgressStore(prefs);

      expect(store.todayCompletedLessons, 0);
      expect(store.todayPracticeMinutes, 0);

      await store.complete('u1-l2', 12, 9);

      expect(store.todayCompletedLessons, 1);
      expect(store.todayPracticeMinutes, 4);
      expect(prefs.getString('progressDay'), isNot('2000-01-01'));
      expect(store.completed, containsAll(['u1-l1', 'u1-l2']));
      expect(store.xp, 52);
      expect(store.gems, 64);
    });

    test('does not count the same lesson twice on the same day', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final store = ProgressStore(prefs);

      await store.complete('u1-l1', 10, 5);
      await store.complete('u1-l1', 10, 5);

      expect(store.todayCompletedLessons, 1);
      expect(store.todayPracticeMinutes, 4);
      expect(store.xp, 10);
      expect(store.gems, 55);
    });
    test('increments a consecutive-day streak only once per active day', () async {
      final yesterday = ProgressStore.dateKey(DateTime.now().subtract(const Duration(days: 1)));
      SharedPreferences.setMockInitialValues({
        'streak': 4,
        'lastStudyDay': yesterday,
      });
      final prefs = await SharedPreferences.getInstance();
      final store = ProgressStore(prefs);

      await store.togglePlanTask('speaking');
      expect(store.streak, 5);
      await store.complete('u1-l1', 10, 5);
      expect(store.streak, 5);
      expect(prefs.getString('lastStudyDay'), ProgressStore.dateKey(DateTime.now()));
    });

    test('persists study goals and daily plan checklist', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final store = ProgressStore(prefs);

      await store.setDailyLessonGoal(8);
      await store.setDailyStudyMinutesGoal(40);
      await store.togglePlanTask('lesson');
      await store.togglePlanTask('vocabulary');

      expect(store.dailyLessonGoal, 8);
      expect(store.dailyStudyMinutesGoal, 40);
      expect(store.todayPlanTaskCount, 2);
      expect(store.todayPlannedMinutes, 25);
    });

    test('stores the latest speaking band and keeps a short assessment history', () async {
      SharedPreferences.setMockInitialValues({});
      final prefs = await SharedPreferences.getInstance();
      final store = ProgressStore(prefs);

      await store.recordSpeakingEvaluation({
        'overallBand': 6.5,
        'fluencyCoherence': 'Good progression',
        'lexicalResource': 'Use more precise collocations',
        'grammaticalRangeAccuracy': 'Varied sentence structures',
        'pronunciation': 'Clear and understandable',
        'strengths': ['Relevant examples'],
        'improvements': ['Develop ideas further'],
      });

      expect(store.band, 6.5);
      expect(store.latestSpeakingEvaluation?['overallBand'], 6.5);
      expect(store.latestSpeakingEvaluation?['improvements'], ['Develop ideas further']);
      expect(store.streak, 1);
    });

  });
}

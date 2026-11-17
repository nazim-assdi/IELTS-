import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:ielts_hero/services/dictionary_api.dart';

void main() {
  group('DictionaryApi', () {
    test('parses definitions, phonetics, examples and word origin', () async {
      final client = MockClient((request) async {
        expect(request.url.host, 'api.dictionaryapi.dev');
        expect(request.url.path, '/api/v2/entries/en/resilient');
        return http.Response(
          jsonEncode([
            {
              'word': 'resilient',
              'phonetic': '/rɪˈzɪliənt/',
              'origin': 'From Latin resilire',
              'meanings': [
                {
                  'partOfSpeech': 'adjective',
                  'definitions': [
                    {
                      'definition': 'Able to recover quickly after difficulty.',
                      'example': 'Children can be remarkably resilient.',
                      'synonyms': ['tough', 'adaptable'],
                      'antonyms': ['fragile'],
                    }
                  ]
                }
              ]
            }
          ]),
          200,
          headers: {'content-type': 'application/json'},
        );
      });
      final api = DictionaryApi(client: client);
      addTearDown(api.dispose);

      final entry = await api.lookup('Resilient');

      expect(entry.word, 'resilient');
      expect(entry.phonetic, '/rɪˈzɪliənt/');
      expect(entry.origin, 'From Latin resilire');
      expect(entry.definitions, hasLength(1));
      expect(entry.definitions.first.partOfSpeech, 'adjective');
      expect(entry.definitions.first.example, 'Children can be remarkably resilient.');
      expect(entry.definitions.first.synonyms, contains('adaptable'));
      expect(entry.definitions.first.antonyms, contains('fragile'));
    });

    test('uses the first phonetics entry when top-level phonetic is absent', () async {
      final entry = DictionaryEntry.fromJson({
        'word': 'eloquent',
        'phonetics': [
          {'text': '/ˈɛləkwənt/'}
        ],
        'meanings': [
          {
            'partOfSpeech': 'adjective',
            'definitions': [
              {'definition': 'Fluent or persuasive in speaking or writing.'}
            ]
          }
        ]
      });

      expect(entry.phonetic, '/ˈɛləkwənt/');
    });

    test('returns a clear not-found error for a missing word', () async {
      final api = DictionaryApi(
        client: MockClient((_) async => http.Response('Not found', 404)),
      );
      addTearDown(api.dispose);

      expect(
        () => api.lookup('wordthatdoesnotexist'),
        throwsA(isA<DictionaryNotFoundException>()),
      );
    });

    test('rejects a phrase instead of sending it as one word', () async {
      final api = DictionaryApi(
        client: MockClient((_) async {
          throw StateError('The HTTP client must not be called for invalid input.');
        }),
      );
      addTearDown(api.dispose);

      expect(
        () => api.lookup('two words'),
        throwsA(isA<FormatException>()),
      );
    });
  });
}

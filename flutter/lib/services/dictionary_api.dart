import 'dart:convert';
import 'package:http/http.dart' as http;

class DictionaryDefinition {
  const DictionaryDefinition({
    required this.partOfSpeech,
    required this.definition,
    this.example = '',
    this.synonyms = const [],
    this.antonyms = const [],
  });

  final String partOfSpeech;
  final String definition;
  final String example;
  final List<String> synonyms;
  final List<String> antonyms;

  factory DictionaryDefinition.fromJson(Map<String, dynamic> json) {
    List<String> strings(dynamic value) => value is List
        ? value.map((item) => item.toString()).where((item) => item.trim().isNotEmpty).toList()
        : const <String>[];
    return DictionaryDefinition(
      partOfSpeech: (json['partOfSpeech'] ?? 'meaning').toString(),
      definition: (json['definition'] ?? '').toString(),
      example: (json['example'] ?? '').toString(),
      synonyms: strings(json['synonyms']),
      antonyms: strings(json['antonyms']),
    );
  }
}

class DictionaryEntry {
  const DictionaryEntry({
    required this.word,
    required this.phonetic,
    required this.definitions,
    this.origin = '',
  });

  final String word;
  final String phonetic;
  final String origin;
  final List<DictionaryDefinition> definitions;

  factory DictionaryEntry.fromJson(Map<String, dynamic> json) {
    final directPhonetic = (json['phonetic'] ?? '').toString().trim();
    final phonetics = (json['phonetics'] as List? ?? const [])
        .whereType<Map>()
        .map((item) => (item['text'] ?? '').toString().trim())
        .where((item) => item.isNotEmpty)
        .toList();
    final meanings = (json['meanings'] as List? ?? const [])
        .whereType<Map>();
    final definitions = <DictionaryDefinition>[];
    for (final meaning in meanings) {
      for (final definition in (meaning['definitions'] as List? ?? const [])) {
        if (definition is Map) {
          final definitionData = Map<String, dynamic>.from(definition);
          definitionData['partOfSpeech'] = meaning['partOfSpeech'] ?? 'meaning';
          definitions.add(DictionaryDefinition.fromJson(definitionData));
        }
      }
    }
    return DictionaryEntry(
      word: (json['word'] ?? '').toString(),
      phonetic: directPhonetic.isNotEmpty ? directPhonetic : (phonetics.isEmpty ? '' : phonetics.first),
      origin: (json['origin'] ?? '').toString(),
      definitions: definitions,
    );
  }
}

class DictionaryApi {
  DictionaryApi({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;
  static const _base = 'api.dictionaryapi.dev';

  Future<DictionaryEntry> lookup(String rawWord) async {
    final word = rawWord.trim().toLowerCase();
    if (!RegExp(r"^[a-z][a-z'-]{0,49}$").hasMatch(word)) {
      throw const FormatException('Search for one English word using letters only.');
    }
    final uri = Uri.https(_base, '/api/v2/entries/en/$word');
    final response = await _client.get(
      uri,
      headers: const {'Accept': 'application/json'},
    ).timeout(const Duration(seconds: 18));

    if (response.statusCode == 404) {
      throw const DictionaryNotFoundException('No entry found. Check the spelling or try another word.');
    }
    if (response.statusCode != 200) {
      throw DictionaryNetworkException('Dictionary service returned ${response.statusCode}. Please try again.');
    }

    final decoded = jsonDecode(response.body);
    if (decoded is! List || decoded.isEmpty || decoded.first is! Map) {
      throw const DictionaryNotFoundException('No definition was returned for this word.');
    }
    final entry = DictionaryEntry.fromJson(Map<String, dynamic>.from(decoded.first as Map));
    if (entry.definitions.isEmpty) {
      throw const DictionaryNotFoundException('This entry has no available definitions.');
    }
    return entry;
  }

  void dispose() => _client.close();
}

class DictionaryNotFoundException implements Exception {
  const DictionaryNotFoundException(this.message);
  final String message;
  @override
  String toString() => message;
}

class DictionaryNetworkException implements Exception {
  const DictionaryNetworkException(this.message);
  final String message;
  @override
  String toString() => message;
}

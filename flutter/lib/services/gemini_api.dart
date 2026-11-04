import 'dart:convert';
import 'package:http/http.dart' as http;

const String defaultIeltsApiUrl = 'https://ielts-hero-api.onrender.com';

/// Calls the private server-side Gemini API. Keep API keys on the server only.
class GeminiApi {
  GeminiApi({required this.baseUrl});
  final String baseUrl;

  bool get configured => baseUrl.trim().isNotEmpty;

  Uri _uri(String path) {
    final base = baseUrl.trim().replaceAll(RegExp(r'/+$'), '');
    return Uri.parse('$base$path');
  }

  String _error(http.Response response) {
    try {
      final body = jsonDecode(response.body);
      if (body is Map && body['error'] != null) return body['error'].toString();
    } catch (_) {}
    return 'Server error (${response.statusCode}). Please try again.';
  }

  Future<String> examinerReply({
    required List<Map<String, String>> history,
    required String message,
    required String part,
  }) async {
    if (!configured) {
      throw Exception('AI server is not connected. Tap the settings icon and add your deployed HTTPS API URL.');
    }
    final response = await http.post(
      _uri('/api/gemini/examiner-chat'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'history': history, 'message': message, 'testPart': part}),
    ).timeout(const Duration(seconds: 60));
    if (response.statusCode != 200) throw Exception(_error(response));
    return (jsonDecode(response.body) as Map<String, dynamic>)['reply']?.toString()
        ?? 'Could you tell me a little more?';
  }

  Future<Map<String, dynamic>> evaluate({
    required String speech,
    required String part,
  }) async {
    if (!configured) {
      throw Exception('AI server is not connected. Add your deployed HTTPS API URL in Voice settings.');
    }
    final response = await http.post(
      _uri('/api/gemini/evaluate-speaking'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'candidateSpeech': speech, 'testPart': part}),
    ).timeout(const Duration(seconds: 60));
    if (response.statusCode != 200) throw Exception(_error(response));
    return jsonDecode(response.body) as Map<String, dynamic>;
  }

  Future<Map<String, dynamic>> generateCueCard(String category) async {
    if (!configured) throw Exception('AI server URL is not configured.');
    final response = await http.post(
      _uri('/api/gemini/generate-cue-card'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'category': category}),
    ).timeout(const Duration(seconds: 60));
    if (response.statusCode != 200) throw Exception(_error(response));
    return jsonDecode(response.body) as Map<String, dynamic>;
  }
}

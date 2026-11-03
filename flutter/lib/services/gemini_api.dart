import 'dart:convert';
import 'package:http/http.dart' as http;

/// Calls the original app's server-side Gemini endpoints. Never put a Gemini key in the Flutter app.
class GeminiApi {
  GeminiApi({this.baseUrl = const String.fromEnvironment('IELTS_API_URL')});
  final String baseUrl;
  bool get configured => baseUrl.trim().isNotEmpty;
  Future<String> examinerReply({required List<Map<String, String>> history, required String message, required String part}) async {
    if (!configured) throw Exception('AI server URL is not configured. Set --dart-define=IELTS_API_URL=https://your-server.example');
    final response = await http.post(Uri.parse('$baseUrl/api/gemini/examiner-chat'), headers: {'Content-Type':'application/json'}, body: jsonEncode({'history': history, 'message': message, 'testPart': part})).timeout(const Duration(seconds: 45));
    if (response.statusCode != 200) throw Exception('AI server returned ${response.statusCode}');
    return (jsonDecode(response.body) as Map<String, dynamic>)['reply']?.toString() ?? 'Could you tell me a little more?';
  }
  Future<Map<String, dynamic>> evaluate({required String speech, required String part}) async {
    if (!configured) throw Exception('AI server URL is not configured.');
    final response = await http.post(Uri.parse('$baseUrl/api/gemini/evaluate-speaking'), headers: {'Content-Type':'application/json'}, body: jsonEncode({'candidateSpeech': speech, 'testPart': part})).timeout(const Duration(seconds: 60));
    if (response.statusCode != 200) throw Exception('Evaluation failed: ${response.statusCode}');
    return jsonDecode(response.body) as Map<String, dynamic>;
  }
  Future<Map<String, dynamic>> generateCueCard(String category) async {
    if (!configured) throw Exception('AI server URL is not configured.');
    final response = await http.post(Uri.parse('$baseUrl/api/gemini/generate-cue-card'), headers: {'Content-Type':'application/json'}, body: jsonEncode({'category': category})).timeout(const Duration(seconds: 45));
    if (response.statusCode != 200) throw Exception('Cue card generation failed.');
    return jsonDecode(response.body) as Map<String, dynamic>;
  }
}

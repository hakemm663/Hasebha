import '../../../../core/network/api_client.dart';

class AiAgentRepository {
  final ApiClient apiClient;

  AiAgentRepository({required this.apiClient});

  Future<Map<String, dynamic>> sendMessage({
    required String message,
    List<Map<String, String>>? history,
    String language = 'ar',
    bool isVoice = false,
  }) async {
    final response = await apiClient.dio.post('/ai/agent', data: {
      'message': message,
      'history': history,
      'language': language,
      'isVoiceInput': isVoice,
    });

    if (response.data['success'] == true) {
      return response.data['data'];
    }
    throw Exception(response.data['error'] ?? 'AI Agent request failed');
  }

  Future<Map<String, dynamic>> executeConfirmedTool({
    required String toolName,
    required Map<String, dynamic> toolArguments,
  }) async {
    final response = await apiClient.dio.post('/ai/tools/execute', data: {
      'toolName': toolName,
      'toolArguments': toolArguments,
    });

    if (response.data['success'] == true) {
      return response.data['data'];
    }
    throw Exception(response.data['error'] ?? 'Failed to execute tool');
  }
}

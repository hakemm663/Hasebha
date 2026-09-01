import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

class ApiClient {
  late final Dio dio;
  static const String baseUrl = 'https://api.hasebha.app/api/v1';

  ApiClient() {
    dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          final prefs = await SharedPreferences.getInstance();
          final token = prefs.getString('auth_token');
          final businessId = prefs.getString('business_id');

          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }
          if (businessId != null) {
            options.headers['x-business-id'] = businessId;
          }
          return handler.next(options);
        },
        onError: (DioException e, handler) {
          // Handle 401 Unauthorized token expiry
          if (e.response?.statusCode == 401) {
            // Trigger token refresh or logout event
          }
          return handler.next(e);
        },
      ),
    );
  }
}

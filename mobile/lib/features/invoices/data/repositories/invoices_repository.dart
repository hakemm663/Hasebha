import 'package:dio/dio.dart';
import '../../../../core/network/api_client.dart';
import '../models/invoice_model.dart';

class InvoicesRepository {
  final ApiClient apiClient;

  InvoicesRepository({required this.apiClient});

  Future<List<InvoiceModel>> getInvoices({String? status, String? search}) async {
    final response = await apiClient.dio.get('/invoices', queryParameters: {
      if (status != null && status != 'ALL') 'status': status,
      if (search != null && search.isNotEmpty) 'search': search,
    });

    if (response.data['success'] == true) {
      final items = response.data['data']['items'] as List;
      return items.map((json) => InvoiceModel.fromJson(json)).toList();
    }
    throw Exception(response.data['error'] ?? 'Failed to load invoices');
  }

  Future<InvoiceModel> createInvoice({
    required String customerId,
    required String dueDate,
    required List<Map<String, dynamic>> items,
    double discount = 0,
    double vatRate = 14,
    String? notes,
  }) async {
    final response = await apiClient.dio.post('/invoices', data: {
      'customerId': customerId,
      'dueDate': dueDate,
      'items': items,
      'discount': discount,
      'vatRate': vatRate,
      'notes': notes,
    });

    if (response.data['success'] == true) {
      return InvoiceModel.fromJson(response.data['data']);
    }
    throw Exception(response.data['error'] ?? 'Failed to create invoice');
  }

  Future<InvoiceModel> recordPayment({
    required String invoiceId,
    required double amount,
    required String paymentMethod,
    String? reference,
  }) async {
    final response = await apiClient.dio.post('/invoices/$invoiceId/payments', data: {
      'amount': amount,
      'paymentMethod': paymentMethod,
      'reference': reference,
    });

    if (response.data['success'] == true) {
      return InvoiceModel.fromJson(response.data['data']);
    }
    throw Exception(response.data['error'] ?? 'Failed to record payment');
  }
}

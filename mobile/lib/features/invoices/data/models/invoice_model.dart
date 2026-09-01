class InvoiceItemModel {
  final String description;
  final double quantity;
  final double unitPrice;
  final double discount;
  final double lineTotal;

  InvoiceItemModel({
    required this.description,
    required this.quantity,
    required this.unitPrice,
    this.discount = 0.0,
    required this.lineTotal,
  });

  factory InvoiceItemModel.fromJson(Map<String, dynamic> json) {
    return InvoiceItemModel(
      description: json['description'] ?? '',
      quantity: (json['quantity'] as num?)?.toDouble() ?? 1.0,
      unitPrice: (json['unitPrice'] as num?)?.toDouble() ?? 0.0,
      discount: (json['discount'] as num?)?.toDouble() ?? 0.0,
      lineTotal: (json['lineTotal'] as num?)?.toDouble() ?? 0.0,
    );
  }

  Map<String, dynamic> toJson() => {
    'description': description,
    'quantity': quantity,
    'unitPrice': unitPrice,
    'discount': discount,
  };
}

class InvoiceModel {
  final String id;
  final String invoiceNumber;
  final String customerName;
  final String customerPhone;
  final String status;
  final String issueDate;
  final String dueDate;
  final double subtotal;
  final double discount;
  final double tax;
  final double total;
  final double amountPaid;
  final double outstandingBalance;
  final String currency;
  final String shareToken;
  final List<InvoiceItemModel> items;

  InvoiceModel({
    required this.id,
    required this.invoiceNumber,
    required this.customerName,
    required this.customerPhone,
    required this.status,
    required this.issueDate,
    required this.dueDate,
    required this.subtotal,
    required this.discount,
    required this.tax,
    required this.total,
    required this.amountPaid,
    required this.outstandingBalance,
    required this.currency,
    required this.shareToken,
    required this.items,
  });

  factory InvoiceModel.fromJson(Map<String, dynamic> json) {
    return InvoiceModel(
      id: json['id'] ?? '',
      invoiceNumber: json['invoiceNumber'] ?? '',
      customerName: json['customerName'] ?? '',
      customerPhone: json['customerPhone'] ?? '',
      status: json['status'] ?? 'SENT',
      issueDate: json['issueDate'] ?? '',
      dueDate: json['dueDate'] ?? '',
      subtotal: (json['subtotal'] as num?)?.toDouble() ?? 0.0,
      discount: (json['discount'] as num?)?.toDouble() ?? 0.0,
      tax: (json['tax'] as num?)?.toDouble() ?? 0.0,
      total: (json['total'] as num?)?.toDouble() ?? 0.0,
      amountPaid: (json['amountPaid'] as num?)?.toDouble() ?? 0.0,
      outstandingBalance: (json['outstandingBalance'] as num?)?.toDouble() ?? 0.0,
      currency: json['currency'] ?? 'EGP',
      shareToken: json['shareToken'] ?? '',
      items: (json['items'] as List? ?? [])
          .map((i) => InvoiceItemModel.fromJson(i))
          .toList(),
    );
  }
}

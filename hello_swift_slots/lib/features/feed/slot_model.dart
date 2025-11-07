import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:equatable/equatable.dart';

class Slot extends Equatable {
  const Slot({
    required this.id,
    required this.businessName,
    required this.category,
    required this.startTime,
    required this.endTime,
    required this.price,
    required this.discountPct,
    required this.address,
    required this.distanceKm,
    required this.status,
  });

  final String id;
  final String businessName;
  final String category;
  final DateTime startTime;
  final DateTime endTime;
  final double price;
  final int discountPct;
  final String address;
  final double distanceKm;
  final String status;

  bool get isBooked => status == 'booked';

  Slot copyWith({String? status}) {
    return Slot(
      id: id,
      businessName: businessName,
      category: category,
      startTime: startTime,
      endTime: endTime,
      price: price,
      discountPct: discountPct,
      address: address,
      distanceKm: distanceKm,
      status: status ?? this.status,
    );
  }

  static Slot fromFirestore(DocumentSnapshot<Map<String, dynamic>> doc) {
    final data = doc.data() ?? <String, dynamic>{};
    final start = data['startTime'] ?? data['startAt'];
    final end = data['endTime'] ?? data['endAt'];
    return Slot(
      id: doc.id,
      businessName: data['businessName'] as String? ?? 'Unknown',
      category: data['category'] as String? ?? 'General',
      startTime: _parseTimestamp(start),
      endTime: _parseTimestamp(end),
      price: _normalizePrice(data['price']),
      discountPct: _parseDiscount(data),
      address: data['address'] as String? ?? '',
      distanceKm: (data['distanceKm'] as num?)?.toDouble() ?? 0,
      status: data['status'] as String? ?? 'open',
    );
  }

  Map<String, dynamic> toFirestore() {
    return {
      'businessName': businessName,
      'category': category,
      'startTime': Timestamp.fromDate(startTime),
      'startAt': Timestamp.fromDate(startTime),
      'endTime': Timestamp.fromDate(endTime),
      'endAt': Timestamp.fromDate(endTime),
      'price': _priceToMinor(price),
      'discountPct': discountPct,
      'discountPercent': discountPct,
      'address': address,
      'distanceKm': distanceKm,
      'status': status,
    };
  }

  static DateTime _parseTimestamp(dynamic value) {
    if (value is Timestamp) {
      return value.toDate();
    }
    if (value is DateTime) {
      return value;
    }
    if (value is String) {
      final parsed = DateTime.tryParse(value);
      if (parsed != null) {
        return parsed;
      }
    }
    return DateTime.now();
  }

  static double _normalizePrice(dynamic value) {
    if (value is int) {
      if (value >= 1000) {
        return value / 100;
      }
      return value.toDouble();
    }
    if (value is double) {
      if (value >= 1000 && value == value.roundToDouble()) {
        return value / 100;
      }
      return value;
    }
    if (value is num) {
      return value.toDouble();
    }
    return 0;
  }

  static int _parseDiscount(Map<String, dynamic> data) {
    return (data['discountPercent'] as num?)?.toInt() ??
        (data['discountPct'] as num?)?.toInt() ??
        0;
  }

  static int _priceToMinor(double value) => (value * 100).round();

  @override
  List<Object?> get props => [
    id,
    businessName,
    category,
    startTime,
    endTime,
    price,
    discountPct,
    address,
    distanceKm,
    status,
  ];
}

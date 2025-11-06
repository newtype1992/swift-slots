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
    final start = data['startTime'];
    final end = data['endTime'];
    return Slot(
      id: doc.id,
      businessName: data['businessName'] as String? ?? 'Unknown',
      category: data['category'] as String? ?? 'General',
      startTime: _parseTimestamp(start),
      endTime: _parseTimestamp(end),
      price: (data['price'] as num?)?.toDouble() ?? 0,
      discountPct: (data['discountPct'] as num?)?.toInt() ?? 0,
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
      'endTime': Timestamp.fromDate(endTime),
      'price': price,
      'discountPct': discountPct,
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
    return DateTime.now();
  }

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

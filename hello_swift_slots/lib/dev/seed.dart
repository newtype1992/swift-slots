import 'dart:math';

import 'package:cloud_firestore/cloud_firestore.dart';

Future<void> seedSlots(FirebaseFirestore db) async {
  final random = Random(42);
  final now = DateTime.now();
  final categories = ['Wellness', 'Dining', 'Fitness', 'Entertainment'];
  final businesses = [
    'Swift Spa',
    'Urban Bites',
    'Velocity Gym',
    'Glow Salon',
    'Peak Performance',
    'Harvest Table',
    'Luxe Lounge',
    'Chill Studio',
    'Sunrise Yoga',
    'Neighborhood Cafe',
  ];
  final addresses = [
    '123 Market Street',
    '55 Sunset Boulevard',
    '9 Harbor Way',
    '201 Oak Avenue',
    '78 River Road',
    '432 Skyline Drive',
    '18 Maple Lane',
    '650 Bay Street',
    '87 Cedar Circle',
    '310 Liberty Plaza',
  ];

  final batch = db.batch();
  final slotsCollection = db.collection('slots');

  for (var i = 0; i < 10; i++) {
    final offsetHours = random.nextInt(72);
    final start = now.add(Duration(hours: offsetHours));
    final end = start.add(Duration(minutes: 45 + random.nextInt(61)));
    final price = 35 + random.nextInt(40);
    final discount = [0, 5, 10, 15][random.nextInt(4)];
    final distance = 1 + random.nextDouble() * 9;

    final payload = <String, dynamic>{
      'businessName': businesses[i % businesses.length],
      'category': categories[i % categories.length],
      'startTime': Timestamp.fromDate(start),
      'startAt': Timestamp.fromDate(start),
      'endTime': Timestamp.fromDate(end),
      'endAt': Timestamp.fromDate(end),
      'price': price * 100,
      'discountPct': discount,
      'discountPercent': discount,
      'address': '${addresses[i % addresses.length]}, Swift City',
      'distanceKm': double.parse(distance.toStringAsFixed(1)),
      'status': 'open',
      'createdAt': FieldValue.serverTimestamp(),
    };

    batch.set(slotsCollection.doc(), payload);
  }

  await batch.commit();
}

import 'dart:math';

import 'slot_model.dart';

class MockSlotsRepository {
  Stream<List<Slot>> watchOpenSlots() {
    final now = DateTime.now();
    final random = Random(42);
    final baseSlots = List<Slot>.generate(10, (index) {
      final start = now.add(Duration(hours: 4 + index * 3));
      final end = start.add(const Duration(hours: 1));
      final discount = (index % 3) * 5;
      final basePrice = 35 + index * 5;
      final price = basePrice - (basePrice * (discount / 100));
      return Slot(
        id: 'mock-slot-$index',
        businessName: 'Swift Service #${index + 1}',
        category: index.isEven ? 'Wellness' : 'Dining',
        startTime: start,
        endTime: end,
        price: double.parse(price.toStringAsFixed(2)),
        discountPct: discount,
        address: '${100 + index} Market Street',
        distanceKm: double.parse(
          (1 + random.nextDouble() * 4).toStringAsFixed(1),
        ),
        status: 'open',
      );
    });
    return Stream.value(baseSlots);
  }
}

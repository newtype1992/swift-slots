import 'package:cloud_functions/cloud_functions.dart';
import 'package:firebase_auth/firebase_auth.dart';

import '../feed/slot_model.dart';

class BookingRepository {
  BookingRepository(this._functions);

  final FirebaseFunctions _functions;

  Future<BookSlotResult> confirmBooking({
    required Slot slot,
    required User user,
  }) async {
    assert(user.uid.isNotEmpty, 'User must be signed in.');
    // The callable enforces auth server-side, but we keep the signature for clarity.
    final callable = _functions.httpsCallable('bookSlot');
    final response =
        await callable.call<Map<String, dynamic>>({'slotId': slot.id});
    final data = response.data;

    final bookingId = data['bookingId'] as String?;
    if (bookingId == null || bookingId.isEmpty) {
      throw Exception('Failed to reserve slot: missing booking id.');
    }

    final amountMinor = (data['amount'] as num?)?.toInt() ?? 0;
    final currency = (data['currency'] as String? ?? 'usd').toLowerCase();
    final holdExpiresAtText = data['holdExpiresAt'] as String?;
    final holdExpiresAt =
        holdExpiresAtText != null ? DateTime.tryParse(holdExpiresAtText) : null;

    return BookSlotResult(
      bookingId: bookingId,
      amountMinor: amountMinor,
      currency: currency,
      holdExpiresAt: holdExpiresAt,
    );
  }
}

class BookSlotResult {
  const BookSlotResult({
    required this.bookingId,
    required this.amountMinor,
    required this.currency,
    required this.holdExpiresAt,
  });

  final String bookingId;
  final int amountMinor;
  final String currency;
  final DateTime? holdExpiresAt;

  double get amountMajor => amountMinor / 100;
}

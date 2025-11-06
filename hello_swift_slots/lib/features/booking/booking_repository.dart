import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

import '../feed/slot_model.dart';

class BookingRepository {
  BookingRepository(this._firestore);

  final FirebaseFirestore _firestore;

  Future<void> confirmBooking({required Slot slot, required User user}) async {
    final bookingRef = _firestore.collection('bookings').doc();
    final slotRef = _firestore.collection('slots').doc(slot.id);

    final batch = _firestore.batch();
    batch.set(bookingRef, {
      'slotId': slot.id,
      'userId': user.uid,
      'status': 'pending',
      'createdAt': FieldValue.serverTimestamp(),
    });
    batch.update(slotRef, {'status': 'booked'});

    await batch.commit();
  }
}

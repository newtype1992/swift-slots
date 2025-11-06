import 'package:cloud_firestore/cloud_firestore.dart';

import 'slot_model.dart';

class FirestoreSlotsRepository {
  FirestoreSlotsRepository(this._firestore);

  final FirebaseFirestore _firestore;

  Stream<List<Slot>> watchOpenSlots() {
    return _firestore
        .collection('slots')
        .where('status', isEqualTo: 'open')
        .orderBy('startTime')
        .limit(50)
        .snapshots()
        .map((snapshot) {
          return snapshot.docs
              .map((doc) => Slot.fromFirestore(doc))
              .toList(growable: false);
        });
  }

  Future<Slot?> fetchSlot(String id) async {
    final doc = await _firestore.collection('slots').doc(id).get();
    if (!doc.exists) {
      return null;
    }
    return Slot.fromFirestore(doc);
  }
}

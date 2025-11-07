import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:cloud_functions/cloud_functions.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:hooks_riverpod/hooks_riverpod.dart';

import '../features/booking/booking_repository.dart';
import '../features/feed/firestore_slots_repository.dart';
import '../features/feed/mock_slots_repository.dart';
import '../features/feed/slot_model.dart';

final firebaseFirestoreProvider = Provider<FirebaseFirestore>(
  (ref) => FirebaseFirestore.instance,
);

final useMockSlotsProvider = StateProvider<bool>((ref) {
  final envValue = dotenv.env['USE_FIRESTORE'];
  final useFirestore = envValue != null && envValue.toLowerCase() == 'true';
  return !useFirestore;
});

final mockSlotsRepositoryProvider = Provider<MockSlotsRepository>(
  (ref) => MockSlotsRepository(),
);

final firestoreSlotsRepositoryProvider = Provider<FirestoreSlotsRepository>((
  ref,
) {
  final firestore = ref.watch(firebaseFirestoreProvider);
  return FirestoreSlotsRepository(firestore);
});

final slotsStreamProvider = StreamProvider<List<Slot>>((ref) {
  final useMock = ref.watch(useMockSlotsProvider);
  if (useMock) {
    final repository = ref.watch(mockSlotsRepositoryProvider);
    return repository.watchOpenSlots();
  }
  final repository = ref.watch(firestoreSlotsRepositoryProvider);
  return repository.watchOpenSlots();
});

final slotByIdProvider = Provider.family<Slot?, String>((ref, slotId) {
  final slotsAsync = ref.watch(slotsStreamProvider);
  return slotsAsync.maybeWhen(
    data: (slots) => _findSlotById(slots, slotId),
    orElse: () => null,
  );
});

final firebaseFunctionsProvider = Provider<FirebaseFunctions>(
  (ref) => FirebaseFunctions.instance,
);

final bookingRepositoryProvider = Provider<BookingRepository>((ref) {
  final functions = ref.watch(firebaseFunctionsProvider);
  return BookingRepository(functions);
});

Slot? _findSlotById(List<Slot> slots, String id) {
  for (final slot in slots) {
    if (slot.id == id) {
      return slot;
    }
  }
  return null;
}

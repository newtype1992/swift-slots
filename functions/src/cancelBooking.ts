import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

const payloadSchema = z.object({
  bookingId: z.string().min(1),
});

/**
 * Allow a signed-in user to cancel their held/confirmed booking.
 */
export const cancelBooking = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in is required to cancel a booking.');
  }

  const { bookingId } = payloadSchema.parse(request.data ?? {});
  const userId = request.auth.uid;

  const bookingRef = db.collection('bookings').doc(bookingId);
  const bookingSnap = await bookingRef.get();

  if (!bookingSnap.exists) {
    throw new HttpsError('not-found', 'Booking not found.');
  }

  const booking = bookingSnap.data() as admin.firestore.DocumentData & {
    slotId?: string;
    userId?: string;
    status?: string;
  };

  if (!booking.slotId) {
    throw new HttpsError('failed-precondition', 'Booking is missing a slot reference.');
  }

  if (booking.userId !== userId) {
    throw new HttpsError('permission-denied', 'You cannot cancel this booking.');
  }

  if (booking.status !== 'held' && booking.status !== 'confirmed') {
    throw new HttpsError('failed-precondition', 'Only held or confirmed bookings can be cancelled.');
  }

  const slotRef = db.collection('slots').doc(booking.slotId);
  const slotSnap = await slotRef.get();

  if (!slotSnap.exists) {
    throw new HttpsError('not-found', 'Slot not found.');
  }

  const slot = slotSnap.data() as admin.firestore.DocumentData & {
    status?: string;
    heldBy?: string;
  };

  if (slot.status !== 'held' || slot.heldBy !== userId) {
    throw new HttpsError('failed-precondition', 'Slot is no longer held by this user.');
  }

  await db.runTransaction(async (transaction) => {
    const freshBookingSnap = await transaction.get(bookingRef);
    if (!freshBookingSnap.exists) {
      throw new HttpsError('not-found', 'Booking no longer exists.');
    }

    const freshBooking = freshBookingSnap.data();
    if (freshBooking?.userId !== userId) {
      throw new HttpsError('permission-denied', 'You cannot cancel this booking.');
    }

    if (freshBooking?.status !== 'held' && freshBooking?.status !== 'confirmed') {
      throw new HttpsError('failed-precondition', 'Booking is no longer cancellable.');
    }

    const freshSlotSnap = await transaction.get(slotRef);
    if (!freshSlotSnap.exists) {
      throw new HttpsError('not-found', 'Slot no longer exists.');
    }

    const freshSlot = freshSlotSnap.data();
    if (freshSlot?.status !== 'held' || freshSlot?.heldBy !== userId) {
      throw new HttpsError('failed-precondition', 'Slot is no longer held by this user.');
    }

    transaction.update(bookingRef, {
      status: 'cancelled',
      cancelledAt: FieldValue.serverTimestamp(),
    });

    transaction.update(slotRef, {
      status: 'open',
      heldBy: FieldValue.delete(),
      holdExpiresAt: FieldValue.delete(),
    });
  });

  return {
    bookingId,
    slotId: booking.slotId,
    status: 'cancelled' as const,
  };
});

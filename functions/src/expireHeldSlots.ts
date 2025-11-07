import * as admin from 'firebase-admin';
import { onSchedule } from 'firebase-functions/v2/scheduler';

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;

/**
 * Release slots whose holds have expired and expire any pending bookings.
 */
export const expireHeldSlots = onSchedule('*/5 * * * *', async () => {
  const now = admin.firestore.Timestamp.now();
  const expiredSlotsSnap = await db
    .collection('slots')
    .where('status', '==', 'held')
    .where('holdExpiresAt', '<=', now)
    .get();

  if (expiredSlotsSnap.empty) {
    console.log('expireHeldSlots: no held slots expired at', now.toDate().toISOString());
    const emptyResult = { expiredCount: 0 };
    return emptyResult as unknown as void;
  }

  let expiredCount = 0;

  for (const slotDoc of expiredSlotsSnap.docs) {
    const slotRef = slotDoc.ref;
    const bookingQuery = db
      .collection('bookings')
      .where('slotId', '==', slotDoc.id)
      .where('status', '==', 'held');

    await db.runTransaction(async (transaction) => {
      const latestSlotSnap = await transaction.get(slotRef);
      if (!latestSlotSnap.exists) {
        return;
      }

      const latestSlot = latestSlotSnap.data();
      if (latestSlot?.status !== 'held') {
        return;
      }

      const bookingSnap = await transaction.get(bookingQuery);
      bookingSnap.docs.forEach((bookingDoc) => {
        transaction.update(bookingDoc.ref, {
          status: 'expired',
          expiredAt: FieldValue.serverTimestamp(),
        });
      });

      transaction.update(slotRef, {
        status: 'open',
        heldBy: FieldValue.delete(),
        holdExpiresAt: FieldValue.delete(),
      });

      expiredCount += 1;
    });
  }

  const result = { expiredCount };
  console.log(
    `expireHeldSlots: processed ${expiredCount} slot(s) at ${now.toDate().toISOString()}`,
  );

  // Cast to satisfy the schedule handler typing while still returning telemetry data.
  return result as unknown as void;
});

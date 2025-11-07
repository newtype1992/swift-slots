import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { z } from 'zod';

import { SlotDoc } from './types';

const db = admin.firestore();

const payloadSchema = z.object({
  slotId: z.string().min(1),
});

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const toTimestamp = (
  value: SlotDoc['startAt'] | undefined,
): admin.firestore.Timestamp | null => {
  if (!value) {
    return null;
  }

  if (value instanceof admin.firestore.Timestamp) {
    return value;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((value as any)?.toDate instanceof Function) {
    // Handles FirebaseFirestore.Timestamp
    return admin.firestore.Timestamp.fromDate(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (value as any).toDate(),
    );
  }

  if (value instanceof Date) {
    return admin.firestore.Timestamp.fromDate(value);
  }

  if (typeof value === 'string') {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.valueOf())) {
      return admin.firestore.Timestamp.fromDate(parsed);
    }
  }

  return null;
};

const normalizePriceToMinorUnits = (price?: number): number => {
  if (!price || !Number.isFinite(price)) {
    return 0;
  }

  // If the value contains decimals assume it is major units and convert to cents.
  if (!Number.isInteger(price)) {
    return Math.round(price * 100);
  }

  return Math.round(price);
};

export const bookSlot = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Sign in is required.');
  }

  const { slotId } = payloadSchema.parse(request.data ?? {});
  const userId = request.auth.uid;
  const now = admin.firestore.Timestamp.now();
  const holdMinutes = Number(process.env.HOLD_MINUTES ?? '10');
  const holdDurationMs = Math.max(1, holdMinutes) * 60 * 1000;
  const holdExpiresAt = admin.firestore.Timestamp.fromMillis(
    now.toMillis() + holdDurationMs,
  );
  const currency = (process.env.CURRENCY ?? 'usd').toLowerCase();

  const result = await db.runTransaction(async (transaction) => {
    const slotRef = db.collection('slots').doc(slotId);
    const slotSnap = await transaction.get(slotRef);

    if (!slotSnap.exists) {
      throw new HttpsError('not-found', 'Slot not found.');
    }

    const slot = slotSnap.data() as SlotDoc & { startTime?: SlotDoc['startAt']; discountPct?: number };

    if (slot.status !== 'open') {
      throw new HttpsError('failed-precondition', 'Slot is no longer available.');
    }

    const slotStart = toTimestamp(slot.startAt ?? slot.startTime);
    if (!slotStart) {
      throw new HttpsError('failed-precondition', 'Slot start time is invalid.');
    }

    if (slotStart.toMillis() <= now.toMillis()) {
      throw new HttpsError('failed-precondition', 'Slot has already started or expired.');
    }

    const discount = clamp(slot.discountPercent ?? slot.discountPct ?? 0, 0, 95);
    const basePrice = normalizePriceToMinorUnits(slot.price);
    const amount = Math.max(0, Math.round(basePrice * (1 - discount / 100)));

    const bookingRef = db.collection('bookings').doc();
    transaction.set(bookingRef, {
      slotId,
      userId,
      status: 'held',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      amount,
      currency,
    });

    transaction.update(slotRef, {
      status: 'held',
      heldBy: userId,
      holdExpiresAt,
    });

    return { bookingId: bookingRef.id, amount };
  });

  return {
    bookingId: result.bookingId,
    amount: result.amount,
    currency,
    holdExpiresAt: holdExpiresAt.toDate().toISOString(),
  };
});

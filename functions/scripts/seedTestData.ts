/* eslint-disable @typescript-eslint/no-var-requires */
const admin = require('firebase-admin');

if (admin.apps.length === 0) {
  admin.initializeApp();
}

const db = admin.firestore();
const FieldValue = admin.firestore.FieldValue;
const Timestamp = admin.firestore.Timestamp;

/**
 * Seed Firestore with a pilot business, approved user, and sample slots/bookings.
 */
async function seed() {
  const businessRef = db.collection('businesses').doc();
  await businessRef.set({
    name: 'Swift Slots Pilot Business',
    contactEmail: 'owner@example.com',
    contactPhone: '+1-555-0100',
    createdAt: FieldValue.serverTimestamp(),
  });

  const userRef = db.collection('users').doc();
  await userRef.set({
    fullName: 'Pilot User',
    email: 'pilot@example.com',
    approved: true,
    createdAt: FieldValue.serverTimestamp(),
  });

  const now = Timestamp.now();
  const oneHour = 60 * 60 * 1000;
  const openSlotStart = Timestamp.fromMillis(now.toMillis() + oneHour);
  const heldSlotStart = Timestamp.fromMillis(now.toMillis() + oneHour * 2);

  const openSlotRef = db.collection('slots').doc();
  await openSlotRef.set({
    businessId: businessRef.id,
    serviceName: 'Discovery Call',
    startAt: openSlotStart,
    endAt: Timestamp.fromMillis(openSlotStart.toMillis() + oneHour),
    price: 15000,
    status: 'open',
    createdAt: FieldValue.serverTimestamp(),
  });

  const heldSlotRef = db.collection('slots').doc();
  await heldSlotRef.set({
    businessId: businessRef.id,
    serviceName: 'Strategy Session',
    startAt: heldSlotStart,
    endAt: Timestamp.fromMillis(heldSlotStart.toMillis() + oneHour),
    price: 20000,
    status: 'held',
    heldBy: userRef.id,
    holdExpiresAt: Timestamp.fromMillis(now.toMillis() - 5 * 60 * 1000),
    createdAt: FieldValue.serverTimestamp(),
  });

  const bookingRef = db.collection('bookings').doc();
  await bookingRef.set({
    slotId: heldSlotRef.id,
    userId: userRef.id,
    status: 'held',
    amount: 20000,
    currency: 'usd',
    createdAt: FieldValue.serverTimestamp(),
  });

  console.log('Seeded business ID:', businessRef.id);
  console.log('Seeded user ID:', userRef.id);
  console.log('Open slot ID:', openSlotRef.id);
  console.log('Held slot ID:', heldSlotRef.id);
  console.log('Booking ID:', bookingRef.id);
}

seed()
  .then(() => {
    console.log('Seed data successfully written.');
    process.exit(0);
  })
  .catch((error: Error) => {
    console.error('Failed to seed Firestore data:', error);
    process.exit(1);
  });

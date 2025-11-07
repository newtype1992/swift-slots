import * as admin from 'firebase-admin';

admin.initializeApp();

export { bookSlot } from './bookSlot';
export { expireHeldSlots } from './expireHeldSlots';
export { cancelBooking } from './cancelBooking';

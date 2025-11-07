import { FieldValue, Timestamp } from 'firebase-admin/firestore';

type SlotStatus = 'open' | 'held' | 'booked' | 'expired';
type BookingStatus = 'held' | 'confirmed' | 'cancelled' | 'expired';

export interface SlotDoc {
  businessId?: string;
  serviceName?: string;
  startAt: Timestamp | FirebaseFirestore.Timestamp | Date | string;
  endAt: Timestamp | FirebaseFirestore.Timestamp | Date | string;
  price: number;
  discountPercent?: number;
  status: SlotStatus;
  heldBy?: string;
  holdExpiresAt?: Timestamp | FirebaseFirestore.Timestamp;
}

export interface BookingDoc {
  slotId: string;
  userId: string;
  status: BookingStatus;
  createdAt: FieldValue;
  amount: number;
}

// Event Types - STANNEL Platform

export interface Event {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  date: Date;
  location: string;
  capacity: number;
  pointsCost: number;
  isHidden: boolean;
  registeredCount: number;
  waitlistEnabled: boolean;
  createdAt: Date;
}

export interface EventRegistration {
  id: string;
  eventId: string;
  userId: string;
  status: 'CONFIRMED' | 'WAITLIST' | 'CANCELLED';
  createdAt: Date;
}

export interface EventWithRegistration extends Event {
  isRegistered: boolean;
  registrationStatus?: 'CONFIRMED' | 'WAITLIST' | 'CANCELLED';
  spotsLeft: number;
}

export interface RegisterEventRequest {
  eventId: string;
}

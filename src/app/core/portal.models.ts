export interface PortalMember {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  place?: string;
  joinDate?: string;
  expiryDate?: string;
  sports?: string[] | string;
  status?: string;
  membershipType?: string;
  gender?: string;
  dateOfBirth?: string;
}

export interface PortalAttendance {
  id?: string;
  memberId?: string;
  date?: string;
  checkInTime?: string;
  checkOutTime?: string;
  duration?: string | number;
  membershipStatus?: string;
  daysToExpiry?: string | number;
}

export interface PortalPayment {
  id?: string;
  memberId?: string;
  date?: string;
  amount?: string | number;
  paymentType?: string;
  periodStart?: string;
  periodEnd?: string;
  status?: string;
  category?: string;
  quantity?: string | number;
}

export interface PortalSnapshot {
  member: PortalMember;
  attendance: PortalAttendance[];
  payments: PortalPayment[];
}

export interface PortalResult {
  snapshot: PortalSnapshot;
  syncedAt: string;
}

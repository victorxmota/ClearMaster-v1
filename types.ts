
export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  pps: string;
  phone: string;
  password?: string;
}

export interface ScheduleItem {
  id: string;
  userId: string;
  locationName: string;
  address: string;
  dayOfWeek: number;
  hoursPerDay: number;
}

export interface OfficeScheduleConfig {
  dayOfWeek: number;
  hours: number;
  isActive: boolean;
}

export interface Office {
  id: string;
  name: string;
  eircode: string;
  address: string;
  defaultSchedule: OfficeScheduleConfig[];
}

export interface GeoLocation {
  lat: number;
  lng: number;
}

export interface SafetyChecklist {
  // PPE
  highVis: boolean;
  helmet: boolean;
  goggles: boolean;
  gloves: boolean;
  mask: boolean;
  earMuffs: boolean;
  faceGuard: boolean;
  harness: boolean;
  boots: boolean;

  // Safety Plan
  knowSafeJob: boolean;
  weatherCheck: boolean;
  safePassInDate: boolean;
  slipTripAware: boolean;
  wetFloorsCleaned: boolean;

  // Lifting
  manualHandlingCert: boolean;
  heavyLiftingAssistance: boolean;

  // Working at Heights
  anchorPointsTie: boolean;
  ladderFooted: boolean;
  safetySigns: boolean;
  commWithOthers: boolean;

  // Equipment
  ladderCheck: boolean;
  sharpEdgesCheck: boolean;
  scraperBladeCovers: boolean;
  hotSurfacesCheck: boolean;
  chemicalCourseComplete: boolean;
  chemicalDilutionAware: boolean;
  equipmentTidy: boolean;
  laddersPutAway: boolean;
}

export interface TimeRecord {
  id: string;
  userId: string;
  scheduleId?: string;
  locationName: string;
  startTime: string;
  endTime?: string;
  date: string;
  safetyChecklist: SafetyChecklist;
  photoUrl?: string;
  endPhotoUrl?: string;
  startLocation?: GeoLocation;
  endLocation?: GeoLocation;
  notes?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

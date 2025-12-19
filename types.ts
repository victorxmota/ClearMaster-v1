
export enum UserRole {
  ADMIN = 'ADMIN',
  EMPLOYEE = 'EMPLOYEE',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  pps: string; // Personal Public Service Number
  phone: string;
  password?: string; // In a real app, never store plain text
}

export interface ScheduleItem {
  id: string;
  userId: string;
  locationName: string;
  address: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, etc.
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
  defaultSchedule: OfficeScheduleConfig[]; // Stores the days and hours configuration
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
  scheduleId?: string; // Optional linkage to a planned schedule
  locationName: string;
  startTime: string; // ISO String
  endTime?: string; // ISO String
  date: string; // YYYY-MM-DD
  safetyChecklist: SafetyChecklist;
  photoUrl?: string; // Start Base64 or URL
  endPhotoUrl?: string; // End Base64 or URL
  startLocation?: GeoLocation; // Latitude/Longitude at start
  endLocation?: GeoLocation;   // Latitude/Longitude at end
  notes?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

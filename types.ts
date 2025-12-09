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

export interface TimeRecord {
  id: string;
  userId: string;
  scheduleId?: string; // Optional linkage to a planned schedule
  locationName: string;
  startTime: string; // ISO String
  endTime?: string; // ISO String
  date: string; // YYYY-MM-DD
  safetyChecklist: {
    gloves: boolean;
    boots: boolean;
    vest: boolean;
    chemicalsSafe: boolean;
  };
  photoUrl?: string; // Start Base64 or URL
  endPhotoUrl?: string; // End Base64 or URL
  notes?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
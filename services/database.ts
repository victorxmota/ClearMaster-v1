
// Using compat layer to resolve "no exported member" errors
import firebase from "firebase/compat/app";
import { db, storage } from "./firebase";
import { User, UserRole, ScheduleItem, TimeRecord, Office, AppNotification } from "../types";

const USERS_COL = 'users';
const SCHEDULES_COL = 'schedules';
const OFFICES_COL = 'offices';
const RECORDS_COL = 'records';
const NOTIFICATIONS_COL = 'notifications';

const ADMIN_EMAIL = 'adminreports@downeycleaning.ie';

const notifyNotificationChange = () => {
  window.dispatchEvent(new CustomEvent('downey:notifications-updated'));
};

const sanitizeData = (data: any) => {
  const clean: any = {};
  Object.keys(data).forEach(key => {
    if (data[key] === undefined) {
      // Skip
    } else if (data[key] === null) {
      if (key === 'readBy') clean[key] = [];
      else if (key === 'recipientId') clean[key] = 'all';
      else clean[key] = null;
    } else if (typeof data[key] === 'object' && data[key] !== null && !Array.isArray(data[key])) {
      clean[key] = sanitizeData(data[key]);
    } else {
      clean[key] = data[key];
    }
  });
  return clean;
};

export const Database = {
  // Sync user data using compat doc and get methods
  syncUser: async (firebaseUser: any, extraData?: Partial<User>): Promise<User> => {
    const userRef = db.collection(USERS_COL).doc(firebaseUser.uid);
    const userSnap = await userRef.get();
    const isSystemAdmin = firebaseUser.email === ADMIN_EMAIL;

    if (userSnap.exists) {
      const existingData = userSnap.data() as User;
      if (isSystemAdmin && existingData.role !== UserRole.ADMIN) {
        await userRef.update({ role: UserRole.ADMIN });
        return { ...existingData, role: UserRole.ADMIN, id: firebaseUser.uid };
      }
      return { ...existingData, id: firebaseUser.uid };
    } else {
      const newUser: User = {
        id: firebaseUser.uid,
        name: extraData?.name || firebaseUser.displayName || (isSystemAdmin ? 'System Admin' : 'New User'),
        email: firebaseUser.email || '',
        role: isSystemAdmin ? UserRole.ADMIN : (extraData?.role || UserRole.EMPLOYEE),
        pps: extraData?.pps || '',
        phone: extraData?.phone || '',
      };
      await userRef.set(sanitizeData(newUser));
      return newUser;
    }
  },

  updateUser: async (userId: string, updates: Partial<User>): Promise<void> => {
    await db.collection(USERS_COL).doc(userId).update(sanitizeData(updates));
  },

  deleteUser: async (userId: string): Promise<void> => {
    try {
      const batch = db.batch();
      
      // 1. Delete user document
      const userRef = db.collection(USERS_COL).doc(userId);
      batch.delete(userRef);

      // 2. Delete associated schedules using compat where and get
      const schedulesSnap = await db.collection(SCHEDULES_COL).where("userId", "==", userId).get();
      schedulesSnap.forEach((d) => batch.delete(d.ref));

      // 3. Delete associated records
      const recordsSnap = await db.collection(RECORDS_COL).where("userId", "==", userId).get();
      recordsSnap.forEach((d) => batch.delete(d.ref));

      // Commit all deletions
      await batch.commit();
      console.log(`User ${userId} and related data deleted successfully.`);
    } catch (error) {
      console.error("Error in Database.deleteUser:", error);
      throw error;
    }
  },

  getUserByAccountId: async (accountId: string): Promise<User | null> => {
    const userSnap = await db.collection(USERS_COL).doc(accountId).get();
    if (userSnap.exists) {
      return { ...userSnap.data(), id: userSnap.id } as User;
    }
    return null;
  },

  getAllUsers: async (): Promise<User[]> => {
    const querySnapshot = await db.collection(USERS_COL).get();
    return querySnapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id
    } as User));
  },

  sendNotification: async (notification: Omit<AppNotification, 'id'>) => {
    try {
      const dataToSave = {
        senderId: notification.senderId,
        senderName: notification.senderName,
        recipientId: notification.recipientId || 'all',
        title: notification.title.trim(),
        message: notification.message.trim(),
        createdAt: notification.createdAt || new Date().toISOString(),
        readBy: []
      };

      const docRef = await db.collection(NOTIFICATIONS_COL).add(dataToSave);
      notifyNotificationChange();
      return docRef;
    } catch (error: any) {
      console.error("Database Error:", error);
      throw error;
    }
  },

  getNotificationsForUser: async (userId: string): Promise<AppNotification[]> => {
    if (!userId) return [];
    try {
      const querySnapshot = await db.collection(NOTIFICATIONS_COL)
        .where("recipientId", "in", [userId, "all"])
        .limit(50)
        .get();
      return querySnapshot.docs
        .map(doc => ({ ...doc.data(), id: doc.id } as AppNotification))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      return [];
    }
  },

  getSentNotifications: async (adminId: string): Promise<AppNotification[]> => {
    try {
      const querySnapshot = await db.collection(NOTIFICATIONS_COL)
        .where("senderId", "==", adminId)
        .limit(50)
        .get();
      return querySnapshot.docs
        .map(doc => ({ ...doc.data(), id: doc.id } as AppNotification))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (error) {
      return [];
    }
  },

  markNotificationAsRead: async (notificationId: string, userId: string) => {
    if (!userId || !notificationId) return;
    try {
      await db.collection(NOTIFICATIONS_COL).doc(notificationId).update({
        readBy: firebase.firestore.FieldValue.arrayUnion(userId)
      });
      notifyNotificationChange();
    } catch (error) {}
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    await db.collection(NOTIFICATIONS_COL).doc(notificationId).delete();
    notifyNotificationChange();
  },

  getOffices: async (): Promise<Office[]> => {
    const querySnapshot = await db.collection(OFFICES_COL).get();
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Office));
  },

  addOffice: async (office: Omit<Office, 'id'>): Promise<void> => {
    await db.collection(OFFICES_COL).add(sanitizeData(office));
  },

  deleteOffice: async (id: string): Promise<void> => {
    await db.collection(OFFICES_COL).doc(id).delete();
  },

  getSchedulesByUser: async (userId: string): Promise<ScheduleItem[]> => {
    const querySnapshot = await db.collection(SCHEDULES_COL).where("userId", "==", userId).get();
    return querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ScheduleItem));
  },

  addSchedule: async (schedule: Omit<ScheduleItem, 'id'>): Promise<void> => {
    await db.collection(SCHEDULES_COL).add(sanitizeData(schedule));
  },

  updateSchedule: async (id: string, updates: Partial<ScheduleItem>): Promise<void> => {
    await db.collection(SCHEDULES_COL).doc(id).update(sanitizeData(updates));
  },

  deleteSchedule: async (id: string): Promise<void> => {
    await db.collection(SCHEDULES_COL).doc(id).delete();
  },

  getActiveSession: async (userId: string): Promise<TimeRecord | null> => {
    const querySnapshot = await db.collection(RECORDS_COL)
      .where("userId", "==", userId)
      .where("endTime", "==", null)
      .get();
    if (!querySnapshot.empty) {
      return { ...querySnapshot.docs[0].data(), id: querySnapshot.docs[0].id } as TimeRecord;
    }
    return null;
  },

  startShift: async (record: Omit<TimeRecord, 'id' | 'photoUrl'>, photo?: File): Promise<TimeRecord> => {
    let photoUrl = "";
    if (photo) {
      const storageRef = storage.ref(`shifts/${Date.now()}_${photo.name}`);
      await storageRef.put(photo);
      photoUrl = await storageRef.getDownloadURL();
    }
    const data = { ...record, photoUrl, endTime: null, totalPausedMs: 0, isPaused: false };
    const docRef = await db.collection(RECORDS_COL).add(sanitizeData(data));
    return { ...data, id: docRef.id } as TimeRecord;
  },

  togglePause: async (session: TimeRecord): Promise<TimeRecord> => {
    const now = new Date().toISOString();
    let updates: any = {};
    if (session.isPaused) {
      const pausedAt = new Date(session.pausedAt!).getTime();
      const currentPauseDuration = Date.now() - pausedAt;
      updates = {
        isPaused: false,
        pausedAt: null,
        totalPausedMs: (session.totalPausedMs || 0) + currentPauseDuration
      };
    } else {
      updates = { isPaused: true, pausedAt: now };
    }
    await db.collection(RECORDS_COL).doc(session.id).update(updates);
    return { ...session, ...updates };
  },

  endShift: async (id: string, updates: Partial<TimeRecord>, photo?: File): Promise<void> => {
    let endPhotoUrl = "";
    if (photo) {
      const storageRef = storage.ref(`shifts/end_${Date.now()}_${photo.name}`);
      await storageRef.put(photo);
      endPhotoUrl = await storageRef.getDownloadURL();
    }
    const finalUpdates = { ...updates, endPhotoUrl, isPaused: false };
    await db.collection(RECORDS_COL).doc(id).update(sanitizeData(finalUpdates));
  },

  getAllRecords: async (): Promise<TimeRecord[]> => {
    const querySnapshot = await db.collection(RECORDS_COL).get();
    // Client-side sorting to avoid index requirement
    return querySnapshot.docs
      .map(doc => ({ ...doc.data(), id: doc.id } as TimeRecord))
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  },

  getRecordsByUser: async (userId: string): Promise<TimeRecord[]> => {
    const querySnapshot = await db.collection(RECORDS_COL).where("userId", "==", userId).get();
    // Client-side sorting to avoid index requirement
    return querySnapshot.docs
      .map(doc => ({ ...doc.data(), id: doc.id } as TimeRecord))
      .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());
  },

  updateRecord: async (id: string, updates: Partial<TimeRecord>): Promise<void> => {
    await db.collection(RECORDS_COL).doc(id).update(sanitizeData(updates));
  },

  deleteRecord: async (id: string): Promise<void> => {
    await db.collection(RECORDS_COL).doc(id).delete();
  },

  addRecord: async (record: Omit<TimeRecord, 'id'>): Promise<void> => {
    await db.collection(RECORDS_COL).add(sanitizeData(record));
  }
};

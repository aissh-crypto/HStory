import { doc, getDoc, setDoc, deleteDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { UserProfile, CaseFile } from '../types';

// Helper to strip undefined values so Firestore never rejects payloads
const cleanForFirestore = <T>(obj: T): T => {
  return JSON.parse(
    JSON.stringify(obj, (_, value) => (value === undefined ? null : value))
  );
};

export const firestoreSync = {
  // Save or update User Profile in Firestore
  async saveUserProfile(userId: string, profile: UserProfile): Promise<void> {
    const path = `users/${userId}`;
    try {
      const payload = cleanForFirestore({
        id: userId,
        email: profile.email || '',
        name: profile.name || profile.displayName || 'Property Buyer',
        displayName: profile.displayName || profile.name || 'Property Buyer',
        residencyStatus: profile.residencyStatus || 'Citizen',
        buyerRole: profile.buyerRole || 'First-time Homebuyer',
        countryPreference: profile.countryPreference || 'Malaysia',
        monthlyGrossIncome: profile.monthlyGrossIncome || 0,
        existingMonthlyDebts: profile.existingMonthlyDebts || 0,
        defaultCurrency: profile.defaultCurrency || 'MYR',
        currencyPreference: profile.currencyPreference || 'AUTO',
        updatedAt: new Date().toISOString(),
      });

      await setDoc(doc(db, 'users', userId), payload, { merge: true });

      // Also mirror to registeredAccounts by email if available for cross-browser / incognito sync
      if (profile.email) {
        const cleanEmail = profile.email.trim().toLowerCase();
        await setDoc(
          doc(db, 'registeredAccounts', cleanEmail),
          {
            uid: userId,
            email: cleanEmail,
            displayName: profile.displayName || profile.name || '',
            profile: payload,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        ).catch(() => {});
      }
    } catch (error) {
      console.error('Error saving user profile to Firestore:', error);
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Delete User Profile & Subcollections (Account Reset)
  async deleteUserProfile(userId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'users', userId));
      const savedSnap = await getDocs(collection(db, 'users', userId, 'saved'));
      for (const d of savedSnap.docs) {
        await deleteDoc(d.ref).catch(() => {});
      }
      const casesSnap = await getDocs(collection(db, 'users', userId, 'caseFiles'));
      for (const d of casesSnap.docs) {
        await deleteDoc(d.ref).catch(() => {});
        await deleteDoc(doc(db, 'caseFiles', d.id)).catch(() => {});
      }
    } catch (e) {
      console.warn('Error purging user profile in Firestore:', e);
    }
  },

  // Load User Profile from Firestore
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    const path = `users/${userId}`;
    try {
      const snap = await getDoc(doc(db, 'users', userId));
      if (snap.exists()) {
        const data = snap.data();
        return {
          id: userId,
          name: data.displayName || data.name || 'Property Buyer',
          displayName: data.displayName || data.name || 'Property Buyer',
          email: data.email || '',
          residencyStatus: data.residencyStatus || 'Citizen',
          buyerRole: data.buyerRole || 'First-time Homebuyer',
          countryPreference: data.countryPreference || 'Malaysia',
          monthlyGrossIncome: typeof data.monthlyGrossIncome === 'number' ? data.monthlyGrossIncome : 0,
          existingMonthlyDebts: typeof data.existingMonthlyDebts === 'number' ? data.existingMonthlyDebts : 0,
          defaultCurrency: data.defaultCurrency || (data.countryPreference === 'Singapore' ? 'SGD' : 'MYR'),
          currencyPreference: data.currencyPreference || 'AUTO',
        };
      }
      return null;
    } catch (error) {
      console.warn('Firestore getUserProfile notice:', error);
      return null;
    }
  },

  // Check remote registered account by email (for cross-device & incognito login)
  async getRegisteredAccountByEmail(email: string): Promise<{ uid: string; email: string; pass?: string; name: string } | null> {
    try {
      const cleanEmail = email.trim().toLowerCase();
      const snap = await getDoc(doc(db, 'registeredAccounts', cleanEmail));
      if (snap.exists()) {
        const data = snap.data();
        return {
          uid: data.uid,
          email: data.email || cleanEmail,
          pass: data.pass || '',
          name: data.displayName || data.name || cleanEmail.split('@')[0],
        };
      }
    } catch (e) {
      console.warn('getRegisteredAccountByEmail note:', e);
    }
    return null;
  },

  // Save registered account credentials in Firestore for incognito cross-session recovery
  async saveRegisteredAccountToFirestore(account: { uid: string; email: string; pass: string; name: string }): Promise<void> {
    try {
      const cleanEmail = account.email.trim().toLowerCase();
      await setDoc(doc(db, 'registeredAccounts', cleanEmail), cleanForFirestore({
        uid: account.uid,
        email: cleanEmail,
        pass: account.pass,
        displayName: account.name,
        name: account.name,
        createdAt: new Date().toISOString(),
      }), { merge: true });
    } catch (e) {
      console.warn('saveRegisteredAccountToFirestore note:', e);
    }
  },

  // Save bookmarked property ID to user's saved subcollection
  async saveProperty(userId: string, propertyId: string): Promise<void> {
    const path = `users/${userId}/saved/${propertyId}`;
    try {
      await setDoc(doc(db, 'users', userId, 'saved', propertyId), {
        propertyId,
        savedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.warn('Error saving property to Firestore:', error);
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Remove bookmarked property ID
  async removeSavedProperty(userId: string, propertyId: string): Promise<void> {
    const path = `users/${userId}/saved/${propertyId}`;
    try {
      await deleteDoc(doc(db, 'users', userId, 'saved', propertyId));
    } catch (error) {
      console.warn('Error removing property from Firestore:', error);
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  // Get all saved property IDs for user
  async getSavedPropertyIds(userId: string): Promise<string[]> {
    try {
      const snap = await getDocs(collection(db, 'users', userId, 'saved'));
      return snap.docs.map((d) => d.id);
    } catch (error) {
      console.warn('Firestore getSavedPropertyIds notice:', error);
      return [];
    }
  },

  // Save or update Case File including full AI chats, videos, and photos
  async saveCaseFile(userId: string, caseFile: CaseFile): Promise<void> {
    try {
      let statusStr = 'in_progress';
      if (caseFile.status === 'Decision Ready') statusStr = 'done';
      else if (caseFile.status === 'Archived' || caseFile.status === 'Not Started') statusStr = 'not_started';

      const country = caseFile.modules?.countryCompliance?.country || 'Malaysia';

      const payload = cleanForFirestore({
        userId,
        caseId: caseFile.caseId,
        propertyId: caseFile.propertyId,
        country,
        status: statusStr,
        displayStatus: caseFile.status,
        progressPercent: caseFile.progressPercent ?? 0,
        modules: caseFile.modules || {},
        verdict: caseFile.decisionProfile || null,
        decisionProfile: caseFile.decisionProfile || null,
        updatedAt: new Date().toISOString(),
      });

      // 1. Save in user's subcollection
      await setDoc(doc(db, 'users', userId, 'caseFiles', caseFile.caseId), payload, { merge: true });

      // 2. Also save to root collection `caseFiles` so it shows immediately in the Firebase Console
      await setDoc(doc(db, 'caseFiles', caseFile.caseId), payload, { merge: true }).catch(() => {});

      // 3. Save full SightView inspection walkthrough (transcripts, photos, video links) into subcollection
      if (caseFile.modules?.siteVisit) {
        const site = caseFile.modules.siteVisit;
        const chatPayload = cleanForFirestore({
          userId,
          caseId: caseFile.caseId,
          propertyId: caseFile.propertyId,
          transcripts: site.transcripts || [],
          photos: site.photos || [],
          inspectionVideos: site.inspectionVideos || [],
          notes: site.notes || '',
          syncedAt: new Date().toISOString(),
        });

        await setDoc(
          doc(db, 'users', userId, 'caseFiles', caseFile.caseId, 'chats', 'inspection_walkthrough'),
          chatPayload,
          { merge: true }
        ).catch((err) => console.warn('Subcollection chat sync notice:', err));
      }
    } catch (error) {
      console.error('Firestore saveCaseFile error:', error);
    }
  },

  // Load all Case Files for user with full SightView inspection history
  async getCaseFiles(userId: string): Promise<any[]> {
    try {
      // 1. Try user subcollection first
      let snap = await getDocs(collection(db, 'users', userId, 'caseFiles'));
      let docs = snap.docs;

      // 2. Fallback to root `caseFiles` where userId == userId if subcollection was empty
      if (docs.length === 0) {
        try {
          const q = query(collection(db, 'caseFiles'), where('userId', '==', userId));
          const rootSnap = await getDocs(q);
          if (rootSnap.docs.length > 0) {
            docs = rootSnap.docs;
          }
        } catch {}
      }

      const results = [];
      for (const d of docs) {
        const data = d.data();
        const caseObj: any = {
          ...data,
          status: data.displayStatus || (data.status === 'done' ? 'Decision Ready' : data.status === 'not_started' ? 'Not Started' : 'In Progress'),
          progressPercent: typeof data.progressPercent === 'number' ? data.progressPercent : 0,
          decisionProfile: data.decisionProfile || data.verdict || null,
        };

        // If siteVisit transcripts/photos were saved in the subcollection, fetch them
        try {
          const chatDoc = await getDoc(doc(db, 'users', userId, 'caseFiles', d.id, 'chats', 'inspection_walkthrough'));
          if (chatDoc.exists()) {
            const chatData = chatDoc.data();
            caseObj.modules = caseObj.modules || {};
            caseObj.modules.siteVisit = caseObj.modules.siteVisit || {};
            if (chatData.transcripts && (!caseObj.modules.siteVisit.transcripts || caseObj.modules.siteVisit.transcripts.length === 0)) {
              caseObj.modules.siteVisit.transcripts = chatData.transcripts;
            }
            if (chatData.photos && (!caseObj.modules.siteVisit.photos || caseObj.modules.siteVisit.photos.length === 0)) {
              caseObj.modules.siteVisit.photos = chatData.photos;
            }
            if (chatData.inspectionVideos && (!caseObj.modules.siteVisit.inspectionVideos || caseObj.modules.siteVisit.inspectionVideos.length === 0)) {
              caseObj.modules.siteVisit.inspectionVideos = chatData.inspectionVideos;
            }
          }
        } catch {}

        results.push(caseObj);
      }

      return results;
    } catch (error) {
      console.warn('Firestore getCaseFiles warning:', error);
      return [];
    }
  },

  // Delete / Dismiss a Case File
  async removeCaseFile(userId: string, caseId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'users', userId, 'caseFiles', caseId));
      await deleteDoc(doc(db, 'caseFiles', caseId)).catch(() => {});
    } catch (error) {
      console.warn('Error removing case file from Firestore:', error);
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}/caseFiles/${caseId}`);
    }
  },

  // Save Live Camera Inspection Session to Firebase
  async saveLiveInspection(userId: string, inspection: {
    id: string;
    propertyTitle: string;
    timestamp: string;
    messagesCount: number;
    severity?: string;
    summary?: string;
  }): Promise<boolean> {
    const path = `users/${userId}/inspections/${inspection.id}`;
    try {
      await setDoc(doc(db, 'users', userId, 'inspections', inspection.id), cleanForFirestore({
        ...inspection,
        syncedAt: new Date().toISOString(),
      }));
      return true;
    } catch (error) {
      console.warn('saveLiveInspection error:', error);
      return false;
    }
  },
};

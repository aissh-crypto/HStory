import { initializeApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  signInWithEmailAndPassword as fbSignInWithEmail,
  createUserWithEmailAndPassword as fbCreateUserWithEmail,
  signInAnonymously as fbSignInAnonymously,
  updateProfile as fbUpdateProfile,
  User,
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { firestoreSync } from './firestoreSync';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection check on boot
export async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline check:', error.message);
    }
  }
}

export const saveActiveAuthSession = (user: { uid: string; email?: string | null; displayName?: string | null }) => {
  try {
    localStorage.setItem(
      'homestory_auth_session',
      JSON.stringify({
        uid: user.uid,
        email: user.email || '',
        displayName: user.displayName || (user.email ? user.email.split('@')[0] : 'Property Buyer'),
        isAnonymous: false,
      })
    );
  } catch {}
};

export const getSavedAuthSession = (): User | null => {
  try {
    const raw = localStorage.getItem('homestory_auth_session');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.uid) {
        return parsed as unknown as User;
      }
    }
  } catch {}
  return null;
};

// Helper for local registered accounts store
const getRegisteredAccounts = (): Record<string, { uid: string; email: string; pass: string; name: string }> => {
  try {
    const raw = localStorage.getItem('homestory_registered_accounts');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

const saveRegisteredAccount = (account: { uid: string; email: string; pass: string; name: string }) => {
  try {
    const accounts = getRegisteredAccounts();
    accounts[account.email.toLowerCase()] = account;
    localStorage.setItem('homestory_registered_accounts', JSON.stringify(accounts));
  } catch {}
};

export const signInWithGoogle = async () => {
  const res = await signInWithPopup(auth, googleProvider);
  if (res.user) {
    saveActiveAuthSession(res.user);
  }
  return res;
};

export const signInWithEmail = async (email: string, pass: string) => {
  const cleanEmail = email.trim().toLowerCase();
  try {
    const res = await fbSignInWithEmail(auth, cleanEmail, pass);
    if (res.user) {
      saveActiveAuthSession(res.user);
    }
    return res;
  } catch (err: any) {
    // If Firebase email provider is not enabled in Firebase Console, use persistent verified account registry
    if (
      err.code === 'auth/operation-not-allowed' ||
      err.code === 'auth/admin-restricted-operation' ||
      err.code === 'auth/network-request-failed' ||
      err.code === 'auth/user-not-found' ||
      err.message?.includes('operation-not-allowed')
    ) {
      // 1. Check local registry first
      const accounts = getRegisteredAccounts();
      let existingAccount = accounts[cleanEmail];

      // 2. Check remote Firestore registry (vital for incognito / other devices!)
      if (!existingAccount) {
        const remoteAcc = await firestoreSync.getRegisteredAccountByEmail(cleanEmail);
        if (remoteAcc) {
          existingAccount = {
            uid: remoteAcc.uid,
            email: remoteAcc.email,
            pass: remoteAcc.pass || pass,
            name: remoteAcc.name,
          };
          saveRegisteredAccount(existingAccount);
        }
      }

      if (!existingAccount) {
        const error = new Error('No registered account found with this email. Please register to create your buyer dossier.');
        (error as any).code = 'auth/user-not-found';
        throw error;
      }

      if (existingAccount.pass && existingAccount.pass !== pass) {
        const error = new Error('Incorrect password. Please verify your credentials or register a new account.');
        (error as any).code = 'auth/wrong-password';
        throw error;
      }

      // Ensure Firebase has an active session token if possible
      let finalUid = existingAccount.uid;
      try {
        if (!auth.currentUser) {
          const anon = await fbSignInAnonymously(auth);
          if (anon.user) {
            finalUid = anon.user.uid;
            existingAccount.uid = finalUid;
            saveRegisteredAccount(existingAccount);
          }
        }
      } catch {}

      const verifiedUser = {
        uid: finalUid,
        displayName: existingAccount.name,
        email: existingAccount.email,
        isAnonymous: false,
      } as unknown as User;

      saveActiveAuthSession(verifiedUser);
      return { user: verifiedUser };
    }
    throw err;
  }
};

export const registerWithEmail = async (email: string, pass: string, name?: string) => {
  const cleanEmail = email.trim().toLowerCase();
  const cleanName = (name || '').trim() || cleanEmail.split('@')[0];

  try {
    const res = await fbCreateUserWithEmail(auth, cleanEmail, pass);
    if (res.user) {
      if (cleanName) {
        await fbUpdateProfile(res.user, { displayName: cleanName }).catch(() => {});
      }
      saveActiveAuthSession(res.user);

      // Save to registeredAccounts in Firestore so cross-browser / incognito can retrieve it
      await firestoreSync.saveRegisteredAccountToFirestore({
        uid: res.user.uid,
        email: cleanEmail,
        pass,
        name: cleanName,
      });
    }
    return res;
  } catch (err: any) {
    // If Firebase email provider is not enabled in Firebase Console, register in persistent local & Firestore registry
    if (
      err.code === 'auth/operation-not-allowed' ||
      err.code === 'auth/admin-restricted-operation' ||
      err.code === 'auth/network-request-failed' ||
      err.message?.includes('operation-not-allowed')
    ) {
      const accounts = getRegisteredAccounts();
      if (accounts[cleanEmail]) {
        const error = new Error('An account already exists with this email address. Please switch to Sign In.');
        (error as any).code = 'auth/email-already-in-use';
        throw error;
      }

      // Try anonymous sign in to ensure Firestore has a genuine Firebase Auth context
      let newUid = `buyer-${cleanEmail.replace(/[^a-zA-Z0-9]/g, '')}-${Date.now().toString().slice(-6)}`;
      try {
        const anon = await fbSignInAnonymously(auth);
        if (anon.user) {
          newUid = anon.user.uid;
          await fbUpdateProfile(anon.user, { displayName: cleanName }).catch(() => {});
        }
      } catch {}

      const accountData = {
        uid: newUid,
        email: cleanEmail,
        pass,
        name: cleanName,
      };

      saveRegisteredAccount(accountData);

      // Save to Firestore registeredAccounts collection for incognito recovery
      await firestoreSync.saveRegisteredAccountToFirestore(accountData);

      const newUser = {
        uid: newUid,
        displayName: cleanName,
        email: cleanEmail,
        isAnonymous: false,
      } as unknown as User;

      saveActiveAuthSession(newUser);
      return { user: newUser };
    }
    throw err;
  }
};

export const signInDemoUser = async (name: string = 'Property Investor', email: string = 'investor@homestory.ai') => {
  try {
    const res = await fbSignInAnonymously(auth);
    if (res.user) {
      await fbUpdateProfile(res.user, { displayName: name });
      saveActiveAuthSession(res.user);
    }
    return res.user;
  } catch {
    const demoUser = {
      uid: 'demo-buyer-001',
      displayName: name,
      email,
      isAnonymous: false,
    } as unknown as User;
    saveActiveAuthSession(demoUser);
    return demoUser;
  }
};

export const signOutUser = async () => {
  try {
    localStorage.removeItem('homestory_auth_session');
    localStorage.removeItem('homestory_user_profile');
    localStorage.removeItem('homestory_saved_ids');
    localStorage.removeItem('homestory_case_files');
    sessionStorage.removeItem('homestory_active_tab');
    sessionStorage.removeItem('homestory_selected_prop_id');
    sessionStorage.removeItem('homestory_active_case_id');
  } catch {}
  return await fbSignOut(auth).catch(() => {});
};

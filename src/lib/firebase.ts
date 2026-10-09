import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, type Firestore } from 'firebase/firestore';

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

import appletConfig from '../../firebase-applet-config.json';

// Read Vite environment variables
const envApiKey = import.meta.env.VITE_FIREBASE_API_KEY;
const envAuthDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
const envProjectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
const envStorageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET;
const envMessagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID;
const envAppId = import.meta.env.VITE_FIREBASE_APP_ID;
const envDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID;

const hasAppletConfig = Boolean(appletConfig?.apiKey && appletConfig?.projectId);

export const hasFirebaseEnv = Boolean(
  hasAppletConfig || (
    envApiKey &&
    envApiKey !== 'your-api-key' &&
    envProjectId &&
    envProjectId !== 'your-project-id'
  )
);

export const firebaseConfig = {
  apiKey: appletConfig?.apiKey || envApiKey || '',
  authDomain: appletConfig?.authDomain || envAuthDomain || `${envProjectId || 'project'}.firebaseapp.com`,
  projectId: appletConfig?.projectId || envProjectId || '',
  storageBucket: appletConfig?.storageBucket || envStorageBucket || `${envProjectId || 'project'}.appspot.com`,
  messagingSenderId: appletConfig?.messagingSenderId || envMessagingSenderId || '',
  appId: appletConfig?.appId || envAppId || '',
};

let appInstance: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

if (hasFirebaseEnv) {
  try {
    if (!getApps().length) {
      appInstance = initializeApp(firebaseConfig);
    } else {
      appInstance = getApps()[0];
    }
    authInstance = getAuth(appInstance);
    const firestoreDbId =
      ((appletConfig as Record<string, unknown>)?.firestoreDatabaseId as string | undefined) ||
      envDatabaseId ||
      'ai-studio-taskmanagr-e9828365-d36c-40f1-885c-9efdec06c5ee';
    dbInstance = firestoreDbId ? getFirestore(appInstance, firestoreDbId) : getFirestore(appInstance);
  } catch (err) {
    console.warn('Firebase initialization warning:', err);
  }
}

export const app = appInstance;
export const auth = authInstance;
export const db = dbInstance;

export function isFirebaseConfigured(): boolean {
  return Boolean(hasFirebaseEnv && appInstance && dbInstance);
}

/**
 * Handles and formats Firestore error with context and throws structured JSON error
 */
export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const currentAuthUser = authInstance?.currentUser;
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    operationType,
    path,
    authInfo: {
      userId: currentAuthUser?.uid ?? null,
      email: currentAuthUser?.email ?? null,
      emailVerified: currentAuthUser?.emailVerified ?? null,
      isAnonymous: currentAuthUser?.isAnonymous ?? null,
      tenantId: currentAuthUser?.tenantId ?? null,
      providerInfo: currentAuthUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
  };

  console.error('Firestore Error:', JSON.stringify(errInfo, null, 2));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Validates Firestore server connection using getDocFromServer
 */
export async function testConnection(): Promise<{ success: boolean; message: string }> {
  if (!isFirebaseConfigured() || !dbInstance) {
    return {
      success: false,
      message: 'Firebase is not configured yet. Configure VITE_FIREBASE_* environment variables in .env.',
    };
  }

  try {
    await getDocFromServer(doc(dbInstance, 'test', 'connection'));
    return { success: true, message: 'Connected to Firestore successfully.' };
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      return { success: false, message: 'Client is offline or network unreachable.' };
    }
    if (error instanceof Error && error.message.includes('permission-denied')) {
      // Permission denied on test/connection is expected if security rules are working!
      return { success: true, message: 'Connected to Firestore (Security rules enforced).' };
    }
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Connection test failed.',
    };
  }
}

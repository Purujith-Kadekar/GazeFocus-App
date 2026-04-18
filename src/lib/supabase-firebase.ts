import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db as firebaseDb } from './firebase';
import { db } from './db';
import type { Database } from '@/types/supabase';
import { randomBytes } from 'crypto';

type UserRow = Database['public']['Tables']['User']['Row'];
type UserInsert = Database['public']['Tables']['User']['Insert'];

export interface FirebaseTokens {
  idToken: string;
  refreshToken: string;
}

export interface AdditionalUserData {
  email?: string | null;
  name?: string | null;
  image?: string | null;
  emailVerified?: boolean | null;
}

function generateUserId(): string {
  return randomBytes(16).toString('hex');
}

export async function syncFirebaseUserToSupabase(
  firebaseUser: FirebaseUser,
  additionalData?: AdditionalUserData
): Promise<UserRow> {
  const firebaseUid = firebaseUser.uid;
  const email = firebaseUser.email || additionalData?.email || null;
  const displayName = firebaseUser.displayName || additionalData?.name || null;
  const photoURL = firebaseUser.photoURL || additionalData?.image || null;
  const emailVerified = firebaseUser.emailVerified || additionalData?.emailVerified || false;

  const existingUser = await getSupabaseUser(firebaseUid);
  
  if (existingUser) {
    const { data, error } = await db
      .from('User')
      .update({
        email,
        name: displayName,
        image: photoURL,
        emailVerified: emailVerified ? new Date().toISOString() : null,
        lastLoginDate: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .eq('firebaseUid', firebaseUid)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  const newUserId = generateUserId();
  const userInsert: UserInsert = {
    id: newUserId,
    email,
    name: displayName,
    image: photoURL,
    emailVerified: emailVerified ? new Date().toISOString() : null,
    lastLoginDate: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    firebaseUid,
    isPremium: false,
    isBlocked: false,
    currentStreak: 0,
    longestStreak: 0,
    weeklyVideosWatched: 0,
  };

  const { data, error } = await db
    .from('User')
    .insert(userInsert)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getSupabaseUser(firebaseUid: string): Promise<UserRow | null> {
  const { data, error } = await db
    .from('User')
    .select()
    .eq('firebaseUid', firebaseUid)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  if (!data) {
    const firebaseUser = await getFirebaseUserByEmail(firebaseUid);
    if (firebaseUser) {
      return firebaseUser;
    }
  }

  return data || null;
}

async function getFirebaseUserByEmail(firebaseUid: string): Promise<UserRow | null> {
  try {
    const userDocRef = doc(firebaseDb, 'users', firebaseUid);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      if (userData.email) {
        const { data, error } = await db
          .from('User')
          .select()
          .eq('email', userData.email)
          .single();

        if (!error && data) {
          await updateDoc(userDocRef, {
            supabaseUserId: data.id,
          });
          return data;
        }
      }
    }
  } catch (err) {
    console.error('Error checking Firebase users collection:', err);
  }
  return null;
}

export async function updateSupabaseUserFromFirebase(
  firebaseUser: FirebaseUser
): Promise<UserRow> {
  const firebaseUid = firebaseUser.uid;
  const email = firebaseUser.email || null;
  const displayName = firebaseUser.displayName || null;
  const photoURL = firebaseUser.photoURL || null;
  const emailVerified = firebaseUser.emailVerified;

  const { data, error } = await db
    .from('User')
    .update({
      email,
      name: displayName,
      image: photoURL,
      emailVerified: emailVerified ? new Date().toISOString() : null,
      updatedAt: new Date().toISOString(),
    })
    .eq('firebaseUid', firebaseUid)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function storeFirebaseTokens(
  userId: string,
  tokens: FirebaseTokens
): Promise<void> {
  const { error } = await db
    .from('User')
    .update({
      firebaseIdToken: tokens.idToken,
      firebaseRefreshToken: tokens.refreshToken,
    })
    .eq('id', userId);

  if (error) throw error;
}

export async function getFirebaseTokens(
  userId: string
): Promise<FirebaseTokens | null> {
  const { data, error } = await db
    .from('User')
    .select('firebaseIdToken, firebaseRefreshToken')
    .eq('id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    throw error;
  }

  if (data && data.firebaseIdToken && data.firebaseRefreshToken) {
    return {
      idToken: data.firebaseIdToken,
      refreshToken: data.firebaseRefreshToken,
    };
  }

  return null;
}

export async function deleteFirebaseTokens(userId: string): Promise<void> {
  const { error } = await db
    .from('User')
    .update({
      firebaseIdToken: null,
      firebaseRefreshToken: null,
    })
    .eq('id', userId);

  if (error) throw error;
}

export async function getSupabaseUserData(
  firebaseUser: FirebaseUser
): Promise<UserRow | null> {
  const firebaseUid = firebaseUser.uid;
  return getSupabaseUser(firebaseUid);
}
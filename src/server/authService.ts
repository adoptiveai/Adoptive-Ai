import bcrypt from 'bcryptjs';
import sgMail from '@sendgrid/mail';
import crypto from 'node:crypto';
import { query } from './db';

const APP_SCHEMA = process.env.SCHEMA_APP_DATA || 'document_data';
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;
const EMAIL_DOMAIN = process.env.EMAIL_DOMAIN || '';

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

export interface UserRecord {
  id: string;
  email: string;
  hashed_password: string;
  created_at?: string;
  updated_at?: string;
}

export const getUserByEmail = async (email: string): Promise<UserRecord | null> => {
  if (!process.env.DATABASE_URL) {
    return null;
  }
  const sql = `SELECT id, email, hashed_password, created_at, updated_at FROM ${APP_SCHEMA}.users WHERE LOWER(email) = LOWER($1) LIMIT 1`;
  const { rows } = await query<UserRecord>(sql, [email]);
  return rows[0] ?? null;
};

export const verifyPassword = async (plain: string, hashed: string) => bcrypt.compare(plain, hashed);

export const hashPassword = async (plain: string) => bcrypt.hash(plain, 12);

export const generateSecurePassword = (length = 16) => {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  return Array.from({ length })
    .map(() => alphabet.charAt(crypto.randomInt(0, alphabet.length)))
    .join('');
};

export const createUser = async (email: string, hashedPassword: string): Promise<UserRecord | null> => {
  const sql = `INSERT INTO ${APP_SCHEMA}.users (email, hashed_password) VALUES ($1, $2) RETURNING id, email, hashed_password, created_at, updated_at`;
  const { rows } = await query<UserRecord>(sql, [email, hashedPassword]);
  return rows[0] ?? null;
};

export const updateUserPassword = async (email: string, hashedPassword: string) => {
  const sql = `UPDATE ${APP_SCHEMA}.users SET hashed_password = $2, updated_at = NOW() WHERE LOWER(email) = LOWER($1)`;
  const result = await query(sql, [email, hashedPassword]);
  return result.rowCount === 1;
};

export const authenticateUser = async (email: string, password: string): Promise<UserRecord | null> => {
  const user = await getUserByEmail(email);
  if (!user) return null;
  const match = await verifyPassword(password, user.hashed_password);
  return match ? user : null;
};

export const sendPasswordEmail = async (email: string, password: string): Promise<boolean> => {
  if (!SENDGRID_API_KEY || !SENDGRID_FROM_EMAIL) {
    console.warn('SendGrid environment variables are not configured; password will not be emailed.');
    return false;
  }

  try {
    await sgMail.send({
      to: email,
      from: SENDGRID_FROM_EMAIL,
      subject: 'Your PolyRAG account password',
      html: `<p>Your new password is: <strong>${password}</strong></p>`,
    });
    return true;
  } catch (error) {
    console.error('Failed to send password email', error);
    return false;
  }
};

export const registerNewUser = async (email: string) => {
  if (EMAIL_DOMAIN && !email.toLowerCase().endswith(EMAIL_DOMAIN.toLowerCase())) {
    return { user: null as UserRecord | null, password: null as string | null, sent: false, reason: 'invalid_domain' };
  }

  const existing = await getUserByEmail(email);
  if (existing) {
    return { user: null as UserRecord | null, password: null as string | null, sent: false, reason: 'already_exists' };
  }

  const plainPassword = generateSecurePassword();
  const hashed = await hashPassword(plainPassword);
  const user = await createUser(email, hashed);
  if (!user) {
    return { user: null, password: null, sent: false, reason: 'creation_failed' };
  }

  const sent = await sendPasswordEmail(email, plainPassword);
  return { user, password: plainPassword, sent, reason: 'success' as const };
};

export const resetUserPassword = async (email: string) => {
  const user = await getUserByEmail(email);
  if (!user) {
    return { success: false, message: 'User not found.' };
  }

  const plainPassword = generateSecurePassword();
  const hashed = await hashPassword(plainPassword);
  const updated = await updateUserPassword(email, hashed);
  if (!updated) {
    return { success: false, message: 'Failed to update password.' };
  }

  const sent = await sendPasswordEmail(email, plainPassword);
  if (sent) {
    return { success: true, message: `A new password has been sent to ${email}.` };
  }
  return { success: true, message: `Email could not be sent. Temporary password: ${plainPassword}` };
};

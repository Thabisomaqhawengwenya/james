import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/client.js';
import { config } from '../config.js';
import { AuthUserPayload } from './types.js';

const SALT_ROUNDS = 10;
const TOKEN_EXPIRY = '7d';

export async function hashPassword(plainText: string): Promise<string> {
  return bcrypt.hash(plainText, SALT_ROUNDS);
}

export async function comparePassword(plainText: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plainText, hash);
}

export function generateToken(payload: AuthUserPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: TOKEN_EXPIRY });
}

export function verifyToken(token: string): AuthUserPayload {
  return jwt.verify(token, config.jwtSecret) as AuthUserPayload;
}

export async function registerUser(email: string, passwordPlain: string, name?: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    throw new Error('An account with this email already exists.');
  }

  const passwordHash = await hashPassword(passwordPlain);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      passwordHash,
      profile: {
        create: {
          name: name?.trim() || normalizedEmail.split('@')[0],
          preferredName: name?.trim() || normalizedEmail.split('@')[0],
          timezone: 'UTC',
          communicationStyle: 'concise, direct, highly competent',
        },
      },
    },
    include: {
      profile: true,
    },
  });

  const token = generateToken({ id: user.id, email: user.email });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.profile?.name || '',
      preferredName: user.profile?.preferredName || '',
    },
    token,
  };
}

export async function loginUser(email: string, passwordPlain: string) {
  const normalizedEmail = email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: { profile: true },
  });

  if (!user) {
    throw new Error('Invalid email or password.');
  }

  const isValid = await comparePassword(passwordPlain, user.passwordHash);
  if (!isValid) {
    throw new Error('Invalid email or password.');
  }

  const token = generateToken({ id: user.id, email: user.email });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.profile?.name || '',
      preferredName: user.profile?.preferredName || '',
    },
    token,
  };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    include: { profile: true },
  });

  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    profile: user.profile,
    createdAt: user.createdAt,
  };
}

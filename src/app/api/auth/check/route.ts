import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/server/authService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body ?? {};
    if (!email) {
      return NextResponse.json({ message: 'Email is required.' }, { status: 400 });
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ exists: true });
    }

    const user = await getUserByEmail(email);
    return NextResponse.json({ exists: !!user });
  } catch (error) {
    console.error('User check error', error);
    return NextResponse.json({ message: 'Failed to check user.' }, { status: 500 });
  }
}

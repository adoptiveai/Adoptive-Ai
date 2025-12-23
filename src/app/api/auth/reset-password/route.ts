import { NextResponse } from 'next/server';
import { resetUserPassword } from '@/server/authService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body ?? {};

    if (!email) {
      return NextResponse.json({ message: 'Email is required.' }, { status: 400 });
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ message: 'Password reset is not configured.' }, { status: 501 });
    }

    const result = await resetUserPassword(email);
    if (!result.success) {
      return NextResponse.json({ message: result.message }, { status: 400 });
    }

    return NextResponse.json({ message: result.message });
  } catch (error) {
    console.error('Password reset error', error);
    return NextResponse.json({ message: 'Failed to reset password.' }, { status: 500 });
  }
}

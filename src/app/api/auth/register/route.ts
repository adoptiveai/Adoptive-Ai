import { NextResponse } from 'next/server';
import { registerNewUser } from '@/server/authService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body ?? {};

    if (!email) {
      return NextResponse.json({ message: 'Email is required.' }, { status: 400 });
    }

    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ message: 'User registration is not configured.' }, { status: 501 });
    }

    const result = await registerNewUser(email);

    switch (result.reason) {
      case 'invalid_domain':
        return NextResponse.json({ message: 'Email domain not allowed.' }, { status: 400 });
      case 'already_exists':
        return NextResponse.json({ message: 'Account already exists for this email.' }, { status: 409 });
      case 'creation_failed':
        return NextResponse.json({ message: 'Failed to create account. Please try again.' }, { status: 500 });
      default:
        return NextResponse.json({
          user: result.user,
          password: result.sent ? undefined : result.password,
          email,
        });
    }
  } catch (error) {
    console.error('Registration error', error);
    return NextResponse.json({ message: 'Failed to register user.' }, { status: 500 });
  }
}

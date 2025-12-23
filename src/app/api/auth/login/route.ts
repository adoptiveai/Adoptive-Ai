import { NextResponse } from 'next/server';
import { authenticateUser } from '@/server/authService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body ?? {};

    if (!email || !password) {
      return NextResponse.json({ message: 'Email and password are required.' }, { status: 400 });
    }

    if (process.env.NO_AUTH === 'true') {
      return NextResponse.json({
        user: {
          id: '00000000-0000-0000-0000-000000000001',
          email,
        },
        noAuth: true,
      });
    }

    const user = await authenticateUser(email, password);
    if (!user) {
      return NextResponse.json({ message: 'Invalid credentials.' }, { status: 401 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Login error', error);
    return NextResponse.json({ message: 'Failed to authenticate user.' }, { status: 500 });
  }
}

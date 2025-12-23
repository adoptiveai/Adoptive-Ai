import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  // Check if user is authenticated via cookie
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('access_token');

  // If not authenticated, redirect to login
  if (!accessToken) {
    redirect('/login');
  }

  // If authenticated, redirect to app/chat (we'll create this route)
  redirect('/chat');
}

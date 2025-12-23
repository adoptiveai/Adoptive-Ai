import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Redirecting...',
};

export default function RootPage() {
  // Simple redirect using meta tag (works everywhere)
  return (
    <html>
      <head>
        <meta httpEquiv="refresh" content="0; url=/login" />
      </head>
      <body>
        <p>Redirecting to login...</p>
      </body>
    </html>
  );
}

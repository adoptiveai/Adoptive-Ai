import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Redirecting...',
};

export default function RootPage() {
    return (
        <html>
            <head>
                <meta httpEquiv="refresh" content="0; url=/chat" />
            </head>
            <body>
                <p>Redirecting to login...</p>
            </body>
        </html>
    );
}

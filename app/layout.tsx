import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WebBurrow — Your internet is a place',
  description: 'A polished local-first spatial homepage for your websites, tools, and digital life.',
  icons: { icon: '/webburrow-icon.png', apple: '/webburrow-icon.png' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

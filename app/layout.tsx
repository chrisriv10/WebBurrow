import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'WebBurrow — Your internet is a place',
  description: 'A playful spatial homepage for your websites, tools, and digital life.',
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

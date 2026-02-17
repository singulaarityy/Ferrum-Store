import './globals.css';
import ClientProviders from '../components/ClientProviders';
import Link from 'next/link';

export const metadata = {
  title: 'My Drive - Google Drive Clone',
  description: 'A React Google Drive Clone using Material UI',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#f9fbfd', margin: 0, padding: 0 }}>
        <ClientProviders>
          {children}
        </ClientProviders>
      </body>
    </html>
  );
}

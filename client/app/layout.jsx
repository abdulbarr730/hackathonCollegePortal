import './globals.css';
import { AuthProvider } from './context/AuthContext';
import { HackathonProvider } from './context/HackathonContext';
import Providers from './providers';
import LayoutWrapper from './LayoutWrapper';

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="h-full transition-colors duration-300">
        <Providers>
          <HackathonProvider>
            <AuthProvider>
              <div className="flex flex-col min-h-screen">
                <LayoutWrapper>
                  {children}
                </LayoutWrapper>
              </div>
            </AuthProvider>
          </HackathonProvider>
        </Providers>
      </body>
    </html>
  );
}
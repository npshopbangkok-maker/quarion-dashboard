import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

export const metadata: Metadata = {
  title: "Quarion Dashboard - ระบบจัดการรายรับ-รายจ่าย",
  description: "ระบบจัดการรายรับ-รายจ่าย แบบ Dashboard สำหรับธุรกิจ",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Quarion",
  },
  icons: {
    icon: "/icons/icon.svg",
    apple: "/icons/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#8b5cf6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="antialiased">
        <AuthProvider>
          {children}
        </AuthProvider>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('SW registered: ', registration);
                  }).catch(function(registrationError) {
                    console.log('SW registration failed: ', registrationError);
                  });
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}

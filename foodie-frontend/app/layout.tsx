import type { Metadata } from "next";
import "./globals.css";
import { ToastProvider } from "@/contexts/ToastContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import Footer from "@/components/Footer";
import AIChatbot from "@/components/AIChatbot";

export const metadata: Metadata = {
  title: "Foodie v2 - Discover Amazing Chefs & Meals",
  description: "Find and order from the best chefs in your area",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`font-sans antialiased flex flex-col min-h-screen`}
      >
        <ErrorBoundary>
          <ToastProvider>
            <AuthProvider>
              <main className="flex-1">
                {children}
              </main>
              <Footer />
              <AIChatbot />
            </AuthProvider>
          </ToastProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}


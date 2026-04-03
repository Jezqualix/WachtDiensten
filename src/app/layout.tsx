import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Wachtdienst Planner - Dockx [TEST/DEMO]",
  description: "Beheer van garage en app wachtdiensten",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="nl" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <footer className="bg-brand-900 text-white py-4 text-center text-sm">
          <p>&copy; {new Date().getFullYear()} Dockx - Wachtdienst Planner</p>
        </footer>
      </body>
    </html>
  );
}

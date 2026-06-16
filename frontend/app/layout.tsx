import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "ThreadIt — Community Discussions",
  description: "A modern community discussion platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="grain">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { GoogleOAuthProvider } from "@react-oauth/google";


export const metadata: Metadata = {
  title: "TaskHub",
  description: "Get Your Task Done",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!}>
          {/* <CommonHeader /> */}
          {children}
        </GoogleOAuthProvider>
      </body>
    </html>
  );
}
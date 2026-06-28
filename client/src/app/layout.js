import { Geist, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { AuthProvider } from "@/components/layout/auth-provider";
import "../styles/globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "CardIO",
  description:
    "Create, share, discover, and practice public study sets with CardIO.",
};

const VALID_ROLES = new Set(["admin", "teacher", "learner"]);

export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const initialIsAuthenticated = Boolean(cookieStore.get("access_token")?.value);
  const roleCookie = cookieStore.get("active_role")?.value;
  const initialRole = VALID_ROLES.has(roleCookie) ? roleCookie : null;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider
          initialIsAuthenticated={initialIsAuthenticated}
          initialRole={initialRole}
        >
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

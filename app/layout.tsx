import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";

// Placeholder imports - we will create these files next
// You can keep using your existing Header/Footer components logic
import Header from "../components/Header";
import Footer from "../components/Footer";

// optimize font loading
const rubik = Rubik({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  variable: "--font-rubik",
});

export const metadata: Metadata = {
  title: "PNR Buddy - Flight Operations Tools",
  description: "Internal Flight Operations Management",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${rubik.variable} font-rubik antialiased flex min-h-screen flex-col`}
      >
        {/* Main Layout Wrapper matching your index.tsx */}
        <div className="flex min-h-screen w-full">
          {/* Sidebar can go here if you uncomment it later */}

          <div className="grow flex flex-col w-full">
            <Header />

            {/* Main Content Area with Gradient */}
            <main className="grow bg-linear-to-b from-blue-400 to-white flex flex-col items-center w-full">
              {children}
            </main>

            <Footer />
          </div>
        </div>

        {/* Toast Notification Wrapper */}
        <Toaster position="top-center" />
      </body>
    </html>
  );
}

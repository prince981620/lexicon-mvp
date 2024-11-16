// src/app/layout.tsx
import "./globals.css";
import { WalletContextProvider } from "../app/components/WalletContextProvider";

export const metadata = {
  title: "Lexicon - AI assistant for Solana",
  description: "An intelligent AI assistant for the Solana blockchain",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#f1f1f1]">
        {/* Background pattern */}
        <div className="fixed inset-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-100 via-transparent to-transparent opacity-50" />
          <div className="absolute inset-0 bg-[url('/lexicon/wave-pattern.svg')] bg-repeat opacity-[0.03]" />
        </div>
        <WalletContextProvider>
          <div className="relative">{children}</div>
        </WalletContextProvider>
      </body>
    </html>
  );
}

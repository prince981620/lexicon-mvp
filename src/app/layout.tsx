// src/app/layout.tsx
import "./globals.css";
import { WalletContextProvider } from "../app/components/WalletContextProvider";

export const metadata = {
  title: "Lexicon - AI Powered Solana dApp",
  description: "An intelligent dApp with Solana Wallet Adapter in Next.js",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="fixed inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        <WalletContextProvider>
          <div className="relative">{children}</div>
        </WalletContextProvider>
      </body>
    </html>
  );
}

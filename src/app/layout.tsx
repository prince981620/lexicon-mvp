// src/app/layout.tsx
import './globals.css';
import { WalletContextProvider } from '../app/components/WalletContextProvider';

export const metadata = {
    title: 'My Solana dApp',
    description: 'A dApp with Solana Wallet Adapter in Next.js 13',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <WalletContextProvider>
                    {children}
                </WalletContextProvider>
            </body>
        </html>
    );
}

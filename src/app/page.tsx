// src/app/page.tsx
import WalletConnectButton from '../app/components/WalletConnectButton';

export default function Home() {
    return (
        <main>
            <h1>Welcome to My Solana dApp</h1>
            <WalletConnectButton />
        </main>
    );
}

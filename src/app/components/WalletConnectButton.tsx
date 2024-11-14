// src/components/WalletConnectButton.tsx
"use client";

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const WalletConnectButton: React.FC = () => {
    const { connected, publicKey } = useWallet();

    return (
        <div>
            <WalletMultiButton />
            {connected && publicKey && (
                <p>Connected as: {publicKey.toBase58()}</p>
            )}
        </div>
    );
};

export default WalletConnectButton;

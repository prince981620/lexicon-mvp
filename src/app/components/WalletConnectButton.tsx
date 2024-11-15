// src/app/components/WalletConnectButton.tsx
"use client";

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

const WalletConnectButton: React.FC = () => {
    return (
        <div>
            <WalletMultiButton />
        </div>
    );
};

export default WalletConnectButton;
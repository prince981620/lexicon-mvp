// src/app/components/WalletConnectButton.tsx
"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";

const WalletConnectButton: React.FC = () => {
  return (
    <div className="relative">
      <WalletMultiButton className="!bg-gray-900/50 !backdrop-blur-sm !border !border-gray-700 !rounded-full !px-6 !py-2 hover:!bg-gray-800/50 transition-all duration-200" />
    </div>
  );
};

export default WalletConnectButton;

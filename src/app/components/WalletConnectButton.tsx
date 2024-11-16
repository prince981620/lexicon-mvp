// src/app/components/WalletConnectButton.tsx
"use client";

import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useEffect, useState } from "react";

const WalletConnectButton: React.FC = () => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="relative">
      <WalletMultiButton className="!bg-gray-900/50 !backdrop-blur-sm !border !border-gray-700 !rounded-full !px-6 !py-2 hover:!bg-gray-800/50 transition-all duration-200" />
    </div>
  );
};

export default WalletConnectButton;

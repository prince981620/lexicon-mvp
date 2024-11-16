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
    <div className="flex flex-col items-center gap-3 p-4 rounded-lg bg-white backdrop-blur-sm border border-gray-100">
      <WalletMultiButton className="!bg-black !text-white hover:!bg-gray-900 transition-all duration-200 !rounded-full !px-6" />
    </div>
  );
};

export default WalletConnectButton;

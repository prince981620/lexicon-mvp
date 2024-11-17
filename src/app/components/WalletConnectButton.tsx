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
    <div>
      <WalletMultiButton className="!bg-[#1a1a1a] hover:!bg-[#2a2a2a] !text-white/90 !border !border-gray-800/50 !rounded-xl !py-2 !px-4 !h-auto !text-sm font-medium transition-colors duration-200" />
    </div>
  );
};

export default WalletConnectButton;

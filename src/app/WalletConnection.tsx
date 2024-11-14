"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import React, { useState, useEffect } from 'react';


export default function WalletConnection() {
  const { connected, publicKey } = useWallet();

  useEffect(() => {
    if (connected) {
      console.log("Connected to wallet:", publicKey?.toBase58());
    }
  }, [connected, publicKey]);

  return (
    <div>
      <WalletMultiButton />
      {connected && <p>Connected: {publicKey?.toBase58()}</p>}
    </div>
  );
}
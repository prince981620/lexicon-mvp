// src/app/page.tsx
"use client";

import { useState } from "react";
import WalletConnectButton from "../app/components/WalletConnectButton";
import ChatComponent from "../app/components/ChatComponent";

export default function Home() {
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12 relative">
      <div className="absolute top-4 right-4 z-10">
        <WalletConnectButton />
      </div>
      
      <div className="text-center space-y-6 mb-12">
        <h1 className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">
          Lexicon Demo
        </h1>
        <p className="text-gray-300 max-w-md mx-auto">
          Experience AI-powered interactions with the Solana blockchain
        </p>
      </div>

      {!isChatOpen ? (
        <button
          onClick={() => setIsChatOpen(true)}
          className="group relative inline-flex items-center justify-center px-8 py-3 text-lg font-medium text-white bg-gradient-to-r from-blue-500 to-purple-500 rounded-full overflow-hidden transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25"
        >
          <span className="relative">Start AI Chat</span>
          <div className="absolute inset-0 bg-white/20 group-hover:animate-shimmer" />
        </button>
      ) : (
        <div className="w-full max-w-4xl animate-fade-in">
          <ChatComponent />
        </div>
      )}
    </main>
  );
}

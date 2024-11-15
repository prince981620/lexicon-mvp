// src/app/page.tsx
"use client";

import { useState } from 'react';
import WalletConnectButton from '../app/components/WalletConnectButton';
import ChatComponent from '../app/components/ChatComponent';

export default function Home() {
    const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

    return (
        <main className="flex flex-col items-center relative">
            <h1 className="text-6xl text-center mb-4">Lexicon Demo</h1>
            <div className="absolute top-2 right-2">
                <WalletConnectButton />
            </div>
            <button 
                onClick={() => setIsChatOpen(true)} 
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
            >
                Start Chat
            </button>
            {isChatOpen && <ChatComponent />}
        </main>
    );
}
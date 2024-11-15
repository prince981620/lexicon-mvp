// src/app/page.tsx
"use client";

import { useState } from 'react';
import WalletConnectButton from '../app/components/WalletConnectButton';
import { LexiconSDK } from 'lexicon-sdk-mvp';

export default function Home() {
    const [chatHistory, setChatHistory] = useState<{ role: string, content: string }[]>([]);
    const [userInput, setUserInput] = useState<string>("");
    const [isChatOpen, setIsChatOpen] = useState<boolean>(false);

    const startChat = async () => {
        const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
        if (userInput.trim() === "" || !apiKey) return;

        const newMessage = { role: "user", content: userInput };
        setChatHistory([...chatHistory, newMessage]);
        setUserInput("");

        try {
            const response = await LexiconSDK.startChat(apiKey, [userInput]);
            if (response !== null) {
                const gptMessage = { role: "assistant", content: response };
                setChatHistory([...chatHistory, newMessage, gptMessage]);
            }
        } catch (error) {
            console.error("Error starting chat:", error);
        }
    };

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
            {isChatOpen && (
                <div className="mt-4 w-full max-w-md">
                    <div className="border p-4 rounded bg-white shadow-md">
                        {chatHistory.map((message, index) => (
                            <div key={index} className={`mb-2 ${message.role === "user" ? "text-right" : "text-left"}`}>
                                <p className={`p-2 rounded ${message.role === "user" ? "bg-blue-500 text-white" : "bg-gray-300 text-black"}`}>
                                    {message.content}
                                </p>
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            className="flex-grow p-2 border rounded"
                            placeholder="Type your message..."
                        />
                        <button
                            onClick={startChat}
                            className="ml-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-700"
                        >
                            Send
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}
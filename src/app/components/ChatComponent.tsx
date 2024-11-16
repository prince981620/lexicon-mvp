/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app/components/ChatComponent.tsx
import { useState } from "react";
import { LexiconSDK } from "lexicon-sdk-mvp";
import { useWallet } from "@solana/wallet-adapter-react";
import { create_solana_transaction } from "../utils/solanaTransactions";

interface Message {
  role: string;
  content: string;
}

interface ChatResponse {
  content: string | null;
  functionCall: {
    name: string;
    arguments: any;
  } | null;
}

const ChatComponent = () => {
  const wallet = useWallet();
  const [chatHistory, setChatHistory] = useState<Message[]>([]);
  const [userInput, setUserInput] = useState<string>("");

  const handleFunctionCall = async (functionCall: any) => {
    if (functionCall.name === "create_solana_transaction") {
      if (!wallet.connected || !wallet.signTransaction || !wallet.publicKey) {
        return "Please connect your wallet first";
      }

      try {
        const { transaction, connection } = await create_solana_transaction(
          functionCall.arguments.recipient_wallet,
          functionCall.arguments.amount_sol,
          wallet.publicKey
        );

        // Sign the transaction
        const signedTx = await wallet.signTransaction(transaction);

        // Send the transaction
        const signature = await connection.sendRawTransaction(
          signedTx.serialize()
        );

        // Wait for confirmation
        const latestBlockhash = await connection.getLatestBlockhash();
        await connection.confirmTransaction({
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        });

        return `Transaction successful! Signature: ${signature}`;
      } catch (error: unknown) {
        console.error("Transaction error:", error);
        if (error instanceof Error) {
          return `Transaction failed: ${error.message}`;
        }
        return "Transaction failed: Unknown error occurred";
      }
    }
    return null;
  };

  const startChat = async () => {
    if (userInput.trim() === "") return;

    const newMessage = { role: "user", content: userInput };
    setChatHistory([...chatHistory, newMessage]);
    setUserInput("");

    try {
      const response: ChatResponse = await LexiconSDK.sendMessage(userInput);

      if (response.content) {
        const gptMessage = { role: "assistant", content: response.content };
        setChatHistory((prev) => [...prev, gptMessage]);
      }

      if (response.functionCall) {
        const functionResult = await handleFunctionCall(response.functionCall);
        const functionMessage = {
          role: "assistant",
          content:
            functionResult ||
            `Function Called: ${
              response.functionCall.name
            }\nArguments: ${JSON.stringify(
              response.functionCall.arguments,
              null,
              2
            )}`,
        };
        setChatHistory((prev) => [...prev, functionMessage]);
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      const errorMessage = {
        role: "assistant",
        content: "Sorry, there was an error processing your request.",
      };
      setChatHistory((prev) => [...prev, errorMessage]);
    }
  };

  return (
    <div className="w-full h-[600px] flex flex-col rounded-2xl bg-gray-900/50 backdrop-blur-lg border border-gray-700">
      {/* Chat History */}
      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {chatHistory.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] px-4 py-2 rounded-2xl ${
                message.role === "user"
                  ? "bg-blue-500 text-white rounded-br-none"
                  : "bg-gray-800 text-gray-100 rounded-bl-none"
              }`}
            >
              <p className="text-sm">{message.content}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex gap-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && startChat()}
            className="flex-1 px-4 py-2 bg-gray-800 text-gray-100 rounded-full border border-gray-700 focus:outline-none focus:border-blue-500 transition-colors"
            placeholder="Type your message..."
          />
          <button
            onClick={startChat}
            className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full hover:opacity-90 transition-opacity"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;

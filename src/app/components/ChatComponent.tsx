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
      if (!wallet.connected || !wallet.signTransaction) {
        return "Please connect your wallet first";
      }

      try {
        const { transaction, connection } = await create_solana_transaction(
          functionCall.arguments.sender_public_key,
          functionCall.arguments.recipient_wallet,
          functionCall.arguments.amount_sol
        );

        // Sign the transaction
        const signedTx = await wallet.signTransaction(transaction);

        // Send the transaction
        const signature = await connection.sendRawTransaction(
          signedTx.serialize()
        );

        // Wait for confirmation
        await connection.confirmTransaction(signature, "confirmed");

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
    <div className="mt-4 w-full max-w-md">
      <div className="border p-4 rounded bg-white shadow-md">
        {chatHistory.map((message, index) => (
          <div
            key={index}
            className={`mb-2 ${
              message.role === "user" ? "text-right" : "text-left"
            }`}
          >
            <p
              className={`p-2 rounded ${
                message.role === "user"
                  ? "bg-blue-500 text-white"
                  : "bg-gray-300 text-black"
              }`}
            >
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
  );
};

export default ChatComponent;

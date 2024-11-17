import { useState } from "react";
import { sendMessageLexicon } from "../backend/sendMessage";
import { useWallet } from "@solana/wallet-adapter-react";
import LoadingSpinner from "./LoadingSpinner";
import { ChatResponse, FrontendMessage } from "../types/types";
import ReactMarkdown from "react-markdown";
import { executeFunctionCall } from "../utils/executeFunctionCall";

const ChatComponent = () => {
  const wallet = useWallet();
  const [chatHistory, setChatHistory] = useState<FrontendMessage[]>([]);
  const [userInput, setUserInput] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const startChat = async () => {
    if (userInput.trim() === "") return;

    const newMessage = { role: "user", content: userInput };
    setChatHistory([...chatHistory, newMessage]);
    setUserInput("");
    setIsGenerating(true);

    try {
      const response: ChatResponse = await sendMessageLexicon(userInput);

      if (response.content) {
        const gptMessage = { role: "assistant", content: response.content };
        setChatHistory((prev) => [...prev, gptMessage]);
      }

      if (response.functionCall) {
        const functionResult = await executeFunctionCall(
          response.functionCall,
          wallet
        );
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
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full h-[700px] flex flex-col rounded-3xl bg-white/95 backdrop-blur-sm border border-gray-100 shadow-2xl">
      {/* Enhanced Lexicon Header */}
      <div className="flex items-center gap-4 p-6 border-b border-gray-100/50">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative">
            <img
              src="/lexicon/lexicon-logo.png"
              alt="Lexicon AI"
              className="h-10 w-10 rounded-xl shadow-lg"
            />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-black">Lexicon AI</h2>
            <p className="text-xs text-gray-500">Powered by Lexicon Labs</p>
          </div>
        </div>
      </div>

      {/* Enhanced Chat History */}
      <div className="flex-1 p-6 overflow-y-auto space-y-6 chat-scrollbar">
        {chatHistory.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            } items-end gap-3`}
          >
            {message.role === "assistant" && (
              <div className="flex-shrink-0">
                <img
                  src="/lexicon/lexicon-logo.png"
                  alt="Lexicon AI"
                  className="h-8 w-8 rounded-xl shadow-md"
                />
              </div>
            )}
            <div
              className={`relative group transition-all duration-200 ${
                message.role === "user" ? "ml-12" : "mr-12"
              }`}
            >
              <div
                className={`px-5 py-3 rounded-2xl ${
                  message.role === "user"
                    ? "bg-gradient-to-br from-black to-gray-800 text-white rounded-br-none shadow-lg"
                    : "bg-gray-50 text-black rounded-bl-none border border-gray-100 shadow-sm"
                }`}
              >
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <ReactMarkdown>{message.content}</ReactMarkdown>
                </div>
              </div>
              <span className="absolute bottom-0 text-xs text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                {new Date().toLocaleTimeString()}
              </span>
            </div>
          </div>
        ))}
        {isGenerating && (
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <img
                src="/lexicon/lexicon-logo.png"
                alt="Lexicon AI"
                className="h-8 w-8 rounded-xl shadow-md"
              />
            </div>
            <div className="px-5 py-3 rounded-2xl bg-gray-50 border border-gray-100 shadow-sm">
              <LoadingSpinner />
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Input Area */}
      <div className="p-6 border-t border-gray-100/50 bg-gray-50/50">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !isGenerating && startChat()}
              disabled={isGenerating}
              className="w-full px-6 py-4 bg-white text-black rounded-2xl border border-gray-200 shadow-sm focus:outline-none focus:border-gray-300 focus:ring-2 focus:ring-gray-100 transition-all disabled:opacity-50 pr-12"
              placeholder={
                isGenerating
                  ? "Lexicon AI is thinking..."
                  : "Message Lexicon AI..."
              }
            />
            {userInput && (
              <button
                onClick={() => setUserInput("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
          <button
            onClick={startChat}
            disabled={isGenerating}
            className="px-8 py-4 bg-black text-white rounded-2xl hover:bg-gray-900 active:bg-gray-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center gap-2"
          >
            {isGenerating ? (
              "Processing..."
            ) : (
              <>
                Send
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatComponent;

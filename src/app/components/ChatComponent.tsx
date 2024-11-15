// src/app/components/ChatComponent.tsx
import { useState } from 'react';

interface Message {
    role: string;
    content: string;
}

const ChatComponent = () => {
    const [chatHistory, setChatHistory] = useState<Message[]>([]);
    const [userInput, setUserInput] = useState<string>("");

    const startChat = async () => {
        if (userInput.trim() === "") return;

        const newMessage = { role: "user", content: userInput };
        setChatHistory([...chatHistory, newMessage]);
        setUserInput("");

        try {
            const response = await fetch('/api/startChat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userInput }),
            });

            const responseText = await response.text();
            console.log("Response Text:", responseText);

            const data = JSON.parse(responseText);
            if (data.response) {
                const gptMessage = { role: "assistant", content: data.response };
                setChatHistory([...chatHistory, newMessage, gptMessage]);
            }
        } catch (error) {
            console.error("Error starting chat:", error);
        }
    };

    return (
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
    );
};

export default ChatComponent;
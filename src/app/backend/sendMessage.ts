import { ChatResponse, Message } from "../types/types";

let messageHistory: Message[] = [];

export const sendMessageLexicon = async (userInput: string): Promise<ChatResponse> => {
  messageHistory.push({ role: "user", content: userInput });

  try {
    const response = await fetch("http://localhost:3000/api/startChat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userInput,
        messageHistory,
      }),
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const data = await response.json();

    // Add assistant's response to history
    if (data.response.content) {
      messageHistory.push({
        role: "assistant",
        content: data.response.content,
      });
    }
    return data.response;
  } catch (error) {
    console.error("Error sending message:", error);
    throw new Error("Failed to send message");
  }
};

export const clearMessageHistory = () => {
  messageHistory = [];
};

export const getMessageHistory = () => {
  return [...messageHistory];
};
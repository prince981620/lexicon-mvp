// src/chat.ts
import { OpenAI } from "openai";
import { tools } from "@/app/types/functionDefs";

const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

export const startChat = async (messages: string[]) => {
  const openai = new OpenAI({
    apiKey,
  });

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages.map((msg) => ({ role: "user", content: msg })),
      tools: tools.map(tool => ({
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters
        }
      })),
      tool_choice: "auto",
    });

    const message = response.choices[0].message;

    if (message.tool_calls) {
      return {
        functionCall: {
          name: message.tool_calls[0].function.name,
          arguments: JSON.parse(message.tool_calls[0].function.arguments)
        },
        content: message.content
      };
    }

    return {
      content: message.content,
      functionCall: null
    };
  } catch (error) {
    console.error("Error while chatting with GPT:", error);
    throw new Error("Unable to fetch chat response.");
  }
};
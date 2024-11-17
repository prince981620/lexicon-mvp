// src/chat.ts
import { OpenAI } from "openai";
import { tools } from "./data/functionDefs";
import { ChatCompletionMessageParam } from "openai/resources/chat/completions";

const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
const model = process.env.NEXT_PUBLIC_AI_MODEL as string;

interface Message {
  role: "system" | "user" | "assistant" | "function";
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

export const startChat = async (messages: Message[]) => {
  const openai = new OpenAI({
    apiKey,
  });

  try {
    const response = await openai.chat.completions.create({
      model: model,
      messages: [
        {
          role: "system",
          content: "You are Lexicon AI, a helpful assistant specializing in Solana blockchain interactions. You communicate in a friendly, professional manner while maintaining technical accuracy."
        },
        ...(messages as ChatCompletionMessageParam[])
      ],
      tools: tools.map((tool) => ({
        type: "function" as const,
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters,
        },
      })),
      tool_choice: "auto",
    });

    const message = response.choices[0].message;

    if (message.tool_calls) {
      return {
        functionCall: {
          name: message.tool_calls[0].function.name,
          arguments: JSON.parse(message.tool_calls[0].function.arguments),
        },
        content: message.content,
      };
    }

    return {
      content: message.content,
      functionCall: null,
    };
  } catch (error) {
    console.error("Error while chatting with GPT:", error);
    throw new Error("Unable to fetch chat response.");
  }
};

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
      model: "gpt-4o-mini", // or gpt-3.5-turbo, depending on your usage
      messages: messages.map((msg) => ({ role: "user", content: msg })),
      tools: tools.map(tool => ({
        type: "function",
        function: {
          name: tool.name,
          description: tool.description,
          parameters: tool.parameters
        }
      })),
    });
    console.log(response);
    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error while chatting with GPT:", error);
    throw new Error("Unable to fetch chat response.");
  }
};
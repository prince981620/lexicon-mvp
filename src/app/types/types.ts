export interface FunctionCall {
  name: string;
  arguments: Record<string, any>;
}

export interface ChatResponse {
  content: string | null;
  functionCall: FunctionCall | null;
}

export interface Message {
  role: "system" | "user" | "assistant" | "function";
  content: string;
  name?: string;
  function_call?: {
    name: string;
    arguments: string;
  };
}

export interface FrontendMessage {
  role: string;
  content: string;
}

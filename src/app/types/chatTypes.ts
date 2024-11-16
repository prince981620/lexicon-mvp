/* eslint-disable @typescript-eslint/no-explicit-any */
export interface FunctionCall {
  name: string;
  arguments: Record<string, any>;
}

export interface ChatResponse {
  content: string | null;
  functionCall: FunctionCall | null;
} 
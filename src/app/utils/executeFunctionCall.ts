import { FunctionCall } from "../types/types";
import { functionHandlers } from "../backend/data/functionHandlers";
import { WalletContextState } from "@solana/wallet-adapter-react";

export const executeFunctionCall = async (
  functionCall: FunctionCall,
  wallet: WalletContextState
): Promise<string | null> => {
  const handler = functionHandlers[functionCall.name];

  if (!handler) {
    console.error(`No handler found for function: ${functionCall.name}`);
    return `Function '${functionCall.name}' is not implemented`;
  }

  try {
    return await handler(functionCall.arguments, wallet);
  } catch (error) {
    console.error(`Error executing function ${functionCall.name}:`, error);
    return `Error executing function ${functionCall.name}`;
  }
};

import { WalletContextState } from "@solana/wallet-adapter-react";
import { create_solana_transaction } from "./solanaTransactions";
import { FunctionCall } from "../types/types";

type FunctionHandler = (
  args: Record<string, any>,
  wallet: WalletContextState
) => Promise<string | null>;

// Map of function names to their handlers
const functionHandlers: Record<string, FunctionHandler> = {
  create_solana_transaction: async (args, wallet) => {
    if (!wallet.connected || !wallet.signTransaction || !wallet.publicKey) {
      return "Please connect your wallet first";
    }

    try {
      const { transaction, connection } = await create_solana_transaction(
        args.recipient_wallet,
        args.amount_sol,
        wallet.publicKey
      );

      const signedTx = await wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(
        signedTx.serialize()
      );

      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      });

      return `Transaction successful! Signature: ${signature}`;
    } catch (error: unknown) {
      console.error("Transaction error:", error);
      if (error instanceof Error) {
        return `Transaction failed: ${error.message}`;
      }
      return "Transaction failed: Unknown error occurred";
    }
  },
  // Add more function handlers here as needed
  // example_function: async (args, wallet) => { ... }
};

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

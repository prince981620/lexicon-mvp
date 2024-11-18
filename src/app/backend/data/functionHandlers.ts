import { create_solana_transaction, create_jupiter_swap } from "../utils/solanaTransactions";
import { FunctionHandler } from "../../types/types";
import { Connection, clusterApiUrl } from "@solana/web3.js";
import { getTokenInfo } from "../utils/tokenMappings";

// Map of function names to their handlers
export const functionHandlers: Record<string, FunctionHandler> = {
  send_solana_transaction: async (args, wallet) => {
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

      return `Transaction successful! ✅\n\n[**View on Solscan**](https://solscan.io/tx/${signature})`;
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
  swap_tokens: async (args, wallet) => {
    if (!wallet.connected || !wallet.signTransaction || !wallet.publicKey) {
      return "Please connect your wallet first";
    }

    try {
      // Get token info including decimals
      const [inputTokenInfo, outputTokenInfo] = await Promise.all([
        getTokenInfo(args.inputToken),
        getTokenInfo(args.outputToken)
      ]);

      // Add validation for reasonable amounts
      if (args.amount <= 0) {
        throw new Error("Amount must be greater than 0");
      }
      if (args.amount > 1000000) {  // Reasonable maximum threshold
        throw new Error("Amount too large");
      }

      // Calculate amount with proper decimals
      const inputDecimals = inputTokenInfo.decimals;
      const amountWithDecimals = Math.round(args.amount * Math.pow(10, inputDecimals));

      const connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
      const { transaction } = await create_jupiter_swap(
        inputTokenInfo.address,
        outputTokenInfo.address,
        amountWithDecimals,
        args.slippageBps,
        wallet.publicKey.toString(),
        connection
      );

      const signedTx = await wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(signedTx.serialize(), {
        skipPreflight: true,
        maxRetries: 2
      });

      const latestBlockhash = await connection.getLatestBlockhash();
      await connection.confirmTransaction({
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      });

      return `Swap successful! ✅\n\n[**View on Solscan**](https://solscan.io/tx/${signature})`;
    } catch (error: unknown) {
      console.error("Swap error:", error);
      if (error instanceof Error) {
        return `Swap failed: ${error.message}`;
      }
      return "Swap failed: Unknown error occurred";
    }
  },
};
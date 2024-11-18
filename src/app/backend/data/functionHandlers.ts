import { create_solana_transaction, create_jupiter_swap } from "../../utils/solanaTransactions";
import { FunctionHandler } from "../../types/types";

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

  swap_tokens: async (args, wallet) => {
    if (!wallet.connected || !wallet.signTransaction || !wallet.publicKey) {
      return "Please connect your wallet first";
    }

    try {
      const { transaction, connection } = await create_jupiter_swap(
        args.inputMint,
        args.outputMint,
        args.amount,
        args.slippageBps,
        wallet.publicKey.toString(),
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

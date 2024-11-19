import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  VersionedTransaction,
} from "@solana/web3.js";
import { FunctionHandler } from "../../types/types";
import { getTokenInfo } from "../utils/tokenMappings";
import fetch from "cross-fetch";

// Transaction creation functions
const create_solana_transaction = async (
  recipient_wallet: string,
  amount_sol: number,
  fromPubkey: PublicKey
) => {
  try {
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const toPubkey = new PublicKey(recipient_wallet);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports: amount_sol * LAMPORTS_PER_SOL,
      })
    );

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;

    return {
      transaction: transaction,
      connection: connection,
    };
  } catch (error) {
    console.error("Error creating transaction:", error);
    throw error;
  }
};

const create_jupiter_swap = async (
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number,
  userPublicKey: string,
  connection?: Connection
) => {
  if (!connection) {
    connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
  }

  const quoteResponse = await (
    await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}\
&outputMint=${outputMint}\
&amount=${amount}\
&slippageBps=${slippageBps}`)
  ).json();

  const { swapTransaction } = await (
    await fetch("https://quote-api.jup.ag/v6/swap", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey,
        wrapAndUnwrapSol: true,
        prioritizationFeeLamports: "auto",
        dynamicComputeUnitLimit: true,
      }),
    })
  ).json();

  const swapTransactionBuf = Buffer.from(swapTransaction, "base64");
  const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

  return { transaction, connection };
};

// Function handlers map
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
      const [inputTokenInfo, outputTokenInfo] = await Promise.all([
        getTokenInfo(args.inputToken),
        getTokenInfo(args.outputToken),
      ]);

      if (args.amount <= 0) {
        throw new Error("Amount must be greater than 0");
      }
      if (args.amount > 1000000) {
        throw new Error("Amount too large");
      }

      const inputDecimals = inputTokenInfo.decimals;
      const amountWithDecimals = Math.round(
        args.amount * Math.pow(10, inputDecimals)
      );

      const connection = new Connection(
        clusterApiUrl("mainnet-beta"),
        "confirmed"
      );
      const { transaction } = await create_jupiter_swap(
        inputTokenInfo.address,
        outputTokenInfo.address,
        amountWithDecimals,
        args.slippageBps,
        wallet.publicKey.toString(),
        connection
      );

      const signedTx = await wallet.signTransaction(transaction);
      const signature = await connection.sendRawTransaction(
        signedTx.serialize(),
        {
          skipPreflight: true,
          maxRetries: 2,
        }
      );

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

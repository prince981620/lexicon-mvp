import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  VersionedTransaction,
} from "@solana/web3.js";
import fetch from 'cross-fetch';

export const create_solana_transaction = async (
  recipient_wallet: string,
  amount_sol: number,
  fromPubkey: PublicKey
) => {
  try {
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
    const toPubkey = new PublicKey(recipient_wallet);

    // Create transaction instruction
    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports: amount_sol * LAMPORTS_PER_SOL,
      })
    );

    // Get the latest blockhash
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

export async function create_jupiter_swap(
  inputMint: string,
  outputMint: string,
  amount: number,
  slippageBps: number,
  userPublicKey: string,
  connection?: Connection
) {
  // Create connection if not provided
  if (!connection) {
    connection = new Connection(clusterApiUrl("mainnet-beta"), "confirmed");
  }

  // Get quote
  const quoteResponse = await (
    await fetch(`https://quote-api.jup.ag/v6/quote?inputMint=${inputMint}\
&outputMint=${outputMint}\
&amount=${amount}\
&slippageBps=${slippageBps}`)
  ).json();

  // Get swap transaction
  const { swapTransaction } = await (
    await fetch('https://quote-api.jup.ag/v6/swap', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        quoteResponse,
        userPublicKey,
        wrapAndUnwrapSol: true,
        prioritizationFeeLamports: 'auto',
        dynamicComputeUnitLimit: true,
      })
    })
  ).json();

  // Deserialize the transaction
  const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
  const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

  return { transaction, connection };
}

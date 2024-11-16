import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

export const create_solana_transaction = async (
  sender_public_key: string,
  recipient_wallet: string,
  amount_sol: number
) => {
  try {
    const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

    // Convert addresses to PublicKey objects
    const fromPubkey = new PublicKey(sender_public_key);
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

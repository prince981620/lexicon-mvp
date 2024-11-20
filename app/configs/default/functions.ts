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
import { getTokenInfo } from "../../api/token/tokenMappings";
import fetch from "cross-fetch";
import { AssetItem, PortfolioResult, TokenInfo  } from "../../types/types";


// Transaction creation functions
const create_solana_transaction = async (
  recipient_wallet: string,
  amount_sol: number,
  fromPubkey: PublicKey,
  rpcUrl?: string
) => {
  try {
    const connection = new Connection(
      rpcUrl || clusterApiUrl("devnet"),
      "confirmed"
    );
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
  rpcUrl?: string
) => {
  const connection = new Connection(
    rpcUrl || clusterApiUrl("mainnet-beta"),
    "confirmed"
  );

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

const getPortfolioBalance = async (
  walletAddress: string,
  includeNfts: boolean = true
) => {
  if (!process.env.NEXT_PUBLIC_HELIUS_API_KEY) {
    throw new Error('Helius API key not found');
  }

  const url = process.env.NEXT_PUBLIC_HELIUS_API_KEY;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 'portfolio-analysis',
      method: 'getAssetsByOwner',
      params: {
        ownerAddress: walletAddress,
        page: 1,
        limit: 1000,
        displayOptions: {
          showFungible: true,
          showNativeBalance: true,
          // Remove showNfts as it's not a valid option
          showCollectionMetadata: includeNfts,  // This is the closest equivalent
          showUnverifiedCollections: includeNfts
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  const { result } = await response.json();
  return result;
};

// Function handlers map
export const functionHandlers: Record<string, FunctionHandler> = {
  send_solana_transaction: async (args, wallet, rpcUrl) => {
    if (!wallet.connected || !wallet.signTransaction || !wallet.publicKey) {
      return "Please connect your wallet first";
    }

    try {
      const { transaction, connection } = await create_solana_transaction(
        args.recipient_wallet,
        args.amount_sol,
        wallet.publicKey,
        rpcUrl
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

  swap_tokens: async (args, wallet, rpcUrl) => {
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

      const { transaction } = await create_jupiter_swap(
        inputTokenInfo.address,
        outputTokenInfo.address,
        amountWithDecimals,
        args.slippageBps,
        wallet.publicKey.toString(),
        rpcUrl
      );

      const connection = new Connection(
        rpcUrl || clusterApiUrl("mainnet-beta"),
        "confirmed"
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

  get_portfolio_balance: async (args, wallet) => {
    try {
      const walletAddress = args.walletAddress || wallet.publicKey?.toString();
      
      if (!walletAddress) {
        return "No wallet address provided or connected";
      }

      const portfolio = await getPortfolioBalance(walletAddress, args.includeNfts);
      
      // Format native SOL balance and value
      const solBalance = (portfolio.nativeBalance?.lamports || 0) / LAMPORTS_PER_SOL;
      const solPrice = portfolio.nativeBalance?.price_per_sol || 0;
      const solValue = portfolio.nativeBalance?.total_price || 0;
      
      let response = `📊 Portfolio Analysis for ${walletAddress}\n\n`;
      response += `💰 Native SOL Balance: ${solBalance.toFixed(4)} SOL`;
      response += ` ($${solPrice.toFixed(2)} per SOL = $${solValue.toFixed(2)})\n\n`;
      
      let totalPortfolioValue = solValue;
      
      if (portfolio.items?.length > 0) {
        response += "🪙 Token Holdings:\n";
        portfolio.items
          .filter((item: AssetItem) => item.interface === "FungibleToken")
          .forEach((token: any) => {
            const tokenBalance = token.token_info?.balance || 0;
            const decimals = token.token_info?.decimals || 0;
            const humanBalance = tokenBalance / Math.pow(10, decimals);
            const symbol = token.token_info?.symbol || token.content?.metadata?.symbol || "Unknown";
            const pricePerToken = token.token_info?.price_info?.price_per_token || 0;
            const totalValue = token.token_info?.price_info?.total_price || 0;
            
            totalPortfolioValue += totalValue;
            
            response += `- ${humanBalance.toFixed(4)} ${symbol}`;
            if (pricePerToken > 0) {
              response += ` ($${pricePerToken.toFixed(6)} per token = $${totalValue.toFixed(2)})\n`;
            } else {
              response += ` (No price data available)\n`;
            }
          });
          
        if (args.includeNfts) {
          const nfts = portfolio.items.filter((item: AssetItem) => item.interface === "V1_NFT");
          response += `\n🖼️ NFTs: ${nfts.length} items\n`;
        }
      }
      
      response += `\n💎 Total Portfolio Value: $${totalPortfolioValue.toFixed(2)}\n`;

      return response;
    } catch (error: unknown) {
      console.error("Portfolio analysis error:", error);
      if (error instanceof Error) {
        return `Failed to get portfolio: ${error.message}`;
      }
      return "Failed to get portfolio: Unknown error occurred";
    }
  },
};
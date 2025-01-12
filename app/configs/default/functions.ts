import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  clusterApiUrl,
  LAMPORTS_PER_SOL,
  VersionedTransaction,
  TransactionMessage,
  AddressLookupTableAccount,
} from "@solana/web3.js";
import { FunctionHandler } from "../../types/types";
import fetch from "cross-fetch";
import { AssetItem} from "../../types/types";
import { API_URLS } from '@raydium-io/raydium-sdk-v2'
import { parseTokenAccountResp } from '@raydium-io/raydium-sdk-v2'
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token'


import { NATIVE_MINT } from '@solana/spl-token'
import axios from 'axios'

interface SwapCompute {
  id: string
  success: true
  version: 'V0' | 'V1'
  openTime?: undefined
  msg: undefined
  data: {
    swapType: 'BaseIn' | 'BaseOut'
    inputMint: string
    inputAmount: string
    outputMint: string
    outputAmount: string
    otherAmountThreshold: string
    slippageBps: number
    priceImpactPct: number
    routePlan: {
      poolId: string
      inputMint: string
      outputMint: string
      feeMint: string
      feeRate: number
      feeAmount: string
    }[]
  }
}

const pubKey = process.env.NEXT_PUBLIC_PLATFORM_FEE_ADDRESS;
const mint = process.env.NEXT_PUBLIC_L24AI_MINT;
const platformFeeAddress = new PublicKey(pubKey);
const url = process.env.NEXT_PUBLIC_QUICKNODE_RPC_URL;
const connection = new Connection(
  url,
  "confirmed"
);

export const fetchTokenAccountData = async (owner:PublicKey) => {
  const solAccountResp = await connection.getAccountInfo(owner)
  const tokenAccountResp = await connection.getTokenAccountsByOwner(owner, { programId: TOKEN_PROGRAM_ID })
  const token2022Req = await connection.getTokenAccountsByOwner(owner, { programId: TOKEN_2022_PROGRAM_ID })
  const tokenAccountData = parseTokenAccountResp({
    owner: owner,
    solAccountResp,
    tokenAccountResp: {
      context: tokenAccountResp.context,
      value: [...tokenAccountResp.value, ...token2022Req.value],
    },
  })
  return tokenAccountData
}


export const addFeeInstruction  = ( buyer: PublicKey, amount: number) =>  {
  const feeAmount: number = amount*0.1;
  const platform: PublicKey = new PublicKey(platformFeeAddress);
  const feeInstruction = SystemProgram.transfer({
    fromPubkey: buyer,
    toPubkey: platform,
    lamports: feeAmount,
  })
  return feeInstruction;
};



export const sellToken = async (owner: PublicKey, mint: PublicKey, tokenAmount: number) => {
  try {
    const inputMint = mint.toBase58(); 
    const outputMint = NATIVE_MINT.toBase58()
    const slippage = 0.5
    const txVersion: string = 'V0'
    const isV0Tx = txVersion === 'V0'

    const RAY_DECIMALS = 6
    const scaledAmount = tokenAmount * Math.pow(10, RAY_DECIMALS)

    console.log('Requesting quote for', scaledAmount, 'RAY tokens')
    const { data: quoteResponse } = await axios.get<SwapCompute>(
      `${API_URLS.SWAP_HOST}/compute/swap-base-in?inputMint=${inputMint}&outputMint=${outputMint}&amount=${scaledAmount}&slippageBps=${slippage * 100}&txVersion=${txVersion}`
    )

    if (!quoteResponse.success) {
      console.error('Quote failed:', quoteResponse)
      throw new Error('Failed to get quote: ' + quoteResponse.msg)
    }

    const expectedSolReturn = Number(quoteResponse.data.outputAmount)
    const feeAmount = Math.floor(expectedSolReturn * 0.01) // 1% fee

    const addFeeInstruction = (owner: PublicKey, feeInLamports: number) => {
      const platform = new PublicKey(platformFeeAddress)
      return SystemProgram.transfer({
        fromPubkey: owner,
        toPubkey: platform,
        lamports: feeInLamports,
      })
    }

    const { tokenAccounts } = await fetchTokenAccountData(owner);
    const inputTokenAcc = tokenAccounts.find((a) => a.mint.toBase58() === inputMint)?.publicKey
    const outputTokenAcc = tokenAccounts.find((a) => a.mint.toBase58() === outputMint)?.publicKey

    if (!inputTokenAcc) {
      throw new Error('No input token account found')
    }

    const { data: swapTransactions } = await axios.post(
      `${API_URLS.SWAP_HOST}/transaction/swap-base-in`,
      {
        computeUnitPriceMicroLamports: '1',
        swapResponse: quoteResponse,
        txVersion,
        wallet: owner.toBase58(),
        wrapSol: false,
        unwrapSol: true,
        inputAccount: inputTokenAcc.toBase58(),
        outputAccount: outputTokenAcc?.toBase58(),
      }
    )

    console.log('Expected SOL return:', expectedSolReturn / LAMPORTS_PER_SOL, 'SOL')
    console.log('Fee amount:', feeAmount , 'LAMPORTS')

  interface SwapTransaction {
      transaction: string
  }

  interface SwapResponse {
      data: SwapTransaction[]
  }
  // @ts-ignore
  const allTxBuf: Buffer[] = (swapTransactions as SwapTransactionsResponse).data.map((tx: SwapTransaction) => Buffer.from(tx.transaction, 'base64'))
    const allTransactions = allTxBuf.map((txBuf) => VersionedTransaction.deserialize(txBuf))

    for (const tx of allTransactions) {
      try {
        const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed')

        const addressLookupTableAccounts = await Promise.all(
          tx.message.addressTableLookups.map(async (lookup) => {
            return await connection.getAddressLookupTable(lookup.accountKey).then((res) => res.value)
          })
        )

        const validAddressLookupTableAccounts = addressLookupTableAccounts.filter(
          (account): account is AddressLookupTableAccount => account !== null
        )

        const accounts = tx.message.getAccountKeys({ addressLookupTableAccounts: validAddressLookupTableAccounts })

        const feeIx = addFeeInstruction(owner, feeAmount)
        const newMessage = new TransactionMessage({
          payerKey: owner,
          recentBlockhash: blockhash,
          instructions: [
            // First do the swap
            ...tx.message.compiledInstructions.map((ix) => ({
              programId: accounts.get(ix.programIdIndex)!,
              keys: ix.accountKeyIndexes.map((idx) => ({
                pubkey: accounts.get(idx)!,
                isSigner: tx.message.isAccountSigner(idx),
                isWritable: tx.message.isAccountWritable(idx),
              })),
              data: Buffer.from(ix.data),
            })),
            feeIx,
          ],
        }).compileToV0Message()

        const newTx = new VersionedTransaction(newMessage);
                try {
          return newTx;
        } catch (e: any) {
          if (e.message.includes('User rejected')) {
            throw new Error('Transaction was cancelled by user');
          }
          throw e;
        }
        
      } catch (e: any) {
        if (e.message.includes('User rejected')) {
          throw new Error('Transaction was cancelled by user');
        }
        console.error('Transaction failed:', e.message);
        throw e;
      }
    }
  } catch (e: any) {
    if (e.message.includes('User rejected')) {
      throw new Error('Transaction was cancelled by user');
    }
    console.error('Transaction failed:', e.message);
    throw e;
  }
}

export const buyToken = async (owner: PublicKey, mint: PublicKey, amountinSol: number) => {
  try {
    const inputMint = NATIVE_MINT.toBase58();


    const outputMint =  mint.toBase58();
    const amount = amountinSol*LAMPORTS_PER_SOL

    const slippage = 0.5 
    const txVersion: string = 'V0' 
    const isV0Tx = txVersion === 'V0'

    const [isInputSol, isOutputSol] = [inputMint === NATIVE_MINT.toBase58(), outputMint === NATIVE_MINT.toBase58()]
    

    const { tokenAccounts } = await fetchTokenAccountData(owner);
    const inputTokenAcc = tokenAccounts.find((a) => a.mint.toBase58() === inputMint)?.publicKey
    const outputTokenAcc = tokenAccounts.find((a) => a.mint.toBase58() === outputMint)?.publicKey

    if (!inputTokenAcc && !isInputSol) {
      console.error('do not have input token account')
      return null;
    }
    const { data } = await axios.get<{
      id: string
      success: boolean
      data: { default: { vh: number; h: number; m: number } }
    }>(`${API_URLS.BASE_HOST}${API_URLS.PRIORITY_FEE}`)

    const { data: swapResponse } = await axios.get<SwapCompute>(
      `${
        API_URLS.SWAP_HOST
      }/compute/swap-base-in?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${
        slippage * 100
      }&txVersion=${txVersion}`
    )

    const { data: swapTransactions } = await axios.post<{
      id: string
      version: string
      success: boolean
      data: { transaction: string }[]
    }>(`${API_URLS.SWAP_HOST}/transaction/swap-base-in`, {
      computeUnitPriceMicroLamports: String(data.data.default.h),
      swapResponse,
      txVersion,
      wallet: owner.toBase58(),
      wrapSol: isInputSol,
      unwrapSol: isOutputSol, // true means output mint receive sol, false means output mint received wsol
      inputAccount: isInputSol ? undefined : inputTokenAcc?.toBase58(),
      outputAccount: isOutputSol ? undefined : outputTokenAcc?.toBase58(),
    })
    swapTransactions.data.forEach((tx) => console.log(
      // tx.transaction.
      "This is transaction message --->",tx.transaction
  ))

    const allTxBuf = swapTransactions.data.map((tx) => Buffer.from(tx.transaction, 'base64'));
    
    const allTransactions = allTxBuf.map((txBuf) =>
      isV0Tx ? VersionedTransaction.deserialize(txBuf) : Transaction.from(txBuf)
    )


    console.log(`total ${allTransactions.length} transactions`, swapTransactions)

    let idx = 0
    if (!isV0Tx) {
    } else {
      console.log('This is V0 transaction');
      for (const tx of allTransactions) {
        idx++
        const transaction = tx as VersionedTransaction
        
        try {
          const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
          
          const feeIx = addFeeInstruction(owner, amount);
          
          const addressLookupTableAccounts = await Promise.all(
            transaction.message.addressTableLookups.map(async (lookup) => {
              return await connection.getAddressLookupTable(lookup.accountKey).then((res) => res.value);
            })
          );
          
          const validAddressLookupTableAccounts = addressLookupTableAccounts.filter((account): account is AddressLookupTableAccount => account !== null);
          const accounts = transaction.message.getAccountKeys({ addressLookupTableAccounts: validAddressLookupTableAccounts });
          
          const newMessage = new TransactionMessage({
            payerKey: owner,
            recentBlockhash: blockhash,
            instructions: [
              feeIx,
              ...transaction.message.compiledInstructions.map((ix) => ({
                programId: accounts.get(ix.programIdIndex)!,
                keys: ix.accountKeyIndexes.map((idx) => ({
                  pubkey: accounts.get(idx)!,
                  isSigner: transaction.message.isAccountSigner(idx),
                  isWritable: transaction.message.isAccountWritable(idx),
                })),
                data: Buffer.from(ix.data),
              })),
            ],
          }).compileToV0Message();

          const newTx = new VersionedTransaction(newMessage);
          try {
            return newTx;
          } catch (e: any) {
            if (e.message.includes('User rejected')) {
              throw new Error('Transaction was cancelled by user');
            }
            throw e;
          }
          
        } catch (e: any) {
          if (e.message.includes('User rejected')) {
            throw new Error('Transaction was cancelled by user');
          }
          console.error('Transaction failed:', e.message);
          throw e;
        }
      }
    }
  } catch (e: any) {
    if (e.message.includes('User rejected')) {
      throw new Error('Transaction was cancelled by user');
    }
    console.error('Transaction failed:', e.message);
    throw e;
  }
}

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


const getPortfolioBalance = async (
  walletAddress: string,
  includeNfts: boolean = true
) => {
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
          showCollectionMetadata: includeNfts,
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

const getTokenBalance = async (connection: Connection, owner: PublicKey, mint: PublicKey): Promise<number> => {
  try {
    const { tokenAccounts } = await fetchTokenAccountData(owner);
    const tokenAccount = tokenAccounts.find((a) => a.mint.equals(mint));
    if (!tokenAccount) return 0;
    return tokenAccount.amount / Math.pow(10, 6); // Assuming 6 decimals
  } catch (error) {
    console.error('Error getting token balance:', error);
    return 0;
  }
};

const getSolBalance = async (connection: Connection, owner: PublicKey): Promise<number> => {
  try {
    const balance = await connection.getBalance(owner);
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Error getting SOL balance:', error);
    return 0;
  }
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

      return `Transaction successful! ✅`;
    } catch (error: unknown) {
      console.error("Transaction error:", error);
      if (error instanceof Error) {
        return `Transaction failed: ${error.message}`;
      }
      return "Transaction failed: Unknown error occurred";
    }
  },

  sell_L24AI: async (args, wallet): Promise<string> => {
    if (!wallet.connected || !wallet.signTransaction || !wallet.publicKey) {
      return "Please connect your wallet first";
    }

    try {
      // Check L24AI token balance first
      const tokenBalance = await getTokenBalance(
        connection,
        wallet.publicKey,
        new PublicKey(mint)
      );

      if (tokenBalance < args.amount) {
        return `Insufficient L24AI balance. You have ${tokenBalance.toFixed(2)} L24AI but tried to sell ${args.amount} L24AI`;
      }

      // Check if user has enough SOL for gas (0.01 SOL should be enough)
      const solBalance = await getSolBalance(connection, wallet.publicKey);
      if (solBalance < 0.01) {
        return `Insufficient SOL for transaction fees. You need at least 0.01 SOL`;
      }

      const tx = await sellToken(
        wallet.publicKey,
        new PublicKey(mint),
        args.amount
      );

      if (!tx) {
        throw new Error("Failed to create transaction");
      }

      try {
        const signedTx = await wallet.signTransaction(tx);
        const latestBlockhash = await connection.getLatestBlockhash();
        
        const signature = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: true,
          maxRetries: 3,
          preflightCommitment: "confirmed"
        });

        await connection.confirmTransaction({
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        });

        return `Transaction successful! ✅`;
      } catch (e: any) {
        if (e.message.includes('User rejected')) {
          return "Transaction was cancelled by user. You can try again.";
        }
        throw e;
      }
    } catch (error: unknown) {
      console.error("Transaction error:", error);
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          return "Transaction was cancelled by user. You can try again.";
        }
        return `Transaction failed: ${error.message}`;
      }
      return "Transaction failed: Unknown error occurred";
    }
  },

  buy_L24AI: async (args, wallet): Promise<string> => {
    if (!wallet.connected || !wallet.signTransaction || !wallet.publicKey) {
      return "Please connect your wallet first";
    }

    const rpcUrl = process.env.NEXT_PUBLIC_QUICKNODE_RPC_URL;
    const connection = new Connection(
      rpcUrl || clusterApiUrl("mainnet-beta"),
      "confirmed"
    );

    try {
      // Check SOL balance first
      const solBalance = await getSolBalance(connection, wallet.publicKey);
      const requiredSol = args.amount + 0.01; // Adding 0.01 SOL for fees and gas
      
      if (solBalance < requiredSol) {
        return `Insufficient SOL balance. You need at least ${requiredSol} SOL but have ${solBalance.toFixed(4)} SOL`;
      }

      const tx = await buyToken(
        wallet.publicKey,
        new PublicKey(mint),
        args.amount
      );

      if (!tx) {
        throw new Error("Failed to create transaction");
      }

      try {
        const signedTx = await wallet.signTransaction(tx);
        const latestBlockhash = await connection.getLatestBlockhash();
        
        const signature = await connection.sendRawTransaction(signedTx.serialize(), {
          skipPreflight: true,
          maxRetries: 3,
          preflightCommitment: "confirmed"
        });

        await connection.confirmTransaction({
          signature,
          blockhash: latestBlockhash.blockhash,
          lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
        });
        
        return `Transaction successful! ✅\n\nAmount: ${args.amount} SOL`;
        // return `Transaction successful! ✅\n\nAmount: ${args.amount} SOL\n[View on Solscan](https://solscan.io/tx/${signature})`;
      } catch (e: any) {
        if (e.message.includes('User rejected')) {
          return "Transaction was cancelled by user. You can try again.";
        }
        throw e;
      }
    } catch (error: unknown) {
      console.error("Transaction error:", error);
      if (error instanceof Error) {
        if (error.message.includes('User rejected')) {
          return "Transaction was cancelled by user. You can try again.";
        }
        return `Transaction failed: ${error.message}`;
      }
      return "Transaction failed: Unknown error occurred";
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
export const tools = [
  {
    name: "send_solana_transaction",
    description:
      "Creates a Solana transaction to send a specified amount of SOL to a recipient wallet.",
    strict: true,
    parameters: {
      type: "object",
      required: ["recipient_wallet", "amount_sol"],
      properties: {
        amount_sol: {
          type: "number",
          description: "The amount of SOL to send.",
        },
        recipient_wallet: {
          type: "string",
          description: "The recipient's Solana wallet address. guney means C43TUJNRzeo3cTQo7h9UYmqZwivUNp8tE1WTFdTLMmid",
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "swap_tokens",
    description: "Swaps tokens using Jupiter Exchange on Solana.",
    strict: true,
    parameters: {
      type: "object",
      required: ["inputMint", "outputMint", "amount", "slippageBps"],
      properties: {
        inputMint: {
          type: "string",
          description: "The input token's mint address",
        },
        outputMint: {
          type: "string",
          description: "The output token's mint address",
        },
        amount: {
          type: "number",
          description: "The amount of input tokens (in smallest denomination)",
        },
        slippageBps: {
          type: "number",
          description: "Slippage tolerance in basis points (e.g., 50 = 0.5%)",
        },
      },
      additionalProperties: false,
    },
  },
];

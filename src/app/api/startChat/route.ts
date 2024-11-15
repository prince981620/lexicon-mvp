// src/app/api/startChat/route.ts
import type { NextRequest } from 'next/server';
import { LexiconSDK } from 'lexicon-sdk-mvp';

export async function POST(req: NextRequest) {
    const { userInput } = await req.json();
    const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;

    if (!userInput || !apiKey) {
        return new Response(JSON.stringify({ message: 'Invalid input or missing API key' }), { status: 400 });
    }

    try {
        const response = await LexiconSDK.startChat(apiKey, [userInput]);
        return new Response(JSON.stringify({ response }), { status: 200 });
    } catch (error) {
        console.error("Error starting chat:", error);
        return new Response(JSON.stringify({ message: 'Internal server error' }), { status: 500 });
    }
}
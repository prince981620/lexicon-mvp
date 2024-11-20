"use client";

import LexiconButton from '../components/LexiconButton';
import { useSearchParams } from 'next/navigation';

export default function ChatWidget() {
  const searchParams = useSearchParams();
  const configId = searchParams?.get('configId') || 'default';
  
  return (
    <div className="fixed bottom-0 right-0 w-fit h-fit bg-transparent">
      <LexiconButton configId={configId} />
    </div>
  );
}

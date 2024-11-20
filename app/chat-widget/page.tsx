"use client";

import LexiconButton from '../components/LexiconButton';
import { useSearchParams } from 'next/navigation';

export default function ChatWidget() {
  const searchParams = useSearchParams();
  const configId = searchParams?.get('configId') || 'default';
  
  return (
      <LexiconButton configId={configId} />
  );
}

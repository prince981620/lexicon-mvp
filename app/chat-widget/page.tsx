"use client";

import LexiconButton from '../components/LexiconButton';
import { useSearchParams } from 'next/navigation';

export default function ChatWidget() {
  const searchParams = useSearchParams();
  const configId = searchParams?.get('configId') || 'default';
  
  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      right: 0,
      width: 'fit-content',
      height: 'fit-content',
      background: 'none',
      backgroundColor: 'transparent'
    }}>
      <LexiconButton configId={configId} />
    </div>
  );
}

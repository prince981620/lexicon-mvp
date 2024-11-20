"use client";

import LexiconButton from '../components/LexiconButton';

export default function ChatWidget() {
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const configId = params.get('configId') || 'default';
  
  return <LexiconButton configId={configId} />;
}

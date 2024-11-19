"use client";

import LexiconButton from '../components/LexiconButton';

export default function ChatWidget() {
  // Apply any URL parameters passed to the iframe
  const params = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const configId = params.get('configId') || 'default';
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <LexiconButton configId={configId} />
    </div>
  );
}

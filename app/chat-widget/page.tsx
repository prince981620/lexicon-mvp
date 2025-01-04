"use client";

import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

const LexiconButton = dynamic(
  () => import('../components/LexiconButton'),
  { ssr: false }
);

function ChatWidgetContent() {
  const searchParams = useSearchParams();
  const configId = searchParams?.get('configId') || 'default';
  
  return <LexiconButton configId={configId} />;
}

export default function ChatWidget() {
  return (
    <div className="bg-transparent">
      <Suspense fallback={<div>Loading...</div>}>
        <ChatWidgetContent />
      </Suspense>
    </div>
  );
}

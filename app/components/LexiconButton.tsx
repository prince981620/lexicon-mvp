"use client";

import { useState, useEffect } from 'react';
import LexiconPopup from "./LexiconPopup";
import { ChatComponentProps } from "../types/types";

interface LexiconButtonProps extends ChatComponentProps {
  buttonClassName?: string;
}

const LexiconButton: React.FC<LexiconButtonProps> = ({
  configId = "default",
  buttonClassName,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (window.parent !== window) {
      const size = isOpen ? { width: 380, height: 680 } : { width: 120, height: 32 };
      window.parent.postMessage({
        type: 'resize',
        ...size
      }, '*');
    }
  }, [isOpen]);

  return (
    <div className="inline-flex">
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center justify-center gap-1.5 w-[120px] h-[32px] bg-transparent text-white rounded-full overflow-hidden"
        >
          <img
            src="/lexicon/lexicon-logo.png"
            alt="Lexicon AI"
            className="h-4 w-4 rounded-full"
          />
          <span className="text-xs font-medium">Chat with AI</span>
        </button>
      ) : (
        <LexiconPopup
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          configId={configId}
        />
      )}
    </div>
  );
};

export default LexiconButton;

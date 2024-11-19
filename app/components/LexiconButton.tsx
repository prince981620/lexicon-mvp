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

  // Notify parent window when chat opens/closes to adjust iframe size
  useEffect(() => {
    if (window.parent !== window) {
      const size = isOpen ? { width: 500, height: 800 } : { width: 200, height: 60 };
      window.parent.postMessage({
        type: 'resize',
        ...size
      }, '*');
    }
  }, [isOpen]);

  return (
    <div className="w-full">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={
            buttonClassName ||
            "group relative flex items-center gap-3 px-6 py-3 bg-black hover:bg-black/90 text-white rounded-full overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
          }
        >
          <img
            src="/lexicon/lexicon-logo.png"
            alt="Lexicon AI"
            className="h-5 w-5 rounded-full"
          />
          <span className="text-base font-medium">Chat with Lexicon</span>
          <div className="absolute inset-0 bg-white/10 group-hover:animate-shimmer" />
        </button>
      )}

      <LexiconPopup
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        configId={configId}
      />
    </div>
  );
};

export default LexiconButton;

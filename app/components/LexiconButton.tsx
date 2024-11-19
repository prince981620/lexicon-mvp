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
      const size = isOpen ? { width: 380, height: 680 } : { width: 200, height: 48 };
      window.parent.postMessage({
        type: 'resize',
        ...size
      }, '*');
    }
  }, [isOpen]);

  return (
    <>
      {!isOpen ? (
        <button
          onClick={() => setIsOpen(true)}
          className={
            buttonClassName ||
            "fixed bottom-0 right-0 group flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-black/90 text-white rounded-tl-2xl overflow-hidden transition-all duration-300 hover:shadow-lg"
          }
        >
          <img
            src="/lexicon/lexicon-logo.png"
            alt="Lexicon AI"
            className="h-5 w-5 rounded-full"
          />
          <span className="text-sm font-medium">Chat with Lexicon</span>
        </button>
      ) : (
        <div className="fixed bottom-0 right-0 bg-black">
          <LexiconPopup
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
            configId={configId}
          />
        </div>
      )}
    </>
  );
};

export default LexiconButton;

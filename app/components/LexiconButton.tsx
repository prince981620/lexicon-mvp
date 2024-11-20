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
      const size = isOpen ? { width: 380, height: 680 } : { width: 180, height: 48 };
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
          className={
            buttonClassName ||
            "flex items-center gap-2 px-4 py-2.5 bg-black hover:bg-black/90 text-white rounded-full overflow-hidden transition-all duration-300 hover:shadow-lg"
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

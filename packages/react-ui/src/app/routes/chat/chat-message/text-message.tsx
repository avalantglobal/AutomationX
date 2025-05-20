import React, { useEffect, useState } from 'react';
import { useTheme } from '@/components/theme-provider';
import { CopyButton } from '@/components/ui/copy-button';
import { SplitCodeText, splitMarkdownByCodeBlocks } from '@/lib/utils';
import { MessageBlock } from './text-message-block';

interface TextMessageProps {
  content: string;
  role: 'user' | 'bot';
}

export const TextMessage: React.FC<TextMessageProps> = React.memo(
  ({ content, role }) => {
    const { theme } = useTheme();
    const [displayedBlocks, setDisplayedBlocks] = useState<SplitCodeText[]>([]);

    useEffect(() => {
      const chunks = splitMarkdownByCodeBlocks(content);
      let currentPart = 0;
      let currentChar = 0;
      let buffer = '';
      let currentBlocks: SplitCodeText[] = [];
      let animationFrame: number;

      const stream = () => {
        if (currentPart >= chunks.length) return;

        const { text, isCodeBlock } = chunks[currentPart];
        const char = text[currentChar];

        if (currentChar < text.length) {
          buffer += char;
          currentChar++;

          const newBlocks = [...currentBlocks, { text: buffer, isCodeBlock }];
          setDisplayedBlocks(newBlocks);
        } else {
          currentBlocks.push({ text: buffer, isCodeBlock });
          buffer = '';
          currentChar = 0;
          currentPart++;
        }

        animationFrame = window.setTimeout(stream, isCodeBlock ? 50 : 15);
      };

      setDisplayedBlocks([]);
      stream();

      return () => clearTimeout(animationFrame);
    }, [content]);

    return (
      <div className="relative">
        {displayedBlocks.map((block, i) => (
          <MessageBlock key={i} block={block} theme={theme} />
        ))}

        {role === 'bot' && displayedBlocks.length > 0 && (
          <CopyButton
            textToCopy={displayedBlocks.map((b) => b.text).join('')}
            tooltipSide="bottom"
            className="absolute top-0 right-0 size-6 p-1 mt-2"
          />
        )}
      </div>
    );
  },
  (prev, next) => prev.content === next.content && prev.role === next.role
);

TextMessage.displayName = 'TextMessage';

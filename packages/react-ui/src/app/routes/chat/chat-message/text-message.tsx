import { javascript } from '@codemirror/lang-javascript';
import { githubDark, githubLight } from '@uiw/codemirror-theme-github';
import ReactCodeMirror, {
  EditorState,
  EditorView,
} from '@uiw/react-codemirror';
import { CodeIcon, Copy } from 'lucide-react';
import React, { useEffect, useState, useMemo } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { cn } from '@/lib/utils';
import { FileResponseInterface } from '@activepieces/shared';

interface TextMessageProps {
  content: string;
  role: 'user' | 'bot';
  attachments?: FileResponseInterface[];
}

interface SplitCodeText {
  text: string;
  isCodeBlock: boolean;
}

const splitMarkdownByCodeBlocks = (text: string): SplitCodeText[] => {
  const regex = /(```[\s\S]*?```)/g;
  const parts = text
    .split(regex)
    .filter((part) => part.trim() !== '')
    .map((d) => ({
      text: d,
      isCodeBlock: d.includes('```'),
    }));
  return parts;
};

export const TextMessage: React.FC<TextMessageProps> = React.memo(
  ({ content, role }) => {
    const { theme } = useTheme();
    const [displayedBlocks, setDisplayedBlocks] = useState<SplitCodeText[]>([]);
    const extensions = useMemo(
      () => [
        theme === 'dark' ? githubDark : githubLight,
        EditorState.readOnly.of(true),
        EditorView.editable.of(false),
        javascript({ jsx: false, typescript: true }),
      ],
      [theme]
    );

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

      return () => {
        clearTimeout(animationFrame);
      };
    }, [content]);

    return (
      <div className="relative">
        {displayedBlocks.map((block, i) => {
          if (block.isCodeBlock) {
            const match = /```(\w+)?/.exec(block.text);
            const language = match?.[1] || 'plaintext';
            const codeContent = block.text
              .replace(/```[\w-]*\n?/, '')
              .replace(/```$/, '')
              .trim();

            return (
              <div
                key={i}
                className={cn(
                  'relative border rounded-md p-4 pt-12 my-4',
                  theme === 'dark' ? 'bg-[#0E1117]' : 'bg-background'
                )}
              >
                <ReactCodeMirror
                  value={codeContent}
                  className="border-none"
                  width="100%"
                  minHeight="50px"
                  basicSetup={{
                    syntaxHighlighting: true,
                    foldGutter: false,
                    lineNumbers: false,
                    searchKeymap: true,
                    lintKeymap: true,
                    autocompletion: false,
                    highlightActiveLine: false,
                    highlightActiveLineGutter: false,
                    highlightSpecialChars: false,
                    indentOnInput: false,
                    bracketMatching: false,
                    closeBrackets: false,
                  }}
                  theme={theme === 'dark' ? githubDark : githubLight}
                  extensions={extensions}
                />
                <div className="absolute top-4 left-5 text-xs text-gray-500 flex items-center gap-1">
                  <CodeIcon className="size-3" />
                  <span>{language}</span>
                </div>
                <CopyCode
                  textToCopy={codeContent}
                  className="absolute top-2 right-2 text-xs text-gray-500"
                />
              </div>
            );
          }

          return (
            <Markdown
              key={i}
              remarkPlugins={[remarkGfm]}
              className="bg-inherit whitespace-pre-wrap my-2"
              components={{
                code({ node, inline, className, children, ...props }: any) {
                  return !inline ? (
                    <code
                      className={cn(
                        className,
                        'bg-gray-200 px-[6px] py-[2px] rounded-xs font-mono text-sm'
                      )}
                      {...props}
                    >
                      {String(children).trim()}
                    </code>
                  ) : (
                    <div className="font-mono text-sm">{children}</div>
                  );
                },
              }}
            >
              {block.text}
            </Markdown>
          );
        })}

        {role === 'bot' && displayedBlocks.length > 0 && (
          <CopyButton
            textToCopy={displayedBlocks.map((b) => b.text).join()}
            tooltipSide="bottom"
            className="absolute top-0 right-0 size-6 p-1 mt-2"
          />
        )}
      </div>
    );
  },
  (prevProps, nextProps) =>
    prevProps.content === nextProps.content && prevProps.role === nextProps.role
);

TextMessage.displayName = 'TextMessage';

const CopyCode = ({
  textToCopy,
  className,
}: {
  textToCopy: string;
  className?: string;
}) => {
  const [isCopied, setIsCopied] = React.useState(false);

  return (
    <div className={className}>
      <Button
        variant="ghost"
        className="gap-2"
        size="xs"
        onClick={() => {
          setIsCopied(true);
          navigator.clipboard.writeText(textToCopy);
          setTimeout(() => setIsCopied(false), 1500);
        }}
      >
        <Copy className="size-4" />
        <span className="text-xs">{isCopied ? 'Copied!' : 'Copy Code'}</span>
      </Button>
    </div>
  );
};

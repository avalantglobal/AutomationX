import React from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn, SplitCodeText } from '@/lib/utils';

export const MarkdownBlock = ({ block }: { block: SplitCodeText }) => {
  return (
    <Markdown
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
};

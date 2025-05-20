import React from 'react';
import { Button } from '@/components/ui/button';
import { Copy } from 'lucide-react';

export const CopyCode = ({
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

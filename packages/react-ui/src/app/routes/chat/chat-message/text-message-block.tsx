import { SplitCodeText } from '@/lib/utils';
import { MarkdownBlock } from './markdown-message';
import { CodeBlock } from './code-message';

export const MessageBlock = ({
  block,
  theme,
}: {
  block: SplitCodeText;
  theme: string;
}) => {
  return block.isCodeBlock ? (
    <CodeBlock block={block} theme={theme} />
  ) : (
    <MarkdownBlock block={block} />
  );
};

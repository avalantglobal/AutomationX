import ReactCodeMirror, {
  EditorState,
  EditorView,
} from '@uiw/react-codemirror';
import { CodeIcon } from 'lucide-react';
import { cn, SplitCodeText } from '@/lib/utils';
import { CopyCode } from './copy-code';
import { useMemo } from 'react';
import { githubDark, githubLight } from '@uiw/codemirror-theme-github';
import { javascript } from '@codemirror/lang-javascript';
export const CodeBlock = ({
  block,
  theme,
}: {
  block: SplitCodeText;
  theme: string;
}) => {
  const match = /```(\w+)?/.exec(block.text);
  const language = match?.[1] || 'plaintext';
  const codeContent = block.text
    .replace(/```[\w-]*\n?/, '')
    .replace(/```$/, '')
    .trim();

  const extensions = useMemo(
    () => [
      theme === 'dark' ? githubDark : githubLight,
      EditorState.readOnly.of(true),
      EditorView.editable.of(false),
      javascript({ jsx: false, typescript: true }),
    ],
    [theme]
  );

  return (
    <div
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
};

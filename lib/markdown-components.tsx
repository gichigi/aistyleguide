// Shared markdown components for consistent styling
import { ReactNode } from "react";

export const MarkdownComponents = {
  h1: ({ node, children, ...props }: { node?: any; children?: ReactNode }) => (
    <h1
      className="text-4xl font-bold mt-8 mb-4 pb-2 border-b-2 border-primary/30 text-primary dark:text-primary-foreground inline-block"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ node, children, ...props }: { node?: any; children?: ReactNode }) => (
    <h2 className="text-3xl font-bold mt-6 mb-3" {...props}>
      {children}
    </h2>
  ),
  h3: ({ node, children, ...props }: { node?: any; children?: ReactNode }) => (
    <h3 className="text-2xl font-bold mt-5 mb-2" {...props}>
      {children}
    </h3>
  ),
  p: ({ node, children, ...props }: { node?: any; children?: ReactNode }) => (
    <p className="text-base mb-4 text-gray-700 dark:text-gray-300" {...props}>
      {children}
    </p>
  ),
  ul: ({ node, children, ...props }: { node?: any; children?: ReactNode }) => (
    <ul className="list-disc list-inside mb-4 space-y-2" {...props}>
      {children}
    </ul>
  ),
  li: ({ node, children, ...props }: { node?: any; children?: ReactNode }) => (
    <li className="text-base text-gray-700 dark:text-gray-300" {...props}>
      {children}
    </li>
  ),
  em: ({ node, children, ...props }: { node?: any; children?: ReactNode }) => (
    <em className="italic text-muted-foreground" {...props}>
      {children}
    </em>
  ),
  strong: ({
    node,
    children,
    ...props
  }: {
    node?: any;
    children?: ReactNode;
  }) => (
    <strong className="font-bold text-gray-900 dark:text-white" {...props}>
      {children}
    </strong>
  ),
  code: ({
    node,
    children,
    ...props
  }: {
    node?: any;
    children?: ReactNode;
  }) => (
    <code
      className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm"
      {...props}
    >
      {children}
    </code>
  ),
  date: ({ children }: { children?: ReactNode }) => (
    <span style={{ fontSize: 12, textTransform: "uppercase", color: "gray" }}>
      {children}
    </span>
  ),
};

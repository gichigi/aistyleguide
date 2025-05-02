// Shared markdown components for consistent styling
export const MarkdownComponents = {
  h1: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
    <h1 
      className="text-5xl font-extrabold mt-12 mb-6 pb-3 border-b-4 border-primary/40 text-primary dark:text-primary-foreground tracking-tight drop-shadow-sm" 
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
    <h2 
      className="text-4xl font-bold mt-10 mb-5 pb-2 border-b-2 border-primary/30 text-primary dark:text-primary-foreground tracking-tight" 
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
    <h3 
      className="text-2xl font-semibold mt-8 mb-4 text-primary dark:text-primary-foreground" 
      {...props}
    >
      {children}
    </h3>
  ),
  p: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
    <p 
      className="text-lg mb-5 text-gray-700 dark:text-gray-300 leading-relaxed" 
      {...props}
    >
      {children}
    </p>
  ),
  ul: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
    <ul 
      className="list-disc list-inside mb-6 space-y-3" 
      {...props}
    >
      {children}
    </ul>
  ),
  li: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
    <li 
      className="text-lg text-gray-700 dark:text-gray-300" 
      {...props}
    >
      {children}
    </li>
  ),
  em: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
    <em 
      className="italic text-muted-foreground" 
      {...props}
    >
      {children}
    </em>
  ),
  strong: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
    <strong 
      className="font-bold text-gray-900 dark:text-white" 
      {...props}
    >
      {children}
    </strong>
  ),
  code: ({ children, ...props }: { children: React.ReactNode; [key: string]: any }) => (
    <code 
      className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-base" 
      {...props}
    >
      {children}
    </code>
  ),
  // New component for colored blocks
  coloredBlock: ({ children, type, ...props }: { children: React.ReactNode; type: 'do' | 'dont'; [key: string]: any }) => (
    <div 
      className={`p-4 rounded-lg mb-4 ${type === 'do' ? 'bg-blue-100 dark:bg-blue-900' : 'bg-red-100 dark:bg-red-900'}`} 
      {...props}
    >
      {children}
    </div>
  ),
} 
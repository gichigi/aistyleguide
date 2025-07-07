import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'
import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn("prose prose-gray max-w-none", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
        // Custom heading styles
        h1: ({ children }) => (
          <h1 className="text-3xl font-bold text-gray-900 mb-6 border-b border-gray-200 pb-4">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-2xl font-semibold text-gray-800 mb-4 mt-8">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-xl font-medium text-gray-800 mb-3 mt-6">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="text-lg font-medium text-gray-700 mb-2 mt-4">
            {children}
          </h4>
        ),
        
        // Custom paragraph styles with proper line spacing
        p: ({ children }) => (
          <p className="text-gray-700 mb-4 leading-relaxed">
            {children}
          </p>
        ),
        
        // Custom list styles  
        ul: ({ children }) => (
          <ul className="list-disc list-inside text-gray-700 mb-4 space-y-1">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-inside text-gray-700 mb-4 space-y-1">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="mb-1">{children}</li>
        ),
        
        // Custom code styles
        code: ({ children, ...props }) => {
          const isInline = !('data-language' in props)
          return isInline ? (
            <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono">
              {children}
            </code>
          ) : (
            <code className="block bg-gray-100 text-gray-800 p-3 rounded text-sm font-mono whitespace-pre-wrap mb-4">
              {children}
            </code>
          )
        },
        
        // Custom blockquote styles
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-blue-500 pl-4 text-gray-600 italic mb-4">
            {children}
          </blockquote>
        ),
        
        // Custom strong/bold styles
        strong: ({ children }) => (
          <strong className="font-semibold text-gray-900">{children}</strong>
        ),
        
        // Custom emphasis/italic styles
        em: ({ children }) => (
          <em className="italic text-gray-700">{children}</em>
        ),
        
        // Custom horizontal rule
        hr: () => (
          <hr className="border-gray-300 my-8" />
        ),
        
        // Custom table styles (from remark-gfm)
        table: ({ children }) => (
          <div className="overflow-x-auto mb-4">
            <table className="min-w-full border-collapse border border-gray-300">
              {children}
            </table>
          </div>
        ),
        th: ({ children }) => (
          <th className="border border-gray-300 bg-gray-50 px-4 py-2 text-left font-semibold">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="border border-gray-300 px-4 py-2">
            {children}
          </td>
        ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
} 
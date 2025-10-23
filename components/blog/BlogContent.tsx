'use client'

import { ReactNode } from 'react'
import ReactMarkdown from 'react-markdown'

interface BlogContentProps {
  children: ReactNode
  className?: string
}

export default function BlogContent({ children, className = '' }: BlogContentProps) {
  // Safely handle content to prevent JSON parsing errors
  const content = typeof children === 'string' ? children : String(children || '');
  
  return (
    <div className={`prose prose-lg max-w-none blog-content ${className}`}>
      <style jsx global>{`
        .blog-content {
          color: hsl(var(--foreground));
        }
        
        .blog-content h1 {
          font-size: 2.5rem;
          font-weight: 700;
          line-height: 1.2;
          margin-bottom: 1.5rem;
          color: hsl(var(--foreground));
        }
        
        .blog-content h2 {
          font-size: 2rem;
          font-weight: 600;
          line-height: 1.3;
          margin-top: 2.5rem;
          margin-bottom: 1rem;
          color: hsl(var(--foreground));
        }
        
        .blog-content h3 {
          font-size: 1.5rem;
          font-weight: 600;
          line-height: 1.4;
          margin-top: 2rem;
          margin-bottom: 0.75rem;
          color: hsl(var(--foreground));
        }
        
        .blog-content h4 {
          font-size: 1.25rem;
          font-weight: 600;
          line-height: 1.4;
          margin-top: 1.5rem;
          margin-bottom: 0.5rem;
          color: hsl(var(--foreground));
        }
        
        .blog-content p {
          font-size: 1.125rem;
          line-height: 1.7;
          margin-bottom: 1.5rem;
          color: hsl(var(--foreground));
        }
        
        .blog-content ul, .blog-content ol {
          margin-bottom: 1.5rem;
          padding-left: 1.5rem;
        }
        
        .blog-content li {
          font-size: 1.125rem;
          line-height: 1.7;
          margin-bottom: 0.5rem;
          color: hsl(var(--foreground));
        }
        
        .blog-content strong {
          font-weight: 600;
          color: hsl(var(--foreground));
        }
        
        .blog-content em {
          font-style: italic;
          color: hsl(var(--foreground));
        }
        
        .blog-content blockquote {
          border-left: 4px solid hsl(var(--primary));
          padding-left: 1.5rem;
          margin: 2rem 0;
          font-style: italic;
          color: hsl(var(--muted-foreground));
          background: hsl(var(--muted) / 0.3);
          padding: 1.5rem;
          border-radius: 0.5rem;
        }
        
        .blog-content code {
          background: hsl(var(--muted));
          padding: 0.25rem 0.5rem;
          border-radius: 0.25rem;
          font-size: 0.9em;
          color: hsl(var(--foreground));
        }
        
        .blog-content pre {
          background: hsl(var(--muted));
          padding: 1.5rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin: 1.5rem 0;
        }
        
        .blog-content pre code {
          background: none;
          padding: 0;
          color: hsl(var(--foreground));
        }
        
        .blog-content a {
          color: hsl(var(--primary));
          text-decoration: underline;
          text-underline-offset: 2px;
        }
        
        .blog-content a:hover {
          text-decoration: none;
        }
        
        .blog-content img {
          border-radius: 0.5rem;
          margin: 2rem 0;
          box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
        }
        
        .blog-content hr {
          border: none;
          border-top: 1px solid hsl(var(--border));
          margin: 3rem 0;
        }
        
        .blog-content table {
          width: 100%;
          border-collapse: collapse;
          margin: 2rem 0;
        }
        
        .blog-content th,
        .blog-content td {
          border: 1px solid hsl(var(--border));
          padding: 0.75rem;
          text-align: left;
        }
        
        .blog-content th {
          background: hsl(var(--muted));
          font-weight: 600;
        }
        
        /* Dark mode adjustments */
        @media (prefers-color-scheme: dark) {
          .blog-content blockquote {
            background: hsl(var(--muted) / 0.2);
          }
        }
      `}</style>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}

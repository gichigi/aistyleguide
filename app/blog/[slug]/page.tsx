import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Header from '@/components/Header'
import BlogContent from '@/components/blog/BlogContent'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Clock, Calendar, ArrowLeft, Share2 } from 'lucide-react'

interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  excerpt: string
  category: string
  featured_image?: string
  author_name: string
  published_at: string
  updated_at: string
  reading_time: number
  word_count: number
  keywords: string[]
}

async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    // Import supabase client directly for server-side rendering
    const { createClient } = await import('@supabase/supabase-js')
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    
    const { data: post, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .eq('is_published', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        return null
      }
      console.error('Error fetching blog post:', error)
      return null
    }

    return post
  } catch (error) {
    console.error('Error fetching blog post:', error)
    return null
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const resolvedParams = await params
  const post = await getBlogPost(resolvedParams.slug)
  
  if (!post) {
    return {
      title: 'Post Not Found | AI Style Guide',
      description: 'The requested blog post could not be found.',
    }
  }

  return {
    title: `${post.title} | AI Style Guide`,
    description: post.excerpt,
    keywords: post.keywords.join(', '),
    authors: [{ name: post.author_name }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      url: `https://aistyleguide.com/blog/${post.slug}`,
      type: 'article',
      publishedTime: post.published_at,
      modifiedTime: post.updated_at,
      authors: [post.author_name],
      images: [
        {
          url: post.featured_image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=630&fit=crop&auto=format',
          width: 1200,
          height: 630,
          alt: post.title,
        }
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: [post.featured_image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=630&fit=crop&auto=format'],
    },
  }
}

// Schema.org structured data component - optimized for SEO
function BlogSchema({ post }: { post: BlogPost }) {
  // Remove the first heading from content for articleBody (title is already in headline)
  const articleBody = post.content.replace(/^#\s+.*$/m, '');
  
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    articleBody: articleBody,
    datePublished: post.published_at,
    dateModified: post.updated_at,
    author: {
      '@type': 'Person',
      name: post.author_name,
    },
    publisher: {
      '@type': 'Organization',
      name: 'AI Style Guide',
      logo: {
        '@type': 'ImageObject',
        url: 'https://aistyleguide.com/aistyleguide-logo.png',
      },
    },
    mainEntityOfPage: `https://aistyleguide.com/blog/${post.slug}`,
    url: `https://aistyleguide.com/blog/${post.slug}`,
    keywords: post.keywords.join(', '),
    wordCount: post.word_count,
    articleSection: post.category,
    image: {
      '@type': 'ImageObject',
      url: post.featured_image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=630&fit=crop&auto=format',
      width: 1200,
      height: 630,
    },
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  )
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const resolvedParams = await params
  const post = await getBlogPost(resolvedParams.slug)

  if (!post) {
    notFound()
  }

  const publishedDate = new Date(post.published_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const updatedDate = new Date(post.updated_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <>
      <BlogSchema post={post} />
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          {/* Breadcrumb */}
          <nav className="mb-8">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/blog" className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to Blog
              </Link>
            </Button>
          </nav>

          <article className="max-w-4xl mx-auto">
            {/* Article Header */}
            <header className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Badge variant="outline">{post.category}</Badge>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    <span>{publishedDate}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{post.reading_time} min read</span>
                  </div>
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold mb-4 leading-tight">
                {post.title}
              </h1>

              <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
                {post.excerpt}
              </p>

              <div className="flex items-center justify-between py-4 border-y">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                    {post.author_name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium">{post.author_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {publishedDate !== updatedDate && `Updated ${updatedDate}`}
                    </p>
                  </div>
                </div>

                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </header>

            {/* Featured Image */}
            {post.featured_image && (
              <div className="mb-8">
                <Image
                  src={post.featured_image}
                  alt={post.title}
                  width={800}
                  height={400}
                  className="w-full rounded-lg shadow-lg"
                />
              </div>
            )}

            {/* Article Content */}
            <BlogContent>
              {post.content.replace(/^#\s+.*$/m, '')}
            </BlogContent>

            {/* Article Footer */}
            <footer className="mt-12 pt-8 border-t">
              <div className="flex flex-wrap gap-2 mb-6">
                {post.keywords.map((keyword) => (
                  <Badge key={keyword} variant="secondary" className="text-xs">
                    {keyword}
                  </Badge>
                ))}
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  <p>Published on {publishedDate}</p>
                  {publishedDate !== updatedDate && (
                    <p>Last updated on {updatedDate}</p>
                  )}
                </div>

                <Button asChild>
                  <Link href="/blog">
                    Read More Articles
                  </Link>
                </Button>
              </div>
            </footer>
          </article>
        </main>
      </div>
    </>
  )
}

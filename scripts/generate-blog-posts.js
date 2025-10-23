#!/usr/bin/env node

/**
 * Blog Post Generation Script
 * Reads CSV topics and generates blog posts using OpenAI API
 * Usage: node scripts/generate-blog-posts.js [--dry-run] [--limit=5]
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Configuration
const CSV_PATH = '/Users/tahi/Downloads/AIStyleGuide_HighLevel_Topics_and_Keywords.csv'
const DRY_RUN = process.argv.includes('--dry-run')
const LIMIT = parseInt(process.argv.find(arg => arg.startsWith('--limit='))?.split('=')[1] || '5')

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Blog post generation prompt
const BLOG_POST_PROMPT = `You are an expert content strategist and copywriter specializing in brand voice and content marketing. 

Write a comprehensive, SEO-optimized blog post about the given topic. The post should be:

1. **Informative and actionable** - Provide practical insights readers can implement
2. **SEO-friendly** - Naturally incorporate the target keywords
3. **Well-structured** - Use clear headings, subheadings, and bullet points
4. **Engaging** - Write in a conversational, professional tone
5. **Comprehensive** - Cover the topic thoroughly (800-1200 words)

Format the response as JSON with these fields:
- title: The blog post title (60 characters or less)
- content: The full blog post content in markdown format
- excerpt: A compelling 150-character summary
- keywords: Array of 5-8 relevant keywords from the target keywords provided

Topic: {title}
Target Keywords: {keywords}

Write for marketing professionals, content creators, and business owners who want to improve their brand communication.`

function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n')
  const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
  
  return lines.slice(1).filter(line => line.trim()).map(line => {
    const values = line.split(',').map(v => v.replace(/"/g, '').trim())
    return {
      title: values[0],
      keywords: values[1]
    }
  })
}

function createSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim('-')
    .substring(0, 60)
}

function calculateReadingTime(content) {
  const wordsPerMinute = 200
  const wordCount = content.split(/\s+/).length
  return Math.ceil(wordCount / wordsPerMinute)
}

async function generateBlogPost(topic) {
  console.log(`🤖 Generating blog post for: "${topic.title}"`)
  
  try {
    const prompt = BLOG_POST_PROMPT
      .replace('{title}', topic.title)
      .replace('{keywords}', topic.keywords)

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert content strategist. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    const response = completion.choices[0].message.content
    const blogPost = JSON.parse(response)
    
    // Calculate additional fields
    const wordCount = blogPost.content.split(/\s+/).length
    const readingTime = calculateReadingTime(blogPost.content)
    const slug = createSlug(blogPost.title)

    return {
      title: blogPost.title,
      slug,
      content: blogPost.content,
      excerpt: blogPost.excerpt,
      keywords: blogPost.keywords,
      category: 'Brand Strategy',
      author_name: 'AI Style Guide',
      word_count: wordCount,
      reading_time: readingTime,
      is_published: true,
      published_at: new Date().toISOString()
    }
  } catch (error) {
    console.error(`❌ Error generating blog post for "${topic.title}":`, error.message)
    return null
  }
}

async function saveBlogPost(blogPost) {
  if (DRY_RUN) {
    console.log('📝 [DRY RUN] Would save blog post:', {
      title: blogPost.title,
      slug: blogPost.slug,
      word_count: blogPost.word_count,
      reading_time: blogPost.reading_time
    })
    return { success: true }
  }

  try {
    const { data, error } = await supabase
      .from('blog_posts')
      .insert([blogPost])
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // Unique constraint violation
        console.log(`⚠️  Blog post with slug "${blogPost.slug}" already exists, skipping...`)
        return { success: false, reason: 'duplicate' }
      }
      throw error
    }

    console.log(`✅ Saved blog post: "${blogPost.title}" (${blogPost.word_count} words)`)
    return { success: true, data }
  } catch (error) {
    console.error(`❌ Error saving blog post "${blogPost.title}":`, error.message)
    return { success: false, error: error.message }
  }
}

async function main() {
  console.log('🚀 Starting blog post generation...')
  console.log(`📊 Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE'}`)
  console.log(`📝 Limit: ${LIMIT} posts`)
  console.log('')

  // Read and parse CSV
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ CSV file not found: ${CSV_PATH}`)
    process.exit(1)
  }

  const csvContent = fs.readFileSync(CSV_PATH, 'utf-8')
  const topics = parseCSV(csvContent)
  
  console.log(`📋 Found ${topics.length} topics in CSV`)
  
  // Process topics (limited by LIMIT)
  const topicsToProcess = topics.slice(0, LIMIT)
  console.log(`🎯 Processing ${topicsToProcess.length} topics`)
  console.log('')

  let successful = 0
  let failed = 0
  let skipped = 0

  for (const [index, topic] of topicsToProcess.entries()) {
    console.log(`\n[${index + 1}/${topicsToProcess.length}]`)
    
    // Generate blog post
    const blogPost = await generateBlogPost(topic)
    if (!blogPost) {
      failed++
      continue
    }

    // Save blog post
    const result = await saveBlogPost(blogPost)
    if (result.success) {
      successful++
    } else if (result.reason === 'duplicate') {
      skipped++
    } else {
      failed++
    }

    // Rate limiting - wait 2 seconds between requests
    if (index < topicsToProcess.length - 1) {
      console.log('⏳ Waiting 2 seconds...')
      await new Promise(resolve => setTimeout(resolve, 2000))
    }
  }

  console.log('\n🎉 Generation complete!')
  console.log(`✅ Successful: ${successful}`)
  console.log(`⚠️  Skipped (duplicates): ${skipped}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`📊 Total processed: ${successful + skipped + failed}`)
}

// Run the script
main().catch(error => {
  console.error('💥 Script failed:', error)
  process.exit(1)
})

'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Loader2, Globe } from "lucide-react"
import AuditResults from "@/components/audit-results"

interface AuditResult {
  violations: any[];
  summary: {
    totalViolations: number;
    pagesCrawled: number;
    topIssues: string[];
  };
}

export default function AuditTestPage() {
  const [url, setUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null)
  const [error, setError] = useState<string | { message: string; details: any; isJavaScriptApp: boolean } | null>(null)

  const handleAudit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!url.trim()) return
    
    setIsLoading(true)
    setError(null)
    setAuditResult(null)
    
    try {
      // Format URL if needed
      let formattedUrl = url.trim()
      if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
        formattedUrl = 'https://' + formattedUrl
      }
      
      const response = await fetch('/api/audit-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: formattedUrl }),
      })
      
      const data = await response.json()
      
      if (data.success) {
        setAuditResult(data.audit)
      } else {
        // Handle JavaScript app detection specially
        if (data.details?.issue === 'javascript_app') {
          setError({
            message: data.message,
            details: data.details,
            isJavaScriptApp: true
          })
        } else {
          setError(data.message || 'Failed to audit website')
        }
      }
    } catch (err) {
      setError('Failed to audit website. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Copy Audit Test
          </h1>
          <p className="text-gray-600">
            Test our copy audit engine - find writing issues on any website
          </p>
        </div>

        {/* Audit Form */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Enter Website URL</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAudit} className="space-y-4">
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="e.g. stripe.com, hubspot.com"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
                <Button 
                  type="submit" 
                  disabled={isLoading || !url.trim()}
                  className="min-w-[120px]"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Auditing...
                    </>
                  ) : (
                    'Audit Copy'
                  )}
                </Button>
              </div>
              
              {error && (
                <div className="space-y-3">
                  <div className="text-red-600 text-sm">
                    {typeof error === 'string' ? error : error.message}
                  </div>
                  
                  {typeof error === 'object' && error.isJavaScriptApp && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <div className="text-blue-600 text-sm">ℹ️</div>
                        <div className="text-sm">
                          <div className="font-medium text-blue-900 mb-1">Why this happened</div>
                          <div className="text-blue-800 mb-2">
                            This site loads content with JavaScript after the page loads. 
                            Our crawler only sees the initial HTML.
                          </div>
                          <div className="text-blue-700 font-medium mb-2">
                            Found: {error.details.contentFound}
                          </div>
                          <div className="text-blue-800">
                            {error.details.suggestion}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </form>
          </CardContent>
        </Card>

        {/* Results */}
        {auditResult && (
          <AuditResults 
            result={auditResult} 
            websiteUrl={url}
          />
        )}

        {/* Example URLs */}
        {!auditResult && !isLoading && (
          <Card>
            <CardHeader>
              <CardTitle>Try These Examples</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { url: 'techcrunch.com', desc: 'News site (many violations)' },
                  { url: 'stripe.com/about', desc: 'Corporate page (some issues)' },
                  { url: 'example.com', desc: 'Simple site (clean copy)' }
                ].map((example) => (
                  <button
                    key={example.url}
                    onClick={() => setUrl(example.url)}
                    className="text-left p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="font-medium text-blue-600">{example.url}</div>
                    <div className="text-sm text-gray-500">{example.desc}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 
'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, FileText, MessageSquare, Clock } from "lucide-react"

interface Violation {
  type: 'long-sentence' | 'passive-voice' | 'jargon' | 'spelling-inconsistency';
  severity: 'high' | 'medium' | 'low';
  text: string;
  suggestion: string;
  page: string;
  position: number;
}

interface AuditResult {
  violations: Violation[];
  summary: {
    totalViolations: number;
    pagesCrawled: number;
    topIssues: string[];
  };
}

interface AuditResultsProps {
  result: AuditResult;
  websiteUrl: string;
}

const severityColors = {
  high: 'bg-red-100 text-red-800 border-red-200',
  medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  low: 'bg-blue-100 text-blue-800 border-blue-200'
}

const typeConfig = {
  'long-sentence': {
    label: 'Long Sentences',
    icon: Clock,
    description: 'Sentences over 25 words that may be hard to read',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-200'
  },
  'passive-voice': {
    label: 'Passive Voice',
    icon: MessageSquare,
    description: 'Passive constructions that weaken your message',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200'
  },
  'jargon': {
    label: 'Jargon',
    icon: AlertTriangle,
    description: 'Technical terms that may confuse readers',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200'
  },
  'spelling-inconsistency': {
    label: 'Spelling Inconsistency',
    icon: FileText,
    description: 'Mixed US/UK spelling or inconsistent terms',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200'
  }
}



export default function AuditResults({ result, websiteUrl }: AuditResultsProps) {
  const { violations, summary } = result

  // Group violations by type
  const violationsByType = violations.reduce((acc, violation) => {
    if (!acc[violation.type]) {
      acc[violation.type] = []
    }
    acc[violation.type].push(violation)
    return acc
  }, {} as Record<string, Violation[]>)

  return (
    <div className="space-y-8">
      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Copy Audit Results
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-red-600">{summary.totalViolations}</div>
              <div className="text-sm text-gray-600">Issues Found</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{summary.pagesCrawled}</div>
              <div className="text-sm text-gray-600">Pages Scanned</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">{summary.topIssues.length}</div>
              <div className="text-sm text-gray-600">Issue Types</div>
            </div>
          </div>
          
          {summary.totalViolations > 0 && (
            <div className="mt-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2 text-orange-800">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">
                  Found {summary.totalViolations} writing issues that could hurt readability
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Violations by Type */}
      {Object.keys(violationsByType).length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Object.entries(violationsByType).map(([type, typeViolations]) => {
            const config = typeConfig[type as keyof typeof typeConfig]
            const Icon = config.icon
            
            return (
              <Card key={type} className={`h-fit ${config.borderColor} border-2`}>
                <CardHeader className={`${config.bgColor} border-b ${config.borderColor}`}>
                  <CardTitle className="flex items-center gap-3">
                    <Icon className={`h-6 w-6 ${config.color}`} />
                    <span className="text-lg">{config.label}</span>
                    <Badge variant="secondary" className="ml-auto text-sm px-2 py-1">
                      {typeViolations.length}
                    </Badge>
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-2">{config.description}</p>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  {typeViolations.slice(0, 3).map((violation, index) => (
                    <div key={index} className="bg-white border border-gray-200 rounded-lg p-5 shadow-sm hover:shadow-md transition-shadow">
                      <div className="mb-4">
                        <div className="text-base text-gray-900 bg-gray-50 p-4 rounded-md border-l-4 border-gray-400 leading-relaxed">
                          <span className="font-medium">"{violation.text.slice(0, 200)}{violation.text.length > 200 ? '...' : ''}"</span>
                          {violation.type === 'long-sentence' && (
                            <div className="mt-2 text-xs text-gray-500">
                              {violation.text.split(/\s+/).length} words
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <div className="text-sm text-blue-800 bg-blue-50 p-3 rounded-md border-l-4 border-blue-300 leading-relaxed">
                          <span className="font-medium">💡 {violation.suggestion}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-end pt-2 border-t border-gray-100">
                        <span className="text-xs text-gray-400">
                          {new URL(violation.page).pathname || '/'}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {typeViolations.length > 3 && (
                    <div className="text-center py-4">
                      <button className="text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-full transition-colors">
                        View {typeViolations.length - 3} more {config.label.toLowerCase()}
                      </button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* No Issues */}
      {violations.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Great Copy!</h3>
            <p className="text-gray-600">
              No major writing issues found on {websiteUrl}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 
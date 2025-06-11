'use client'

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, FileText } from "lucide-react"

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

const typeLabels = {
  'long-sentence': 'Long Sentence',
  'passive-voice': 'Passive Voice',
  'jargon': 'Jargon',
  'spelling-inconsistency': 'Spelling'
}

export default function AuditResults({ result, websiteUrl }: AuditResultsProps) {
  const { violations, summary } = result

  return (
    <div className="space-y-6">
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
            <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
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

      {/* Violations List */}
      {violations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Issues Found</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {violations.slice(0, 5).map((violation, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={severityColors[violation.severity]}>
                      {violation.severity.toUpperCase()}
                    </Badge>
                    <span className="font-medium">{typeLabels[violation.type]}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new URL(violation.page).pathname || '/'}
                  </span>
                </div>
                
                <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded border-l-4 border-gray-300">
                  "{violation.text.slice(0, 200)}{violation.text.length > 200 ? '...' : ''}"
                </div>
                
                <div className="text-sm text-blue-700 bg-blue-50 p-2 rounded">
                  💡 {violation.suggestion}
                </div>
              </div>
            ))}
            
            {violations.length > 5 && (
              <div className="text-center text-gray-500 text-sm">
                + {violations.length - 5} more issues found
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* No Issues */}
      {violations.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Great Copy!</h3>
            <p className="text-gray-600">
              No major writing issues found on {websiteUrl}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 
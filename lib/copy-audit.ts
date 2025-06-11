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

interface PageContent {
  url: string;
  title: string;
  content: string;
  paragraphs?: string[];  // Separate paragraph content for long sentence detection
}

/**
 * Detect long sentences (> 25 words) - ONLY in paragraph content
 */
function detectLongSentences(paragraphs: string[], pageUrl: string): Violation[] {
  const violations: Violation[] = [];
  
  paragraphs.forEach((paragraph, paragraphIndex) => {
    // Split paragraph into sentences
    const sentences = paragraph
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20);  // Only check substantial sentences
    
    sentences.forEach((sentence, sentenceIndex) => {
      const words = sentence.split(/\s+/).length;
      
      if (words > 25) {
        violations.push({
          type: 'long-sentence',
          severity: words > 35 ? 'high' : 'medium',
          text: sentence,
          suggestion: `Break into ${Math.ceil(words / 15)} shorter sentences.`,
          page: pageUrl,
          position: paragraphIndex * 100 + sentenceIndex
        });
      }
    });
  });
  
  return violations;
}

/**
 * Detect passive voice patterns - ONLY in paragraph content
 */
function detectPassiveVoice(paragraphs: string[], pageUrl: string): Violation[] {
  const violations: Violation[] = [];
  
  // Simple passive voice regex
  const passivePattern = /\b(was|were|is|are|been|being)\s+\w+ed\b/gi;
  
  paragraphs.forEach((paragraph, paragraphIndex) => {
    const sentences = paragraph.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    sentences.forEach((sentence, sentenceIndex) => {
      const matches = sentence.match(passivePattern);
      
      if (matches && matches.length > 0) {
        violations.push({
          type: 'passive-voice',
          severity: 'medium',
          text: sentence.trim(),
          suggestion: 'Rewrite in active voice.',
          page: pageUrl,
          position: paragraphIndex * 100 + sentenceIndex
        });
      }
    });
  });
  
  return violations;
}

/**
 * Main audit function
 */
export function auditCopy(pages: PageContent[]): AuditResult {
  const allViolations: Violation[] = [];
  
  // Run detection rules ONLY on paragraph content
  pages.forEach(page => {
    if (page.paragraphs && page.paragraphs.length > 0) {
      const longSentences = detectLongSentences(page.paragraphs, page.url);
      const passiveVoice = detectPassiveVoice(page.paragraphs, page.url);
      
      allViolations.push(...longSentences, ...passiveVoice);
    }
  });
  
  // Sort by severity (high first)
  allViolations.sort((a, b) => {
    const severityOrder = { high: 3, medium: 2, low: 1 };
    return severityOrder[b.severity] - severityOrder[a.severity];
  });
  
  // Create summary
  const violationTypes = [...new Set(allViolations.map(v => v.type))];
  const topIssues = violationTypes.slice(0, 3);
  
  return {
    violations: allViolations.slice(0, 10), // Limit to top 10 for UI
    summary: {
      totalViolations: allViolations.length,
      pagesCrawled: pages.length,
      topIssues
    }
  };
} 
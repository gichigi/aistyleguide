import { jsPDF } from "jspdf"

// Simple styling constants
const STYLES = {
  margin: 20,
  fontSize: {
    title: 24,
    heading: 18,
    body: 12
  },
  spacing: {
    paragraph: 10,
    section: 20
  },
  pageHeight: 297, // A4 height in mm
  lineHeight: 8
}

// --- Helper: Decode HTML Entities ---
function decodeEntities(text: string) {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

// --- Helper: Parse Markdown Blocks ---
function parseMarkdownBlocks(md: string) {
  const lines = md.split('\n');
  const blocks = [];
  lines.forEach(line => {
    if (/^#{1,6} /.test(line)) {
      // Heading
      const level = line.match(/^#+/)[0].length;
      blocks.push({ type: `heading${level}`, text: line.replace(/^#{1,6} /, '').trim() });
    } else if (/^[-*] /.test(line)) {
      // Bullet list
      blocks.push({ type: 'bullet', text: line.replace(/^[-*] /, '').trim() });
    } else if (/^\d+\. /.test(line)) {
      // Numbered list
      blocks.push({ type: 'number', text: line.replace(/^\d+\. /, '').trim() });
    } else if (line.trim() === '') {
      // Blank line = paragraph break
      blocks.push({ type: 'space' });
    } else {
      // Paragraph
      blocks.push({ type: 'paragraph', text: line.trim() });
    }
  });
  return blocks;
}

// --- Helper: Draw Blocks to PDF ---
function drawBlocksToPDF(doc, blocks, brandName) {
  let y = 20;
  const maxWidth = 170;
  doc.setFontSize(24);
  doc.setFont(undefined, 'bold');
  doc.text(`${brandName} Style Guide`, 20, y);
  y += 20;

  blocks.forEach(block => {
    if (block.type.startsWith('heading')) {
      const size = 24 - (parseInt(block.type.replace('heading', '')) - 1) * 3;
      doc.setFontSize(size);
      doc.setFont(undefined, 'bold');
      const lines = doc.splitTextToSize(decodeEntities(block.text), maxWidth);
      lines.forEach(line => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(line, 20, y);
        y += 10;
      });
      y += 4;
    } else if (block.type === 'bullet') {
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      const lines = doc.splitTextToSize('• ' + decodeEntities(block.text), maxWidth - 8);
      lines.forEach(line => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(line, 28, y);
        y += 8;
      });
      y += 2;
    } else if (block.type === 'number') {
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      const lines = doc.splitTextToSize('1. ' + decodeEntities(block.text), maxWidth - 8);
      lines.forEach(line => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(line, 28, y);
        y += 8;
      });
      y += 2;
    } else if (block.type === 'paragraph') {
      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      let text = decodeEntities(block.text)
        .replace(/\*\*(.+?)\*\*/g, (_, m) => m.toUpperCase()) // crude bold: ALL CAPS
        .replace(/\*(.+?)\*/g, (_, m) => m); // crude italics: just plain
      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach(line => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.text(line, 20, y);
        y += 8;
      });
      y += 6;
    } else if (block.type === 'space') {
      y += 6;
    }
  });
}

// PDF generator using jsPDF's html() method
export function generatePDF(htmlString: string, brandName: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new jsPDF();
      // Create a temporary div to hold the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlString;
      document.body.appendChild(tempDiv);

      doc.html(tempDiv, {
        callback: function (doc) {
          document.body.removeChild(tempDiv); // Clean up
          resolve(doc.output('blob'));
        },
        margin: [20, 20, 20, 20],
        autoPaging: 'text',
        x: 0,
        y: 0,
        width: 170 // max width of content on PDF
      });
    } catch (error) {
      console.error('[PDF Utils] PDF generation error:', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        brandName,
        contentLength: htmlString.length
      });
      reject(new Error('Failed to generate PDF. Please try again or contact support.'));
    }
  });
} 
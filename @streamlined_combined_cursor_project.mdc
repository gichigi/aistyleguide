---
description: 
globs: 
alwaysApply: false
---
## Detailed App Flow & Implementation Plan

### 1. User Journey Overview
- **Landing Page**
  - User sees intro, pricing, and CTA
  - Button: **Create your own style guide**
  - User can also enter a website URL for analysis

- **Website Analysis & Autofill**
  - User enters a website URL (optional)
  - Model analyzes the website and extracts brand info:
    - Brand name
    - Brand description
    - Target audience
    - Tone/voice
    - Colors, fonts, logos (if possible)
  - Autofills the brand details form with extracted info
  - User can review and edit any field

- **Brand Details Form**
  - User enters or edits brand name, description, audience, tone
  - Real-time validation, character counts, help text
  - Button: **Generate your style guide**
  - On submit:
    - If not paid: generates preview
    - If paid: user is redirected directly to full access for that guide (never sees brand details again for that guide)

- **Preview Page**
  - Shows partial style guide (limited sections)
  - Uses shared MarkdownComponents for formatting
  - Fade-out effect before paywall
  - Button: **Unlock Full Guide** (opens payment dialog)
  - If user pays, they get access to that specific guide only

- **Payment Flow**
  - Stripe checkout session created
  - On success: redirects to /payment/success
  - Shows loading/progress while generating full guide
  - On completion: redirects to /full-access for that guide
  - **User must pay for each style guide they generate**
  - If user wants to generate a different guide (different brand details) or re-generate, they must pay again

- **Full Access Page**
  - Shows full style guide (core or complete) for the guide just paid for
  - Uses shared MarkdownComponents for formatting
  - Download options (PDF, DOCX, HTML)
  - Notion import instructions
  - User can only access the guide(s) they have paid for

- **Download Flow**
  - User selects format
  - File generated and downloaded
  - HTML/PDF/DOCX styled to match web as closely as possible

### 2. Backend Implementation
- **API Routes**
  - `/api/preview`: Generates preview markdown (limited sections)
  - `/api/generate-styleguide`: Generates full guide (core/complete)
  - `/api/create-checkout-session`: Stripe integration
  - `/api/extract-website`: Analyzes website and returns brand info for autofill

- **Template Processing**
  - Loads markdown templates
  - Replaces variables (brand name, date, traits, rules)
  - Validates markdown structure
  - Ensures output matches required format

- **OpenAI Integration**
  - Generates brand voice traits and rules
  - Ensures output is markdown-compliant
  - Used for both preview and full guide

- **Per-Guide Payment Logic**
  - Each guide is tied to a unique set of brand details
  - Payment grants access to that specific guide only
  - New/different brand details require new payment

### 3. Frontend Implementation
- **Shared MarkdownComponents**
  - Centralized in `lib/markdown-components.tsx`
  - Used in preview, full-access, and any markdown rendering
  - Consistent classes for headings, lists, emphasis, code
  - Dark mode support

- **Website Analysis UI**
  - Input for website URL
  - Button: **Analyze Website**
  - Shows loading state and autofills form on success

- **Brand Details Form**
  - Inputs for all brand fields
  - Autofilled if website analysis is used
  - Button: **Generate your style guide**
  - If user has already paid for this guide, redirect to full access instead of showing form

- **Preview Page**
  - Loads preview markdown via API
  - Renders with shared components
  - Fade-out and paywall UI
  - Button: **Unlock Full Guide**
  - If user pays, they get access to that specific guide only

- **Full Access Page**
  - Loads full guide from localStorage
  - Renders with shared components
  - Download and Notion import dialogs
  - User can only access the guide(s) they have paid for

- **Payment Success Page**
  - Shows progress while generating guide
  - Handles errors and redirects
  - Redirects to full access for the just-paid guide

### 4. Download File Generation
- **PDF/HTML/DOCX**
  - Use same fonts, heading sizes, and colors as web
  - Convert markdown to styled output
  - Add brand name and date to header
  - Ensure lists, code, and emphasis are styled

### 5. Error Handling & Validation
- **Form Validation**
  - Real-time, with clear messages
  - Disable submit if invalid

- **API Error Handling**
  - Show toast notifications on error
  - Fallbacks for missing data

- **Markdown Validation**
  - Ensure all generated content matches required structure
  - Log and show errors if not

### 6. Consistency & Future-Proofing
- **Always use MarkdownComponents for new markdown features**
- Add code comments to guide future devs
- Test all flows in both light and dark mode
- Keep download output in sync with web style

### 7. Testing & QA
- **Manual Testing**
  - All user flows: website analysis, preview, payment, full access, download
  - Edge cases: missing fields, network errors, invalid markdown
  - Test per-guide payment and access logic

- **Automated Tests**
  - (Planned) Add tests for API routes and template processing

### 8. Success Criteria
- All markdown looks the same everywhere
- No broken flows or regressions
- Users can preview, pay, and access full guide smoothly
- Downloaded files match web style
- Website analysis autofills as much as possible, user can always edit
- Per-guide payment and access logic is enforced

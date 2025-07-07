---
description: 
globs: 
alwaysApply: false
---
# AI Style Guide Generator - Project Scratchpad

## 📋 Project Overview
Web app that generates brand style guides from website URLs using AI to extract and analyze brand elements. Built with Next.js, TypeScript, Tailwind CSS, OpenAI API, and Stripe.

## 🎯 Core User Journey
1. **Landing Page** → Enter website URL or create manually
2. **Website Analysis** → AI extracts brand info and autofills form
3. **Brand Details** → User reviews/edits brand information  
4. **Preview** → Shows partial style guide with paywall
5. **Payment** → Stripe checkout for full access
6. **Email Capture** → Collects email for thank you & abandoned cart recovery
7. **Full Access** → Complete style guide with download options


## 🚧 Active Tasks

### **P1: Progressive Auth & Email Capture Strategy**
*6-week phased rollout to improve conversions and email capture*

**🎯 Goal:** Increase email capture and user retention while maintaining current conversion rates

**Phase 1 (Weeks 1-2): Progressive Email Capture**
*Simple email capture without authentication - minimal complexity implementation*

**📋 Step-by-Step Implementation Plan:**

**Day 1: Supabase Database Setup**
1. **Create email_captures table using Supabase MCP:**
   ```sql
   CREATE TABLE email_captures (
     id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
     email TEXT NOT NULL,
     brand_name TEXT,
     brand_description TEXT,
     voice_traits JSONB,
     captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     session_id TEXT,
     converted BOOLEAN DEFAULT FALSE,
     stripe_session_id TEXT,
     last_email_sent TIMESTAMP WITH TIME ZONE
   );
   
   -- Add indexes for performance
   CREATE INDEX idx_email_captures_email ON email_captures(email);
   CREATE INDEX idx_email_captures_session ON email_captures(session_id);
   CREATE INDEX idx_email_captures_created ON email_captures(captured_at);
   ```

2. **Set up Row Level Security (RLS):**
   ```sql
   ALTER TABLE email_captures ENABLE ROW LEVEL SECURITY;
   
   -- Allow inserts from API (no user context needed)
   CREATE POLICY "Allow email capture inserts" ON email_captures
     FOR INSERT WITH CHECK (true);
   
   -- Restrict reads to service role only
   CREATE POLICY "Service role can read all" ON email_captures
     FOR SELECT USING (auth.role() = 'service_role');
   ```

**Day 2: Frontend Integration**
1. **Add email field to brand-details page (`app/brand-details/page.tsx`):**
   ```tsx
   // Add to form alongside existing fields
   <div className="space-y-2">
     <label htmlFor="email" className="text-sm font-medium">
       Email (optional)
     </label>
     <input
       type="email"
       id="email"
       placeholder="We'll email you a copy of your style guide"
       className="w-full p-3 border rounded-lg"
       value={formData.email}
       onChange={(e) => setFormData({...formData, email: e.target.value})}
     />
     <p className="text-xs text-gray-600">
       💌 Get your style guide via email + exclusive tips
     </p>
   </div>
   ```

2. **Update form submission logic:**
   - Capture email alongside existing brand data
   - Generate unique session_id for tracking
   - Store in localStorage for persistence

**Day 3: API Endpoint Creation**
1. **Create email capture API (`app/api/capture-email/route.ts`):**
   ```typescript
   import { createClient } from '@supabase/supabase-js'
   
   export async function POST(request: Request) {
     const { email, brandData, sessionId } = await request.json()
     
     const supabase = createClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.SUPABASE_SERVICE_ROLE_KEY!
     )
     
     const { data, error } = await supabase
       .from('email_captures')
       .insert({
         email,
         brand_name: brandData.name,
         brand_description: brandData.description,
         voice_traits: brandData.voiceTraits,
         session_id: sessionId
       })
     
     if (error) return Response.json({ error }, { status: 500 })
     return Response.json({ success: true })
   }
   ```

**Day 4: Email Templates & Automation**
1. **Create email templates using React Email:**
   ```tsx
   // components/emails/welcome-email.tsx
   export function WelcomeEmail({ brandName }: { brandName: string }) {
     return (
       <Html>
         <Head />
         <Body>
           <Container>
             <Heading>Your {brandName} Style Guide is Ready! 🎨</Heading>
             <Text>Thanks for using AIStyleGuide...</Text>
           </Container>
         </Body>
       </Html>
     )
   }
   ```

2. **Set up automated email sequences:**
   - **Immediate:** Welcome email with preview link
   - **2 hours:** Abandoned cart reminder with link (if no conversion)
   - **24 hours:** Final reminder with 20% off discount (last chance)

**Day 5: Resend Integration Enhancement**
1. **Extend existing email service (`lib/email-service.ts`):**
   ```typescript
   export async function sendWelcomeEmail(email: string, brandName: string) {
     return await resend.emails.send({
       from: 'AI Style Guide <hello@aistyleguide.com>',
       to: email,
       subject: `Your ${brandName} Style Guide Preview`,
       react: WelcomeEmail({ brandName })
     })
   }
   
   export async function sendAbandonedCartEmail(email: string, sessionId: string) {
     const recoveryUrl = `${process.env.NEXT_PUBLIC_APP_URL}/preview/${sessionId}`
     return await resend.emails.send({
       from: 'AI Style Guide <hello@aistyleguide.com>',
       to: email,
       subject: 'Don\'t lose your style guide progress',
       react: AbandonedCartEmail({ recoveryUrl })
     })
   }
   
   export async function sendFinalOfferEmail(email: string, sessionId: string) {
     const recoveryUrl = `${process.env.NEXT_PUBLIC_APP_URL}/preview/${sessionId}?discount=SAVE20`
     return await resend.emails.send({
       from: 'AI Style Guide <hello@aistyleguide.com>',
       to: email,
       subject: 'Last chance: 20% off your style guide',
       react: FinalOfferEmail({ recoveryUrl })
     })
   }
   ```

**Day 6: Background Jobs Setup**
1. **Create email automation API (`app/api/email-automation/route.ts`):**
   - Query email_captures for users who haven't converted
   - Send appropriate emails based on time elapsed
   - Update last_email_sent timestamp

2. **Set up Vercel Cron Job:**
   ```typescript
   // vercel.json
   {
     "crons": [{
       "path": "/api/email-automation",
       "schedule": "0 */2 * * *"  // Every 2 hours
     }]
   }
   ```

**Day 7: Analytics & Unique URLs**
1. **Add email capture tracking:**
   - Track email submission rate
   - Monitor email open/click rates via Resend
   - Measure conversion impact

2. **Create unique permanent URLs for email access:**
   - Generate secure tokens for each email capture
   - Create `/preview/{unique-token}` route for email access
   - Allow users to access their preview from any email link

**🔧 Technical Requirements:**
- Supabase project with service role key
- Resend API key (existing account)
- React Email for templates
- Vercel Cron for automation

**📊 Success Metrics to Track:**
- Email capture rate (target: 60%+ of brand-details submissions)
- Email → preview completion rate
- Email → conversion rate
- Overall conversion rate impact

**Phase 2 (Weeks 3-4): Full Auth System + Dashboard**
- Build user authentication system (email/password + social logins)
- Create user dashboard showing guide history and re-downloads
- Link Stripe customers to user accounts
- Add "Create account to save progress" flow before checkout

**Phase 3 (Week 5): A/B Testing**
- **Test A:** Auth-first approach (account required before preview)
- **Test B:** Progressive auth approach (email → preview → account)
- **Control:** Current flow (no auth)
- Run parallel tests with equal traffic split

**Phase 4 (Week 6): Optimization**
- Analyze A/B test results and optimize winning approach
- Implement learnings and prepare for next iteration

**📊 Success Metrics:**
- **Email Capture Rate:** Target 60%+ (currently ~40% via Stripe)
- **Conversion Rate:** Maintain current levels (don't decrease)
- **User Retention:** Track return visits and re-downloads
- **Support Load:** Monitor password resets and access issues

**🔄 Fallback Plan - Freemium Option:**
*If auth strategy doesn't improve conversions significantly*

**Freemium Structure:**
1. **Core Style Guide:** Free (25 essential rules)
2. **Complete Style Guide:** $149 (99+ advanced rules, all formats)
3. **Enterprise:** Contact Us (custom branding, team features)

**When to Implement Freemium:**
- If email capture doesn't improve conversion rates
- If users frequently request "free trial" option
- If competitors launch free offerings
- If market research shows price sensitivity

**Technical Requirements (All Phases):**
- User authentication system (email/password + social)
- Email service enhancement for early capture
- User dashboard for guide history
- Stripe customer linking and account management
- A/B testing infrastructure for flow variants

## ✅ Recently Completed

### Latest (Jan 2025)
- ✅ **Enhanced Brand Details UX** - Auto-population of brand name + formatted descriptions with paragraph breaks for better readability
- ✅ **Voice Trait UI Cleanup** - Removed redundant "Choose from preset traits" subheading  
- ✅ **Homepage Icon Update** - Changed www/globe icon to AI sparkle icon for clearer AI functionality indication
- ✅ **Input Field Width Fix** - Removed excessive right padding (sm:pr-40) that was making text area too narrow
- ✅ **Placeholder Text Update** - Changed to "Enter the URL or add a short description" for better clarity
- ✅ **Paywall UX Optimization** - Verified existing implementation has good conversion features (pricing transparency, fade-out, mobile responsive)
- ✅ **Custom Voice Traits** - Users can add custom traits alongside predefined ones, AI generates matching descriptions, hybrid quality approach
- ✅ **Enhanced Brand Input** - Homepage accepts URLs + text descriptions, AI expansion
- ✅ **Voice Traits Integration** - Selected traits now influence AI-generated style rules
- ✅ **Email Automation** - Thank you emails, abandoned cart recovery with discount codes
- ✅ **Comparison Table** - Professional "Why choose AIStyleGuide" landing page section

### Foundation (2024)
- ✅ **Core Journey** - Complete user flow from landing → analysis → preview → payment → delivery
- ✅ **Production Ready** - Type safety, security, performance, mobile responsiveness


## 📚 Key Lessons Learned

### Technical Architecture
- **Template consistency is critical** - Always use shared MarkdownComponents for uniform styling across all generated content
- **Type safety prevents runtime errors** - Add type guards before accessing potentially undefined values, especially with AI responses

### User Experience  
- **Mobile-first + loading states** - Most users access on mobile, always provide feedback instead of blank screens
- **Payment UX strategy** - Static previews save OpenAI costs, full generation only post-payment with clear pricing/flow

### AI Integration
- **OpenAI responses need validation** - Always check format, handle edge cases, use chunked generation for reliability
- **Cost optimization matters** - GPT-3.5 for extraction, GPT-4 for generation, 10k character limits prevent token overruns

### Development Process
- **Data flow validation + error handling** - Test through all system layers, detailed logs for debugging, graceful API failure degradation
- **Parallel tool usage** - Use multiple tools simultaneously for efficiency during development

### Email Integration
- **Professional delivery best practices** - HTML + text versions, inline CSS, clear CTAs, respect consent, track sent emails to prevent spam
- **Stripe abandoned cart setup** - Requires promotional consent, 30-day recovery URL expiry, discount codes increase conversion rates

### Node.js ESM Module Caching
- **ESM cache cannot be cleared** - Unlike CommonJS, no invalidation API exists, use dynamic imports + query parameters for dev hot reloading
- **Memory leak warning** - Cache busting creates permanent entries, only use in development mode

### Email Template Mystery (Unresolved)  
- **Problem**: Getting old email template despite code changes, confirmed NOT Stripe auto-emails (disabled in dashboard)
- **Applied fixes**: ESM cache busting, server restarts, cleared .next cache - still persists, needs webhook debugging

### Development Workflow
- **Stripe testing setup** - Test mode first with CLI webhooks, clean test/live config separation, real emails in test mode

### Custom Voice Traits Implementation
- **Hybrid approach works best** - Keep expert descriptions for predefined traits, generate AI descriptions for custom traits in identical format
- **Type safety for complex UIs** - Union types (`MixedTrait`) with type guards prevent runtime errors and enable proper validation
- **Technical debt compounds quickly** - Duplicate template processing functions created maintenance burden; clean up early to prevent confusion
- **Quality consistency matters** - Users notice format inconsistencies; match AI-generated content exactly to existing patterns
- **Focused AI prompts perform better** - Single trait generation with specific format requirements more reliable than bulk generation
- **Error handling should be invisible** - Graceful fallbacks with clear manual editing instructions maintain user flow when AI fails

## 🗺️ Future Roadmap
*Transform from "quick generator" to "professional copywriter tool"*

**Critical Priority (P0):**
- **Copy Audit Engine** - Violation detection (passive voice, sentence length, jargon, spelling inconsistencies)

**High Priority (P1):**
- **Dynamic Questionnaire UI** - Pre-populated form based on audit findings, smart defaults with user override
- **Preview Mode with Regeneration** - Side panel preview, section-by-section regeneration, violation→rule connections
- **Watermarked PDF Samples** - Free 4-page preview with watermark to prove value before purchase

**Medium Priority (P2):**
- **Composable Prompt System** - Modular prompts for section regeneration without full rebuild

**Low Priority (P3):**
- **Email Features** - Style guide delivery via email, welcome/onboarding sequence
- **Automated testing** - Add tests for API routes and template processing
- **Analytics integration** - Track user behavior and conversion metrics
- **Performance monitoring** - Add logging and monitoring for production issues

### **Test Alt /brand-details Layout Option with Users**
**Side Panel Layout Implementation:**
- ✅ **Test page created** at `/test-layout` - Full form with side-panel trait selection
- ✅ **Complete form structure** - Brand name, description, language/formality dropdowns, voice traits
- ✅ **Side-by-side layout** - Left panel (trait selection), Right panel (live preview)
- ✅ **Mobile responsive** - Traits stack below form on small screens

**Layout Options Explored:**
- **Option A: Side Panel** - Selection left, preview right (implemented in test)
- **Option B: Collapsible Cards** - Compact with expand/collapse
- **Option C: Modal/Drawer** - Trait details in overlays

### **Email Setup Required**
- **Need**: Resend API key from dashboard
- **Need**: Domain verification (DNS records for aistyleguide.com)
- **Current**: Using placeholder API key `re_your_api_key_here`

### **Testing Needed**
- **Abandoned Cart Flow**: Test 2-hour session expiration
- **Email Templates**: Verify HTML rendering across email clients
- **Discount Codes**: Test recovery URL functionality

### Medium Term (1-2 months)  
- **Advanced customization options** - Allow users to modify generated style guides
- **Template variety** - Add different style guide formats and structures
- **Export enhancements** - Better PDF styling, additional formats (JSON, Figma)
- **User dashboard** - Allow users to manage multiple purchased guides

### Long Term (3+ months)
- **Team collaboration features** - Share guides within organizations
- **API for developers** - Allow programmatic access to style guide generation
- **White-label solution** - Allow agencies to rebrand and resell the tool
- **Advanced AI features** - Visual brand analysis, competitive analysis integration

## 🔧 Technical Notes

### Current Architecture
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, Lucide Icons
- **terminal**: Always use pnpm instead of NPM for packagae install
- **Backend**: Next.js API routes, OpenAI API, Stripe integration
- **Storage**: localStorage for client state, sessionStorage for temporary data
- **Templates**: Markdown-based with variable replacement system
- **Styling**: Tailwind Typography, shared MarkdownComponents, dark mode support

### Key Files & Directories
- `app/page.tsx` - Landing page with URL input
- `app/brand-details/page.tsx` - Brand information form  
- `app/preview/page.tsx` - Style guide preview with paywall
- `app/full-access/page.tsx` - Complete style guide display
- `app/api/extract-website/` - Website analysis and brand extraction
- `app/api/generate-styleguide/` - Full style guide generation
- `app/api/preview/` - Preview content generation (static)
- `lib/template-processor.ts` - Template loading and processing
- `lib/markdown-components.tsx` - Shared markdown rendering components
- `templates/core_template.md` - Main style guide template

### Performance Optimizations
- **Parallel API calls** - Website analysis fetches multiple pages simultaneously
- **Model selection** - GPT-3.5-turbo for extraction, GPT-4 for generation
- **Content optimization** - 10k character limit for AI processing
- **Request timeouts** - 5-second timeout to prevent hanging requests
- **Static previews** - No AI costs for preview generation

### Security Measures  
- **No test endpoints in production** - All testing moved inline or removed
- **Input validation** - All form inputs validated on client and server
- **Rate limiting considerations** - Timeouts and error handling for external requests
- **Credit protection** - Static previews prevent unnecessary OpenAI usage

### Email Service (`lib/email-service.ts`)
- **Provider**: Resend (developer-friendly, good deliverability)
- **Templates**: Thank you emails, abandoned cart recovery
- **Features**: HTML + text versions, discount codes, professional styling
- **Spam Prevention**: Tracks sent emails to avoid duplicates

### Stripe Configuration
- **Email Capture**: `consent_collection.promotions = 'auto'`
- **Session Expiry**: 2 hours for abandoned cart recovery
- **Recovery URLs**: 30-day validity with discount codes
- **Webhooks**: `checkout.session.completed`, `checkout.session.expired`

### Environment Variables
```
RESEND_API_KEY=re_your_api_key_here
STRIPE_MODE=test (switches between test/live)
NEXT_PUBLIC_APP_URL=http://localhost:3000 (for local testing)
```

---

*Last updated: January 2025*
*Status: Active Development*
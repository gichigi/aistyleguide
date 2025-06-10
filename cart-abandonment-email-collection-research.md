# Cart Abandonment Email Collection Research

## Current Problem Analysis

**Issue**: Your application currently only captures user email addresses after they complete payment through Stripe checkout. This means:
- No ability to follow up with users who abandon their cart before reaching Stripe
- No data on potential customers who viewed pricing but didn't proceed
- Missed revenue recovery opportunities from interested but hesitant users

**Current Flow**: Website → Brand Details → Preview → Paywall → Stripe Checkout → Email Captured

**Goal**: Capture email addresses earlier in the funnel to enable cart abandonment recovery.

## Option 1: Stripe's Built-in Cart Abandonment Recovery (Recommended)

### How It Works
Stripe provides native cart abandonment recovery that works without requiring a separate login system:

1. **Promotional Consent Collection**: Add `consent_collection[promotions]: 'auto'` to your checkout session
2. **Recovery Configuration**: Enable `after_expiration.recovery.enabled: true`  
3. **Automatic Email Capture**: Stripe captures the email when user enters it in checkout
4. **Abandonment Webhooks**: Receive `checkout.session.expired` events with recovery URLs

### Implementation

```typescript
// Update app/api/create-checkout-session/route.ts
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [...],
  mode: 'payment',
  success_url: `${BASE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}&guide_type=${guideType}`,
  cancel_url: `${BASE_URL}/payment/cancel`,
  
  // NEW: Enable cart abandonment recovery
  consent_collection: {
    promotions: 'auto', // Shows "Keep me updated" checkbox
  },
  after_expiration: {
    recovery: {
      enabled: true,
      allow_promotion_codes: true, // Optional: allow discount codes in recovery
    }
  },
  
  // Optional: Set custom expiration (default is 24 hours)
  expires_at: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
})
```

```typescript
// Update app/api/webhook/route.ts
switch (event.type) {
  case "checkout.session.completed":
    console.log("Payment successful:", event.data.object)
    break
    
  case "checkout.session.expired":
    const session = event.data.object
    const email = session.customer_details?.email
    const recoveryUrl = session.after_expiration?.recovery?.url
    const consentedToPromotions = session.consent?.promotions === 'opt_in'
    
    if (email && recoveryUrl && consentedToPromotions) {
      // Send abandonment recovery email
      await sendAbandonmentRecoveryEmail(email, recoveryUrl, session)
    }
    break
}
```

### Pros
- ✅ **No additional development needed** - Uses Stripe's infrastructure
- ✅ **GDPR/Privacy compliant** - Built-in consent management
- ✅ **Automatic recovery URLs** - Stripe generates secure recovery links
- ✅ **No login system required** - Works with guest checkout
- ✅ **Professional implementation** - Handles spam prevention, security

### Cons
- ❌ **Limited to users who reach Stripe checkout** - Won't capture earlier abandonment
- ❌ **Requires promotional consent** - Users must opt-in to receive emails
- ❌ **Stripe-controlled experience** - Less customization of consent flow

### Expected Impact
- **Capture Rate**: 40-60% of users who reach checkout (depending on consent rates)
- **Recovery Rate**: 10-15% of abandoned carts typically convert via email recovery
- **Implementation Time**: 2-4 hours

## Option 2: Early Email Collection with Value Exchange

### How It Works
Collect email addresses earlier in the funnel by offering something valuable in exchange:

1. **Preview Enhancement**: Offer "email for extended preview"
2. **Progress Saving**: "Save your progress" functionality
3. **Personalization**: "Get personalized recommendations"

### Implementation Options

#### A. Enhanced Preview Gate
```typescript
// Add to app/preview/page.tsx
const [emailForPreview, setEmailForPreview] = useState('')
const [showEmailGate, setShowEmailGate] = useState(false)
const [hasExtendedPreview, setHasExtendedPreview] = useState(false)

const handleExtendedPreview = async (email: string) => {
  // Store email for abandonment tracking
  localStorage.setItem('userEmail', email)
  
  // Track in your analytics
  await fetch('/api/track-email-collection', {
    method: 'POST',
    body: JSON.stringify({ 
      email, 
      source: 'extended_preview',
      timestamp: Date.now() 
    })
  })
  
  setHasExtendedPreview(true)
  setShowEmailGate(false)
}

// In your preview component
{!hasExtendedPreview && (
  <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 mb-6">
    <h3 className="text-lg font-semibold mb-2">
      🎯 See More of Your Style Guide
    </h3>
    <p className="text-gray-600 mb-4">
      Enter your email to unlock additional preview sections and see exactly what you'll get.
    </p>
    <div className="flex gap-2">
      <Input
        type="email"
        placeholder="your.email@company.com"
        value={emailForPreview}
        onChange={(e) => setEmailForPreview(e.target.value)}
        className="flex-1"
      />
      <Button onClick={() => handleExtendedPreview(emailForPreview)}>
        Show More Preview
      </Button>
    </div>
    <p className="text-xs text-gray-500 mt-2">
      ✓ No spam ✓ Unsubscribe anytime ✓ Only style guide related updates
    </p>
  </div>
)}
```

#### B. Progress Saving Feature
```typescript
// Add to brand details or preview page
const handleSaveProgress = async (email: string) => {
  // Save to your database or localStorage
  const progressData = {
    email,
    brandDetails,
    previewGenerated: true,
    timestamp: Date.now(),
    stage: 'preview_completed'
  }
  
  // Store locally for immediate access
  localStorage.setItem('savedProgress', JSON.stringify(progressData))
  
  // Send to your backend for abandonment tracking
  await fetch('/api/save-progress', {
    method: 'POST',
    body: JSON.stringify(progressData)
  })
  
  toast({
    title: "Progress Saved!",
    description: "We'll email you a link to continue where you left off."
  })
}
```

### Email Collection API Endpoint
```typescript
// Create app/api/track-email-collection/route.ts
import { NextResponse } from "next/server"

interface EmailCollection {
  email: string
  source: 'extended_preview' | 'save_progress' | 'newsletter_signup'
  timestamp: number
  metadata?: Record<string, any>
}

export async function POST(request: Request) {
  try {
    const data: EmailCollection = await request.json()
    
    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(data.email)) {
      return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
    }
    
    // Store in your database (or for now, just log)
    console.log('Email collected:', data)
    
    // Optional: Add to email service (Mailgun, SendGrid, etc.)
    // await addToEmailList(data.email, data.source)
    
    // Set up abandonment tracking
    setTimeout(() => {
      // Check if user completed purchase
      // If not, send follow-up email
      sendAbandonmentEmail(data.email, data.source)
    }, 24 * 60 * 60 * 1000) // 24 hours
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error collecting email:', error)
    return NextResponse.json({ error: 'Failed to collect email' }, { status: 500 })
  }
}
```

### Pros
- ✅ **Captures earlier abandonment** - Gets users before they reach checkout
- ✅ **Higher capture rates** - More users willing to share email for value
- ✅ **Full control** - Custom consent flow and messaging
- ✅ **Multiple touchpoints** - Can collect at various stages

### Cons
- ❌ **More development work** - Need to build collection and tracking system
- ❌ **Privacy compliance** - Must handle GDPR/CCPA compliance yourself
- ❌ **Email service needed** - Requires integration with email provider

### Expected Impact
- **Capture Rate**: 25-40% of users (varies by value proposition)
- **Earlier Funnel Coverage**: Captures 2-3x more potential customers
- **Implementation Time**: 1-2 weeks

## Option 3: Progressive Profiling Approach

### How It Works
Gradually collect information as users progress through your funnel:

1. **Step 1**: Email for personalized recommendations
2. **Step 2**: Company name for better customization  
3. **Step 3**: Industry for relevant examples
4. **Step 4**: Purchase decision

### Implementation
```typescript
// Create a progressive profiling component
const [userProfile, setUserProfile] = useState({
  email: '',
  company: '',
  industry: '',
  stage: 'initial'
})

const ProfileStep = ({ currentStep, onNext }) => {
  switch(currentStep) {
    case 'email':
      return (
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <h3 className="text-lg font-semibold mb-2">
            Get Personalized Style Guide Recommendations
          </h3>
          <p className="text-gray-600 mb-4">
            We'll customize your preview based on your industry and company type.
          </p>
          <Input
            type="email"
            placeholder="your.email@company.com"
            onChange={(e) => setUserProfile(prev => ({...prev, email: e.target.value}))}
          />
          <Button onClick={() => onNext('company')} className="mt-3">
            Continue →
          </Button>
        </div>
      )
    // Additional steps...
  }
}
```

### Pros
- ✅ **Feels natural** - Gradual information collection
- ✅ **Higher quality data** - More complete user profiles
- ✅ **Better personalization** - Can customize experience
- ✅ **Multiple engagement points** - Several opportunities to capture interest

### Cons
- ❌ **Complex implementation** - Multi-step flow management
- ❌ **Potential friction** - Some users may abandon due to steps
- ❌ **More testing needed** - Multiple flow variations to optimize

## Option 4: Social Proof + Email Collection

### How It Works
Use social proof to encourage email sharing:

```typescript
// Add to your preview page
<div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
  <div className="flex items-center gap-3 mb-3">
    <div className="flex -space-x-2">
      {/* Avatar images */}
    </div>
    <div>
      <p className="font-medium text-blue-900">
        Join 2,847 business owners
      </p>
      <p className="text-sm text-blue-700">
        who've created professional style guides
      </p>
    </div>
  </div>
  
  <div className="flex gap-2">
    <Input
      type="email"
      placeholder="your.email@company.com"
      className="flex-1"
    />
    <Button>
      Join Community
    </Button>
  </div>
  
  <p className="text-xs text-blue-600 mt-2">
    Get style guide tips, examples, and early access to new features
  </p>
</div>
```

## Option 5: Exit Intent Email Capture

### Implementation
```typescript
// Create app/hooks/useExitIntent.ts
import { useEffect, useState } from 'react'

export const useExitIntent = () => {
  const [showExitModal, setShowExitModal] = useState(false)
  
  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        setShowExitModal(true)
      }
    }
    
    document.addEventListener('mouseleave', handleMouseLeave)
    return () => document.removeEventListener('mouseleave', handleMouseLeave)
  }, [])
  
  return { showExitModal, setShowExitModal }
}

// Use in your preview component
const ExitIntentModal = ({ isOpen, onClose }) => (
  <Dialog open={isOpen} onOpenChange={onClose}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Wait! Don't Leave Empty-Handed 🎯</DialogTitle>
        <DialogDescription>
          Get our free "Brand Style Guide Checklist" plus 20% off your style guide
        </DialogDescription>
      </DialogHeader>
      
      <div className="space-y-4">
        <Input type="email" placeholder="your.email@company.com" />
        <Button className="w-full">
          Get Free Checklist + 20% Off
        </Button>
      </div>
      
      <p className="text-xs text-gray-500 text-center">
        No spam. Unsubscribe anytime. One-time 20% discount code.
      </p>
    </DialogContent>
  </Dialog>
)
```

## Recommended Implementation Strategy

### Phase 1: Stripe Cart Abandonment (Week 1)
**Priority**: High | **Effort**: Low | **Impact**: Medium

1. Implement Stripe's built-in cart abandonment recovery
2. Add promotional consent collection to checkout
3. Create webhook handler for expired sessions
4. Set up basic abandonment recovery email template

**Expected Results**: 
- Capture 40-60% of users who reach checkout
- Recover 10-15% of abandoned carts
- Minimal development time

### Phase 2: Early Email Collection (Week 2-3)  
**Priority**: High | **Effort**: Medium | **Impact**: High

1. Add "extended preview" email gate
2. Implement progress saving functionality
3. Create email collection API endpoint
4. Set up abandonment tracking system

**Expected Results**:
- Capture 25-40% of preview viewers
- 2-3x increase in recoverable abandonment data
- Better funnel visibility

### Phase 3: Advanced Features (Week 4+)
**Priority**: Medium | **Effort**: High | **Impact**: Medium

1. Exit intent modal
2. Progressive profiling
3. Social proof integration
4. A/B testing framework

## Technical Requirements

### Database Schema (if storing emails)
```sql
CREATE TABLE email_collections (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  source VARCHAR(50) NOT NULL, -- 'stripe_checkout', 'extended_preview', etc.
  consent_marketing BOOLEAN DEFAULT FALSE,
  brand_details JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  conversion_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'converted', 'abandoned'
  last_email_sent TIMESTAMP,
  recovery_emails_sent INTEGER DEFAULT 0
);
```

### Email Service Integration
```typescript
// lib/email-service.ts - Enhanced version
export interface AbandonmentEmailData {
  email: string
  source: string
  recoveryUrl?: string
  brandDetails?: any
  discountCode?: string
}

export async function sendAbandonmentEmail(data: AbandonmentEmailData) {
  const template = getEmailTemplate(data.source)
  
  // Use your preferred email service
  // - SendGrid
  // - Mailgun  
  // - Resend
  // - AWS SES
  
  return await emailService.send({
    to: data.email,
    subject: template.subject,
    html: template.html(data),
    from: 'support@aistyleguide.com'
  })
}
```

## Privacy & Compliance Considerations

### GDPR Compliance
- ✅ Clear consent messaging ("I agree to receive marketing emails")
- ✅ Easy unsubscribe mechanism  
- ✅ Data retention policies
- ✅ Right to deletion

### Email Best Practices
- ✅ Double opt-in for marketing emails (recommended)
- ✅ Clear sender identification
- ✅ Relevant, valuable content only
- ✅ Respect unsubscribe requests immediately
- ✅ Segment based on user behavior

### Privacy Policy Updates
Update your privacy policy to include:
- Email collection practices
- Purpose of data collection
- Third-party integrations (email services)
- User rights and controls

## Success Metrics to Track

### Primary Metrics
- **Email Collection Rate**: % of visitors who provide email
- **Cart Abandonment Recovery Rate**: % of abandoned carts that convert via email
- **Revenue Recovery**: $ amount recovered from abandonment emails

### Secondary Metrics  
- **Email Engagement**: Open rates, click rates for recovery emails
- **Conversion Funnel**: Email collection → Checkout → Purchase
- **User Experience**: Bounce rate, time on site after email collection

## Expected ROI

### Conservative Estimate
- **Additional Email Captures**: +150-300 emails/month
- **Recovery Conversion Rate**: 10-15%
- **Average Order Value**: $120
- **Monthly Revenue Recovery**: $1,800 - $5,400

### Optimistic Estimate  
- **Additional Email Captures**: +500-800 emails/month
- **Recovery Conversion Rate**: 15-25%
- **Monthly Revenue Recovery**: $9,000 - $24,000

### Implementation Cost
- **Development Time**: 1-3 weeks
- **Email Service**: $20-100/month
- **Total Investment**: $2,000-6,000 (dev time + tools)

**Payback Period**: 1-3 months

## Conclusion

The most effective approach is a **phased implementation**:

1. **Start with Stripe's cart abandonment recovery** - Quick win with minimal effort
2. **Add early email collection** - Captures more users in the funnel  
3. **Optimize with advanced features** - Exit intent, social proof, etc.

This strategy will help you capture significantly more potential customers while maintaining a good user experience and staying compliant with privacy regulations.

The key is to provide clear value in exchange for email addresses and to use the collected data responsibly to help users complete their purchase journey.
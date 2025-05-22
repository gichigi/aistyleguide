# Stripe Webhook Issue Fix Guide

## Problem Summary

The Stripe webhook endpoint at `https://aistyleguide.com/api/webhook` is failing to process webhook events. After investigation, we've identified these issues:

1. **URL Redirect Issue**: The website redirects from `aistyleguide.com` to `www.aistyleguide.com`, causing webhook signature verification failures
2. **API Version Mismatch**: The checkout session creation uses an invalid future API version
3. **Error Handling**: The webhook handler has limited error logging, making it difficult to diagnose issues

## Implemented Fixes

We've made the following changes to address these issues:

1. **Fixed API Version**: 
   - Updated both webhook handler and checkout session to use the same valid API version `2023-10-16`

2. **Enhanced Error Logging**: 
   - Added detailed logging to capture webhook processing errors
   - Added URL normalization to handle the domain redirect issue

3. **Environment Updates**:
   - Updated .env to use the www subdomain for all URLs
   - Added a specific webhook URL environment variable

4. **Test Scripts**:
   - Created `test-webhook.js` to verify webhook functionality
   - Created `update-stripe-webhook.js` to update webhook URL in Stripe Dashboard

## Steps to Verify Fix

1. **Run the Webhook Test Script**:
   ```
   node test-webhook.js
   ```
   This will test both `aistyleguide.com` and `www.aistyleguide.com` endpoints. The www version should return a 200 status.

2. **Update Stripe Dashboard Configuration**:
   ```
   STRIPE_SECRET_KEY=your_secret_key node update-stripe-webhook.js
   ```
   This will update any incorrectly configured webhook endpoints in your Stripe account.

3. **Check Vercel Logs**: 
   After deploying these changes, monitor the Vercel logs for the next 24 hours to ensure webhook events are being processed correctly.

## Additional Recommendations

1. **Implement Proper Event Handling**: The current webhook only logs events without taking action. Implement proper payment processing logic.

2. **Add Webhook Event Storage**: Store webhook events in a database to track payment status and avoid losing data if the server is unavailable.

3. **Add Redundancy**: Consider implementing a fallback mechanism for payment verification in case webhooks fail.

4. **Regular Monitoring**: Set up monitoring for webhook events and alert on failures.

## Certificate Issue

The SSL certificate for `aistyleguide.com` shows a start date of May 16, 2025, which is in the future. This might be causing TLS verification issues with Stripe's webhook delivery. Contact your hosting provider to fix this certificate issue. 
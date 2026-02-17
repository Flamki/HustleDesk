import {
  sendSuccess,
  sendBadRequest,
  sendServerError,
  sendMethodNotAllowed,
  sendRateLimitError,
  validateEmail,
  validateStringLength,
  sanitizeString,
  parseJsonBody,
  logger,
  executeQuery,
  getServiceClient,
  checkRateLimitGlobal,
  getClientIp,
} from '../_shared/index.js';

/**
 * Validate email address (more strict for public endpoint)
 */
const isValidEmail = (email) => {
  const validation = validateEmail(email);
  return validation.valid;
};

/**
 * Public site signup endpoint - handles email capture from marketing sites
 * CRITICAL: This is a public endpoint with extra security measures
 */
export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      return sendMethodNotAllowed(res, ['POST']);
    }

    // Parse request body
    const bodyResult = parseJsonBody(req);
    if (!bodyResult.valid) {
      logger.warn('Site signup - invalid JSON', { error: bodyResult.error });
      return sendBadRequest(res, 'Invalid request format');
    }

    const body = bodyResult.data;
    
    // Extract and sanitize inputs
    const slug = sanitizeString(body.slug || '', 100).toLowerCase();
    const email = sanitizeString(body.email || '', 254).toLowerCase();
    const name = body.name ? sanitizeString(body.name, 120) : null;
    const consent = body.consent !== false;

    // Honeypot check - bot protection
    if (String(body.website || '').trim()) {
      logger.info('Site signup - honeypot triggered', { ip: getClientIp(req) });
      return sendSuccess(res, { ok: true }); // Return success to fool bots
    }

    // Validate required fields
    if (!slug) {
      return sendBadRequest(res, 'slug is required');
    }

    const slugValidation = validateStringLength(slug, { min: 1, max: 100, name: 'Slug' });
    if (!slugValidation.valid) {
      return sendBadRequest(res, slugValidation.error);
    }

    if (!isValidEmail(email)) {
      return sendBadRequest(res, 'Valid email is required');
    }

    // Rate limiting - aggressive for public endpoints
    const ip = getClientIp(req);
    
    // IP-based rate limit (20 signups per minute per IP)
    const ipLimit = await checkRateLimitGlobal({
      key: `site-signup:ip:${slug}:${ip}`,
      limit: 20,
      windowMs: 60 * 1000,
    });
    
    res.setHeader('X-RateLimit-Store', ipLimit.store || 'memory');
    
    if (!ipLimit.allowed) {
      logger.warn('Site signup - IP rate limit exceeded', { 
        ip, 
        slug,
        limit: 20,
      });
      res.setHeader('Retry-After', String(ipLimit.retryAfterSeconds));
      return sendRateLimitError(res, ipLimit.retryAfterSeconds);
    }

    // Email-based rate limit (6 signups per 10 minutes per email)
    const emailLimit = await checkRateLimitGlobal({
      key: `site-signup:email:${slug}:${email}`,
      limit: 6,
      windowMs: 10 * 60 * 1000,
    });
    
    if (!emailLimit.allowed) {
      logger.warn('Site signup - Email rate limit exceeded', { 
        email: email.substring(0, 3) + '***', // Partial email for privacy
        slug,
        limit: 6,
      });
      res.setHeader('Retry-After', String(emailLimit.retryAfterSeconds));
      return sendRateLimitError(res, emailLimit.retryAfterSeconds);
    }

    // Get service admin client
    let admin;
    try {
      admin = getServiceClient();
    } catch (error) {
      logger.error('Site signup - service client error', { error: error.message });
      return sendServerError(res, 'Service not available');
    }

    // Fetch and validate site
    const siteResult = await executeQuery(
      admin
        .from('marketing_sites')
        .select('id,user_id,slug,cta_text,show_email_signup,published_at')
        .eq('slug', slug)
        .maybeSingle(),
      {
        operation: 'fetch_site',
        slug,
      }
    );

    if (!siteResult.success) {
      logger.error('Site signup - site fetch failed', { 
        slug,
        error: siteResult.error,
      });
      return sendServerError(res, 'Failed to fetch site');
    }

    const site = siteResult.data;

    if (!site || !site.published_at) {
      logger.warn('Site signup - site not found or not published', { slug });
      return sendBadRequest(res, 'Site not found');
    }

    if (!site.show_email_signup) {
      logger.warn('Site signup - signups disabled', { slug });
      return sendBadRequest(res, 'Email signup is disabled for this site');
    }

    // Extract metadata for logging
    const ipHeader = req.headers['x-forwarded-for'] ? 
      String(req.headers['x-forwarded-for']).split(',')[0].trim() : null;
    const ua = req.headers['user-agent'] ? 
      sanitizeString(req.headers['user-agent'], 300) : null;

    // Check for existing contact
    const existingResult = await executeQuery(
      admin
        .from('marketing_contacts')
        .select('id,status,tags')
        .eq('user_id', site.user_id)
        .eq('email', email)
        .maybeSingle(),
      {
        operation: 'check_existing_contact',
        userId: site.user_id,
      }
    );

    // Handle unsubscribed users (respect their choice)
    if (existingResult.success && existingResult.data?.status === 'unsubscribed') {
      logger.info('Site signup - respecting unsubscribe status', {
        slug,
        email: email.substring(0, 3) + '***',
      });
      
      // Log attempt but don't resubscribe
      await executeQuery(
        admin.from('marketing_site_signups').insert({
          user_id: site.user_id,
          site_id: site.id,
          email,
          name,
          consent,
          ip: ipHeader || ip,
          user_agent: ua,
        }),
        {
          operation: 'log_signup_unsubscribed',
          userId: site.user_id,
        }
      );
      
      return sendSuccess(res, { ok: true }); // Return success to user
    }

    // Upsert contact with site tag
    const siteTag = `site:${slug}`;
    const existingTags = Array.isArray(existingResult.data?.tags) ? existingResult.data.tags : [];
    const tags = Array.from(new Set([...existingTags, siteTag])).slice(0, 50);

    const firstName = name ? name.split(' ')[0].slice(0, 100) : null;
    const lastName = name ? name.split(' ').slice(1).join(' ').slice(0, 100) : null;

    await executeQuery(
      admin
        .from('marketing_contacts')
        .upsert(
          {
            user_id: site.user_id,
            email,
            first_name: firstName,
            last_name: lastName,
            tags,
            status: consent ? 'subscribed' : 'pending',
            unsubscribed_at: null,
          },
          { onConflict: 'user_id,email' }
        ),
      {
        operation: 'upsert_contact',
        userId: site.user_id,
      }
    );

    // Log signup event
    await executeQuery(
      admin.from('marketing_site_signups').insert({
        user_id: site.user_id,
        site_id: site.id,
        email,
        name,
        consent,
        ip: ipHeader || ip,
        user_agent: ua,
      }),
      {
        operation: 'log_signup',
        userId: site.user_id,
        siteId: site.id,
      }
    );

    // Log analytics event (non-blocking, ignore errors)
    try {
      await admin.from('marketing_site_events').insert({
        user_id: site.user_id,
        site_id: site.id,
        event_type: 'signup',
        metadata: {
          source: 'public_site_signup',
          slug,
        },
      });
    } catch (error) {
      logger.debug('Site signup - analytics logging failed', { 
        error: error.message,
      });
      // Continue anyway - analytics failure shouldn't block signup
    }

    logger.info('Site signup completed successfully', {
      slug,
      userId: site.user_id,
      siteId: site.id,
      consent,
    });

    return sendSuccess(res, { ok: true });
  } catch (error) {
    logger.error('Site signup - unexpected error', {
      error: error.message,
      stack: error.stack,
    });
    return sendServerError(res, 'Signup processing failed');
  }
}

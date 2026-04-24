export type TemplateCategory = 'Proposal' | 'Outreach' | 'Follow-up' | 'Client Mgmt' | 'Pricing' | 'Social Proof' | 'Contracts';

export type TemplateDef = {
  key: string;
  title: string;
  description: string;
  category: TemplateCategory;
  content: string;
  tags: string[];
  likes: number;
};

const asTemplate = (t: TemplateDef): TemplateDef => t;

// Keep templates ASCII-only for consistent rendering across email clients + PDFs.
const BASE_TEMPLATES: TemplateDef[] = [
  asTemplate({
    key: 'proposal_specialist_cover_letter',
    title: 'Specialist Cover Letter (Upwork)',
    description: 'Problem-first proposal that proves niche fit, outlines a clear plan, and ends with an easy next step.',
    category: 'Proposal',
    content: `Hi [Client Name],

I read your post about [Project Name] and it sounds like the main goal is [Outcome], but the risk is [Risk / Pain Point].

Here is how I would approach this:
1. Clarify success metrics + scope (10 minutes)
2. Build the first working version of [Deliverable] with [Key Constraint]
3. Review + iterate with you, then hand off with documentation

Relevant experience:
- [1-2 line proof: similar project + result]
- [Tooling / stack match]

If you are open to it, I can share a quick outline (or a short Loom) for the first 48 hours of work.

Best,
[Your Name]`,
    tags: ['Upwork', 'Proposal', 'High intent'],
    likes: 1240,
  }),
  asTemplate({
    key: 'proposal_short_bullets',
    title: 'Short Proposal (Bullets Only)',
    description: 'Fast, scannable proposal for busy clients. Works well when the job post is clear.',
    category: 'Proposal',
    content: `Hi [Client Name],

I can help with [Project Name]. Here is what I will do:
- [Step 1]
- [Step 2]
- [Step 3]

Timeline: [X days]
Budget: [Fixed price or hourly]

2 questions:
1. [Question 1]
2. [Question 2]

If that looks good, I can start [Start day/time].

[Your Name]`,
    tags: ['Short', 'Direct', 'Low friction'],
    likes: 980,
  }),
  asTemplate({
    key: 'proposal_fixed_price_milestones',
    title: 'Fixed-Price Proposal With Milestones',
    description: 'De-risks fixed-price by splitting scope into clear milestones with acceptance criteria.',
    category: 'Proposal',
    content: `Hi [Client Name],

For [Project Name], I recommend a fixed-price plan broken into milestones:

Milestone 1: Discovery + plan ([Price])
- Confirm requirements
- Define success metrics
- Produce a short implementation plan

Milestone 2: Build ([Price])
- Implement [Core feature set]
- QA + edge cases
- Weekly progress updates

Milestone 3: Polish + handoff ([Price])
- Final revisions
- Documentation
- Handoff call (optional)

Total: [Total Price]
Timeline: [X days/weeks]

If you want, I can write the milestones in your platform format so everything is crystal clear.

Best,
[Your Name]`,
    tags: ['Fixed price', 'Milestones', 'Scope control'],
    likes: 720,
  }),
  asTemplate({
    key: 'proposal_discovery_call',
    title: 'Discovery Call Pitch',
    description: 'Useful when the post is vague or high stakes. Moves the client into a structured call quickly.',
    category: 'Proposal',
    content: `Hi [Client Name],

Before I quote accurately for [Project Name], I want to avoid assumptions.

Can we do a 15-minute discovery call where I ask:
- What does success look like in 30 days?
- What is the current workflow and what is broken?
- Any deadlines, constraints, or non-negotiables?

After the call, I will send:
- A clear scope summary
- A recommended approach
- A fixed price or an hourly estimate (your choice)

If you share 2-3 times that work for you, I will send a calendar link.

Best,
[Your Name]`,
    tags: ['Sales', 'Discovery', 'Clarity'],
    likes: 640,
  }),
  asTemplate({
    key: 'proposal_retainer_pitch',
    title: 'Retainer Pitch (Monthly Support)',
    description: 'Convert a one-off project into recurring monthly revenue with a simple retainer structure.',
    category: 'Proposal',
    content: `Hi [Client Name],

Now that we have [Completed Work], the best next step is to keep momentum with ongoing support.

I can offer a monthly retainer:
- [Hours or deliverables] per month
- Priority response time: [X hours]
- Includes: [What is included]
- Rate: [Monthly price]

This is typically more cost-effective than ad-hoc work because it reduces context switching and keeps delivery consistent.

If you want, I can propose 2 retainer options (light and full) so you can choose.

Best,
[Your Name]`,
    tags: ['Upsell', 'Retainer', 'Recurring'],
    likes: 670,
  }),
  asTemplate({
    key: 'proposal_scope_questions',
    title: 'Scope Clarification Questions',
    description: 'Send when the job post is unclear. Turns vague requirements into a clear scope fast.',
    category: 'Proposal',
    content: `Hi [Client Name],

To quote [Project Name] accurately, I have a few quick questions:
1. What is the primary goal? (Revenue, leads, speed, UX, reliability)
2. What is the deadline (if any) and why?
3. Do you have examples of what you like (2-3 links/screenshots)?
4. What is in scope vs out of scope?
5. Who will approve deliverables?

Once you reply, I will send a clear scope summary plus a fixed price or hourly estimate.

Best,
[Your Name]`,
    tags: ['Discovery', 'Clarity', 'Reduce rework'],
    likes: 820,
  }),
  asTemplate({
    key: 'proposal_portfolio_case_study',
    title: 'Portfolio + Case Study Proposal',
    description: 'Great for premium clients: short plan + one relevant case study to build confidence.',
    category: 'Proposal',
    content: `Hi [Client Name],

I can help with [Project Name]. The fastest path is:
- Week 1: [Plan]
- Week 2: [Plan]

Here is a relevant case study:
[Project / Client]
- Problem: [Problem]
- Work: [What you did]
- Result: [Measured outcome]

If you share [Required access/assets], I can start on [Date] and send the first update within 24-48 hours.

Best,
[Your Name]`,
    tags: ['Premium', 'Proof', 'Case study'],
    likes: 690,
  }),
  asTemplate({
    key: 'outreach_value_first_cold_email',
    title: 'Value-First Cold Email',
    description: 'Start with a specific observation and offer a tiny deliverable before asking for anything.',
    category: 'Outreach',
    content: `Hi [Name],

I have been following [Company Name] and I liked [Specific detail].

I noticed one opportunity to improve [Area] that could impact [Metric]. It is small, but it is usually high leverage.

If you want, I can send a 2-minute Loom showing:
- What I noticed
- Why it matters
- How to fix it quickly

Should I send it over?

Thanks,
[Your Name]`,
    tags: ['Cold email', 'High response', 'Loom'],
    likes: 856,
  }),
  asTemplate({
    key: 'outreach_short_loom_audit',
    title: 'Short Loom Audit Offer',
    description: 'Offer a free micro-audit with a clear time box. High reply rate for agencies and SaaS.',
    category: 'Outreach',
    content: `Hi [Name],

Quick idea for [Company Name]:

I can record a 3-minute Loom showing 3 fixes to improve [Metric] on [Page / Flow]. No pitch in the video, just actionable points.

If you want it, reply with:
- the URL
- the main goal (signups, bookings, sales)

I will send it today.

Best,
[Your Name]`,
    tags: ['Loom', 'Offer', 'Value first'],
    likes: 740,
  }),
  asTemplate({
    key: 'outreach_referral_request',
    title: 'Referral Request (Warm)',
    description: 'Ask a past client for an intro in a way that is easy for them to act on.',
    category: 'Outreach',
    content: `Hi [Name],

Hope you are doing well. Quick question: do you know anyone who needs help with [Service] right now?

If yes, I can send a short blurb you can forward. If not, no worries.

Thanks,
[Your Name]`,
    tags: ['Referrals', 'Warm', 'Short'],
    likes: 610,
  }),
  asTemplate({
    key: 'outreach_linkedin_connect',
    title: 'LinkedIn Connection Note (Not Spammy)',
    description: 'A human connection request that references something real and does not pitch immediately.',
    category: 'Outreach',
    content: `Hi [Name],

I saw your post about [Topic] and your point about [Detail] was spot on.

I work with [Industry] teams on [What you do]. Would love to connect and learn from your posts.

[Your Name]`,
    tags: ['LinkedIn', 'Short', 'Networking'],
    likes: 430,
  }),
  asTemplate({
    key: 'outreach_reactivate_old_lead',
    title: 'Re-Engage Old Lead',
    description: 'Revive a past conversation with a clear, low-pressure prompt and a specific update.',
    category: 'Outreach',
    content: `Hi [Name],

Quick check-in. Last time we spoke about [Project/Topic], you mentioned [Context].

I recently helped a client with something similar and thought of you. If [Goal] is still on your radar, I can share a short plan.

No worries if timing is not right. Want me to send it?

Best,
[Your Name]`,
    tags: ['Warm lead', 'Reactivation', 'Short'],
    likes: 510,
  }),
  asTemplate({
    key: 'followup_gentle_nudge',
    title: 'Gentle Nudge Follow-Up',
    description: 'Polite follow-up after sending a proposal. Asks a simple yes/no to unblock.',
    category: 'Follow-up',
    content: `Hi [Name],

Just bumping this. Are you still looking for help with [Project Name]?

If you went a different direction, totally fine. A quick note helps me close it out on my end.

Best,
[Your Name]`,
    tags: ['Short', 'Polite', '3-day'],
    likes: 2300,
  }),
  asTemplate({
    key: 'followup_call_recap',
    title: 'Call Recap + Next Steps',
    description: 'Send right after a discovery call to confirm scope and keep momentum.',
    category: 'Follow-up',
    content: `Hi [Name],

Thanks for the call. Here is my quick recap of what we agreed:

Goal:
- [Goal]

Scope:
- [Item 1]
- [Item 2]

Timeline:
- [Timeline]

Next steps:
1. I will send [Proposal / milestone breakdown] by [Date]
2. You will confirm [Access / assets / decision]

If anything above is off, reply with corrections and I will update.

Best,
[Your Name]`,
    tags: ['Professional', 'Momentum', 'Clarity'],
    likes: 760,
  }),
  asTemplate({
    key: 'followup_after_proposal_question',
    title: 'Follow-Up With One Clear Question',
    description: 'Avoids "just checking in" by asking a single decision question.',
    category: 'Follow-up',
    content: `Hi [Name],

Quick question on [Project Name]:
Would you like me to proceed with [Option A] or [Option B]?

Once I have that, I can send the exact timeline and start date.

Best,
[Your Name]`,
    tags: ['Direct', 'Decision', 'Low friction'],
    likes: 880,
  }),
  asTemplate({
    key: 'followup_invoice_payment_reminder',
    title: 'Invoice Payment Reminder (Polite)',
    description: 'Friendly payment reminder that keeps the relationship intact.',
    category: 'Follow-up',
    content: `Hi [Client Name],

Quick reminder that invoice [Invoice Number] for [Project Name] is due on [Due Date].

If you already processed it, please ignore this message.
If there is anything you need from me to close it out, tell me and I will send it right away.

Thanks,
[Your Name]`,
    tags: ['Invoices', 'Professional', 'Simple'],
    likes: 950,
  }),
  asTemplate({
    key: 'followup_breakup',
    title: 'Break-Up Email (Final Follow-Up)',
    description: 'Final follow-up before marking as lost. Often triggers a response without sounding pushy.',
    category: 'Follow-up',
    content: `Hi [Name],

Since I have not heard back, I am assuming [Project Name] is not a priority right now or you found someone else.

I will close this out on my end.

If you want to revisit later, reply with "reopen" and I will pick it up quickly.

Best,
[Your Name]`,
    tags: ['Final follow-up', 'Sales', 'Psychology'],
    likes: 1105,
  }),
  asTemplate({
    key: 'client_kickoff_checklist',
    title: 'Project Kickoff Checklist',
    description: 'Sets expectations, reduces rework, and gathers everything you need upfront.',
    category: 'Client Mgmt',
    content: `Hi [Client Name],

Excited to start [Project Name]. To begin smoothly, I need:
- Access: [Admin / repo / Figma / analytics]
- Assets: [Brand guide / copy / images]
- Stakeholders: who approves changes?
- Deadlines: any hard dates?
- Communication: preferred channel + response time

Proposed cadence:
- Updates: [Daily/Weekly] via [Channel]
- Reviews: [Day/time]

Once I have access + assets, I will deliver the first update by [Date].

Thanks,
[Your Name]`,
    tags: ['Kickoff', 'Operations', 'Professional'],
    likes: 890,
  }),
  asTemplate({
    key: 'client_access_request',
    title: 'Access Request (Clear and Specific)',
    description: 'Ask for access without back-and-forth. Works well for dev/analytics/design work.',
    category: 'Client Mgmt',
    content: `Hi [Client Name],

To start [Project Name], I need access to:
- [Tool 1] (role: [Admin/Editor])
- [Tool 2]
- [Repo/Figma/Hosting]

If you prefer, you can invite me here: [Email / username]

Once access is in, I will send the first update by [Date].

Thanks,
[Your Name]`,
    tags: ['Operations', 'Access', 'Kickoff'],
    likes: 700,
  }),
  asTemplate({
    key: 'client_weekly_update',
    title: 'Weekly Client Update',
    description: 'A consistent structure that builds trust and reduces anxious messages.',
    category: 'Client Mgmt',
    content: `Hi [Client Name],

Weekly update for [Project Name]:

Done:
- [Item 1]
- [Item 2]

In progress:
- [Item 1]

Next:
- [Item 1]
- [Item 2]

Risks / blockers:
- [Blocker] (needs: [Decision / access])

If you have any changes to priorities, reply with the new order and I will adjust.

Best,
[Your Name]`,
    tags: ['Weekly', 'Trust', 'Status'],
    likes: 1020,
  }),
  asTemplate({
    key: 'client_scope_creep',
    title: 'Scope Change / Change Request',
    description: 'Protects your time and keeps the relationship healthy when new work appears mid-scope.',
    category: 'Client Mgmt',
    content: `Hi [Client Name],

Yes, I can add [New request].

To keep things clear, this is outside the current scope of [Current scope], so we have two options:
1. Add it as a new milestone for [Price] and extend the timeline by [X days]
2. Swap priorities: we can replace [Lower priority item] with [New request] and keep timeline the same

Which option do you prefer?

Best,
[Your Name]`,
    tags: ['Boundaries', 'Scope', 'Professional'],
    likes: 940,
  }),
  asTemplate({
    key: 'client_pause_project',
    title: 'Pause Project (Professional)',
    description: 'When the client goes silent or requirements stall: pause politely and set terms.',
    category: 'Client Mgmt',
    content: `Hi [Client Name],

I am currently blocked on [Blocker]. To avoid burning hours without progress, I will pause work until we have:
- [Decision / asset / access]

Once you reply, I can resume within [X hours/days].

Best,
[Your Name]`,
    tags: ['Boundaries', 'Professional', 'Reduce waste'],
    likes: 680,
  }),
  asTemplate({
    key: 'client_rate_increase_notice',
    title: 'Rate Increase Notice',
    description: 'Raise rates without losing good clients. Includes a loyalty window.',
    category: 'Client Mgmt',
    content: `Hi [Client Name],

I am writing to let you know about an upcoming change to my billing.

Starting [Date], my hourly rate will be [New rate].

This change lets me limit my workload and keep delivering the level of focus and quality you expect.

If you would like, I can lock your current rate until [Date] if you book your next block of hours before then.

Thanks for being a great partner,
[Your Name]`,
    tags: ['Business', 'Rates', 'Retention'],
    likes: 540,
  }),
  asTemplate({
    key: 'client_wrapup_testimonial',
    title: 'Project Wrap-Up + Testimonial Request',
    description: 'Close cleanly and ask for a review/testimonial with minimal friction.',
    category: 'Client Mgmt',
    content: `Hi [Client Name],

It has been a pleasure working on [Project Name]. I have delivered the final files and the last invoice is attached / sent.

If you are happy with the work, would you mind leaving a short testimonial on [Platform]?
Here is the link: [Link]

If you need anything later, just reply to this thread and I will jump in.

Thanks,
[Your Name]`,
    tags: ['Offboarding', 'Review', 'Referrals'],
    likes: 910,
  }),
  asTemplate({
    key: 'client_decline_not_a_fit',
    title: 'Decline Project (Not a Fit)',
    description: 'Say no without burning bridges. Keeps the door open for future work.',
    category: 'Client Mgmt',
    content: `Hi [Client Name],

Thanks for considering me for [Project Name]. After reviewing the details, I do not think I am the best fit for this specific request.

If you want, I can recommend the right type of specialist to look for, or share 2-3 questions to ask candidates.

Wishing you a smooth project,
[Your Name]`,
    tags: ['Professional', 'Boundaries', 'Reputation'],
    likes: 520,
  }),

  // ═══════════════════════════════════════════════════════════
  // Pricing & Negotiation
  // ═══════════════════════════════════════════════════════════

  asTemplate({
    key: 'pricing_too_high_response',
    title: '"Your Price Is Too High" Response',
    description: 'Reframe the conversation on value instead of discounting. The #1 objection freelancers face.',
    category: 'Pricing',
    content: `Hi [Client Name],

I understand that budget matters. Here is how I see the investment:

What you get:
- [Deliverable 1] that directly impacts [Metric]
- [Deliverable 2] that saves [X hours/month]
- [Quality guarantee / revision policy]

What this prevents:
- Rework from hiring someone cheaper who misses [Critical detail]
- Lost revenue from [Delayed launch / poor UX / bugs]

I can also offer a phased approach:
- Phase 1: [Core deliverable] for [Lower price]
- Phase 2: [Remaining work] once you see results

Would a phased plan work better for your budget?

Best,
[Your Name]`,
    tags: ['Negotiation', 'Objection handling', 'Value'],
    likes: 1340,
  }),
  asTemplate({
    key: 'pricing_rush_job_surcharge',
    title: 'Rush Job Pricing Template',
    description: 'Set a rush fee without sounding greedy. Protects your schedule and compensates for priority shifts.',
    category: 'Pricing',
    content: `Hi [Client Name],

I can meet the [Date] deadline. For rush delivery, here is how pricing adjusts:

Standard timeline ([X days]): [Standard price]
Rush timeline ([Y days]): [Rush price] (includes [X]% priority surcharge)

The surcharge covers:
- Rescheduling other committed work
- Extended hours to meet your deadline
- Same quality standard, faster delivery

If you confirm by [Date], I will start immediately.

Best,
[Your Name]`,
    tags: ['Rush', 'Pricing', 'Boundaries'],
    likes: 780,
  }),
  asTemplate({
    key: 'pricing_negotiate_without_discount',
    title: 'Negotiate Without Dropping Price',
    description: 'Offer more value instead of less money. Keeps your rate intact while giving the client a win.',
    category: 'Pricing',
    content: `Hi [Client Name],

I appreciate you sharing your budget. My rate reflects [Years] of experience and [Specialization], and I keep it consistent to maintain quality.

Instead of lowering the price, I can add value:
- Option A: Include [Extra deliverable] at no additional cost
- Option B: Extend support to [X days] post-delivery
- Option C: Add [Training session / documentation / template]

This way you get more for your investment without compromising on quality.

Which option appeals to you?

Best,
[Your Name]`,
    tags: ['Negotiation', 'Value-add', 'Professional'],
    likes: 920,
  }),
  asTemplate({
    key: 'pricing_payment_terms',
    title: 'Payment Terms Agreement',
    description: 'Set clear payment expectations upfront. Prevents awkward conversations later.',
    category: 'Pricing',
    content: `Hi [Client Name],

Before we kick off, here are my standard payment terms for [Project Name]:

Payment structure:
- [X]% upfront before work begins ([Amount])
- [X]% at [Milestone] ([Amount])
- [X]% on final delivery ([Amount])

Payment details:
- Method: [PayPal / Wise / Bank transfer / Platform escrow]
- Due: within [X] days of invoice
- Late payments: work pauses after [X] days overdue

Invoices will include a clear breakdown of hours or deliverables.

If you need different terms, let me know and we can adjust.

Best,
[Your Name]`,
    tags: ['Payment', 'Terms', 'Professional'],
    likes: 870,
  }),

  // ═══════════════════════════════════════════════════════════
  // Social Proof & Testimonials
  // ═══════════════════════════════════════════════════════════

  asTemplate({
    key: 'social_proof_testimonial_guided',
    title: 'Guided Testimonial Request',
    description: 'Make it easy for clients to write a great review by giving them 3 simple prompts.',
    category: 'Social Proof',
    content: `Hi [Client Name],

I really enjoyed working on [Project Name]. If you have 2 minutes, a short testimonial would mean a lot for my business.

To make it easy, you can just answer these 3 questions:
1. What was the problem you needed help with?
2. What did I deliver?
3. What was the result or impact?

Even 2-3 sentences is great. You can reply to this email or post directly on [Platform + link].

Thanks,
[Your Name]`,
    tags: ['Testimonials', 'Reviews', 'Growth'],
    likes: 1050,
  }),
  asTemplate({
    key: 'social_proof_case_study_request',
    title: 'Case Study Interview Request',
    description: 'Turn a great project into marketing content. Clients often say yes when you make it effortless.',
    category: 'Social Proof',
    content: `Hi [Client Name],

The results from [Project Name] were impressive: [Key metric or outcome].

Would you be open to a short case study? Here is what it involves:
- A 15-minute call where I ask 5 questions
- I write the entire case study (you just approve it)
- You get a copy to use in your own marketing

Benefits for you:
- Free exposure to my audience ([X] followers / visitors)
- A polished piece you can share with your stakeholders

Would next week work for a quick call?

Best,
[Your Name]`,
    tags: ['Case study', 'Marketing', 'Growth'],
    likes: 640,
  }),
  asTemplate({
    key: 'social_proof_linkedin_recommendation',
    title: 'LinkedIn Recommendation Request',
    description: 'Platform-specific request for LinkedIn recommendations. Strongest social proof for B2B freelancers.',
    category: 'Social Proof',
    content: `Hi [Client Name],

Thanks again for the opportunity to work on [Project Name]. I really enjoyed the collaboration.

Would you be open to writing a short LinkedIn recommendation? It helps me attract more clients like you.

Here is a direct link: https://www.linkedin.com/in/[your-profile]/edit/forms/recommendation/

If it helps, here are some things you could mention:
- The problem we solved
- How the process went
- The outcome or result

No pressure at all. Either way, I would be happy to write one for you too.

Best,
[Your Name]`,
    tags: ['LinkedIn', 'Social proof', 'B2B'],
    likes: 580,
  }),

  // ═══════════════════════════════════════════════════════════
  // Additional Client Management
  // ═══════════════════════════════════════════════════════════

  asTemplate({
    key: 'client_mistake_recovery',
    title: '"I Made a Mistake" Recovery Email',
    description: 'Own mistakes professionally and present a fix. Builds more trust than pretending it did not happen.',
    category: 'Client Mgmt',
    content: `Hi [Client Name],

I want to flag something: [What went wrong].

This was my responsibility and here is what I am doing about it:

1. Immediate fix: [What you are doing right now]
2. Root cause: [Why it happened]
3. Prevention: [What changes you are making]

Timeline to resolve: [X hours/days]

I take quality seriously and this does not reflect my standard. The fix is my top priority today.

Best,
[Your Name]`,
    tags: ['Recovery', 'Trust', 'Professional'],
    likes: 760,
  }),
  asTemplate({
    key: 'client_deadline_extension',
    title: 'Deadline Extension Request',
    description: 'Ask for more time without losing trust. Frames delay as quality-focused, not careless.',
    category: 'Client Mgmt',
    content: `Hi [Client Name],

Update on [Project Name]: I want to be upfront that the [Deliverable] needs [X more days] to meet the quality bar we agreed on.

What happened:
- [Reason: unexpected complexity / dependency / scope addition]

What is done:
- [Progress so far]

What remains:
- [Remaining work]

New delivery date: [Date]

I would rather deliver something excellent a few days late than rush something mediocre on time. If the original date is non-negotiable, I can [Alternative: deliver partial / cut scope].

Best,
[Your Name]`,
    tags: ['Deadlines', 'Transparency', 'Trust'],
    likes: 830,
  }),
  asTemplate({
    key: 'client_free_work_decline',
    title: '"Can You Do This For Free?" Decline',
    description: 'Politely decline free work requests while keeping the relationship warm.',
    category: 'Client Mgmt',
    content: `Hi [Client Name],

Thanks for thinking of me for [Request]. I appreciate the opportunity.

Unfortunately, I am not able to take this on without compensation because [honest reason: full schedule / this is my livelihood / scope is significant].

Here is what I can offer instead:
- A paid mini-engagement: [X hours for $Y] to handle the core need
- A quick pointer: [One specific tip they can act on themselves]
- A referral to someone who might be available at a lower rate

I hope one of these works. If budget opens up later, I would be happy to revisit.

Best,
[Your Name]`,
    tags: ['Boundaries', 'Professional', 'Diplomacy'],
    likes: 710,
  }),

  // ═══════════════════════════════════════════════════════════
  // Additional Follow-ups
  // ═══════════════════════════════════════════════════════════

  asTemplate({
    key: 'followup_thank_you_after_hired',
    title: 'Thank You After Being Hired',
    description: 'Sets a professional tone from day one. Small gesture that clients remember.',
    category: 'Follow-up',
    content: `Hi [Client Name],

Thanks for choosing me for [Project Name]. I am excited to get started.

Here is what happens next:
1. I will review everything you shared by [Date]
2. I will send my first update or questions by [Date]
3. You can reach me at [Preferred channel] anytime

If you think of anything else I should know before I start, just reply here.

Looking forward to great results,
[Your Name]`,
    tags: ['Onboarding', 'Professional', 'Trust'],
    likes: 650,
  }),
  asTemplate({
    key: 'followup_quarterly_checkin',
    title: 'Quarterly Client Check-In',
    description: 'Reactivate past clients at the right time. Q4 and Q1 are when budgets refresh.',
    category: 'Follow-up',
    content: `Hi [Client Name],

It has been a few months since we wrapped [Project Name] and I wanted to check in.

A few things that might be relevant:
- I recently helped a client with [Similar project] and got [Result]
- I have availability opening up in [Month]
- I added [New skill/tool] to my toolkit

If you have any upcoming projects or know someone who needs [Your service], I would love to help.

Either way, hope business is going well.

Best,
[Your Name]`,
    tags: ['Reactivation', 'Seasonal', 'Revenue'],
    likes: 590,
  }),

  // ═══════════════════════════════════════════════════════════
  // Additional Proposals
  // ═══════════════════════════════════════════════════════════

  asTemplate({
    key: 'proposal_counter_offer_underbid',
    title: 'Counter-Offer When Underbid',
    description: 'When someone bid lower, reframe the conversation on risk and quality. Win on value, not price.',
    category: 'Proposal',
    content: `Hi [Client Name],

I understand there are lower bids for [Project Name]. Here is why my approach is different:

What low bids often miss:
- [Common shortcut that causes rework]
- [Security / performance / scalability concern]
- [Lack of documentation or handoff]

What I include:
- [Specific deliverable that prevents rework]
- [Quality assurance step]
- [Post-delivery support: X days]

The real cost is not the bid price. It is the total cost including revisions, delays, and fixes.

If you want, I can do a small paid test ([X hours, $Y]) so you can evaluate my work before committing to the full project.

Best,
[Your Name]`,
    tags: ['Competition', 'Value', 'Differentiation'],
    likes: 730,
  }),
  asTemplate({
    key: 'proposal_platform_profile_bio',
    title: 'Platform Profile / Bio Template',
    description: 'Structured bio template for Upwork, Fiverr, or any freelance platform. First impression matters.',
    category: 'Proposal',
    content: `[Title]: [Your Specialty] | [Key differentiator]

I help [Target client type] achieve [Outcome] through [Your service].

What I do:
- [Service 1]: [One-line benefit]
- [Service 2]: [One-line benefit]
- [Service 3]: [One-line benefit]

Results:
- [Metric 1]: [Number or percentage]
- [Metric 2]: [Number or percentage]
- [Client type] across [Industries]

Tools: [Tool 1], [Tool 2], [Tool 3], [Tool 4]

Process:
1. Discovery call to understand your needs
2. Clear scope and timeline before work starts
3. Regular updates and revisions included
4. Clean handoff with documentation

Available for: [Hourly / Fixed-price / Retainer]
Response time: within [X hours]

[Your Name]`,
    tags: ['Profile', 'Platform', 'First impression'],
    likes: 1180,
  }),

  // ═══════════════════════════════════════════════════════
  // CONTRACTS
  // ═══════════════════════════════════════════════════════
  asTemplate({
    key: 'contract_freelance_agreement',
    title: 'Freelance Service Agreement',
    category: 'Contracts',
    description: 'A clear, professional freelance contract covering scope, payment, timeline, and IP rights.',
    content: `FREELANCE SERVICE AGREEMENT

This Agreement is entered into as of [Date] between:

SERVICE PROVIDER: [Your Full Name]
Email: [Your Email]
Address: [Your Address]

CLIENT: [Client Name / Company]
Email: [Client Email]
Address: [Client Address]

1. SCOPE OF WORK
The Service Provider agrees to perform the following services:
- [Deliverable 1]
- [Deliverable 2]
- [Deliverable 3]

2. TIMELINE
- Project Start Date: [Date]
- Estimated Completion: [Date]
- Milestones: [List key milestones and dates]

3. COMPENSATION
- Total Project Fee: [Currency] [Amount]
- Payment Schedule:
  * [X]% deposit upon signing ([Currency] [Amount])
  * [X]% upon [milestone] ([Currency] [Amount])
  * [X]% upon final delivery ([Currency] [Amount])
- Payment Method: [Bank transfer / PayPal / etc.]
- Late Payment: Invoices unpaid after 14 days incur 1.5% monthly interest.

4. REVISIONS
- Included revisions: [X] rounds
- Additional revisions billed at [Currency] [Rate]/hour

5. INTELLECTUAL PROPERTY
- All IP transfers to Client upon full payment.
- Service Provider retains the right to display the work in their portfolio.

6. CONFIDENTIALITY
Both parties agree to keep project details confidential and not share proprietary information with third parties.

7. TERMINATION
Either party may terminate with [X] days written notice. Client pays for all work completed to date.

8. LIABILITY
Service Provider's total liability shall not exceed the total project fee.

AGREED AND ACCEPTED:

Service Provider: ___________________  Date: ________
Client: ___________________  Date: ________`,
    tags: ['Contract', 'Agreement', 'Legal', 'Scope'],
    likes: 2340,
  }),
  asTemplate({
    key: 'contract_nda',
    title: 'Non-Disclosure Agreement (NDA)',
    category: 'Contracts',
    description: 'Mutual NDA to protect confidential information shared during a freelance engagement.',
    content: `MUTUAL NON-DISCLOSURE AGREEMENT

This NDA is entered into as of [Date] between:

PARTY A: [Your Full Name] ("Service Provider")
PARTY B: [Client Name / Company] ("Client")

1. PURPOSE
The parties wish to explore a potential business relationship regarding [Project Description] and may share confidential information.

2. DEFINITION OF CONFIDENTIAL INFORMATION
"Confidential Information" includes all non-public information shared by either party, including but not limited to:
- Business plans, strategies, and financial data
- Technical specifications, source code, and designs
- Client lists, pricing, and marketing plans
- Any information marked "Confidential"

3. OBLIGATIONS
Each party agrees to:
- Use Confidential Information solely for the stated purpose
- Not disclose to third parties without prior written consent
- Protect information with the same care as their own confidential data

4. EXCLUSIONS
This NDA does not apply to information that:
- Is publicly available through no fault of the receiving party
- Was already known before disclosure
- Is independently developed without use of confidential information
- Is required to be disclosed by law

5. TERM
This NDA remains in effect for [2] years from the date of signing.

6. RETURN OF INFORMATION
Upon request or termination, each party shall return or destroy all confidential materials.

AGREED AND ACCEPTED:

Party A: ___________________  Date: ________
Party B: ___________________  Date: ________`,
    tags: ['NDA', 'Confidentiality', 'Legal'],
    likes: 1890,
  }),
  asTemplate({
    key: 'contract_scope_change',
    title: 'Scope Change Amendment',
    category: 'Contracts',
    description: 'Formal amendment when project scope changes. Protects you from scope creep.',
    content: `SCOPE CHANGE AMENDMENT

Amendment to Agreement dated [Original Agreement Date]
Between [Your Name] and [Client Name]

Amendment Date: [Date]
Amendment Number: [#]

1. ORIGINAL SCOPE
The original agreement covered:
- [Original deliverable 1]
- [Original deliverable 2]

2. REQUESTED CHANGES
The following changes have been requested by the Client:
- [New/changed deliverable 1]
- [New/changed deliverable 2]
- [Removed item, if any]

3. IMPACT ON TIMELINE
- Original completion date: [Date]
- Revised completion date: [Date]
- Additional time required: [X] days/weeks

4. IMPACT ON COST
- Original project fee: [Currency] [Amount]
- Additional cost for scope change: [Currency] [Amount]
- Revised total fee: [Currency] [Amount]
- Payment for additional work due: [Date/milestone]

5. ALL OTHER TERMS
All other terms and conditions of the original agreement remain unchanged and in full effect.

AGREED AND ACCEPTED:

Service Provider: ___________________  Date: ________
Client: ___________________  Date: ________`,
    tags: ['Scope creep', 'Amendment', 'Change order'],
    likes: 1650,
  }),
  asTemplate({
    key: 'contract_project_completion',
    title: 'Project Completion & Handoff',
    category: 'Contracts',
    description: 'Formal sign-off document confirming project delivery and acceptance.',
    content: `PROJECT COMPLETION & ACCEPTANCE

Project: [Project Name]
Agreement Date: [Original Agreement Date]
Completion Date: [Date]

Between: [Your Name] (Service Provider)
And: [Client Name] (Client)

1. DELIVERABLES COMPLETED
The following deliverables have been completed and delivered:

[x] [Deliverable 1] - Delivered [Date]
[x] [Deliverable 2] - Delivered [Date]
[x] [Deliverable 3] - Delivered [Date]

2. FILES & ASSETS TRANSFERRED
- [Source files / repository access]
- [Design files (Figma/Sketch/PSD)]
- [Documentation / user guides]
- [Login credentials / API keys]
- [Other assets]

3. ACCEPTANCE
By signing below, the Client acknowledges that:
- All agreed deliverables have been received
- The work meets the specifications outlined in the original agreement
- The final payment of [Currency] [Amount] is due within [X] days
- The revision period has concluded

4. WARRANTY PERIOD
The Service Provider offers a [30]-day warranty period for bug fixes related to the delivered work, starting from the date of this acceptance.

5. POST-PROJECT SUPPORT
Any work beyond the warranty period will be billed at [Currency] [Rate]/hour.

ACCEPTED:

Service Provider: ___________________  Date: ________
Client: ___________________  Date: ________`,
    tags: ['Completion', 'Handoff', 'Sign-off', 'Acceptance'],
    likes: 1420,
  }),
  asTemplate({
    key: 'contract_payment_terms',
    title: 'Payment Terms Addendum',
    category: 'Contracts',
    description: 'Standalone payment terms document to attach to any agreement or send to new clients.',
    content: `PAYMENT TERMS

Effective Date: [Date]
Service Provider: [Your Full Name]
Client: [Client Name / Company]

1. INVOICING
- Invoices will be sent via email to [Client Email]
- Payment is due within [14/30] days of invoice date
- All amounts are in [Currency]

2. PAYMENT METHODS ACCEPTED
- Bank Transfer: [Bank Name, Account Details]
- PayPal: [PayPal Email]
- [Other: Wise / Payoneer / Razorpay]

3. DEPOSIT POLICY
- Projects over [Currency] [Amount] require a [50]% deposit before work begins
- Deposits are non-refundable once work has commenced

4. LATE PAYMENT
- Invoices unpaid after [14] days incur a 1.5% monthly late fee
- Work may be paused on accounts with invoices overdue by more than [30] days
- Service Provider reserves the right to withhold deliverables until payment is received

5. ADDITIONAL WORK
- Work outside the agreed scope will be quoted separately
- Additional work will not begin until the quote is approved in writing

6. CANCELLATION
- If the Client cancels mid-project, payment is due for all work completed
- Unused deposit may be refunded at Service Provider's discretion

These terms apply to all work performed unless superseded by a separate written agreement.

ACKNOWLEDGED:

Client: ___________________  Date: ________`,
    tags: ['Payment', 'Terms', 'Invoice', 'Late fees'],
    likes: 1560,
  }),
];

const validateTemplate = (t: TemplateDef) => {
  if (!t.key || !/^[a-z0-9_]+$/.test(t.key)) return `Invalid key: ${t.key}`;
  if (!t.title.trim()) return `Template ${t.key} title is empty`;
  if (!t.description.trim()) return `Template ${t.key} description is empty`;
  if (!t.content.trim()) return `Template ${t.key} content is empty`;
  if (!Array.isArray(t.tags)) return `Template ${t.key} tags missing`;
  for (const ch of t.content) {
    if (ch.charCodeAt(0) > 127) return `Template ${t.key} contains non-ASCII characters`;
  }
  return null;
};

export const getBaseTemplates = (): TemplateDef[] => {
  const errors: string[] = [];
  const keys = new Set<string>();
  for (const t of BASE_TEMPLATES) {
    if (keys.has(t.key)) errors.push(`Duplicate template key: ${t.key}`);
    keys.add(t.key);
    const err = validateTemplate(t);
    if (err) errors.push(err);
  }
  if (errors.length) {
    // Fail fast in dev so we never ship broken templates.
    throw new Error(`Templates validation failed:\n${errors.join('\n')}`);
  }
  return BASE_TEMPLATES;
};

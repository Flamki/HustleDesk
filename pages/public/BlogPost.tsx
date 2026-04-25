import React from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, ArrowRight } from 'lucide-react';
import SEO from '../../components/SEO';
import { PublicPageLayout } from './PublicPageLayout';
import { blogPosts } from './BlogIndex';

// ── Article content by slug ──
const articles: Record<string, React.ReactNode> = {
  'how-to-write-freelance-proposal-that-wins': (
    <>
      <p>Writing freelance proposals is a numbers game — but it doesn't have to be a losing one. The difference between a 5% win rate and a 40% win rate comes down to structure, personalization, and timing.</p>
      <p>After analyzing thousands of proposals through GetSoloDesk's AI engine, we've identified the exact patterns that separate winning proposals from the ones that get ignored.</p>

      <h2>The 5-Part Proposal Framework</h2>
      <p>Every high-converting proposal follows this structure:</p>

      <h3>1. The Hook (First 2 sentences)</h3>
      <p>Your opening must prove you <strong>read the job posting</strong>. Reference a specific detail — the tech stack, the business challenge, or the timeline. Generic openings like "I'm a professional developer with 5 years of experience" get skipped.</p>
      <blockquote>"I noticed you're migrating from WordPress to React — I did the same migration for [Company] last month, reducing their page load from 4.2s to 0.8s."</blockquote>

      <h3>2. The Proof (1-2 sentences)</h3>
      <p>One concrete result. Not a list of skills — a <strong>measurable outcome</strong>. Numbers convert better than adjectives.</p>

      <h3>3. The Plan (3-4 bullets)</h3>
      <p>Show them you've already started thinking about their project. Break down what you'd deliver, in what order, and why that order makes sense.</p>

      <h3>4. The Price + Timeline</h3>
      <p>Be specific. "Around $500-1000" signals uncertainty. "$650 for the scope described, delivered in 5 business days" signals confidence.</p>

      <h3>5. The Close (1 sentence)</h3>
      <p>End with a low-commitment next step: "When works for a 10-minute call?" beats "I look forward to hearing from you."</p>

      <h2>Common Mistakes</h2>
      <ul>
        <li><strong>Too long:</strong> Keep it under 200 words. Clients scan, they don't read essays.</li>
        <li><strong>No personalization:</strong> If you could send the same proposal to 10 different jobs, it's too generic.</li>
        <li><strong>Leading with price:</strong> Build value first. Price is the last thing they should see.</li>
        <li><strong>No social proof:</strong> Even one relevant project example increases response rates by 60%.</li>
      </ul>

      <h2>Speed Matters</h2>
      <p>On Upwork, proposals submitted within the first hour get 3x more views. This is where an AI proposal generator becomes essential — it lets you respond to more jobs, faster, without sacrificing quality.</p>

      <p>GetSoloDesk's AI agent learns from your wins and losses, adapting its tone, structure, and pricing suggestions over time. The result: proposals that sound like you wrote them (because the AI learned your style) but in 5 seconds instead of 30 minutes.</p>
    </>
  ),

  'freelancer-crm-why-you-need-one': (
    <>
      <p>If you're freelancing without a CRM, you're leaving money on the table. Not because a CRM is fancy — but because your memory isn't reliable enough to manage 10+ client relationships, follow-up schedules, and revenue tracking simultaneously.</p>

      <h2>The Real Cost of Not Having a CRM</h2>
      <p>Let's do the math. If you miss just <strong>one follow-up per month</strong> on a potential $1,500 project, that's $18,000/year in lost revenue. Not because you're bad at your job — because you forgot to send an email.</p>

      <h2>What a Freelancer CRM Actually Does</h2>
      <p>Forget enterprise features like "pipeline velocity" and "lead scoring algorithms." A freelancer CRM needs exactly three things:</p>

      <h3>1. Visual Pipeline</h3>
      <p>See every opportunity at a glance. Saved → Applied → Replied → Won. Drag-and-drop. Done. You should never have to wonder "wait, did I already apply to that job?"</p>

      <h3>2. Follow-Up Reminders</h3>
      <p>The CRM should nudge you when it's time to check in on a silent lead. Not based on arbitrary schedules — based on how long it's been since last contact and the deal stage.</p>

      <h3>3. Revenue Tracking</h3>
      <p>Know your monthly revenue, average deal size, and win rate by platform. "I think I made around $5k last month" is not a business strategy. "$6,240 from 4 projects, 22% win rate on Upwork vs 35% on LinkedIn" — that's actionable data.</p>

      <h2>Why Spreadsheets Don't Work</h2>
      <ul>
        <li>No reminders — you have to manually check what needs follow-up</li>
        <li>No analytics — calculating win rates across platforms requires formulas</li>
        <li>No context — you can't see a client's full history at a glance</li>
        <li>No mobile — checking a spreadsheet on your phone is painful</li>
      </ul>

      <h2>Set Up a CRM in 5 Minutes</h2>
      <p>Sign up with Google. Add your first job. That's it. GetSoloDesk is pre-configured for freelance workflows — no 30-minute onboarding, no "customizing your pipeline stages." It works out of the box because it was built for exactly one use case: solo freelancers.</p>
    </>
  ),

  'upwork-proposal-tips': (
    <>
      <p>After 500+ proposals on Upwork and a 28% win rate (top 5% of the platform), these are the 7 tactics that consistently get responses.</p>

      <h2>1. Apply Within the First Hour</h2>
      <p>Upwork's algorithm boosts early proposals. Jobs posted in the last 60 minutes have 3x fewer applicants. Set up alerts for your keywords and respond fast. An AI proposal generator helps here — speed without sacrificing quality.</p>

      <h2>2. Never Start With "Dear Client"</h2>
      <p>It screams template. Use the client's name if visible, or jump straight into the hook. "I noticed your landing page loads in 6.2 seconds — I can get that under 2 seconds" is a far better opener.</p>

      <h2>3. Attach a Relevant Sample</h2>
      <p>Proposals with attachments get 50% more responses. Even a screenshot of a similar project works. It gives the client something tangible to evaluate.</p>

      <h2>4. Price Confidently</h2>
      <p>Underbidding signals desperation. If the budget is $500-1000, bid $750 and justify why. Clients who care only about the lowest price are clients you don't want.</p>

      <h2>5. Ask One Specific Question</h2>
      <p>End with a question that shows expertise: "Are you using Next.js or plain React for this?" This does two things: proves you understand the project, and gives the client a reason to reply.</p>

      <h2>6. Keep It Under 150 Words</h2>
      <p>Clients reading 50 proposals don't have time for essays. The best proposals are punchy, specific, and end with a clear next step.</p>

      <h2>7. Follow Up After 3 Days</h2>
      <p>If the job is still open after 3 days, send a follow-up message. 80% of freelancers never follow up. A simple "Hi, I wanted to check if you had any questions about my proposal" can win the deal.</p>

      <h2>Track What Works</h2>
      <p>The biggest mistake freelancers make is not tracking their proposals. Without data, you can't improve. GetSoloDesk tracks every proposal you send — which ones get responses, which platforms convert best, and what pricing sweet spots work for your niche.</p>
    </>
  ),

  'track-freelance-income': (
    <>
      <p>Most freelancers can't answer a simple question: "How much did you earn last month?" Not because they don't care — because their income is scattered across platforms, payment methods, and timezones.</p>

      <h2>The Three Pillars of Freelance Income Tracking</h2>

      <h3>1. Time Tracking (The Foundation)</h3>
      <p>If you bill hourly, untracked time is lost money. The average freelancer loses 2.5 hours per day to untracked work — that's $4,500/month at $75/hr. A one-click timer eliminates this entirely.</p>
      <p>Even project-based freelancers should track time. It helps you understand your <strong>effective hourly rate</strong> — the actual $/hr you earn after accounting for revisions, meetings, and scope creep.</p>

      <h3>2. Invoicing (The Collection)</h3>
      <p>Send invoices within 24 hours of completing work. Every day you delay, the probability of payment drops by 5%. Use a system that auto-generates invoices from tracked time so there's zero friction.</p>

      <h3>3. Revenue Dashboard (The Insight)</h3>
      <p>Monthly revenue, average project value, income by client, income by platform. This data drives better decisions: which clients to pursue, which platforms to focus on, when to raise rates.</p>

      <h2>Tax Implications</h2>
      <p>As a freelancer, you're responsible for quarterly estimated taxes. Without accurate income tracking, you're either overpaying (losing cash flow) or underpaying (risking penalties). Track everything, export monthly, and work with an accountant who understands freelance income.</p>

      <h2>The GetSoloDesk Approach</h2>
      <p>Time tracking → Invoice generation → Revenue dashboard. All connected. Start a timer, finish work, generate an invoice from the time entries, and see the revenue hit your dashboard. One system, zero spreadsheets.</p>
    </>
  ),

  'freelance-follow-up-email-templates': (
    <>
      <p>80% of deals are won after the 5th follow-up. But 92% of freelancers give up after the first. The follow-up is where the money is — and most people leave it on the table.</p>

      <h2>Template 1: The Gentle Nudge (Day 3)</h2>
      <blockquote>
        "Hi [Name], just wanted to follow up on my proposal for [Project]. I'm available to start this week if the timeline works. Happy to jump on a quick call to discuss — when's convenient?"
      </blockquote>

      <h2>Template 2: The Value Add (Day 7)</h2>
      <blockquote>
        "Hi [Name], I've been thinking about your [Project] and had a few ideas that could improve [specific aspect]. Would love to share them in a quick Loom video — no commitment. Let me know if that would be helpful."
      </blockquote>

      <h2>Template 3: The Social Proof (Day 14)</h2>
      <blockquote>
        "Hi [Name], quick update — I just finished a similar project for [Client/Industry] and the results were [specific metric]. If you're still looking for someone for [Project], I'd love to chat about applying the same approach."
      </blockquote>

      <h2>Template 4: The Last Chance (Day 21)</h2>
      <blockquote>
        "Hi [Name], I wanted to check in one more time about [Project]. My schedule is filling up for next month, so if this is still on your radar, now would be a great time to connect. If the timing isn't right, totally understand — I'll keep an eye out for future opportunities."
      </blockquote>

      <h2>Template 5: The Breakup (Day 30)</h2>
      <blockquote>
        "Hi [Name], I haven't heard back about [Project] so I'll assume the timing isn't right. No worries at all — I'll close this out on my end. If anything changes in the future, feel free to reach out. Best of luck with [specific wish]!"
      </blockquote>

      <h2>Timing Strategy</h2>
      <p>The key isn't just what you say — it's when you say it. Space follow-ups at 3, 7, 14, 21, and 30 days. Each one should add new value, not just ask "any update?"</p>
      <p>With GetSoloDesk, follow-up reminders are automated based on deal stage. You'll never forget to check in on a lead — the CRM tracks timing and nudges you at the right moment.</p>
    </>
  ),
};

export const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();

  const post = blogPosts.find((p) => p.slug === slug);
  const content = slug ? articles[slug] : null;

  if (!post || !content) {
    return <Navigate to="/blog" replace />;
  }

  const postIndex = blogPosts.findIndex((p) => p.slug === slug);
  const nextPost = blogPosts[postIndex + 1];
  const prevPost = blogPosts[postIndex - 1];

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    author: { '@type': 'Organization', name: 'GetSoloDesk' },
    publisher: {
      '@type': 'Organization',
      name: 'GetSoloDesk',
      url: 'https://getsolodesk.com',
    },
    mainEntityOfPage: `https://getsolodesk.com/blog/${post.slug}`,
  };

  return (
    <PublicPageLayout>
      <SEO
        title={post.title}
        description={post.description}
        path={`/blog/${post.slug}`}
        keywords={[post.category.toLowerCase(), 'freelance', 'freelancer tips']}
        structuredData={articleSchema}
      />

      {/* Header */}
      <section className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <Link to="/blog" className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-600 transition-colors mb-6">
            <ArrowLeft size={14} /> Back to blog
          </Link>
          <div className="flex items-center gap-3 mb-4">
            <span
              className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full"
              style={{ backgroundColor: `${post.categoryColor}15`, color: post.categoryColor }}
            >
              {post.category}
            </span>
            <span className="text-xs text-slate-400 flex items-center gap-1"><Calendar size={10} />{post.date}</span>
            <span className="text-xs text-slate-400 flex items-center gap-1"><Clock size={10} />{post.readTime}</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight leading-tight">{post.title}</h1>
        </div>
      </section>

      <article className="bg-white py-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 blog-article">
          {content}
        </div>
      </article>

      {/* CTA Banner */}
      <section className="bg-slate-50 border-y border-slate-200 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Ready to put this into practice?</h2>
          <p className="text-slate-500 mb-6">GetSoloDesk gives you the CRM, AI proposals, and follow-up system to execute every strategy in this article.</p>
          <Link to="/signup" className="inline-flex items-center gap-2 px-7 py-3.5 bg-slate-900 text-white rounded-xl font-bold text-sm hover:bg-slate-800 transition-all group">
            Start Free <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Prev / Next */}
      {(prevPost || nextPost) && (
        <section className="bg-white py-12">
          <div className="max-w-3xl mx-auto px-4 grid grid-cols-2 gap-4">
            {prevPost ? (
              <Link to={`/blog/${prevPost.slug}`} className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all">
                <p className="text-xs text-slate-400 mb-1">← Previous</p>
                <p className="text-sm font-bold text-slate-900 line-clamp-2">{prevPost.title}</p>
              </Link>
            ) : <div />}
            {nextPost ? (
              <Link to={`/blog/${nextPost.slug}`} className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:shadow-sm transition-all text-right">
                <p className="text-xs text-slate-400 mb-1">Next →</p>
                <p className="text-sm font-bold text-slate-900 line-clamp-2">{nextPost.title}</p>
              </Link>
            ) : <div />}
          </div>
        </section>
      )}
    </PublicPageLayout>
  );
};

export default BlogPost;

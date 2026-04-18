
import React, { useState, useMemo } from 'react';
import { 
    Search, Rocket, Sparkles, LayoutList, CreditCard, Shield, 
    ChevronRight, ArrowLeft, Mail, MessageSquare, CheckCircle, X,
    ExternalLink, BookOpen, HelpCircle, Send
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// --- Data Structure ---

const CATEGORIES = [
    { 
        id: 'getting-started', 
        title: 'Getting Started', 
        icon: Rocket, 
        description: 'New to GetSoloDesk? Start here.',
        color: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20',
        articles: [
            { id: 'gs-1', title: 'How GetSoloDesk works', content: 'GetSoloDesk is your freelance operating system. It helps you track jobs from various platforms (Upwork, Fiverr, etc.) in one pipeline and generate AI-powered proposals to win more clients.' },
            { id: 'gs-2', title: 'Setting up your freelancer profile', content: 'Your profile is the brain of the AI. Go to Settings > Profile to add your skills, experience, and past projects. The more details you add, the better your proposals will be.' },
            { id: 'gs-3', title: 'Adding your first job', content: 'Click "Add Job" in the sidebar. Copy the job title and description from the freelance platform. We recommend pasting the full description so our AI can analyze requirements accurately.' },
            { id: 'gs-4', title: 'Generating your first proposal', content: 'Once a job is added, click "Generate Proposal". Select your tone and length preferences, then let the AI draft a cover letter for you.' },
        ] 
    },
    { 
        id: 'ai-proposals', 
        title: 'AI Proposals', 
        icon: Sparkles, 
        description: 'Writing perfect pitches with AI.',
        color: 'text-teal-700 bg-teal-50 dark:bg-teal-900/20',
        articles: [
            { id: 'ai-1', title: 'How proposal credits work', content: 'Free plans get 5 credits per month. Pro plans get unlimited credits. One credit is consumed every time you click "Generate Proposal" or "Regenerate".' },
            { id: 'ai-2', title: 'Tips to improve proposal quality', content: '1. Ensure your Profile is complete.\n2. Add "Notes" to the job if you have specific ideas.\n3. Choose the right "Tone" (Friendly vs Professional) based on the client\'s job post style.' },
            { id: 'ai-3', title: 'How to edit generated proposals', content: 'The AI output is a draft. You can edit the text directly in the proposal box before copying it. We encourage adding a personal touch!' },
            { id: 'ai-4', title: 'Why shorter proposals win better', content: 'Clients are busy. Our "Concise" mode generates proposals that get straight to the point, often resulting in higher reply rates than long cover letters.' },
        ] 
    },
    { 
        id: 'job-tracker', 
        title: 'Job Tracker', 
        icon: LayoutList, 
        description: 'Managing your pipeline.',
        color: 'text-amber-500 bg-amber-50 dark:bg-amber-900/20',
        articles: [
            { id: 'jt-1', title: 'Understanding job statuses', content: 'Saved: Found it, haven\'t applied.\nApplied: Proposal sent.\nReplied: Client responded (Good job!).\nWon: You got the gig.\nLost: Didn\'t work out.' },
            { id: 'jt-2', title: 'How follow-up reminders work', content: 'When you mark a job as "Applied", we automatically set a follow-up reminder for 3 days later at 10:00 AM. You can adjust both date and time in Job Details.' },
            { id: 'jt-3', title: 'Best follow-up practices', content: 'Keep it short. "Hi [Name], just bumping this to the top of your inbox. Are you still looking for help with [Project]?" is usually enough.' },
            { id: 'jt-4', title: 'Marking jobs as won/lost', content: 'Open the job details and change the status dropdown. Marking as "Won" updates your revenue stats in the dashboard.' },
        ] 
    },
    { 
        id: 'billing', 
        title: 'Billing & Plans', 
        icon: CreditCard, 
        description: 'Payments and subscriptions.',
        color: 'text-green-500 bg-green-50 dark:bg-green-900/20',
        articles: [
            { id: 'b-1', title: 'Free vs Pro plan', content: 'Free: 10 active jobs, 5 AI credits/mo.\nPro ($9/mo): Unlimited jobs, Unlimited AI, Analytics, Follow-up reminders.' },
            { id: 'b-2', title: 'How AI credits work', content: 'Credits reset on the 1st of every month. Unused credits do not rollover on the Free plan.' },
            { id: 'b-3', title: 'How to upgrade or cancel', content: 'Go to Settings > Billing. You can upgrade instantly or cancel anytime. Cancellations take effect at the end of the billing cycle.' },
            { id: 'b-4', title: 'Refund policy', content: 'We offer a 14-day money-back guarantee if you are not satisfied with the Pro plan. Contact support to request a refund.' },
        ] 
    },
    { 
        id: 'account', 
        title: 'Account & Data', 
        icon: Shield, 
        description: 'Security and privacy.',
        color: 'text-red-500 bg-red-50 dark:bg-red-900/20',
        articles: [
            { id: 'a-1', title: 'Reset password', content: 'Go to Settings > Account to update your password. If you are logged out, use the "Forgot Password" link on the login page.' },
            { id: 'a-2', title: 'Delete account', content: 'You can permanently delete your account from Settings > Danger Zone. This action is irreversible.' },
            { id: 'a-3', title: 'Data privacy & security', content: 'We do not share your proposal data or job details with third parties. Your data is encrypted at rest and in transit.' },
        ] 
    }
];

// Flat list for search
const ALL_ARTICLES = CATEGORIES.flatMap(c => c.articles.map(a => ({ ...a, categoryId: c.id, categoryTitle: c.title, icon: c.icon, color: c.color })));

export const HelpPage: React.FC = () => {
    const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedArticle, setSelectedArticle] = useState<string | null>(null);
    const [showContactForm, setShowContactForm] = useState(false);
    
    // Contact Form State
    const [contactSubject, setContactSubject] = useState('General question');
    const [contactMessage, setContactMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [sentSuccess, setSentSuccess] = useState(false);

    // Derived State
    const filteredArticles = useMemo(() => {
        if (!searchQuery) return [];
        const q = searchQuery.toLowerCase();
        return ALL_ARTICLES.filter(a => 
            a.title.toLowerCase().includes(q) || 
            a.content.toLowerCase().includes(q)
        );
    }, [searchQuery]);

    const activeCategory = selectedCategory ? CATEGORIES.find(c => c.id === selectedCategory) : null;
    const activeArticle = selectedArticle 
        ? ALL_ARTICLES.find(a => a.id === selectedArticle) 
        : null;

    // Navigation Handlers
    const goHome = () => {
        setSelectedCategory(null);
        setSelectedArticle(null);
        setSearchQuery('');
    };

    const handleContactSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        // Mock API call
        setTimeout(() => {
            setIsSending(false);
            setSentSuccess(true);
            setTimeout(() => {
                setShowContactForm(false);
                setSentSuccess(false);
                setContactMessage('');
            }, 2000);
        }, 1500);
    };

    // --- Render Functions ---

    const renderHeader = () => (
        <div className="text-center max-w-2xl mx-auto mb-12">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                How can we help you?
            </h1>
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Search help articles (e.g. 'billing', 'proposal', 'password')..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 rounded-[10px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-lg shadow-slate-200/50 dark:shadow-black/20 outline-none focus:ring-2 focus:ring-teal-700 transition-all"
                />
            </div>
        </div>
    );

    const renderSearchResults = () => (
        <div className="max-w-3xl mx-auto">
            <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">
                {filteredArticles.length} results for "{searchQuery}"
            </h3>
            <div className="space-y-3">
                {filteredArticles.map(article => (
                    <button
                        key={article.id}
                        onClick={() => setSelectedArticle(article.id)}
                        className="w-full text-left p-4 bg-white dark:bg-slate-900 rounded-[10px] border border-slate-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-md transition-all group"
                    >
                        <div className="flex items-center gap-3 mb-2">
                            <div className={`p-1.5 rounded-lg ${article.color}`}>
                                <article.icon size={14} />
                            </div>
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                {article.categoryTitle}
                            </span>
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                            {article.title}
                        </h4>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">
                            {article.content}
                        </p>
                    </button>
                ))}
                {filteredArticles.length === 0 && (
                    <div className="text-center py-12">
                        <p className="text-slate-500">No results found.</p>
                        <button onClick={() => setSearchQuery('')} className="text-teal-700 font-medium mt-2">Clear search</button>
                    </div>
                )}
            </div>
        </div>
    );

    const renderCategories = () => (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {CATEGORIES.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className="flex flex-col text-left p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-lg hover:-translate-y-1 transition-all group h-full"
                >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${cat.color}`}>
                        <cat.icon size={24} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                        {cat.title}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        {cat.description}
                    </p>
                    <div className="mt-auto pt-4 flex items-center text-sm font-medium text-teal-700 dark:text-teal-400 opacity-0 group-hover:opacity-100 transition-opacity">
                        View {cat.articles.length} articles <ChevronRight size={16} className="ml-1" />
                    </div>
                </button>
            ))}
        </div>
    );

    const renderCategoryView = () => (
        <div className="max-w-4xl mx-auto">
            <button 
                onClick={goHome}
                className="flex items-center text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white mb-6 transition-colors"
            >
                <ArrowLeft size={16} className="mr-1" /> Back to Help Center
            </button>

            <div className="flex items-center gap-4 mb-8">
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${activeCategory?.color}`}>
                    {activeCategory && <activeCategory.icon size={32} />}
                </div>
                <div>
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{activeCategory?.title}</h2>
                    <p className="text-slate-500 dark:text-slate-400">{activeCategory?.description}</p>
                </div>
            </div>

            <div className="grid gap-4">
                {activeCategory?.articles.map(article => (
                    <button
                        key={article.id}
                        onClick={() => setSelectedArticle(article.id)}
                        className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-[10px] border border-slate-200 dark:border-slate-800 hover:border-teal-300 dark:hover:border-teal-700 hover:shadow-sm transition-all group text-left"
                    >
                        <div className="flex items-center gap-4">
                            <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg text-slate-400 group-hover:text-teal-500 transition-colors">
                                <BookOpen size={20} />
                            </div>
                            <span className="font-medium text-slate-700 dark:text-slate-200 group-hover:text-teal-700 dark:group-hover:text-teal-400 transition-colors">
                                {article.title}
                            </span>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-teal-400" />
                    </button>
                ))}
            </div>
        </div>
    );

    const renderArticleView = () => (
        <div className="max-w-3xl mx-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                <button 
                    onClick={() => setSelectedArticle(null)}
                    className="flex items-center text-sm text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                    <ArrowLeft size={16} className="mr-1" /> Back
                </button>
                <div className="text-xs text-slate-400">Updated recently</div>
            </div>
            
            <div className="p-8 lg:p-12">
                <div className="mb-8">
                     <span className="text-xs font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 mb-2 block">
                        {activeArticle?.categoryTitle || 'Help Article'}
                     </span>
                     <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-6">
                        {activeArticle?.title}
                     </h1>
                </div>

                <div className="prose dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
                    {activeArticle?.content}
                </div>

                <div className="mt-12 pt-8 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-slate-500 font-medium">Was this article helpful?</p>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition-colors">
                            👍 Yes
                        </button>
                        <button className="px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium transition-colors">
                            👎 No
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-full pb-12 relative">
            
            {/* Main Content Area */}
            <div className="space-y-8">
                {/* Dynamic Content Switching */}
                {!selectedCategory && !searchQuery ? (
                    <>
                        {renderHeader()}
                        {renderCategories()}
                    </>
                ) : searchQuery ? (
                    <>
                        {renderHeader()}
                        {renderSearchResults()}
                    </>
                ) : selectedArticle ? (
                    renderArticleView()
                ) : (
                    renderCategoryView()
                )}
            </div>

            {/* Bottom Contact Section */}
            <div className="mt-20 border-t border-slate-200 dark:border-slate-800 pt-12">
                <div className="max-w-4xl mx-auto bg-indigo-900 dark:bg-indigo-950 rounded-2xl p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-xl">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                    
                    <div className="relative z-10 space-y-6">
                        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                            <HelpCircle size={32} />
                        </div>
                        <h2 className="text-2xl sm:text-3xl font-bold">Still need help?</h2>
                        <p className="text-indigo-200 max-w-lg mx-auto">
                            Can't find the answer you're looking for? Our support team is here to help you get back to clients.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-4">
                            <div className="text-center">
                                <div className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1">Email Support</div>
                                <div className="font-mono bg-black/20 px-3 py-1 rounded text-sm">getsolodesk@gmail.com</div>
                            </div>
                            <div className="hidden sm:block w-px h-12 bg-indigo-800"></div>
                             <div className="text-center">
                                <div className="text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1">Avg. Reply Time</div>
                                <div className="font-bold text-green-400 flex items-center gap-1">
                                    <CheckCircle size={14} /> &lt; 24 hours
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowContactForm(true)}
                            className="mt-8 px-8 py-3 bg-white text-indigo-900 font-bold rounded-[10px] hover:bg-indigo-50 transition-colors shadow-lg shadow-black/20"
                        >
                            Contact Support
                        </button>
                    </div>
                </div>
            </div>

            {/* Contact Modal */}
            {showContactForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div 
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                        onClick={() => setShowContactForm(false)}
                    />
                    <div className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
                        
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">Contact Support</h3>
                            <button onClick={() => setShowContactForm(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6">
                            {sentSuccess ? (
                                <div className="text-center py-8">
                                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 dark:text-green-400">
                                        <CheckCircle size={32} />
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Message Sent!</h3>
                                    <p className="text-slate-500 dark:text-slate-400">
                                        Thanks for reaching out. We'll get back to you at <span className="font-medium text-slate-900 dark:text-white">{user?.email}</span> shortly.
                                    </p>
                                </div>
                            ) : (
                                <form onSubmit={handleContactSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Email Address
                                        </label>
                                        <input 
                                            type="email" 
                                            value={user?.email || ''} 
                                            disabled 
                                            className="w-full px-4 py-2 rounded-[10px] bg-slate-100 dark:bg-slate-800 border-none text-slate-500 dark:text-slate-400 cursor-not-allowed"
                                        />
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Topic
                                        </label>
                                        <select 
                                            value={contactSubject}
                                            onChange={(e) => setContactSubject(e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-[10px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-700 outline-none"
                                        >
                                            <option>General question</option>
                                            <option>Bug report</option>
                                            <option>Billing issue</option>
                                            <option>Feature request</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                                            Message
                                        </label>
                                        <textarea 
                                            rows={5}
                                            value={contactMessage}
                                            onChange={(e) => setContactMessage(e.target.value)}
                                            placeholder="Describe your issue or question..."
                                            required
                                            className="w-full px-4 py-3 rounded-[10px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-700 outline-none resize-none"
                                        />
                                    </div>

                                    <button 
                                        type="submit"
                                        disabled={isSending}
                                        className="w-full py-3 bg-teal-700 text-white font-bold rounded-[10px] hover:bg-teal-800 transition-colors shadow-lg shadow-teal-500/20 disabled:opacity-70 flex items-center justify-center gap-2"
                                    >
                                        {isSending ? (
                                            <>Sending...</>
                                        ) : (
                                            <>
                                                Send Message <Send size={18} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};


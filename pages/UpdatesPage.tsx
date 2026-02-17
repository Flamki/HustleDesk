
import React, { useState } from 'react';
import { 
    Sparkles, Zap, Wrench, Calendar, ArrowRight, Mail, 
    CheckCircle2, Star, Map, ThumbsUp, PartyPopper, ArrowUpRight
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';

const ROADMAP = [
    { title: 'Mobile App', status: 'In Progress', eta: 'Q4 2024' },
    { title: 'QuickBooks Integration', status: 'Planned', eta: 'Q1 2025' },
    { title: 'Dark Mode Email Templates', status: 'Planned', eta: 'Q1 2025' }
];

const UPDATES = [
    {
        id: 1,
        version: 'v1.2.0',
        date: 'Today',
        title: 'AI Profile Avatar & Smart Settings',
        type: 'feature',
        featured: true,
        description: 'Your AI assistant just got a personality upgrade. It now understands your specific skills and tone better than ever. We have also completely overhauled the settings page to give you granular control.',
        items: [
            'New "Profile Avatar" chat interface to build your persona',
            'Added tone customization (Friendly vs. Professional)',
            'Resume parsing (drag & drop support)',
            'Smart settings dashboard redesign'
        ],
        likes: 24
    },
    {
        id: 2,
        version: 'v1.1.5',
        date: 'Last Week',
        title: 'Analytics & Pipeline Improvements',
        type: 'improvement',
        description: 'We have overhauled the analytics engine to give you deeper insights into your conversion rates.',
        items: [
            'New Pipeline Funnel visualization',
            'Revenue tracking charts',
            'Follow-up reminders are now customizable',
            'Added "Lost" reason tracking'
        ],
        likes: 12
    },
    {
        id: 3,
        version: 'v1.1.0',
        date: '2 Weeks Ago',
        title: 'Dark Mode & UI Polish',
        type: 'improvement',
        description: 'Late night hustling just got easier on the eyes. We polished every pixel for a consistent dark mode experience.',
        items: [
            'Full Dark Mode support across the app',
            'New sidebar navigation design',
            'Improved mobile responsiveness for job cards',
            'Faster page transitions'
        ],
        likes: 45
    },
    {
        id: 4,
        version: 'v1.0.2',
        date: '1 Month Ago',
        title: 'Bug Fixes & Performance',
        type: 'fix',
        description: 'Squashed some pesky bugs to ensure a smoother experience.',
        items: [
            'Fixed an issue where proposals wouldn\'t copy on iOS',
            'Resolved login session timeout issues',
            'Improved loading speed of the jobs list by 40%'
        ],
        likes: 8
    }
];

export const UpdatesPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [subscribed, setSubscribed] = useState(false);
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [subscribeError, setSubscribeError] = useState<string | null>(null);
    const [likedUpdates, setLikedUpdates] = useState<number[]>([]);

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email.trim()) return;

        setIsSubscribing(true);
        setSubscribeError(null);
        try {
            const response = await fetch('/api/subscriptions/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: email.trim(),
                    source: 'updates_page',
                }),
            });

            const body = await response.json().catch(() => ({}));
            if (!response.ok) {
                setSubscribeError(body.error || 'Failed to subscribe. Please try again.');
                return;
            }

            setSubscribed(true);
            setEmail('');
        } catch {
            setSubscribeError('Network error. Please try again.');
        } finally {
            setIsSubscribing(false);
        }
    };

    const toggleLike = (id: number) => {
        if (likedUpdates.includes(id)) {
            setLikedUpdates(prev => prev.filter(i => i !== id));
        } else {
            setLikedUpdates(prev => [...prev, id]);
        }
    };

    return (
        <div className="max-w-6xl mx-auto animate-in fade-in duration-500 pb-12">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 border-b border-slate-200 dark:border-slate-800 pb-8">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="bg-indigo-600 p-1 rounded-md">
                            <Sparkles size={14} className="text-white" />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Changelog</span>
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">Product Updates</h1>
                    <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xl">
                        New features, fixes, and improvements. We ship weekly to help you win more clients.
                    </p>
                </div>
                <div className="flex gap-3">
                    <a href="https://twitter.com" target="_blank" rel="noreferrer" className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-2">
                        Follow updates
                        <ArrowUpRight size={14} />
                    </a>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                
                {/* --- Main Feed (Left Column) --- */}
                <div className="lg:col-span-2 space-y-12">
                    
                    {UPDATES.map((update, index) => {
                        const isFeature = update.type === 'feature';
                        const isImprovement = update.type === 'improvement';
                        const isLiked = likedUpdates.includes(update.id);
                        
                        return (
                            <div key={index} className="relative group">
                                {/* Vertical Line Connector */}
                                {index !== UPDATES.length - 1 && (
                                    <div className="absolute left-6 top-16 bottom-0 w-px bg-slate-200 dark:bg-slate-800 group-hover:bg-slate-300 dark:group-hover:bg-slate-700 transition-colors"></div>
                                )}

                                <div className="flex gap-6">
                                    {/* Avatar/Icon */}
                                    <div className="flex-shrink-0 relative z-10">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-4 border-slate-50 dark:border-slate-950 shadow-sm transition-transform group-hover:scale-110 ${isFeature ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' : isImprovement ? 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                            {isFeature ? <Sparkles size={20} /> : isImprovement ? <Zap size={20} /> : <Wrench size={20} />}
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 pb-12">
                                        <div className="flex flex-wrap items-center gap-3 mb-2">
                                            <span className="text-sm font-bold text-slate-500 dark:text-slate-400">{update.date}</span>
                                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                                            <span className="font-mono text-xs font-medium text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                                {update.version}
                                            </span>
                                            {update.featured && (
                                                <Badge variant="purple" className="ml-auto animate-pulse">Latest Release</Badge>
                                            )}
                                        </div>

                                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer">
                                            {update.title}
                                        </h2>

                                        {/* Featured Image Placeholder */}
                                        {update.featured && (
                                            <div className="mb-6 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 aspect-video bg-gradient-to-br from-indigo-50 to-slate-100 dark:from-slate-900 dark:to-indigo-950/20 flex items-center justify-center relative group/image">
                                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                                                <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm p-4 rounded-2xl shadow-lg border border-white/50 dark:border-slate-700 flex flex-col items-center gap-3 transform group-hover/image:scale-105 transition-transform duration-500">
                                                    <div className="flex gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                                        <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                                                        <div className="w-2 h-2 rounded-full bg-green-400"></div>
                                                    </div>
                                                    <div className="h-2 w-32 bg-slate-200 dark:bg-slate-600 rounded-full"></div>
                                                    <div className="flex gap-2">
                                                        <div className="h-16 w-16 bg-slate-200 dark:bg-slate-600 rounded-lg"></div>
                                                        <div className="h-16 w-16 bg-slate-200 dark:bg-slate-600 rounded-lg"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-6 text-lg">
                                            {update.description}
                                        </p>

                                        <ul className="space-y-3 mb-6">
                                            {update.items.map((item, i) => (
                                                <li key={i} className="flex items-start gap-3 text-slate-600 dark:text-slate-400">
                                                    <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                                                    <span>{item}</span>
                                                </li>
                                            ))}
                                        </ul>

                                        <div className="flex items-center gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <button 
                                                onClick={() => toggleLike(update.id)}
                                                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isLiked ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                            >
                                                {isLiked ? <PartyPopper size={16} /> : <ThumbsUp size={16} />}
                                                {update.likes + (isLiked ? 1 : 0)} Helpful
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* --- Sidebar (Right Column) --- */}
                <div className="space-y-8">
                    
                    {/* Subscribe Widget */}
                    <div className="bg-slate-900 dark:bg-slate-800 rounded-2xl p-6 text-white relative overflow-hidden shadow-xl sticky top-6">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500 rounded-full blur-3xl opacity-30 -translate-y-1/2 translate-x-1/2"></div>
                        <div className="relative z-10">
                            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center mb-4">
                                <Mail size={20} />
                            </div>
                            <h3 className="text-lg font-bold mb-2">Get updates delivered</h3>
                            <p className="text-indigo-200 text-sm mb-4">
                                We ship new features every Tuesday. Don't miss out.
                            </p>
                            
                            {!subscribed ? (
                                <form onSubmit={handleSubscribe} className="space-y-2">
                                    <input 
                                        type="email" 
                                        placeholder="your@email.com"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={isSubscribing}
                                        className="w-full px-3 py-2 rounded-lg bg-white/10 border border-white/20 text-white placeholder:text-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <button
                                        type="submit"
                                        disabled={isSubscribing}
                                        className="w-full py-2 bg-white text-slate-900 font-bold rounded-lg text-sm hover:bg-indigo-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {isSubscribing ? 'Subscribing...' : 'Subscribe'}
                                    </button>
                                    {subscribeError && (
                                        <p className="text-xs text-red-200 pt-1">{subscribeError}</p>
                                    )}
                                </form>
                            ) : (
                                <div className="bg-green-500/20 border border-green-500/30 text-green-300 px-4 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-bold animate-in zoom-in">
                                    <CheckCircle2 size={16} /> Subscribed!
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Roadmap Widget */}
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 sticky top-80">
                        <div className="flex items-center gap-2 mb-6">
                            <Map size={18} className="text-slate-400" />
                            <h3 className="font-bold text-slate-900 dark:text-white">Up Next</h3>
                        </div>
                        
                        <div className="space-y-4">
                            {ROADMAP.map((item, i) => (
                                <div key={i} className="flex items-start justify-between group">
                                    <div>
                                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 transition-colors">{item.title}</div>
                                        <div className="text-xs text-slate-400">{item.eta}</div>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.status === 'In Progress' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                        {item.status}
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800">
                            <button className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1">
                                Request a feature <ArrowRight size={14} />
                            </button>
                        </div>
                    </div>

                </div>

            </div>
        </div>
    );
};

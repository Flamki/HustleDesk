
import React, { useState, useEffect, useRef } from 'react';
import { Send, Bot, User as UserIcon, CheckCircle2, Sparkles, RefreshCcw, Briefcase, Code, DollarSign, Globe, Paperclip, UploadCloud, Crown, Shield } from 'lucide-react';
import { FreelancerProfile } from '../../types';
import { useProfile } from '../../context/ProfileContext';

// ... (STEPS constant logic assumed)
const STEPS = [
    {
        id: 'intro',
        message: "Hi there! I'm your HustleDesk AI agent. Let's build your professional profile so I can write better proposals for you. You can upload your Resume/CV to autocomplete everything, or we can chat manually. First, what services do you offer?",
        field: 'skills'
    },
    {
        id: 'experience',
        message: "Great. How many years of experience do you have in this field?",
        field: 'yearsExperience'
    },
    {
        id: 'portfolio',
        message: "Got it. Do you have a portfolio website, GitHub, or LinkedIn URL you'd like potential clients to see?",
        field: 'portfolioUrl'
    },
    {
        id: 'project',
        message: "Let's make you stand out. Tell me about a project you're proud of. What did you build and what technologies did you use?",
        field: 'projects'
    },
    {
        id: 'rate',
        message: "Almost done. What is your target hourly rate (in USD)?",
        field: 'hourlyRate'
    },
    {
        id: 'bio',
        message: "Finally, tell me a little about yourself—what makes you unique? I'll use this to craft your bio.",
        field: 'bio'
    },
    {
        id: 'complete',
        message: "Fantastic! I've saved your profile. You can now go to the Jobs page and start generating personalized proposals.",
        field: 'done'
    }
];

export const ProfileAssistant: React.FC = () => {
    const { profile, updateProfile } = useProfile();
    const [messages, setMessages] = useState<any[]>([]);
    const [input, setInput] = useState('');
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial greeting
    useEffect(() => {
        if (messages.length === 0) {
            simulateAssistantMessage(STEPS[0].message);
        }
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const simulateAssistantMessage = (text: string) => {
        setIsTyping(true);
        setTimeout(() => {
            setMessages(prev => [...prev, { id: Date.now().toString(), role: 'assistant', content: text }]);
            setIsTyping(false);
        }, 1200);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!input.trim() || !profile) return;

        const userText = input.trim();
        setInput('');
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userText }]);
        
        // Basic mock processing
        const newProfile = { ...profile };
        const step = STEPS[currentStepIndex];
        
        if (step.field === 'skills') {
             const skills = userText.split(',').map(s => s.trim());
             newProfile.skills = [...new Set([...newProfile.skills, ...skills])];
        } else if (step.field === 'yearsExperience') {
             newProfile.yearsExperience = parseInt(userText.replace(/\D/g, '')) || 0;
        } else if (step.field === 'hourlyRate') {
             newProfile.hourlyRate = parseInt(userText.replace(/\D/g, '')) || 0;
        } else if (step.field === 'bio') {
             newProfile.bio = userText;
             newProfile.completedOnboarding = true;
        }
        
        await updateProfile(newProfile);

        if (currentStepIndex < STEPS.length - 1) {
            setCurrentStepIndex(prev => prev + 1);
            simulateAssistantMessage(STEPS[currentStepIndex + 1].message);
        }
    };

    if (!profile) return <div>Loading...</div>;

    // Responsive height calc for mobile browser bars using 'dvh' if available, fallback to vh
    // Subtract header height (~140px approx)
    return (
        <div className="flex flex-col lg:flex-row h-[calc(100vh-140px)] lg:h-[calc(100vh-140px)] gap-8">
            
            {/* Left: Chat Interface */}
            <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 rounded-[32px] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative">
                
                {/* Chat Header */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg">
                                <Bot size={24} />
                            </div>
                            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse"></span>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white">AI Assistant</h3>
                            <p className="text-xs text-slate-500 font-medium">Building your profile...</p>
                        </div>
                    </div>
                    <button className="text-slate-400 hover:text-indigo-600 transition-colors p-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800">
                        <RefreshCcw size={18} />
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50 dark:bg-slate-950/50">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                            {msg.role === 'assistant' && (
                                <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 mr-3 mt-1 shrink-0">
                                    <Sparkles size={14} />
                                </div>
                            )}
                            <div className={`
                                max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm
                                ${msg.role === 'user' 
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-tr-none' 
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none border border-slate-100 dark:border-slate-700'}
                            `}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-white dark:bg-slate-800 rounded-2xl rounded-tl-none p-4 shadow-sm border border-slate-100 dark:border-slate-700 w-16 h-12 flex items-center justify-center gap-1.5 ml-11">
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                    <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                        <button type="button" className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                            <Paperclip size={20} />
                        </button>
                        <input
                            className="flex-1 bg-slate-100 dark:bg-slate-800 border-none rounded-xl px-4 py-3.5 focus:ring-2 focus:ring-indigo-500 dark:text-white placeholder:text-slate-400 transition-all"
                            placeholder="Type your answer..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            autoFocus
                        />
                        <button 
                            type="submit" 
                            disabled={!input.trim()}
                            className="p-3.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:scale-95 transition-all shadow-lg shadow-indigo-500/20"
                        >
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            </div>

            {/* Right: Gamified Profile Card (Desktop Only) */}
            <div className="hidden lg:flex w-[400px] flex-col gap-6">
                
                {/* Character Card */}
                <div className="bg-white dark:bg-slate-900 rounded-[32px] p-1 border-2 border-indigo-100 dark:border-slate-700 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                    
                    <div className="bg-white dark:bg-slate-900 rounded-[28px] p-6 pt-16 relative overflow-hidden h-full">
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-24 h-24 rounded-2xl bg-white dark:bg-slate-800 p-1.5 shadow-xl rotate-3 group-hover:rotate-0 transition-transform duration-500">
                            <div className="w-full h-full rounded-xl bg-slate-100 dark:bg-slate-700 overflow-hidden">
                                <img loading="lazy" decoding="async" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.id}`} className="w-full h-full bg-cover" alt="Avatar" />
                            </div>
                            <div className="absolute -bottom-3 -right-3 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full border-2 border-white shadow-sm flex items-center gap-1">
                                <Crown size={10} fill="currentColor" /> Lvl {profile.experienceLevel === 'Expert' ? 50 : profile.experienceLevel === 'Intermediate' ? 25 : 1}
                            </div>
                        </div>

                        <div className="mt-8 text-center">
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Freelancer Agent</h2>
                            <p className="text-indigo-600 dark:text-indigo-400 font-medium text-sm">
                                {profile.experienceLevel} • ${profile.hourlyRate}/hr
                            </p>
                        </div>

                        <div className="mt-8 space-y-4">
                            <div>
                                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase mb-2">
                                    <span>Skills</span>
                                    <span>{profile.skills.length}</span>
                                </div>
                                <div className="flex flex-wrap gap-2 justify-center">
                                    {profile.skills.slice(0, 6).map(s => (
                                        <span key={s} className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs rounded-md font-medium border border-slate-200 dark:border-slate-700">
                                            {s}
                                        </span>
                                    ))}
                                    {profile.skills.length === 0 && <span className="text-slate-400 text-xs italic">No skills yet</span>}
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
                                <div className="text-xs font-bold text-slate-400 uppercase mb-1">Bio</div>
                                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 italic">
                                    "{profile.bio || 'Waiting for input...'}"
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Upload Zone */}
                <div 
                    className="flex-1 rounded-[32px] border-3 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center p-6 text-center hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all cursor-pointer group"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div className="w-12 h-12 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-md mb-3 group-hover:scale-110 transition-transform">
                        <UploadCloud size={24} className="text-indigo-500" />
                    </div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">Drop Resume</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[200px]">
                        Auto-fill your profile instantly by uploading a PDF.
                    </p>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.docx" />
                </div>

            </div>
        </div>
    );
};


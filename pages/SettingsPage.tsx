
import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  User, CreditCard, Bell, Sparkles, AlertTriangle, Shield, 
  Bot, Save, Mail, Briefcase, Plus, ExternalLink, Trash2, 
  Send, Code, Globe, CheckCircle2, RefreshCw, Zap, Rocket, Smile,
  FileText, ScrollText, AlignLeft, Lock, Smartphone, Laptop, History, 
  Download, Check, Key, Receipt, Calendar, CreditCard as CreditCardIcon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useProfile } from '../context/ProfileContext';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import * as authService from '../services/supabaseService';
import type { BillingInvoice } from '../services/supabaseService';
import type { FollowupReminderSweepResult } from '../services/supabaseService';
import type { NotificationSettingsDto } from '../services/supabaseService';
import type { FreelancerProfile } from '../types';

type SettingsTab = 'profile' | 'account' | 'billing' | 'notifications' | 'ai' | 'danger';

const parseCsvSet = (value: string | undefined): Set<string> =>
  new Set(
    String(value || '')
      .split(',')
      .map((entry) => entry.trim().toLowerCase())
      .filter(Boolean)
  );

const FOLLOWUP_SWEEP_ADMIN_EMAILS = parseCsvSet(
  import.meta.env.VITE_FOLLOWUP_REMINDER_TRIGGER_ADMIN_EMAILS || import.meta.env.VITE_ADMIN_EMAILS
);
const FOLLOWUP_SWEEP_ADMIN_IDS = parseCsvSet(
  import.meta.env.VITE_FOLLOWUP_REMINDER_TRIGGER_ADMIN_IDS || import.meta.env.VITE_ADMIN_USER_IDS
);

const deriveExperienceLevel = (years: number): FreelancerProfile['experienceLevel'] => {
  if (years >= 8) return 'Expert';
  if (years >= 3) return 'Intermediate';
  return 'Entry';
};

const mergeProfilePatch = (
  current: FreelancerProfile,
  patch: Partial<FreelancerProfile>
): FreelancerProfile => {
  const next: FreelancerProfile = { ...current, ...patch };

  if (Array.isArray(patch.skills)) {
    next.skills = [...new Set([...current.skills, ...patch.skills].map((s) => String(s || '').trim()).filter(Boolean))].slice(0, 24);
  }

  if (typeof patch.yearsExperience === 'number' && !Number.isNaN(patch.yearsExperience)) {
    const years = Math.max(0, Math.min(60, patch.yearsExperience));
    next.yearsExperience = years;
    if (!patch.experienceLevel) {
      next.experienceLevel = deriveExperienceLevel(years);
    }
  }

  if (typeof patch.hourlyRate === 'number' && !Number.isNaN(patch.hourlyRate)) {
    next.hourlyRate = Math.max(0, Math.min(10000, patch.hourlyRate));
  }

  if (typeof patch.bio === 'string' && patch.bio.trim()) {
    next.bio = patch.bio.trim();
  }

  if (typeof patch.portfolioUrl === 'string' && patch.portfolioUrl.trim()) {
    next.portfolioUrl = patch.portfolioUrl.trim();
  }

  if (typeof patch.linkedinUrl === 'string' && patch.linkedinUrl.trim()) {
    next.linkedinUrl = patch.linkedinUrl.trim();
  }

  if (Array.isArray(patch.pastProjects) && patch.pastProjects.length > 0) {
    const additions = patch.pastProjects.map((project, idx) => ({
      id: project.id || `generated-${Date.now()}-${idx}`,
      name: project.name || 'Project',
      description: project.description || '',
      technologies: Array.isArray(project.technologies) ? project.technologies : [],
      link: project.link,
    }));
    next.pastProjects = [...current.pastProjects, ...additions].slice(-12);
  }

  return next;
};

const loadRazorpayScript = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  if (window.Razorpay) return true;

  const existing = document.querySelector('script[data-razorpay-checkout="1"]');
  if (existing) {
    await new Promise((resolve) => {
      const done = () => resolve(true);
      existing.addEventListener('load', done, { once: true });
      existing.addEventListener('error', done, { once: true });
      setTimeout(done, 3000);
    });
    return Boolean(window.Razorpay);
  }

  return await new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.setAttribute('data-razorpay-checkout', '1');
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export const SettingsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as SettingsTab) || 'profile';

  const { user } = useAuth();
  const { profile, updateProfile } = useProfile();
  
  // -- Profile Chat State --
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<{id: string, role: 'user' | 'assistant', content: string}[]>([
      { id: '1', role: 'assistant', content: 'Hi! I am your profile assistant. I update your digital twin in real-time. Tell me about a new skill you learned or update your hourly rate.' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const autoCheckoutTriggeredRef = useRef(false);

  // -- Mock Data for other tabs --
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);

  const [sessions] = useState([
      { id: 1, device: 'MacBook Pro', location: 'San Francisco, US', active: true, icon: Laptop },
      { id: 2, device: 'iPhone 14', location: 'San Francisco, US', active: false, lastActive: '2 hours ago', icon: Smartphone },
  ]);
  const [billingLoading, setBillingLoading] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [notifSettings, setNotifSettings] = useState<NotificationSettingsDto | null>(null);
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifError, setNotifError] = useState<string | null>(null);
  const [runSweepLoading, setRunSweepLoading] = useState(false);
  const [runSweepError, setRunSweepError] = useState<string | null>(null);
  const [runSweepResult, setRunSweepResult] = useState<FollowupReminderSweepResult | null>(null);

  const userEmail = String(user?.email || '').trim().toLowerCase();
  const userId = String(user?.id || '').trim().toLowerCase();
  const isFollowupSweepAdmin =
    (FOLLOWUP_SWEEP_ADMIN_EMAILS.size > 0 || FOLLOWUP_SWEEP_ADMIN_IDS.size > 0) &&
    (FOLLOWUP_SWEEP_ADMIN_EMAILS.has(userEmail) || FOLLOWUP_SWEEP_ADMIN_IDS.has(userId));

  // Auto-scroll chat
  useEffect(() => {
      if (activeTab === 'profile') {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
  }, [messages, activeTab]);

  useEffect(() => {
    if (activeTab !== 'billing') return;
    let active = true;
    const loadInvoices = async () => {
      setInvoicesLoading(true);
      const { data, error } = await authService.getStripeInvoices();
      if (!active) return;
      if (error) {
        setBillingError(error.message);
      } else {
        setInvoices(data);
      }
      setInvoicesLoading(false);
    };
    void loadInvoices();
    return () => {
      active = false;
    };
  }, [activeTab]);

  useEffect(() => {
    if (activeTab !== 'notifications') return;
    let active = true;
    const load = async () => {
      setNotifLoading(true);
      setNotifError(null);
      const { data, error } = await authService.getNotificationSettings();
      if (!active) return;
      if (error) {
        setNotifSettings(null);
        setNotifError(error.message);
      } else {
        setNotifSettings(
          data || {
            followup_reminders: true,
            client_replies: true,
            weekly_summary: true,
          }
        );
      }
      setNotifLoading(false);
    };
    void load();
    return () => {
      active = false;
    };
  }, [activeTab]);

  const saveNotificationSettings = async (next: NotificationSettingsDto) => {
    setNotifSettings(next);
    setNotifSaving(true);
    setNotifError(null);
    const { error } = await authService.updateNotificationSettings(next);
    setNotifSaving(false);
    if (error) setNotifError(error.message);
  };

  const runFollowupSweep = async () => {
    setRunSweepLoading(true);
    setRunSweepError(null);
    const { data, error } = await authService.runFollowupReminderSweepNow();
    setRunSweepLoading(false);
    if (error || !data) {
      setRunSweepResult(null);
      setRunSweepError(error?.message || 'Failed to run follow-up sweep');
      return;
    }
    setRunSweepResult(data);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !profile) return;
    
    const userText = chatInput.trim();
    setChatInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userText }]);
    setIsTyping(true);
    try {
      const history = [...messages, { id: `temp-${Date.now()}`, role: 'user' as const, content: userText }]
        .slice(-10)
        .map((message) => ({ role: message.role, content: message.content }));

      const result = await authService.generateProfileAssistantReply(
        userText,
        profile,
        { mode: 'settings' },
        history
      );

      const newProfile = mergeProfilePatch(profile, result.profilePatch || {});
      await updateProfile(newProfile);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-assistant`,
          role: 'assistant',
          content: result.reply || 'Profile updated.',
        },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not process your update right now.';
      setMessages((prev) => [
        ...prev,
        { id: `${Date.now()}-assistant-error`, role: 'assistant', content: message },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const openCheckout = React.useCallback(async () => {
    setBillingLoading(true);
    setBillingError(null);
    const { url, razorpayOrder, error } = await authService.createStripeCheckoutSession();
    if (error) {
      setBillingLoading(false);
      setBillingError(error?.message || 'Failed to start checkout');
      return;
    }
    if (url) {
      setBillingLoading(false);
      window.location.href = url;
      return;
    }
    if (!razorpayOrder) {
      setBillingLoading(false);
      setBillingError('Checkout session missing');
      return;
    }

    const scriptLoaded = await loadRazorpayScript();
    if (!scriptLoaded || !window.Razorpay) {
      setBillingLoading(false);
      setBillingError('Unable to load payment gateway. Please refresh and try again.');
      return;
    }

    const razorpay = new window.Razorpay({
      key: razorpayOrder.keyId,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      name: razorpayOrder.name,
      description: razorpayOrder.description,
      order_id: razorpayOrder.orderId,
      prefill: razorpayOrder.prefill,
      theme: { color: '#4F46E5' },
      handler: async (response) => {
        setBillingLoading(true);
        const result = await authService.verifyRazorpayPayment(response);
        setBillingLoading(false);
        if (result.error || !result.success) {
          setBillingError(result.error?.message || 'Payment verification failed');
          return;
        }

        const { data, error: invoiceError } = await authService.getStripeInvoices();
        if (!invoiceError) setInvoices(data);

        window.location.href = razorpayOrder.successUrl || '/app/settings?tab=billing&checkout=success';
      },
    });

    razorpay.on('payment.failed', (eventData) => {
      const payload =
        eventData && typeof eventData === 'object' ? (eventData as { error?: { description?: string } }) : null;
      const message = payload?.error?.description || 'Payment failed. Please try another card or bank.';
      setBillingError(message);
      setBillingLoading(false);
    });

    setBillingLoading(false);
    razorpay.open();
  }, []);

  const openPortal = React.useCallback(async () => {
    if (typeof window !== 'undefined' && window.location.pathname.includes('/app/settings')) {
      document.getElementById('invoice-history')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      const { url } = await authService.createStripePortalSession();
      if (url) window.location.href = url;
    }
  }, []);

  useEffect(() => {
    if (activeTab !== 'billing') return;
    if (searchParams.get('action') !== 'checkout') return;
    if (autoCheckoutTriggeredRef.current) return;
    if (user?.plan === 'pro') return;

    autoCheckoutTriggeredRef.current = true;
    const timer = window.setTimeout(() => {
      void openCheckout();
    }, 250);

    const url = new URL(window.location.href);
    url.searchParams.delete('action');
    window.history.replaceState({}, document.title, `${url.pathname}${url.search}${url.hash}`);

    return () => window.clearTimeout(timer);
  }, [activeTab, openCheckout, searchParams, user?.plan]);

  if (!profile) return <div className="p-8 flex justify-center"><RefreshCw className="animate-spin text-slate-400" /></div>;

  return (
    <div className="flex-1 w-full min-w-0 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[calc(100vh-100px)] animate-in fade-in duration-300">
        
        {/* Content Header */}
        <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 z-10">
            <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white capitalize flex items-center gap-2">
                    {activeTab === 'profile' && <Bot className="text-indigo-600" />}
                    {activeTab === 'ai' && <Sparkles className="text-amber-500" />}
                    {activeTab === 'account' && <Shield className="text-blue-500" />}
                    {activeTab === 'billing' && <CreditCard className="text-green-500" />}
                    {activeTab === 'notifications' && <Bell className="text-purple-500" />}
                    {activeTab === 'danger' && <Trash2 className="text-red-500" />}
                    
                    {activeTab === 'profile' ? 'Digital Twin' : 
                     activeTab === 'ai' ? 'AI Brain' : activeTab}
                </h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    {activeTab === 'profile' ? 'Manage the persona that powers your proposals.' : 
                     activeTab === 'ai' ? 'Configure how the AI writes for you.' : 
                     activeTab === 'billing' ? 'Manage your subscription and payment methods.' :
                     'Manage your account settings.'}
                </p>
            </div>
            {activeTab === 'profile' && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-full text-xs font-bold border border-green-100 dark:border-green-900/30">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    System Active
                </div>
            )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950/30">
            
            {/* --- PROFILE TAB --- */}
            {activeTab === 'profile' && (
                <div className="flex flex-col lg:flex-row h-full">
                    
                    {/* Left: Visual Identity Card */}
                    <div className="lg:w-1/2 p-8 overflow-y-auto border-b lg:border-b-0 lg:border-r border-slate-200 dark:border-slate-800">
                        <div className="max-w-md mx-auto space-y-8">
                            
                            {/* The ID Card */}
                            <div className="relative bg-white dark:bg-slate-800 rounded-[24px] p-6 shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden group">
                                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 opacity-90"></div>
                                
                                <div className="relative flex justify-between items-end mt-8 mb-4">
                                    <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-800 p-1.5 shadow-lg rotate-3 group-hover:rotate-0 transition-transform duration-500 ease-out">
                                        <img loading="lazy" decoding="async" 
                                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} 
                                            alt="Avatar" 
                                            className="w-full h-full rounded-xl bg-slate-100 dark:bg-slate-700 object-cover" 
                                        />
                                    </div>
                                    <div className="text-right mb-1">
                                        <div className="text-2xl font-bold text-slate-900 dark:text-white">{user?.email?.split('@')[0]}</div>
                                        <div className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{profile.experienceLevel} Freelancer</div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Rate</span>
                                            <div className="text-lg font-bold text-slate-900 dark:text-white">${profile.hourlyRate}/hr</div>
                                        </div>
                                        <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Experience</span>
                                            <div className="text-lg font-bold text-slate-900 dark:text-white">{profile.yearsExperience} Yrs</div>
                                        </div>
                                    </div>

                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">Primary Skills</span>
                                        <div className="flex flex-wrap gap-2">
                                            {profile.skills.slice(0, 8).map(skill => (
                                                <span key={skill} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-200 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-600">
                                                    {skill}
                                                </span>
                                            ))}
                                            {profile.skills.length === 0 && <span className="text-xs text-slate-400 italic">No skills added yet</span>}
                                        </div>
                                    </div>

                                    <div>
                                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-2">Bio Snippet</span>
                                        <p className="text-xs text-slate-600 dark:text-slate-300 italic bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 leading-relaxed">
                                            "{profile.bio || 'Tell the assistant about yourself to generate a bio.'}"
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{profile.pastProjects.length}</div>
                                    <div className="text-xs font-bold text-slate-500 uppercase mt-1">Projects</div>
                                </div>
                                <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">100%</div>
                                    <div className="text-xs font-bold text-slate-500 uppercase mt-1">Profile</div>
                                </div>
                                <div className="text-center p-4 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                    <div className="text-2xl font-bold text-amber-500">4.9</div>
                                    <div className="text-xs font-bold text-slate-500 uppercase mt-1">Rating</div>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* Right: Chat Interface */}
                    <div className="lg:w-1/2 flex flex-col h-full bg-white dark:bg-slate-900 relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500 z-10"></div>
                        
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2`}>
                                    <div className={`
                                        max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-sm
                                        ${msg.role === 'user' 
                                            ? 'bg-indigo-600 text-white rounded-tr-none' 
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-tl-none'}
                                    `}>
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex justify-start">
                                    <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-none p-4 w-16 flex items-center justify-center gap-1.5">
                                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                                        <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                            <form onSubmit={handleSendMessage} className="relative flex items-center gap-2">
                                <input
                                    type="text"
                                    value={chatInput}
                                    onChange={(e) => setChatInput(e.target.value)}
                                    placeholder="Type to update skills, rate, or bio..."
                                    className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                />
                                <button 
                                    type="submit"
                                    disabled={!chatInput.trim()}
                                    className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:scale-95 transition-all shadow-lg shadow-indigo-500/20"
                                >
                                    <Send size={18} />
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* --- AI PREFERENCES TAB --- */}
            {activeTab === 'ai' && (
                <div className="p-8 max-w-5xl mx-auto space-y-12">
                    
                    {/* Tone Section */}
                    <div id="invoice-history">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <Zap size={20} className="text-amber-500" /> Default Tone
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { id: 'professional', label: 'Professional', icon: Briefcase, desc: 'Formal, polite, and polished. Best for corporate clients.' },
                                { id: 'friendly', label: 'Friendly', icon: Smile, desc: 'Warm, casual, and approachable. Good for startups.' },
                                { id: 'confident', label: 'Confident', icon: Rocket, desc: 'Bold, direct, and expert. Show them who\'s boss.' }
                            ].map((option) => {
                                const isSelected = profile.preferences?.defaultTone === option.id;
                                return (
                                    <button
                                        key={option.id}
                                        onClick={() => updateProfile({ ...profile, preferences: { ...profile.preferences!, defaultTone: option.id as any } })}
                                        className={`
                                            relative flex flex-col items-start p-6 rounded-2xl border-2 transition-all duration-200 text-left group
                                            ${isSelected 
                                                ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 shadow-md ring-1 ring-indigo-500/20' 
                                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                                        `}
                                    >
                                        <div className={`
                                            w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors
                                            ${isSelected 
                                                ? 'bg-indigo-600 text-white' 
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 group-hover:text-indigo-600'}
                                        `}>
                                            <option.icon size={20} />
                                        </div>
                                        <span className={`font-bold mb-1 ${isSelected ? 'text-indigo-900 dark:text-white' : 'text-slate-900 dark:text-slate-200'}`}>
                                            {option.label}
                                        </span>
                                        <span className={`text-xs leading-relaxed ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`}>
                                            {option.desc}
                                        </span>
                                        {isSelected && <div className="absolute top-4 right-4 text-indigo-600 dark:text-indigo-400"><CheckCircle2 size={20} /></div>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Length Section */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <RefreshCw size={20} className="text-blue-500" /> Default Length
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {[
                                { id: 'concise', label: 'Concise', icon: Zap, desc: 'Short & sweet (~100 words). High response rate.' },
                                { id: 'standard', label: 'Standard', icon: FileText, desc: 'Balanced (~200 words). Explains value clearly.' },
                                { id: 'detailed', label: 'Detailed', icon: ScrollText, desc: 'Comprehensive (~300+ words). Deep dive.' }
                            ].map((option) => {
                                const isSelected = profile.preferences?.defaultLength === option.id;
                                return (
                                    <button
                                        key={option.id}
                                        onClick={() => updateProfile({ ...profile, preferences: { ...profile.preferences!, defaultLength: option.id as any } })}
                                        className={`
                                            relative flex flex-col items-start p-6 rounded-2xl border-2 transition-all duration-200 text-left group
                                            ${isSelected 
                                                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-md ring-1 ring-blue-500/20' 
                                                : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-slate-50 dark:hover:bg-slate-800/50'}
                                        `}
                                    >
                                        <div className={`
                                            w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors
                                            ${isSelected 
                                                ? 'bg-blue-600 text-white' 
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600'}
                                        `}>
                                            <option.icon size={20} />
                                        </div>
                                        <span className={`font-bold mb-1 ${isSelected ? 'text-blue-900 dark:text-white' : 'text-slate-900 dark:text-slate-200'}`}>
                                            {option.label}
                                        </span>
                                        <span className={`text-xs leading-relaxed ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}>
                                            {option.desc}
                                        </span>
                                        {isSelected && <div className="absolute top-4 right-4 text-blue-600 dark:text-blue-400"><CheckCircle2 size={20} /></div>}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Custom Instructions */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Custom Instructions</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Add specific rules for the AI (e.g. "Always mention my React certification", "Never use emojis").</p>
                            </div>
                            <Badge variant="neutral">Optional</Badge>
                        </div>
                        <textarea 
                            className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none resize-none dark:text-white placeholder:text-slate-400"
                            placeholder="- Always sign off with 'Cheers, [Name]&#10;- Emphasize fast delivery&#10;- Avoid corporate jargon"
                        />
                        <div className="flex justify-end mt-4">
                            <button className="px-4 py-2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-bold rounded-lg hover:opacity-90 transition-opacity">
                                Save Instructions
                            </button>
                        </div>
                    </div>

                </div>
            )}

            {/* --- BILLING TAB (ENHANCED) --- */}
            {activeTab === 'billing' && (
                <div className="p-8 max-w-6xl mx-auto space-y-10">
                    {billingError && (
                      <div className="px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 text-sm text-red-600 dark:text-red-300">
                        {billingError}
                      </div>
                    )}
                    
                    {/* Top Row: Subscription & Usage */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        
                        {/* 1. Subscription Command Card */}
                        <div className="lg:col-span-2 relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-2xl p-8 flex flex-col justify-between min-h-[300px]">
                            {/* Background FX */}
                            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2"></div>
                            <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-600/10 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4"></div>
                            
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/10">
                                            <Sparkles className="text-indigo-300" size={24} />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold tracking-tight">Pro Plan</h2>
                                            <p className="text-indigo-200 text-sm">
                                              {user?.plan === 'pro' ? 'Active Subscription' : 'Upgrade for unlimited usage'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className={`px-3 py-1 border rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur-md ${
                                      user?.plan === 'pro'
                                        ? 'bg-green-500/20 text-green-300 border-green-500/30'
                                        : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                    }`}>
                                        {user?.plan === 'pro' ? 'Auto-Renewal On' : 'Free Plan'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8 mb-8">
                                    <div>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Billing Amount</p>
                                        <p className="text-4xl font-bold">$9<span className="text-lg text-slate-400 font-normal">/mo</span></p>
                                    </div>
                                    <div>
                                        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">Next Billing Date</p>
                                        <p className="text-xl font-medium flex items-center gap-2">
                                            <Calendar size={18} className="text-indigo-400" /> Nov 12, 2024
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="relative z-10 flex gap-4">
                                <button
                                  onClick={() => {
                                    void (user?.plan === 'pro' ? openPortal() : openCheckout());
                                  }}
                                  disabled={billingLoading}
                                  className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors shadow-lg disabled:opacity-60"
                                >
                                    {billingLoading ? 'Opening...' : user?.plan === 'pro' ? 'View Billing History' : 'Upgrade to Pro'}
                                </button>
                                <button
                                  onClick={() => {
                                    void openPortal();
                                  }}
                                  disabled={billingLoading}
                                  className="px-6 py-3 bg-white/10 text-white rounded-xl font-bold text-sm hover:bg-white/20 transition-colors border border-white/10 backdrop-blur-md disabled:opacity-60"
                                >
                                    View Invoices
                                </button>
                            </div>
                        </div>

                        {/* 2. Usage Stats */}
                        <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-center">
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Plan Usage</h3>
                            
                            {/* Circular AI Credit */}
                            <div className="flex items-center gap-6 mb-8">
                                <div className="relative w-24 h-24 flex-shrink-0">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-slate-800" />
                                        <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-indigo-600" strokeDasharray={251} strokeDashoffset={251 - (251 * 0.45)} strokeLinecap="round" />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                                        <span className="text-xl font-bold text-slate-900 dark:text-white">45%</span>
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-white">AI Credits</div>
                                    <div className="text-xs text-slate-500 mb-2">{user?.aiCreditsUsed ?? 0} / {user?.aiCreditsLimit ?? 0} used</div>
                                    <button
                                      onClick={() => {
                                        void openCheckout();
                                      }}
                                      disabled={billingLoading}
                                      className="text-xs font-bold text-indigo-600 hover:underline disabled:opacity-60"
                                    >
                                      Get more credits
                                    </button>
                                </div>
                            </div>

                            {/* Linear Active Jobs */}
                            <div>
                                <div className="flex justify-between text-xs font-bold text-slate-500 uppercase mb-2">
                                    <span>Active Jobs</span>
                                    <span>8 / Unlimited</span>
                                </div>
                                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div className="h-full bg-teal-500 w-[15%] rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>

                    {/* Middle Row: Payment Methods */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Payment Method</h3>
                                <button className="text-sm font-bold text-indigo-600 hover:underline">+ Add New</button>
                            </div>
                            
                            {/* Realistic Card UI */}
                            <div className="relative w-full max-w-sm aspect-[1.586/1] rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-slate-800 to-black text-white p-6 flex flex-col justify-between transition-transform hover:scale-[1.02] duration-300">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                                
                                <div className="flex justify-between items-start relative z-10">
                                    <div className="w-12 h-8 bg-gradient-to-r from-yellow-200 to-yellow-400 rounded-md opacity-80"></div>
                                    <span className="font-mono text-lg tracking-widest italic opacity-80">VISA</span>
                                </div>

                                <div className="relative z-10">
                                    <div className="font-mono text-xl tracking-widest mb-4 flex gap-4">
                                        <span>••••</span> <span>••••</span> <span>••••</span> <span>4242</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] uppercase opacity-60 mb-0.5">Card Holder</p>
                                            <p className="font-medium text-sm tracking-wide uppercase">{user?.email?.split('@')[0] || 'YOUR NAME'}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase opacity-60 mb-0.5">Expires</p>
                                            <p className="font-medium text-sm tracking-wide">12/25</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Billing Details</h3>
                                <button className="text-sm font-bold text-indigo-600 hover:underline">Edit</button>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Billing Name</span>
                                    <span className="font-medium text-slate-900 dark:text-white">Acme Freelancing</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Billing Email</span>
                                    <span className="font-medium text-slate-900 dark:text-white">{user?.email}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Address</span>
                                    <span className="font-medium text-slate-900 dark:text-white text-right">123 Market St, Suite 400<br/>San Francisco, CA 94103</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Tax ID</span>
                                    <span className="font-medium text-slate-900 dark:text-white">US-992831</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    <div className="w-full border-t border-slate-200 dark:border-slate-800"></div>

                    {/* Bottom Row: Invoice History */}
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Invoice History</h3>
                        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <th className="px-6 py-4">Invoice ID</th>
                                        <th className="px-6 py-4">Plan</th>
                                        <th className="px-6 py-4">Date</th>
                                        <th className="px-6 py-4">Amount</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {invoicesLoading ? (
                                      <tr>
                                        <td className="px-6 py-6 text-slate-500" colSpan={6}>Loading invoices...</td>
                                      </tr>
                                    ) : invoices.length === 0 ? (
                                      <tr>
                                        <td className="px-6 py-6 text-slate-500" colSpan={6}>No invoices yet.</td>
                                      </tr>
                                    ) : invoices.map((inv) => (
                                        <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                                            <td className="px-6 py-4 font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                                <Receipt size={16} className="text-slate-400" />
                                                {inv.id}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">{inv.plan}</td>
                                            <td className="px-6 py-4 text-slate-500">{inv.date}</td>
                                            <td className="px-6 py-4 font-mono font-medium text-slate-900 dark:text-white">{inv.amount}</td>
                                            <td className="px-6 py-4">
                                                <Badge variant={inv.status === 'Paid' ? 'success' : 'danger'}>
                                                    {inv.status}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {inv.invoice_pdf || inv.hosted_invoice_url ? (
                                                  <a
                                                    href={inv.invoice_pdf || inv.hosted_invoice_url || '#'}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors inline-flex items-center gap-1 opacity-0 group-hover:opacity-100"
                                                  >
                                                    <Download size={14} /> PDF
                                                  </a>
                                                ) : (
                                                  <span className="text-xs text-slate-400">N/A</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>
            )}

            {/* --- ACCOUNT TAB --- */}
            {activeTab === 'account' && (
                <div className="p-8 max-w-3xl mx-auto space-y-8">
                    
                    {/* Login Details */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <Key size={20} className="text-slate-400" /> Login Details
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                                <div className="flex gap-3">
                                    <Input value={user?.email} disabled className="bg-slate-50 dark:bg-slate-800 text-slate-500" icon={Mail} />
                                </div>
                            </div>
                            <div className="pt-4">
                                <button className="text-sm font-bold text-indigo-600 hover:underline">Change Password</button>
                            </div>
                        </div>
                    </div>

                    {/* Active Sessions */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <Shield size={20} className="text-green-500" /> Active Sessions
                        </h3>
                        <div className="space-y-4">
                            {sessions.map((session) => (
                                <div key={session.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-600 text-slate-500">
                                            <session.icon size={20} />
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900 dark:text-white text-sm">{session.device}</div>
                                            <div className="text-xs text-slate-500">
                                                {session.location} • {session.active ? <span className="text-green-600 font-bold">Active Now</span> : session.lastActive}
                                            </div>
                                        </div>
                                    </div>
                                    {!session.active && (
                                        <button className="text-xs font-bold text-red-500 hover:text-red-600">Revoke</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            )}

            {/* --- NOTIFICATIONS TAB --- */}
            {activeTab === 'notifications' && (
                <div className="p-8 max-w-3xl mx-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        {notifError && (
                          <div className="px-6 py-4 text-sm text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border-b border-red-100 dark:border-red-900/30">
                            {notifError}
                          </div>
                        )}
                        {notifLoading || !notifSettings ? (
                          <div className="p-6 text-sm text-slate-500">Loading notification settings...</div>
                        ) : (
                          <>
                            {[
                              {
                                key: 'followup_reminders' as const,
                                id: 'followup_reminders',
                                label: 'Follow-up Reminders',
                                desc: 'Get notified when a job application needs a follow-up.',
                                icon: History,
                              },
                              {
                                key: 'client_replies' as const,
                                id: 'client_replies',
                                label: 'Client Replies',
                                desc: 'Receive alerts when a client replies to your tracked jobs.',
                                icon: Mail,
                              },
                              {
                                key: 'weekly_summary' as const,
                                id: 'weekly_summary',
                                label: 'Weekly Summary',
                                desc: 'A weekly digest of your pipeline performance sent every Monday.',
                                icon: FileText,
                              },
                            ].map((item, i) => (
                              <div
                                key={item.id}
                                className={`flex items-center justify-between p-6 ${i !== 0 ? 'border-t border-slate-100 dark:border-slate-800' : ''}`}
                              >
                                <div className="flex items-start gap-4">
                                  <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg mt-1">
                                    <item.icon size={20} />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white">{item.label}</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md">{item.desc}</p>
                                  </div>
                                </div>
                                <div className="relative inline-block w-12 h-6 transition duration-200 ease-in-out">
                                  <input
                                    type="checkbox"
                                    id={item.id}
                                    className="peer sr-only"
                                    checked={Boolean(notifSettings[item.key])}
                                    disabled={notifSaving}
                                    onChange={(e) => {
                                      void saveNotificationSettings({
                                        ...notifSettings,
                                        [item.key]: e.target.checked,
                                      });
                                    }}
                                  />
                                  <label
                                    htmlFor={item.id}
                                    className="block overflow-hidden h-6 rounded-full bg-slate-200 dark:bg-slate-700 cursor-pointer peer-checked:bg-indigo-600 transition-colors after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-6 peer-disabled:opacity-60"
                                  ></label>
                                </div>
                              </div>
                            ))}
                            {isFollowupSweepAdmin && (
                              <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                  <div className="flex items-start gap-3">
                                    <div className="p-2 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-lg">
                                      <Zap size={18} />
                                    </div>
                                    <div>
                                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm">Admin Follow-up Sweep</h4>
                                      <p className="text-xs text-slate-500 dark:text-slate-400">
                                        Manually trigger due follow-up reminder emails right now.
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => void runFollowupSweep()}
                                    disabled={runSweepLoading}
                                    className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 disabled:cursor-not-allowed text-white transition-colors"
                                  >
                                    {runSweepLoading ? <RefreshCw size={14} className="animate-spin" /> : <Rocket size={14} />}
                                    {runSweepLoading ? 'Running...' : 'Run Sweep Now'}
                                  </button>
                                </div>
                                {runSweepError && (
                                  <div className="text-xs text-red-600 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-lg px-3 py-2">
                                    {runSweepError}
                                  </div>
                                )}
                                {runSweepResult && (
                                  <div className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-3">
                                    Sweep complete: scanned {runSweepResult.scanned}, due {runSweepResult.due}, sent {runSweepResult.sent}, failed {runSweepResult.failed}, skipped {runSweepResult.skipped}.
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="px-6 py-4 text-xs text-slate-500 border-t border-slate-100 dark:border-slate-800">
                              {notifSaving ? 'Saving...' : 'Changes save automatically.'}
                            </div>
                          </>
                        )}
                    </div>
                </div>
            )}

            {/* --- DANGER TAB --- */}
            {activeTab === 'danger' && (
                <div className="p-8 max-w-3xl mx-auto">
                    <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl p-8">
                        <div className="flex items-start gap-6">
                            <div className="p-4 bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 rounded-2xl shadow-sm">
                                <AlertTriangle size={32} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-xl font-bold text-red-700 dark:text-red-400">Delete Account</h3>
                                <p className="text-red-600/80 dark:text-red-400/70 text-sm mt-2 mb-6 leading-relaxed">
                                    Permanently remove your account and all of your content. This action is not reversible, so please continue with caution. All your job tracking data and proposals will be lost.
                                </p>
                                <button className="px-6 py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20">
                                    Delete Personal Account
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    </div>
  );
};


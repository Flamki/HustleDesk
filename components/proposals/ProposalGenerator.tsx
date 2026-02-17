
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Wand2, Copy, RefreshCw, Save, CheckCircle, ChevronDown, ChevronUp, 
  ExternalLink, Calendar, AlertCircle, Sparkles, ArrowLeft,
  Briefcase, Smile, Rocket, Zap, FileText, ScrollText, UserCircle
} from 'lucide-react';
import { Job } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useProfile } from '../../context/ProfileContext';
import * as authService from '../../services/supabaseService';
import { Badge } from '../ui/Badge';

interface ProposalGeneratorProps {
  jobId: string;
}

export const ProposalGenerator: React.FC<ProposalGeneratorProps> = ({ jobId }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { profile } = useProfile();
  
  // Mobile Tab State
  const [mobileTab, setMobileTab] = useState<'settings' | 'result'>('settings');

  // Data State
  const [job, setJob] = useState<Job | null>(null);
  const [loadingJob, setLoadingJob] = useState(true);
  
  // AI Settings State - Initialize with Profile Preferences
  const [tone, setTone] = useState<'professional' | 'friendly' | 'confident'>(
      profile?.preferences?.defaultTone || 'professional'
  );
  const [length, setLength] = useState<'concise' | 'standard' | 'detailed'>(
      profile?.preferences?.defaultLength || 'standard'
  );
  const [highlights, setHighlights] = useState<string[]>([]);

  // Update defaults if profile loads late
  useEffect(() => {
      if (profile?.preferences) {
          setTone(profile.preferences.defaultTone);
          setLength(profile.preferences.defaultLength);
      }
  }, [profile]);
  
  // Generation State
  const [proposal, setProposal] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [creditsRemaining, setCreditsRemaining] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // UI State
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [showAppliedModal, setShowAppliedModal] = useState(false);
  const [appliedDate, setAppliedDate] = useState(new Date().toISOString().split('T')[0]);

  // Load Job
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data, error } = await authService.getJobById(jobId);
        if (error || !data) throw new Error('Failed to load job');
        setJob(data);
        if (data.proposal) {
            setProposal(data.proposal);
            setMobileTab('result'); // Auto-switch to result if exists
        }
        
        // Mock credits load
        if (user) {
            setCreditsRemaining(user.aiCreditsLimit - user.aiCreditsUsed);
        }
      } catch (err) {
        setError('Could not load job details');
      } finally {
        setLoadingJob(false);
      }
    };
    loadData();
  }, [jobId, user]);

  // Generation Loading Animation
  useEffect(() => {
    let interval: number;
    if (isGenerating) {
      setGenerationStep(0);
      setMobileTab('result'); // Switch to result view on mobile when generating
      interval = window.setInterval(() => {
        setGenerationStep((prev) => (prev < 3 ? prev + 1 : prev));
      }, 2000); // Change message every 2 seconds
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const loadingMessages = [
    'Analyzing job requirements...',
    'Reviewing your profile...',
    'Crafting your proposal...',
    'Almost done...'
  ];

  const handleHighlightChange = (value: string) => {
    if (highlights.includes(value)) {
      setHighlights(prev => prev.filter(h => h !== value));
    } else {
      if (highlights.length < 3) {
        setHighlights(prev => [...prev, value]);
      }
    }
  };

  const handleGenerate = async () => {
    if (!job) return;
    
    // Check credits
    if (user?.plan === 'free' && (creditsRemaining !== null && creditsRemaining <= 0)) {
        alert('You have reached your free AI limit. Please upgrade to Pro.');
        return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const result = await authService.generateProposal(job.id, {
        tone,
        length,
        highlights
      }, profile);
      setProposal(result.proposal);
      setCreditsRemaining(result.creditsRemaining);
    } catch (err) {
      setError('Failed to generate proposal. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(proposal);
      setCopySuccess(true);
      setShowToast(true);
      setTimeout(() => {
          setCopySuccess(false);
          setShowToast(false);
      }, 3000);
    } catch (err) {
      console.error('Failed to copy');
    }
  };

  const handleSave = async () => {
    if (!job) return;
    try {
        await authService.saveProposal(job.id, proposal);
        alert('Proposal saved successfully!');
    } catch (err) {
        alert('Failed to save proposal');
    }
  };

  const handleMarkApplied = async () => {
    if (!job) return;
    try {
        await authService.updateJobStatus(job.id, 'Applied', new Date(appliedDate).toISOString());
        navigate('/app/jobs');
    } catch (err) {
        alert('Failed to update status');
    }
  };

  const wordCount = useMemo(() => {
    return proposal.trim().split(/\s+/).filter(w => w.length > 0).length;
  }, [proposal]);

  if (loadingJob) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
             <div className="animate-spin text-indigo-600 dark:text-indigo-400">
                 <RefreshCw size={32} />
             </div>
        </div>
    );
  }

  if (!job) {
      return (
          <div className="p-8 text-center">
              <h2 className="text-xl font-bold">Job not found</h2>
              <button onClick={() => navigate('/app/jobs')} className="text-indigo-600 mt-4">Back to Jobs</button>
          </div>
      );
  }

  return (
    // Use h-[calc(100vh-theme('spacing.32'))] on desktop to fit within layout if needed, or stick to flex
    <div className="flex flex-col lg:flex-row h-full lg:h-[calc(100vh-140px)] bg-slate-50 dark:bg-slate-950 lg:overflow-hidden relative rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
      
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-30">
          <button 
            onClick={() => setMobileTab('settings')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${mobileTab === 'settings' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500'}`}
          >
            Settings & Context
          </button>
          <button 
            onClick={() => setMobileTab('result')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${mobileTab === 'result' ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400' : 'border-transparent text-slate-500'}`}
          >
            Proposal Result
          </button>
      </div>

      {/* --- LEFT COLUMN: Settings & Context --- */}
      <div className={`${mobileTab === 'settings' ? 'flex' : 'hidden lg:flex'} w-full lg:w-2/5 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex-col h-auto lg:h-full lg:overflow-y-auto z-10 shadow-xl lg:shadow-none`}>
         
         <div className="p-4 border-b border-slate-100 dark:border-slate-800 sticky top-0 bg-white dark:bg-slate-900 z-20">
             <button onClick={() => navigate('/app/jobs')} className="text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 text-sm mb-4">
                 <ArrowLeft size={16} /> Back to Jobs
             </button>
             
             <h1 className="text-xl font-bold text-slate-900 dark:text-white leading-tight mb-2 line-clamp-2">
                 {job.title}
             </h1>
             
             <div className="flex flex-wrap items-center gap-3 text-sm">
                 <Badge variant="neutral">{job.platform}</Badge>
                 <span className="text-slate-500 dark:text-slate-400 font-medium">
                     {job.currency} {job.budgetMin} - {job.budgetMax}
                 </span>
             </div>
         </div>

         {/* Job Details Accordion */}
         <div className="border-b border-slate-100 dark:border-slate-800">
             <button 
                onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
                className="w-full flex justify-between items-center p-4 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
             >
                 <span className="flex items-center gap-2">
                    <FileText size={16} className="text-slate-400" />
                    {isDetailsExpanded ? 'Hide Job Details' : 'View Full Details'}
                 </span>
                 {isDetailsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
             </button>
             
             {isDetailsExpanded && (
                 <div className="p-4 bg-slate-50 dark:bg-slate-800/50 text-sm space-y-4 animate-in slide-in-from-top-2 border-t border-slate-100 dark:border-slate-800">
                     {/* Details Content */}
                     <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Description</label>
                         <div className="p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                             {job.description}
                         </div>
                     </div>
                     <div>
                         <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">My Notes</label>
                         <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg border border-amber-100 dark:border-amber-900/30 text-slate-600 dark:text-slate-300 italic">
                             {job.notes || "No notes added."}
                         </div>
                     </div>
                 </div>
             )}
         </div>

         {/* AI Settings */}
         <div className="p-6 space-y-8 flex-1">
             <div>
                 <div className="flex items-center justify-between mb-4">
                     <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Sparkles size={18} className="text-indigo-500" />
                        AI Settings
                     </h3>
                     {profile && profile.skills.length > 0 && (
                         <div className="flex items-center gap-1.5 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                             <UserCircle size={12} /> Profile Active
                         </div>
                     )}
                 </div>
                 
                 {/* Tone */}
                 <div className="mb-6">
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Tone</label>
                     <div className="grid grid-cols-3 gap-3">
                         {[{ id: 'professional', label: 'Pro', icon: Briefcase }, { id: 'friendly', label: 'Friendly', icon: Smile }, { id: 'confident', label: 'Bold', icon: Rocket }].map((option) => (
                             <button
                                 key={option.id}
                                 onClick={() => setTone(option.id as any)}
                                 className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200 ${tone === option.id ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700'}`}
                             >
                                 <option.icon size={20} className={`mb-1 ${tone === option.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                                 <span className="text-xs font-bold">{option.label}</span>
                             </button>
                         ))}
                     </div>
                 </div>

                 {/* Length */}
                 <div className="mb-6">
                     <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Length</label>
                     <div className="grid grid-cols-3 gap-3">
                         {[{ id: 'concise', label: 'Short', icon: Zap }, { id: 'standard', label: 'Medium', icon: FileText }, { id: 'detailed', label: 'Long', icon: ScrollText }].map((option) => (
                             <button
                                 key={option.id}
                                 onClick={() => setLength(option.id as any)}
                                 className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all duration-200 ${length === option.id ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-200 dark:border-slate-700'}`}
                             >
                                 <option.icon size={20} className={`mb-1 ${length === option.id ? 'text-indigo-600' : 'text-slate-400'}`} />
                                 <span className="text-xs font-bold">{option.label}</span>
                             </button>
                         ))}
                     </div>
                 </div>

                 {/* Generate Button */}
                 <div className="sticky bottom-0 bg-white dark:bg-slate-900 pt-4 pb-2">
                     <button
                        onClick={handleGenerate}
                        disabled={isGenerating || (user?.plan === 'free' && (creditsRemaining ?? 0) <= 0)}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.02] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                     >
                         {isGenerating ? 'Generating...' : <><Wand2 size={20} /> Generate Proposal</>}
                     </button>
                 </div>
             </div>
         </div>
      </div>

      {/* --- RIGHT COLUMN: Result & Actions --- */}
      <div className={`${mobileTab === 'result' ? 'flex' : 'hidden lg:flex'} w-full lg:w-3/5 bg-slate-50 dark:bg-slate-950 flex-col h-auto lg:h-full lg:overflow-y-auto relative min-h-[500px]`}>
         
         {/* Loading Overlay */}
         {isGenerating && (
             <div className="absolute inset-0 bg-white/90 dark:bg-slate-900/90 z-20 flex flex-col items-center justify-center">
                 <Sparkles className="text-indigo-600 animate-pulse mb-4" size={40} />
                 <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{loadingMessages[generationStep]}</h3>
             </div>
         )}

         {/* Content Area */}
         <div className="flex-1 p-6 lg:p-12 flex flex-col max-w-4xl mx-auto w-full">
             {!proposal && !isGenerating ? (
                 <div className="flex-1 flex flex-col items-center justify-center text-center space-y-6 opacity-70">
                     <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
                         <Wand2 className="text-indigo-500" size={32} />
                     </div>
                     <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Ready to write?</h2>
                     <p className="text-slate-500 max-w-md mx-auto">Configure your settings and click Generate.</p>
                     <button onClick={() => setMobileTab('settings')} className="lg:hidden text-indigo-600 font-bold">Go to Settings</button>
                 </div>
             ) : (
                 <div className="flex-1 flex flex-col space-y-6">
                     <div className="flex justify-between items-end">
                         <h2 className="text-lg font-bold text-slate-900 dark:text-white">Generated Proposal</h2>
                         <span className="text-xs font-mono text-slate-400">{wordCount} words</span>
                     </div>
                     
                     <div className="relative flex-1">
                         <textarea
                            value={proposal}
                            onChange={(e) => setProposal(e.target.value)}
                            className="w-full h-full min-h-[400px] p-6 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 leading-relaxed resize-none focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm font-sans text-base"
                         />
                     </div>

                     <div className="grid grid-cols-2 gap-3">
                         <button onClick={handleCopy} className={`py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${copySuccess ? 'bg-green-600 text-white' : 'bg-indigo-600 text-white'}`}>
                             {copySuccess ? 'Copied!' : 'Copy'}
                         </button>
                         <button onClick={() => setShowAppliedModal(true)} className="py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                             Mark Applied
                         </button>
                     </div>
                 </div>
             )}
         </div>
      </div>

      {/* Applied Modal */}
      {showAppliedModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Mark as Applied</h3>
                  <div className="space-y-4">
                      <div>
                          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Date Applied</label>
                          <input type="date" value={appliedDate} onChange={(e) => setAppliedDate(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
                      </div>
                      <div className="flex gap-3 pt-2">
                          <button onClick={() => setShowAppliedModal(false)} className="flex-1 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">Cancel</button>
                          <button onClick={handleMarkApplied} className="flex-1 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700">Confirm</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

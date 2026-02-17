
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Save, Wand2, AlertCircle, Briefcase, RotateCcw, CheckCircle2 } from 'lucide-react';
import { Input } from '../ui/Input';
import * as authService from '../../services/supabaseService';
import { useAuth } from '../../context/AuthContext';
import { PlatformIcon } from '../ui/PlatformIcon';

interface JobFormData {
  title: string;
  platform: string;
  company: string;
  description: string;
  budgetMin: string;
  budgetMax: string;
  currency: string;
  proposedPrice: string;
}

const INITIAL_DATA: JobFormData = {
  title: '',
  platform: '',
  company: '',
  description: '',
  budgetMin: '',
  budgetMax: '',
  currency: 'INR',
  proposedPrice: '',
};

const SAMPLE_DRAFT: JobFormData = {
  title: 'Landing page redesign (Webflow)',
  platform: 'Upwork',
  company: 'Acme Studio',
  description:
    'We need a modern landing page redesign in Webflow. You will take the existing copy and improve layout, add responsive sections, and optimize for conversions. Please share 2-3 relevant examples and your timeline.',
  budgetMin: '300',
  budgetMax: '800',
  currency: 'USD',
  proposedPrice: '650',
};

const PLATFORMS = [
  { 
    id: 'Upwork', 
    label: 'Upwork', 
    logo: <PlatformIcon platform="Upwork" className="w-6 h-6" />,
    activeClass: 'ring-2 ring-[#14a800] bg-[#14a800]/5 border-[#14a800] dark:bg-[#14a800]/20',
    iconClass: 'text-[#14a800]'
  },
  { 
    id: 'Fiverr', 
    label: 'Fiverr', 
    logo: <PlatformIcon platform="Fiverr" className="w-6 h-6" />,
    activeClass: 'ring-2 ring-[#1dbf73] bg-[#1dbf73]/5 border-[#1dbf73] dark:bg-[#1dbf73]/20',
    iconClass: 'text-[#1dbf73]'
  },
  { 
    id: 'LinkedIn', 
    label: 'LinkedIn', 
    logo: <PlatformIcon platform="LinkedIn" className="w-6 h-6" />,
    activeClass: 'ring-2 ring-[#0a66c2] bg-[#0a66c2]/5 border-[#0a66c2] dark:bg-[#0a66c2]/20',
    iconClass: 'text-[#0a66c2]'
  },
  { 
    id: 'Other', 
    label: 'Other', 
    logo: <PlatformIcon platform="Other" className="w-6 h-6" />,
    activeClass: 'ring-2 ring-slate-500 bg-slate-100 border-slate-500 dark:bg-slate-800',
    iconClass: 'text-slate-500 dark:text-slate-400'
  },
];

const CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AUD'];

export const AddJobForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [formData, setFormData] = useState<JobFormData>(INITIAL_DATA);
  const [errors, setErrors] = useState<Partial<Record<keyof JobFormData, string>>>({});
  const [isDirty, setIsDirty] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<string | null>(null);
  
  // Use ref to hold latest formData for interval closure
  const formDataRef = useRef(formData);

  // Sync ref with state
  useEffect(() => {
    formDataRef.current = formData;
  }, [formData]);

  // Prefill sample draft via URL (?prefill=sample)
  useEffect(() => {
    const params = new URLSearchParams(location.search || '');
    const prefill = (params.get('prefill') || '').toLowerCase();
    if (prefill !== 'sample') return;

    setFormData(SAMPLE_DRAFT);
    setDraftRestored(true);
    setIsDirty(true);
    try {
      localStorage.setItem('job_draft', JSON.stringify(SAMPLE_DRAFT));
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Load draft on mount
  useEffect(() => {
    const params = new URLSearchParams(location.search || '');
    const prefill = (params.get('prefill') || '').toLowerCase();
    if (prefill === 'sample') return;

    const savedDraft = localStorage.getItem('job_draft');
    if (savedDraft) {
      setTimeout(() => {
        if (window.confirm('We found an unsaved job draft. Would you like to restore it?')) {
          try {
            const parsed = JSON.parse(savedDraft);
            setFormData(parsed);
            setDraftRestored(true);
            setIsDirty(true);
          } catch (e) {
            console.error('Failed to parse draft', e);
            localStorage.removeItem('job_draft');
          }
        } else {
          localStorage.removeItem('job_draft');
        }
      }, 100);
    }
  }, []);

  // Auto-save every 30 seconds if dirty
  useEffect(() => {
    let intervalId: number;

    if (isDirty) {
      intervalId = window.setInterval(() => {
        localStorage.setItem('job_draft', JSON.stringify(formDataRef.current));
        setLastAutoSavedAt(new Date().toLocaleTimeString());
      }, 30000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isDirty]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);
    
    // Clear error when user types
    if (errors[name as keyof JobFormData]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name as keyof JobFormData];
        return newErrors;
      });
    }
  };

  const handlePlatformChange = (id: string) => {
    setFormData((prev) => ({ ...prev, platform: id }));
    setIsDirty(true);
    if (errors.platform) {
       setErrors((prev) => ({ ...prev, platform: undefined }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof JobFormData, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Job title is required';
    } else if (formData.title.length > 500) {
      newErrors.title = 'Title must be under 500 characters';
    }

    if (!formData.platform) {
      newErrors.platform = 'Please select a platform';
    }

    if (!formData.description.trim()) {
        newErrors.description = 'Job description is required';
    } else if (formData.description.length < 50) {
      newErrors.description = 'Description must be at least 50 characters for AI analysis';
    } else if (formData.description.length > 10000) {
      newErrors.description = 'Description exceeds 10,000 characters limit';
    }
    
    if (formData.budgetMin && formData.budgetMax) {
      if (Number(formData.budgetMin) > Number(formData.budgetMax)) {
        newErrors.budgetMax = 'Max budget cannot be less than min budget';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAction = async (action: 'save' | 'generate') => {
    if (!validate()) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
    }

    setIsSubmitting(true);

    const payload = {
      title: formData.title.trim(),
      platform: formData.platform,
      company: formData.company.trim() || undefined,
      description: formData.description.trim(),
      budgetMin: formData.budgetMin ? Number(formData.budgetMin) : undefined,
      budgetMax: formData.budgetMax ? Number(formData.budgetMax) : undefined,
      currency: formData.currency,
      proposedPrice: formData.proposedPrice ? Number(formData.proposedPrice) : undefined,
      status: 'Saved' as const,
      notes: '',
      userId: user?.id,
    };

    const { data: newJob, error } = await authService.createJob(payload);
    if (error || !newJob) {
      setIsSubmitting(false);
      window.alert(error?.message || 'Failed to save job');
      return;
    }

    // Clear draft on successful save
    localStorage.removeItem('job_draft');
    setIsSubmitting(false);

    if (action === 'save') {
        navigate('/app/jobs');
    } else {
        navigate(`/app/proposals/generate/${newJob.id}`);
    }
  };

  const handleCancel = () => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to discard them?')) {
        localStorage.removeItem('job_draft');
        navigate('/app/jobs');
      }
    } else {
      navigate('/app/jobs');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
      <div className="p-6 sm:p-8 space-y-8">
        
        {draftRestored && (
           <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-4 py-3 rounded-xl flex items-center gap-2 text-sm animate-in fade-in slide-in-from-top-2">
              <RotateCcw size={16} />
              Draft restored from your last session.
           </div>
        )}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>Draft autosaves every 30 seconds while editing.</span>
          <span>{lastAutoSavedAt ? `Last saved at ${lastAutoSavedAt}` : isDirty ? 'Pending first autosave...' : 'No unsaved changes'}</span>
        </div>

        {/* 1. Title (required, max 500 chars) */}
        <div>
          <div className="flex justify-between">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Job Title <span className="text-red-500">*</span>
            </label>
            <span className={`text-xs ${formData.title.length > 500 ? 'text-red-500 font-bold' : 'text-slate-400 dark:text-slate-500'}`}>
                {formData.title.length}/500
            </span>
          </div>
          <Input
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. Senior React Developer needed for SaaS"
            error={errors.title}
            maxLength={500}
            className="rounded-[12px] py-4 text-lg font-semibold placeholder:text-slate-500 dark:placeholder:text-slate-400 border-slate-300 dark:border-slate-700 shadow-sm transition-all focus:border-indigo-500"
          />
        </div>

        {/* 2. Platform (required, radio buttons displayed as cards) */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
            Platform <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PLATFORMS.map((p) => {
               const isSelected = formData.platform === p.id;
               return (
                <label
                  key={p.id}
                  className={`
                    relative cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 text-left flex items-center gap-3
                    ${isSelected 
                        ? p.activeClass 
                        : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700'
                    }
                    ${errors.platform && !isSelected ? 'border-red-200 dark:border-red-900' : ''}
                  `}
                >
                  <input 
                    type="radio" 
                    name="platform" 
                    value={p.id} 
                    checked={isSelected} 
                    onChange={() => handlePlatformChange(p.id)}
                    className="sr-only"
                  />
                  <div className={`transition-colors ${isSelected ? p.iconClass : 'text-slate-400 dark:text-slate-500'}`}>
                      {p.logo}
                  </div>
                  <div className={`font-semibold ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                      {p.label}
                  </div>
                  {isSelected && (
                      <div className={`absolute top-2 right-2 ${p.iconClass}`}>
                          <CheckCircle2 size={16} />
                      </div>
                  )}
                </label>
               )
            })}
          </div>
          {errors.platform && (
            <p className="text-xs text-red-500 mt-2 font-medium animate-in slide-in-from-top-1">{errors.platform}</p>
          )}
        </div>

        {/* 3. Company (optional) */}
        <Input
          label="Company / Client Name (Optional)"
          name="company"
          value={formData.company}
          onChange={handleChange}
          placeholder="e.g. TechFlow Inc."
          icon={Briefcase}
        />

        {/* 4. Job Description (required, min 50 chars) */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Job Description <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded-md w-fit font-medium">
                    <Wand2 size={12} />
                    <span>AI analyzes this to draft your proposal</span>
                </div>
            </div>
            <span className={`text-xs font-medium ${
                formData.description.length > 10000 ? 'text-red-500 font-bold' : 
                formData.description.length < 50 && formData.description.length > 0 ? 'text-amber-500' : 'text-slate-400 dark:text-slate-500'
            }`}>
                {formData.description.length} / 10,000
            </span>
          </div>
          <div className="relative">
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={10}
              className={`
                w-full rounded-[12px] border bg-slate-50 dark:bg-slate-900 px-4 py-4 text-base outline-none transition-all duration-200
                placeholder:text-slate-500 dark:placeholder:text-slate-400 text-slate-900 dark:text-white
                focus:bg-white dark:focus:bg-slate-950 focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-slate-900 focus:border-indigo-500 focus:ring-indigo-100 dark:focus:ring-indigo-900/30
                min-h-[250px] resize-y shadow-sm font-sans
                ${errors.description ? 'border-red-300 dark:border-red-900 focus:border-red-500 focus:ring-red-100' : 'border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600'}
              `}
              placeholder="Paste the full job description here... Our AI uses this context to generate a highly personalized proposal for you."
            />
            {errors.description && (
               <div className="absolute bottom-4 right-4 flex items-center gap-1.5 text-xs font-medium text-red-500 bg-white/90 dark:bg-slate-800/90 px-2 py-1 rounded-md shadow-sm border border-red-100 dark:border-red-900 animate-in fade-in">
                 <AlertCircle size={12} />
                 {errors.description}
               </div>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Minimum 50 characters required.
          </p>
        </div>

        {/* 5. Budget Range (optional) & 6. Proposed Price (optional) */}
        <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Budget Range (Optional)
                </label>
                <div className="flex gap-2">
                    <div className="w-24 flex-shrink-0">
                        <select 
                           name="currency"
                           value={formData.currency}
                           onChange={handleChange}
                           className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 focus:ring-offset-1 dark:focus:ring-offset-slate-900"
                        >
                            {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <input 
                       type="number"
                       name="budgetMin"
                       value={formData.budgetMin}
                       onChange={handleChange}
                       placeholder="Min"
                       className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 focus:ring-offset-1 dark:focus:ring-offset-slate-900"
                    />
                    <div className="flex items-center text-slate-400 dark:text-slate-500">-</div>
                    <input 
                       type="number"
                       name="budgetMax"
                       value={formData.budgetMax}
                       onChange={handleChange}
                       placeholder="Max"
                       className={`w-full rounded-xl border bg-slate-50 dark:bg-slate-900 dark:text-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 focus:ring-offset-1 dark:focus:ring-offset-slate-900 ${errors.budgetMax ? 'border-red-300 dark:border-red-900' : 'border-slate-200 dark:border-slate-700'}`}
                    />
                </div>
                {errors.budgetMax && <p className="text-xs text-red-500 animate-in slide-in-from-top-1">{errors.budgetMax}</p>}
            </div>

            <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Proposed Price (Optional)
                </label>
                <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm font-medium">
                        {formData.currency}
                    </span>
                    <input 
                       type="number"
                       name="proposedPrice"
                       value={formData.proposedPrice}
                       onChange={handleChange}
                       placeholder="0.00"
                       className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 dark:text-white pl-12 pr-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30 focus:ring-offset-1 dark:focus:ring-offset-slate-900"
                    />
                </div>
            </div>
        </div>

        {/* Actions */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row justify-between gap-4">
            <button
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-6 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
                Cancel
            </button>
            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={() => {
                      void handleAction('save');
                    }}
                    disabled={isSubmitting}
                    className="px-6 py-3 text-sm font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                    <Save size={18} />
                    {isSubmitting ? 'Saving...' : 'Save Job'}
                </button>
                <button
                    onClick={() => {
                      void handleAction('generate');
                    }}
                    disabled={isSubmitting}
                    className="px-8 py-3 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 flex items-center justify-center gap-2"
                >
                    <Wand2 size={18} />
                    {isSubmitting ? 'Saving...' : 'Save & Generate'}
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

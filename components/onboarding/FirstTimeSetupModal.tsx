import React, { useMemo, useState } from 'react';
import {
  Sparkles,
  User2,
  Briefcase,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Target,
  MessageSquare,
  Clock,
  DollarSign,
  Zap,
  Shield,
  Rocket,
  Check,
  LogOut,
} from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
import { useAuth } from '../../context/AuthContext';
import type {
  FreelancerProfile,
  FreelancerSpecialization,
  GenderIdentity,
  ProfessionalStatus,
} from '../../types';

type SetupFormState = {
  fullName: string;
  dateOfBirth: string;
  gender: GenderIdentity | '';
  professionalStatus: ProfessionalStatus | '';
  freelancerSpecialization: FreelancerSpecialization | '';
  specializationOther: string;
  primaryServices: string;
  yearsExperience: string;
  hourlyRateTarget: string;
  communicationStyle: string;
};

const GENDER_OPTIONS: Array<{ value: GenderIdentity; label: string; icon: string }> = [
  { value: 'male', label: 'Male', icon: '👨' },
  { value: 'female', label: 'Female', icon: '👩' },
  { value: 'non_binary', label: 'Non-binary', icon: '🧑' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say', icon: '🤐' },
];

const STATUS_OPTIONS: Array<{ value: ProfessionalStatus; label: string; description: string; icon: string }> = [
  { value: 'student', label: 'Student', description: 'Currently studying', icon: '📚' },
  { value: 'graduate', label: 'Graduate', description: 'Recently graduated', icon: '🎓' },
  { value: 'employee', label: 'Employee', description: 'Working full-time', icon: '💼' },
  { value: 'freelancer', label: 'Freelancer', description: 'Self-employed', icon: '🚀' },
];

const SPECIALIZATION_OPTIONS: Array<{ value: FreelancerSpecialization; label: string }> = [
  { value: 'writer', label: 'Writer' },
  { value: 'copywriter', label: 'Copywriter' },
  { value: 'developer', label: 'Developer' },
  { value: 'mobile_developer', label: 'Mobile Developer' },
  { value: 'graphic_designer', label: 'Graphic Designer' },
  { value: 'ui_ux_designer', label: 'UI/UX Designer' },
  { value: 'video_editor', label: 'Video Editor' },
  { value: 'social_media_manager', label: 'Social Media Manager' },
  { value: 'digital_marketer', label: 'Digital Marketer' },
  { value: 'seo_specialist', label: 'SEO Specialist' },
  { value: 'data_analyst', label: 'Data Analyst' },
  { value: 'virtual_assistant', label: 'Virtual Assistant' },
  { value: 'translator', label: 'Translator' },
  { value: 'animator', label: 'Animator' },
  { value: 'qa_tester', label: 'QA Tester' },
  { value: 'consultant', label: 'Consultant' },
  { value: 'other', label: 'Other' },
];

const COMMUNICATION_STYLES: Array<{ value: string; label: string; description: string; icon: React.ReactNode }> = [
  { value: 'Professional', label: 'Professional', description: 'Formal and business-focused', icon: <Briefcase size={18} /> },
  { value: 'Friendly', label: 'Friendly', description: 'Warm and approachable', icon: <MessageSquare size={18} /> },
  { value: 'Consultative', label: 'Consultative', description: 'Advisory and strategic', icon: <Target size={18} /> },
  { value: 'Direct', label: 'Direct', description: 'Concise and to-the-point', icon: <Zap size={18} /> },
];

const deriveExperienceLevel = (years: number): FreelancerProfile['experienceLevel'] => {
  if (years >= 8) return 'Expert';
  if (years >= 3) return 'Intermediate';
  return 'Entry';
};

// Map communication style to AI proposal tone for Fireworks AI twin agent
const communicationStyleToTone = (style: string): 'professional' | 'friendly' | 'confident' => {
  const normalized = style.toLowerCase().trim();
  if (normalized === 'friendly') return 'friendly';
  if (normalized === 'direct') return 'confident';
  return 'professional';
};

const specializationLabel = (value: FreelancerSpecialization | '') =>
  SPECIALIZATION_OPTIONS.find((item) => item.value === value)?.label || '';

const buildInitialState = (profile: FreelancerProfile): SetupFormState => {
  const setup = profile.preferences?.profileSetup;
  return {
    fullName: setup?.fullName || '',
    dateOfBirth: setup?.dateOfBirth || '',
    gender: setup?.gender || '',
    professionalStatus: setup?.professionalStatus || '',
    freelancerSpecialization: setup?.freelancerSpecialization || '',
    specializationOther: setup?.specializationOther || '',
    primaryServices: setup?.primaryServices || profile.skills.join(', '),
    yearsExperience:
      setup?.yearsExperience != null ? String(setup.yearsExperience) : String(profile.yearsExperience || 0),
    hourlyRateTarget:
      setup?.hourlyRateTarget != null ? String(setup.hourlyRateTarget) : String(profile.hourlyRate || 0),
    communicationStyle: setup?.communicationStyle || profile.communicationStyle || 'Professional',
  };
};

const parseSkills = (services: string, specialization: string, specializationOther: string): string[] => {
  const fromServices = services
    .split(/[,\n/]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 12)
    .map((item) => item.charAt(0).toUpperCase() + item.slice(1));

  const fromSpecialization =
    specialization === 'other'
      ? specializationOther.trim()
      : specializationLabel(specialization as FreelancerSpecialization);

  const all = fromSpecialization ? [fromSpecialization, ...fromServices] : fromServices;
  return [...new Set(all)].slice(0, 16);
};

const STEPS = [
  {
    number: 1,
    title: 'About You',
    subtitle: 'Personal details',
    icon: User2,
    description: 'Tell us about yourself so we can personalize your workspace.',
  },
  {
    number: 2,
    title: 'Your Craft',
    subtitle: 'Professional identity',
    icon: Briefcase,
    description: 'Help us understand your expertise to generate winning proposals.',
  },
  {
    number: 3,
    title: 'Fine-tune',
    subtitle: 'Preferences',
    icon: Target,
    description: 'Set your rates and how you want your proposals to sound.',
  },
];

const inputClassName = `
  w-full rounded-xl border px-4 py-3 text-sm outline-none transition-all duration-200
  bg-white dark:bg-slate-800/50 backdrop-blur
  placeholder:text-slate-400 dark:placeholder:text-slate-500
  focus:bg-white dark:focus:bg-slate-800/70 focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-slate-900
  border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white
  focus:border-emerald-500 dark:focus:border-emerald-400
  focus:ring-emerald-100 dark:focus:ring-emerald-900/25
  hover:border-slate-300 dark:hover:border-slate-600
`;

export const FirstTimeSetupModal: React.FC = () => {
  const { profile, updateProfile } = useProfile();
  const { signOut } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [slideDirection, setSlideDirection] = useState<'left' | 'right'>('left');

  const [form, setForm] = useState<SetupFormState>(() => {
    if (!profile) {
      return {
        fullName: '',
        dateOfBirth: '',
        gender: '',
        professionalStatus: '',
        freelancerSpecialization: '',
        specializationOther: '',
        primaryServices: '',
        yearsExperience: '0',
        hourlyRateTarget: '0',
        communicationStyle: 'Professional',
      };
    }
    return buildInitialState(profile);
  });

  const isOpen = Boolean(profile && !profile.completedOnboarding);

  const stepError = useMemo(() => {
    if (!isOpen) return null;
    if (step === 1) {
      if (!form.fullName.trim()) return 'Please enter your full name.';
    }
    if (step === 2) {
      if (!form.professionalStatus) return 'Please select your professional status.';
      if (!form.freelancerSpecialization) return 'Please select your specialization.';
      if (form.freelancerSpecialization === 'other' && !form.specializationOther.trim()) {
        return 'Please specify your specialization.';
      }
    }
    if (step === 3) {
      if (!form.primaryServices.trim() || form.primaryServices.trim().length < 8) {
        return 'Please describe your services (at least 8 characters).';
      }
      const years = Number(form.yearsExperience);
      if (Number.isNaN(years) || years < 0 || years > 60) {
        return 'Please enter valid years of experience.';
      }
      const hourly = Number(form.hourlyRateTarget);
      if (Number.isNaN(hourly) || hourly < 0 || hourly > 100000) {
        return 'Please enter a valid hourly rate.';
      }
    }
    return null;
  }, [form, isOpen, step]);

  if (!isOpen || !profile) return null;

  const setField = <K extends keyof SetupFormState>(key: K, value: SetupFormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const goNext = () => {
    if (stepError) return;
    setSlideDirection('left');
    setStep((prev) => Math.min(3, prev + 1));
  };

  const goBack = () => {
    setSlideDirection('right');
    setStep((prev) => Math.max(1, prev - 1));
  };

  const saveSetup = async () => {
    if (stepError || submitting) return;

    setSubmitting(true);
    setError(null);
    try {
      const yearsExperience = Math.max(0, Number(form.yearsExperience || 0));
      const hourlyRate = Math.max(0, Number(form.hourlyRateTarget || 0));
      const skills = parseSkills(
        form.primaryServices,
        form.freelancerSpecialization,
        form.specializationOther
      );

      const existingBio = String(profile.bio || '').trim();
      const specialization =
        form.freelancerSpecialization === 'other'
          ? form.specializationOther.trim()
          : specializationLabel(form.freelancerSpecialization);
      const generatedBio =
        existingBio ||
        `${form.fullName.trim()} is a ${specialization || 'freelance professional'} with ${yearsExperience} years of experience focused on ${form.primaryServices.trim()}.`;

      const nextProfile: FreelancerProfile = {
        ...profile,
        skills: [...new Set([...(profile.skills || []), ...skills])],
        yearsExperience,
        hourlyRate,
        experienceLevel: deriveExperienceLevel(yearsExperience),
        communicationStyle: form.communicationStyle.trim(),
        bio: generatedBio,
        completedOnboarding: true,
        preferences: {
          ...profile.preferences,
          defaultTone: communicationStyleToTone(form.communicationStyle),
          defaultLength: profile.preferences?.defaultLength || 'standard',
          profileSetup: {
            fullName: form.fullName.trim(),
            dateOfBirth: form.dateOfBirth,
            gender: form.gender as GenderIdentity,
            professionalStatus: form.professionalStatus as ProfessionalStatus,
            freelancerSpecialization: form.freelancerSpecialization as FreelancerSpecialization,
            specializationOther:
              form.freelancerSpecialization === 'other' ? form.specializationOther.trim() : undefined,
            primaryServices: form.primaryServices.trim(),
            yearsExperience,
            hourlyRateTarget: hourlyRate,
            communicationStyle: form.communicationStyle.trim(),
            setupCompletedAt: new Date().toISOString(),
          },
        },
      };

      await updateProfile(nextProfile);
    } catch (setupError) {
      setError(setupError instanceof Error ? setupError.message : 'Could not save your setup. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Live preview data
  const previewSpecialization = form.freelancerSpecialization === 'other'
    ? form.specializationOther.trim()
    : specializationLabel(form.freelancerSpecialization);
  const previewSkills = form.primaryServices
    .split(/[,\n/]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 5);

  return (
    <div className="fixed inset-0 z-[150] flex bg-slate-950">
      {/* ===== LEFT PANEL - Branding & Progress (desktop only) ===== */}
      <div className="hidden lg:flex lg:w-[420px] xl:w-[480px] flex-col relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 -right-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-teal-500/5 rounded-full blur-2xl" />
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }} />
        </div>

        <div className="relative flex flex-col h-full px-10 py-10">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-14">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Sparkles size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">GetSoloDesk</span>
          </div>

          {/* Headline */}
          <div className="mb-12">
            <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight mb-3">
              Set up your<br />
              <span className="bg-gradient-to-r from-emerald-400 to-teal-300 bg-clip-text text-transparent">
                AI workspace
              </span>
            </h1>
            <p className="text-base text-slate-400 leading-relaxed max-w-[320px]">
              Your personal AI agent will use this information to write better proposals, find better jobs, and grow your freelance career.
            </p>
          </div>

          {/* Step Progress - Vertical */}
          <div className="flex-1 flex flex-col justify-center">
            <div className="space-y-2">
              {STEPS.map((s, i) => {
                const isActive = step === s.number;
                const isCompleted = step > s.number;
                const Icon = s.icon;
                return (
                  <div key={s.number} className="flex items-start gap-4">
                    {/* Step circle + connecting line */}
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                        isActive
                          ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/40 scale-110'
                          : isCompleted
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-slate-800 text-slate-500'
                      }`}>
                        {isCompleted ? <Check size={18} strokeWidth={3} /> : <Icon size={18} />}
                      </div>
                      {i < STEPS.length - 1 && (
                        <div className={`w-0.5 h-12 mt-1 rounded-full transition-colors duration-500 ${
                          isCompleted ? 'bg-emerald-500/40' : 'bg-slate-800'
                        }`} />
                      )}
                    </div>
                    {/* Step text */}
                    <div className={`pt-1.5 transition-opacity duration-300 ${isActive ? 'opacity-100' : 'opacity-50'}`}>
                      <p className={`text-sm font-bold transition-colors ${
                        isActive ? 'text-white' : 'text-slate-400'
                      }`}>{s.title}</p>
                      <p className="text-xs text-slate-500">{s.subtitle}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Live preview card */}
          {form.fullName.trim() && (
            <div className="mt-auto">
              <div className="rounded-2xl bg-slate-800/60 backdrop-blur border border-slate-700/50 p-5 animate-in fade-in slide-in-from-bottom-3 duration-500">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                    {form.fullName.trim().charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{form.fullName.trim()}</p>
                    <p className="text-xs text-slate-400">{previewSpecialization || 'Freelancer'}</p>
                  </div>
                </div>
                {previewSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {previewSkills.map((s) => (
                      <span key={s} className="px-2 py-0.5 text-[10px] font-medium bg-slate-700/60 text-slate-300 rounded-md">
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Bottom trust badges */}
          <div className="flex items-center gap-5 mt-6 pt-6 border-t border-slate-800">
            {[
              { icon: Zap, text: 'AI-powered' },
              { icon: Shield, text: 'Private' },
              { icon: Clock, text: '30 seconds' },
            ].map(({ icon: BIcon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <BIcon size={12} />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== RIGHT PANEL - Form ===== */}
      <div className="flex-1 flex flex-col bg-white dark:bg-slate-900 overflow-hidden">
        {/* Mobile header (shown only on small screens) */}
        <div className="lg:hidden px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Sparkles size={14} className="text-white" />
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">Set Up Your Workspace</h1>
          </div>
          {/* Mobile step dots */}
          <div className="flex items-center gap-2 mt-3">
            {STEPS.map((s) => (
              <div key={s.number} className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                step >= s.number ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
              }`} />
            ))}
          </div>
        </div>

        {/* Form content - scrollable */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-lg mx-auto px-6 sm:px-10 py-8 lg:py-12">
            {/* Step header */}
            <div className="mb-8">
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-2">
                Step {step} of 3
              </p>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight mb-2">
                {STEPS[step - 1].title}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {STEPS[step - 1].description}
              </p>
            </div>

            {/* Form steps */}
            <div key={step} className={`animate-in ${slideDirection === 'left' ? 'slide-in-from-right-4' : 'slide-in-from-left-4'} fade-in duration-300`}>

              {/* Step 1: Personal Info */}
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <User2 size={16} />
                      </div>
                      <input
                        type="text"
                        value={form.fullName}
                        onChange={(e) => setField('fullName', e.target.value)}
                        placeholder="e.g. Ayush Santosh Singh"
                        className={`${inputClassName} pl-10`}
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        value={form.dateOfBirth}
                        onChange={(e) => setField('dateOfBirth', e.target.value)}
                        className={inputClassName}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Gender
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {GENDER_OPTIONS.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => setField('gender', option.value)}
                            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all duration-200 ${
                              form.gender === option.value
                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 shadow-sm shadow-emerald-500/10'
                                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                            }`}
                          >
                            <span>{option.icon}</span>
                            {option.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <Shield size={16} className="text-slate-400 shrink-0" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Your personal information is private and never shared with clients. It helps your AI agent personalize proposals.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Professional Identity */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                      Professional Status <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {STATUS_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setField('professionalStatus', option.value)}
                          className={`flex items-center gap-3 p-4 rounded-xl border text-left transition-all duration-200 ${
                            form.professionalStatus === option.value
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm shadow-indigo-500/10 ring-1 ring-indigo-500/20'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <span className="text-xl">{option.icon}</span>
                          <div>
                            <p className={`text-sm font-bold ${
                              form.professionalStatus === option.value
                                ? 'text-indigo-700 dark:text-indigo-300'
                                : 'text-slate-700 dark:text-slate-200'
                            }`}>{option.label}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{option.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Your Specialization <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={form.freelancerSpecialization}
                      onChange={(e) =>
                        setField('freelancerSpecialization', e.target.value as FreelancerSpecialization | '')
                      }
                      className={inputClassName}
                    >
                      <option value="">Select your specialization...</option>
                      {SPECIALIZATION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {form.freelancerSpecialization === 'other' && (
                    <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Specify Your Specialization <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                          <Briefcase size={16} />
                        </div>
                        <input
                          type="text"
                          value={form.specializationOther}
                          onChange={(e) => setField('specializationOther', e.target.value)}
                          placeholder="e.g. Legal Research Freelancer"
                          className={`${inputClassName} pl-10`}
                          autoFocus
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Proposal Preferences */}
              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                      Services You Offer <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={form.primaryServices}
                      onChange={(e) => setField('primaryServices', e.target.value)}
                      rows={3}
                      placeholder="e.g. React development, API integration, dashboard UX improvements"
                      className={`${inputClassName} resize-none`}
                      autoFocus
                    />
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1.5">
                      Separate services with commas. Your AI agent uses these to write targeted proposals.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        <span className="flex items-center gap-1.5">
                          <Clock size={14} className="text-slate-400" />
                          Years of Experience
                        </span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={60}
                        value={form.yearsExperience}
                        onChange={(e) => setField('yearsExperience', e.target.value)}
                        className={inputClassName}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        <span className="flex items-center gap-1.5">
                          <DollarSign size={14} className="text-slate-400" />
                          Hourly Rate (USD)
                        </span>
                      </label>
                      <input
                        type="number"
                        min={0}
                        value={form.hourlyRateTarget}
                        onChange={(e) => setField('hourlyRateTarget', e.target.value)}
                        className={inputClassName}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                      Proposal Tone
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {COMMUNICATION_STYLES.map((style) => (
                        <button
                          key={style.value}
                          type="button"
                          onClick={() => setField('communicationStyle', style.value)}
                          className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all duration-200 ${
                            form.communicationStyle === style.value
                              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-sm shadow-emerald-500/10 ring-1 ring-emerald-500/20'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <span className={`${
                            form.communicationStyle === style.value
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-slate-400'
                          }`}>{style.icon}</span>
                          <div>
                            <p className={`text-sm font-bold ${
                              form.communicationStyle === style.value
                                ? 'text-emerald-700 dark:text-emerald-300'
                                : 'text-slate-700 dark:text-slate-200'
                            }`}>{style.label}</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{style.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
                      This sets the default AI tone for all generated proposals. You can change it per-proposal later.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Error display */}
            {error && (
              <div className="mt-6 flex items-center gap-2 text-sm text-red-600 dark:text-red-400 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30 animate-in fade-in slide-in-from-bottom-1 duration-200">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions - fixed at bottom */}
        <div className="border-t border-slate-100 dark:border-slate-800 px-6 sm:px-10 py-5 bg-white dark:bg-slate-900">
          <div className="max-w-lg mx-auto flex items-center justify-between">
            <div>
              {step > 1 ? (
                <button
                  type="button"
                  onClick={goBack}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <ArrowLeft size={14} />
                  Back
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => { void signOut(); }}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium text-slate-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              )}
            </div>

            {step < 3 ? (
              <button
                type="button"
                onClick={goNext}
                disabled={Boolean(stepError)}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20 hover:shadow-emerald-500/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                Continue
                <ArrowRight size={15} />
              </button>
            ) : (
              <button
                type="button"
                onClick={saveSetup}
                disabled={Boolean(stepError) || submitting}
                className="flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/25 hover:shadow-indigo-500/35 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                    Setting up...
                  </>
                ) : (
                  <>
                    <Rocket size={16} />
                    Launch Workspace
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

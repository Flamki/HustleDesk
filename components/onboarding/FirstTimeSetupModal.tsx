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
} from 'lucide-react';
import { useProfile } from '../../context/ProfileContext';
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

const STATUS_OPTIONS: Array<{ value: ProfessionalStatus; label: string; description: string; icon: React.ReactNode }> = [
  { value: 'student', label: 'Student', description: 'Currently studying', icon: <span className="text-lg">📚</span> },
  { value: 'graduate', label: 'Graduate', description: 'Recently graduated', icon: <span className="text-lg">🎓</span> },
  { value: 'employee', label: 'Employee', description: 'Working full-time', icon: <span className="text-lg">💼</span> },
  { value: 'freelancer', label: 'Freelancer', description: 'Self-employed', icon: <span className="text-lg">🚀</span> },
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

const STEP_META = [
  { number: 1, title: 'About You', subtitle: 'Personal Info', icon: User2 },
  { number: 2, title: 'Your Craft', subtitle: 'Professional Identity', icon: Briefcase },
  { number: 3, title: 'Fine-tune', subtitle: 'Proposal Preferences', icon: Target },
];

// Step progress indicator component
const StepIndicator: React.FC<{ currentStep: number }> = ({ currentStep }) => (
  <div className="flex items-center gap-1 sm:gap-2">
    {STEP_META.map((meta, i) => {
      const isActive = currentStep === meta.number;
      const isCompleted = currentStep > meta.number;
      const Icon = meta.icon;
      return (
        <React.Fragment key={meta.number}>
          {i > 0 && (
            <div className={`hidden sm:block w-8 h-0.5 rounded-full transition-colors duration-500 ${
              isCompleted ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-slate-700'
            }`} />
          )}
          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-500 ${
              isActive
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30 scale-110'
                : isCompleted
                  ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
            }`}>
              {isCompleted ? <CheckCircle2 size={16} /> : <Icon size={16} />}
            </div>
            <div className="hidden md:block">
              <p className={`text-xs font-bold leading-none transition-colors ${
                isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'
              }`}>{meta.subtitle}</p>
            </div>
          </div>
        </React.Fragment>
      );
    })}
  </div>
);

export const FirstTimeSetupModal: React.FC = () => {
  const { profile, updateProfile } = useProfile();
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
        `${form.fullName} is a ${specialization || 'freelance professional'} with ${yearsExperience} years of experience focused on ${form.primaryServices.trim()}.`;

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
          defaultTone: profile.preferences?.defaultTone || 'professional',
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-2xl mx-4 animate-in zoom-in-95 fade-in duration-300">
        {/* Main card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-black/20 border border-slate-200/50 dark:border-slate-800 overflow-hidden">

          {/* Header with gradient accent */}
          <div className="relative px-6 sm:px-8 pt-7 pb-5">
            {/* Gradient line at top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-indigo-500" />

            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                    <Sparkles size={16} className="text-white" />
                  </div>
                  <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                    Set Up Your Workspace
                  </h1>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 pl-[42px]">
                  {step === 1 && "Tell us about yourself so we can personalize your experience."}
                  {step === 2 && "Help us understand your expertise to generate better proposals."}
                  {step === 3 && "Fine-tune how your proposals sound and what you offer."}
                </p>
              </div>
            </div>

            <StepIndicator currentStep={step} />
          </div>

          {/* Divider */}
          <div className="h-px bg-slate-100 dark:bg-slate-800" />

          {/* Content area */}
          <div className="px-6 sm:px-8 py-6 min-h-[320px]" key={step}>
            <div className={`animate-in ${slideDirection === 'left' ? 'slide-in-from-right-4' : 'slide-in-from-left-4'} fade-in duration-300`}>

              {/* Step 1: Personal Info */}
              {step === 1 && (
                <div className="space-y-5">
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

                  <div className="grid sm:grid-cols-2 gap-4">
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
                            onClick={() => setField('gender', option.value)}
                            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all duration-200 ${
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

                  {/* Benefit callout */}
                  <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <Shield size={16} className="text-slate-400 shrink-0" />
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Your personal information is private and never shared with clients.
                    </p>
                  </div>
                </div>
              )}

              {/* Step 2: Professional Identity */}
              {step === 2 && (
                <div className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
                      Professional Status <span className="text-red-400">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {STATUS_OPTIONS.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => setField('professionalStatus', option.value)}
                          className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200 ${
                            form.professionalStatus === option.value
                              ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 shadow-sm shadow-indigo-500/10 ring-1 ring-indigo-500/20'
                              : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          {option.icon}
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
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                        Your Specialization
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
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Step 3: Proposal Preferences */}
              {step === 3 && (
                <div className="space-y-5">
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
                    />
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                      Separate services with commas. These power your AI-generated proposals.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
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
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2.5">
                      Communication Style
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      {COMMUNICATION_STYLES.map((style) => (
                        <button
                          key={style.value}
                          onClick={() => setField('communicationStyle', style.value)}
                          className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all duration-200 ${
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
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="h-px bg-slate-100 dark:bg-slate-800" />
          <div className="px-6 sm:px-8 py-4 flex items-center justify-between">
            {/* Error display */}
            <div className="flex-1 mr-4">
              {(error) && (
                <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 animate-in fade-in slide-in-from-bottom-1 duration-200">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                  {error}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2.5">
              {step > 1 && (
                <button
                  onClick={goBack}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                >
                  <ArrowLeft size={14} />
                  Back
                </button>
              )}
              {step < 3 ? (
                <button
                  onClick={goNext}
                  disabled={Boolean(stepError)}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-emerald-600/20 hover:shadow-emerald-500/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Continue
                  <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  onClick={saveSetup}
                  disabled={Boolean(stepError) || submitting}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/20 hover:shadow-indigo-500/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      <Rocket size={15} />
                      Launch Workspace
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Benefits strip below card */}
        <div className="flex items-center justify-center gap-6 mt-4 px-4">
          {[
            { icon: Zap, text: 'AI-powered proposals' },
            { icon: Shield, text: 'Private & secure' },
            { icon: Rocket, text: 'Takes 30 seconds' },
          ].map(({ icon: BenefitIcon, text }) => (
            <div key={text} className="flex items-center gap-1.5 text-xs text-slate-400">
              <BenefitIcon size={12} />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

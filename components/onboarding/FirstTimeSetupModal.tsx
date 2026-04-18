import React, { useMemo, useState } from 'react';
import { Sparkles, User2, Briefcase, CheckCircle2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
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

const GENDER_OPTIONS: Array<{ value: GenderIdentity; label: string }> = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const STATUS_OPTIONS: Array<{ value: ProfessionalStatus; label: string }> = [
  { value: 'student', label: 'Student' },
  { value: 'graduate', label: 'Graduate' },
  { value: 'employee', label: 'Employee' },
  { value: 'freelancer', label: 'Freelancer' },
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

export const FirstTimeSetupModal: React.FC = () => {
  const { profile, updateProfile } = useProfile();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      if (!form.dateOfBirth) return 'Please enter your date of birth.';
      if (!form.gender) return 'Please select your gender.';
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
      if (!form.communicationStyle.trim()) {
        return 'Please choose your communication style.';
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
    setStep((prev) => Math.min(3, prev + 1));
  };

  const goBack = () => setStep((prev) => Math.max(1, prev - 1));

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

  const stepTitle =
    step === 1 ? 'Personal Info' : step === 2 ? 'Professional Identity' : 'Proposal Preferences';

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => undefined}
      closeOnOverlayClick={false}
      closeButton={false}
      size="xl"
      className="max-w-3xl"
      title="Complete Your Profile Setup"
      footer={
        <div className="w-full flex items-center justify-between">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Step {step} of 3 - {stepTitle}
          </div>
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                onClick={goBack}
                className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Back
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={goNext}
                disabled={Boolean(stepError)}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={saveSetup}
                disabled={Boolean(stepError) || submitting}
                className="px-5 py-2 rounded-lg text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
              >
                {submitting ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/60 border-t-white animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={16} />
                    Save & Continue
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        <div className="rounded-2xl p-4 bg-gradient-to-r from-emerald-50 to-indigo-50 dark:from-emerald-900/20 dark:to-indigo-900/20 border border-emerald-100 dark:border-emerald-900/30">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-center text-emerald-600">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="font-bold text-slate-900 dark:text-white">Let us tailor your workspace</p>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                This one-time setup helps GetSoloDesk generate stronger proposals and smarter recommendations.
              </p>
            </div>
          </div>
        </div>

        {step === 1 && (
          <div className="space-y-4">
            <Input
              label="Full Name"
              value={form.fullName}
              onChange={(e) => setField('fullName', e.target.value)}
              placeholder="e.g. Ayush Santosh Singh"
              icon={User2}
            />
            <Input
              label="Date of Birth"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setField('dateOfBirth', e.target.value)}
            />
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Gender</label>
              <div className="grid grid-cols-2 gap-2">
                {GENDER_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setField('gender', option.value)}
                    className={`px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                      form.gender === option.value
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Professional Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setField('professionalStatus', option.value)}
                    className={`px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                      form.professionalStatus === option.value
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Freelance Specialization
              </label>
              <select
                value={form.freelancerSpecialization}
                onChange={(e) =>
                  setField('freelancerSpecialization', e.target.value as FreelancerSpecialization | '')
                }
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
              >
                <option value="">Select specialization...</option>
                {SPECIALIZATION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {form.freelancerSpecialization === 'other' && (
              <Input
                label="Your Specialization"
                value={form.specializationOther}
                onChange={(e) => setField('specializationOther', e.target.value)}
                placeholder="e.g. Legal Research Freelancer"
                icon={Briefcase}
              />
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Primary Services
              </label>
              <textarea
                value={form.primaryServices}
                onChange={(e) => setField('primaryServices', e.target.value)}
                rows={4}
                placeholder="e.g. React development, API integration, dashboard UX improvements"
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <Input
                label="Years of Experience"
                type="number"
                min={0}
                max={60}
                value={form.yearsExperience}
                onChange={(e) => setField('yearsExperience', e.target.value)}
              />
              <Input
                label="Target Hourly Rate (USD)"
                type="number"
                min={0}
                value={form.hourlyRateTarget}
                onChange={(e) => setField('hourlyRateTarget', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Communication Style
              </label>
              <select
                value={form.communicationStyle}
                onChange={(e) => setField('communicationStyle', e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2.5 text-sm outline-none focus:border-indigo-500"
              >
                <option value="Professional">Professional</option>
                <option value="Friendly">Friendly</option>
                <option value="Consultative">Consultative</option>
                <option value="Direct">Direct</option>
              </select>
            </div>
          </div>
        )}

        {(stepError || error) && (
          <div className="rounded-lg border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error || stepError}
          </div>
        )}
      </div>
    </Modal>
  );
};


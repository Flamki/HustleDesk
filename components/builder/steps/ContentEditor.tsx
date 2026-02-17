import React, { useMemo, useState } from 'react';
import { Briefcase, FolderOpen, GraduationCap, Image, Layers3, MessageSquare, Sparkles, Star, User, Wrench } from 'lucide-react';
import type { PortfolioBuilderState } from '../builderTypes';

interface Props {
  state: PortfolioBuilderState;
  onStateChange: (next: PortfolioBuilderState) => void;
  onBack: () => void;
  onNext: () => void;
}

type TabId =
  | 'hero'
  | 'about'
  | 'stats'
  | 'services'
  | 'skills'
  | 'projects'
  | 'experience'
  | 'education'
  | 'testimonials'
  | 'contact';

const tabs: Array<{ id: TabId; label: string; icon: React.ElementType }> = [
  { id: 'hero', label: 'Hero', icon: User },
  { id: 'about', label: 'About', icon: Layers3 },
  { id: 'stats', label: 'Stats', icon: Sparkles },
  { id: 'services', label: 'Services', icon: Wrench },
  { id: 'skills', label: 'Skills', icon: Star },
  { id: 'projects', label: 'Projects', icon: FolderOpen },
  { id: 'experience', label: 'Experience', icon: Briefcase },
  { id: 'education', label: 'Education', icon: GraduationCap },
  { id: 'testimonials', label: 'Testimonials', icon: Image },
  { id: 'contact', label: 'Contact', icon: MessageSquare },
];

const rid = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

const splitLines = (value: string) =>
  value
    .split('|')
    .map((v) => v.trim())
    .filter(Boolean);

export const ContentEditor: React.FC<Props> = ({ state, onStateChange, onBack, onNext }) => {
  const [tab, setTab] = useState<TabId>('hero');
  const c = state.content;

  const setContent = (patch: Partial<PortfolioBuilderState['content']>) => {
    onStateChange({ ...state, content: { ...state.content, ...patch } });
  };

  const tabView = useMemo(() => {
    if (tab === 'hero') {
      return (
        <div className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Full Name *" value={c.fullName} onChange={(v) => setContent({ fullName: v })} />
            <Field label="Professional Title *" value={c.professionalTitle} onChange={(v) => setContent({ professionalTitle: v })} />
          </div>
          <Field label="Hero Label" value={c.heroLabel} onChange={(v) => setContent({ heroLabel: v })} />
          <Field label="Hero Headline" value={c.heroHeadline} onChange={(v) => setContent({ heroHeadline: v })} />
          <Field label="Hero Subheadline" multiline value={c.heroSubheadline} onChange={(v) => setContent({ heroSubheadline: v })} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Availability" value={c.availability} onChange={(v) => setContent({ availability: v })} />
            <Field label="Years Experience" value={c.yearsExperience} onChange={(v) => setContent({ yearsExperience: v })} />
          </div>
          <Field label="Short Bio" multiline value={c.bio} onChange={(v) => setContent({ bio: v })} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Profile Image URL" value={c.profileImageUrl} onChange={(v) => setContent({ profileImageUrl: v })} />
            <Field label="Hero Banner Image URL" value={c.heroImageUrl} onChange={(v) => setContent({ heroImageUrl: v })} />
          </div>
        </div>
      );
    }

    if (tab === 'about') {
      return (
        <div className="space-y-3">
          <Field label="About Section Title" value={c.aboutTitle} onChange={(v) => setContent({ aboutTitle: v })} />
          <Field label="About Section Body" multiline value={c.aboutBody} onChange={(v) => setContent({ aboutBody: v })} />
          <div className="rounded-lg border border-sky-200 bg-sky-50 dark:bg-sky-950/20 dark:border-sky-900/30 text-sky-800 dark:text-sky-200 text-sm px-4 py-3">
            Tip: Use 2-4 short paragraphs separated by blank lines for easier reading.
          </div>
        </div>
      );
    }

    if (tab === 'stats') {
      return (
        <div className="space-y-3">
          {c.stats.map((stat) => (
            <SectionCard key={stat.id}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field
                  label="Stat Label"
                  value={stat.label}
                  onChange={(v) => setContent({ stats: c.stats.map((s) => (s.id === stat.id ? { ...s, label: v } : s)) })}
                />
                <Field
                  label="Stat Value"
                  value={stat.value}
                  onChange={(v) => setContent({ stats: c.stats.map((s) => (s.id === stat.id ? { ...s, value: v } : s)) })}
                />
              </div>
              <DangerButton onClick={() => setContent({ stats: c.stats.filter((s) => s.id !== stat.id) })}>Remove Stat</DangerButton>
            </SectionCard>
          ))}
          <AddButton onClick={() => setContent({ stats: [...c.stats, { id: rid(), label: 'New Stat', value: '100+' }] })}>Add Stat</AddButton>
        </div>
      );
    }

    if (tab === 'services') {
      return (
        <div className="space-y-3">
          {c.services.map((service) => (
            <SectionCard key={service.id}>
              <Field
                label="Service Title"
                value={service.title}
                onChange={(v) => setContent({ services: c.services.map((s) => (s.id === service.id ? { ...s, title: v } : s)) })}
              />
              <Field
                label="Service Description"
                multiline
                value={service.description}
                onChange={(v) => setContent({ services: c.services.map((s) => (s.id === service.id ? { ...s, description: v } : s)) })}
              />
              <Field
                label="Tags (comma-separated)"
                value={service.tags}
                onChange={(v) => setContent({ services: c.services.map((s) => (s.id === service.id ? { ...s, tags: v } : s)) })}
              />
              <DangerButton onClick={() => setContent({ services: c.services.filter((s) => s.id !== service.id) })}>Remove Service</DangerButton>
            </SectionCard>
          ))}
          <AddButton onClick={() => setContent({ services: [...c.services, { id: rid(), title: 'New Service', description: '', tags: '' }] })}>
            Add Service
          </AddButton>
        </div>
      );
    }

    if (tab === 'skills') {
      return (
        <div className="space-y-3">
          {c.skills.map((skill) => (
            <SectionCard key={skill.id}>
              <div className="grid grid-cols-1 md:grid-cols-[1fr,220px] gap-3">
                <Field
                  label="Skill Name"
                  value={skill.name}
                  onChange={(v) =>
                    setContent({
                      skills: c.skills.map((s) => (s.id === skill.id ? { ...s, name: v } : s)),
                    })
                  }
                />
                <div>
                  <div className="text-sm font-medium mb-1">Level: {skill.level}%</div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={skill.level}
                    onChange={(e) =>
                      setContent({
                        skills: c.skills.map((s) => (s.id === skill.id ? { ...s, level: Number(e.target.value) } : s)),
                      })
                    }
                    className="w-full"
                  />
                </div>
              </div>
              <DangerButton onClick={() => setContent({ skills: c.skills.filter((s) => s.id !== skill.id) })}>Remove Skill</DangerButton>
            </SectionCard>
          ))}
          <AddButton onClick={() => setContent({ skills: [...c.skills, { id: rid(), name: 'New Skill', level: 75 }] })}>Add Skill</AddButton>
        </div>
      );
    }

    if (tab === 'projects') {
      return (
        <div className="space-y-3">
          {c.projects.map((project) => (
            <SectionCard key={project.id}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field
                  label="Project Title"
                  value={project.title}
                  onChange={(v) => setContent({ projects: c.projects.map((p) => (p.id === project.id ? { ...p, title: v } : p)) })}
                />
                <Field
                  label="Project Category"
                  value={project.category}
                  onChange={(v) => setContent({ projects: c.projects.map((p) => (p.id === project.id ? { ...p, category: v } : p)) })}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field
                  label="Client"
                  value={project.client}
                  onChange={(v) => setContent({ projects: c.projects.map((p) => (p.id === project.id ? { ...p, client: v } : p)) })}
                />
                <Field
                  label="Year"
                  value={project.year}
                  onChange={(v) => setContent({ projects: c.projects.map((p) => (p.id === project.id ? { ...p, year: v } : p)) })}
                />
              </div>
              <Field
                label="Description"
                multiline
                value={project.description}
                onChange={(v) => setContent({ projects: c.projects.map((p) => (p.id === project.id ? { ...p, description: v } : p)) })}
              />
              <Field
                label="Outcome / Results"
                multiline
                value={project.outcome}
                onChange={(v) => setContent({ projects: c.projects.map((p) => (p.id === project.id ? { ...p, outcome: v } : p)) })}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field
                  label="Project Link"
                  value={project.link}
                  onChange={(v) => setContent({ projects: c.projects.map((p) => (p.id === project.id ? { ...p, link: v } : p)) })}
                />
                <Field
                  label="Image URL"
                  value={project.imageUrl}
                  onChange={(v) => setContent({ projects: c.projects.map((p) => (p.id === project.id ? { ...p, imageUrl: v } : p)) })}
                />
              </div>
              <Field
                label="Tags (comma-separated)"
                value={project.tags}
                onChange={(v) => setContent({ projects: c.projects.map((p) => (p.id === project.id ? { ...p, tags: v } : p)) })}
              />
              <DangerButton onClick={() => setContent({ projects: c.projects.filter((p) => p.id !== project.id) })}>Remove Project</DangerButton>
            </SectionCard>
          ))}
          <AddButton
            onClick={() =>
              setContent({
                projects: [
                  ...c.projects,
                  {
                    id: rid(),
                    title: 'New Project',
                    category: 'Case Study',
                    client: '',
                    year: new Date().getFullYear().toString(),
                    outcome: '',
                    link: '#',
                    description: '',
                    imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
                    tags: '',
                  },
                ],
              })
            }
          >
            Add Project
          </AddButton>
        </div>
      );
    }

    if (tab === 'experience') {
      return (
        <div className="space-y-3">
          {c.experience.map((x) => (
            <SectionCard key={x.id}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Role" value={x.role} onChange={(v) => setContent({ experience: c.experience.map((e) => (e.id === x.id ? { ...e, role: v } : e)) })} />
                <Field label="Company" value={x.company} onChange={(v) => setContent({ experience: c.experience.map((e) => (e.id === x.id ? { ...e, company: v } : e)) })} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field label="Period" value={x.period} onChange={(v) => setContent({ experience: c.experience.map((e) => (e.id === x.id ? { ...e, period: v } : e)) })} />
                <Field label="Location" value={x.location} onChange={(v) => setContent({ experience: c.experience.map((e) => (e.id === x.id ? { ...e, location: v } : e)) })} />
                <Field
                  label="Employment Type"
                  value={x.employmentType}
                  onChange={(v) => setContent({ experience: c.experience.map((e) => (e.id === x.id ? { ...e, employmentType: v } : e)) })}
                />
              </div>
              <Field label="Description" multiline value={x.description} onChange={(v) => setContent({ experience: c.experience.map((e) => (e.id === x.id ? { ...e, description: v } : e)) })} />
              <Field
                label="Achievements (separate with |)"
                multiline
                value={x.achievements}
                onChange={(v) => setContent({ experience: c.experience.map((e) => (e.id === x.id ? { ...e, achievements: v } : e)) })}
              />
              <Field
                label="Technologies (comma-separated)"
                value={x.technologies}
                onChange={(v) => setContent({ experience: c.experience.map((e) => (e.id === x.id ? { ...e, technologies: v } : e)) })}
              />
              <DangerButton onClick={() => setContent({ experience: c.experience.filter((e) => e.id !== x.id) })}>Remove Experience</DangerButton>
            </SectionCard>
          ))}
          <AddButton
            onClick={() =>
              setContent({
                experience: [
                  ...c.experience,
                  {
                    id: rid(),
                    role: 'New Role',
                    company: 'Company',
                    period: '2024 - Present',
                    location: 'Remote',
                    employmentType: 'Contract',
                    description: '',
                    achievements: '',
                    technologies: '',
                  },
                ],
              })
            }
          >
            Add Experience
          </AddButton>
        </div>
      );
    }

    if (tab === 'education') {
      return (
        <div className="space-y-3">
          {c.education.map((x) => (
            <SectionCard key={x.id}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Degree" value={x.degree} onChange={(v) => setContent({ education: c.education.map((e) => (e.id === x.id ? { ...e, degree: v } : e)) })} />
                <Field label="Institution" value={x.institution} onChange={(v) => setContent({ education: c.education.map((e) => (e.id === x.id ? { ...e, institution: v } : e)) })} />
              </div>
              <Field label="Period" value={x.period} onChange={(v) => setContent({ education: c.education.map((e) => (e.id === x.id ? { ...e, period: v } : e)) })} />
              <Field label="Details" multiline value={x.details} onChange={(v) => setContent({ education: c.education.map((e) => (e.id === x.id ? { ...e, details: v } : e)) })} />
              <DangerButton onClick={() => setContent({ education: c.education.filter((e) => e.id !== x.id) })}>Remove Education</DangerButton>
            </SectionCard>
          ))}
          <AddButton
            onClick={() =>
              setContent({
                education: [...c.education, { id: rid(), degree: 'Degree', institution: 'Institution', period: '2020 - 2024', details: '' }],
              })
            }
          >
            Add Education
          </AddButton>
        </div>
      );
    }

    if (tab === 'testimonials') {
      return (
        <div className="space-y-3">
          {c.testimonials.map((x) => (
            <SectionCard key={x.id}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field label="Name" value={x.name} onChange={(v) => setContent({ testimonials: c.testimonials.map((t) => (t.id === x.id ? { ...t, name: v } : t)) })} />
                <Field label="Role" value={x.role} onChange={(v) => setContent({ testimonials: c.testimonials.map((t) => (t.id === x.id ? { ...t, role: v } : t)) })} />
                <Field
                  label="Company"
                  value={x.company}
                  onChange={(v) => setContent({ testimonials: c.testimonials.map((t) => (t.id === x.id ? { ...t, company: v } : t)) })}
                />
              </div>
              <Field label="Quote" multiline value={x.quote} onChange={(v) => setContent({ testimonials: c.testimonials.map((t) => (t.id === x.id ? { ...t, quote: v } : t)) })} />
              <DangerButton onClick={() => setContent({ testimonials: c.testimonials.filter((t) => t.id !== x.id) })}>Remove Testimonial</DangerButton>
            </SectionCard>
          ))}
          <AddButton
            onClick={() => setContent({ testimonials: [...c.testimonials, { id: rid(), name: 'Client Name', role: 'Role', company: 'Company', quote: 'Feedback goes here.' }] })}
          >
            Add Testimonial
          </AddButton>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <SectionCard>
          <Field label="Contact Section Title" value={c.contactTitle} onChange={(v) => setContent({ contactTitle: v })} />
          <Field label="Contact Description" multiline value={c.contactDescription} onChange={(v) => setContent({ contactDescription: v })} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Email" value={c.email} onChange={(v) => setContent({ email: v })} />
            <Field label="Phone" value={c.phone} onChange={(v) => setContent({ phone: v })} />
          </div>
          <Field label="Location" value={c.location} onChange={(v) => setContent({ location: v })} />
        </SectionCard>

        <SectionCard>
          <Toggle label="Show contact form" checked={c.contactFormEnabled} onChange={(v) => setContent({ contactFormEnabled: v })} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Contact Form Title" value={c.contactFormTitle} onChange={(v) => setContent({ contactFormTitle: v })} />
            <Field
              label="Form Success Message"
              value={c.contactFormSuccessMessage}
              onChange={(v) => setContent({ contactFormSuccessMessage: v })}
            />
          </div>
        </SectionCard>

        <SectionCard>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Primary CTA Label" value={c.primaryCtaLabel} onChange={(v) => setContent({ primaryCtaLabel: v })} />
            <Field label="Primary CTA URL" value={c.primaryCtaUrl} onChange={(v) => setContent({ primaryCtaUrl: v })} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field label="Secondary CTA Label" value={c.secondaryCtaLabel} onChange={(v) => setContent({ secondaryCtaLabel: v })} />
            <Field label="Secondary CTA URL" value={c.secondaryCtaUrl} onChange={(v) => setContent({ secondaryCtaUrl: v })} />
          </div>
          <Field label="Footer Text" value={c.footerText} onChange={(v) => setContent({ footerText: v })} />
        </SectionCard>

        {c.experience.some((item) => splitLines(item.achievements).length === 0 && item.achievements.trim().length > 0) ? (
          <div className="rounded-lg border border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-200 text-sm px-4 py-3">
            Tip: Use the | separator for experience achievements to render bullet points cleanly.
          </div>
        ) : null}
      </div>
    );
  }, [tab, c]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[38px] font-semibold leading-tight text-slate-900 dark:text-white">Edit Your Content</h2>
        <p className="text-slate-500 mt-2">Customize every section of your portfolio to match your real experience and goals</p>
      </div>

      <div className="rounded-xl border border-slate-300 dark:border-slate-700 p-2 grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-lg px-3 py-2 text-sm flex items-center justify-center gap-2 ${
                tab === t.id ? 'bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700' : 'text-slate-500'
              }`}
            >
              <Icon size={14} />
              {t.label}
            </button>
          );
        })}
      </div>

      <div>{tabView}</div>

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm">
          Back
        </button>
        <button onClick={onNext} className="rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2 text-sm font-semibold">
          Continue to Links & Social
        </button>
      </div>
    </div>
  );
};

const Field: React.FC<{
  label: string;
  value: string;
  multiline?: boolean;
  onChange: (value: string) => void;
}> = ({ label, value, multiline, onChange }) => {
  return (
    <label className="block">
      <div className="text-sm font-medium mb-1">{label}</div>
      {multiline ? (
        <textarea
          value={value}
          rows={4}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-sm"
        />
      )}
    </label>
  );
};

const Toggle: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void }> = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-3 text-sm font-medium">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4" />
    {label}
  </label>
);

const SectionCard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="rounded-xl border border-slate-300 dark:border-slate-700 p-3 space-y-3">{children}</div>
);

const AddButton: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button onClick={onClick} className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm">
    {children}
  </button>
);

const DangerButton: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button className="rounded-lg bg-rose-600 text-white px-3 py-1 text-xs" onClick={onClick}>
    {children}
  </button>
);

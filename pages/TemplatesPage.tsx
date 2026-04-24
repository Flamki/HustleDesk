import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  Briefcase,
  Check,
  Copy,
  DollarSign,
  FileText,
  MessageSquare,
  Search,
  Send,
  Shield,
  Star,
  X,
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { getBaseTemplates, TemplateCategory, TemplateDef } from '../templates/baseTemplates';
import {
  deleteTemplateOverride,
  listTemplateOverrides,
  TemplateOverrideRow,
  upsertTemplateOverride,
} from '../services/templatesService';

type UiTemplateCategory = 'All' | TemplateCategory;

type UiTemplate = TemplateDef & {
  customized: boolean;
  effectiveTitle: string;
  effectiveContent: string;
  overrideUpdatedAt?: string;
};

export const TemplatesPage: React.FC = () => {
  const baseTemplates = useMemo(() => getBaseTemplates(), []);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<UiTemplateCategory>('All');
  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [overridesByKey, setOverridesByKey] = useState<Record<string, TemplateOverrideRow>>({});
  const [overridesLoading, setOverridesLoading] = useState(true);
  const [overridesError, setOverridesError] = useState<string | null>(null);

  const [modalMode, setModalMode] = useState<'default' | 'my'>('default');
  const [draftTitle, setDraftTitle] = useState('');
  const [draftContent, setDraftContent] = useState('');
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setOverridesLoading(true);
      setOverridesError(null);
      const { overrides, error } = await listTemplateOverrides();
      if (!mounted) return;
      if (error) {
        setOverridesError(error.message || 'Failed to load your template edits');
        setOverridesByKey({});
        setOverridesLoading(false);
        return;
      }
      const map: Record<string, TemplateOverrideRow> = {};
      for (const row of overrides) map[row.template_key] = row;
      setOverridesByKey(map);
      setOverridesLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const templates: UiTemplate[] = useMemo(() => {
    return baseTemplates.map((t) => {
      const o = overridesByKey[t.key];
      const customized = Boolean(o);
      return {
        ...t,
        customized,
        effectiveTitle: (o?.title || '').trim() || t.title,
        effectiveContent: (o?.content || '').trim() || t.content,
        overrideUpdatedAt: o?.updated_at,
      };
    });
  }, [baseTemplates, overridesByKey]);

  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return templates.filter((t) => {
      const matchesSearch =
        !q ||
        t.effectiveTitle.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q));
      const matchesCategory = selectedCategory === 'All' || t.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [templates, searchQuery, selectedCategory]);

  const selectedTemplate = useMemo(() => {
    if (!selectedTemplateKey) return null;
    return templates.find((t) => t.key === selectedTemplateKey) || null;
  }, [selectedTemplateKey, templates]);

  const handleCopy = async (content: string, key: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(null), 1500);
    } catch {
      setCopiedKey(null);
    }
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Proposal':
        return FileText;
      case 'Outreach':
        return Send;
      case 'Follow-up':
        return MessageSquare;
      case 'Client Mgmt':
        return Briefcase;
      case 'Pricing':
        return DollarSign;
      case 'Social Proof':
        return Award;
      case 'Contracts':
        return Shield;
      default:
        return FileText;
    }
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'Proposal':
        return 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400';
      case 'Outreach':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Follow-up':
        return 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400';
      case 'Client Mgmt':
        return 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400';
      case 'Pricing':
        return 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'Social Proof':
        return 'bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400';
      case 'Contracts':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400';
      default:
        return 'bg-slate-100 text-slate-600';
    }
  };

  const openTemplate = (t: UiTemplate) => {
    setSelectedTemplateKey(t.key);
    setModalMode(t.customized ? 'my' : 'default');
    setDraftTitle(t.effectiveTitle);
    setDraftContent(t.effectiveContent);
    setSaveState('idle');
    setSaveError(null);
  };

  const closeModal = () => {
    setSelectedTemplateKey(null);
    setSaveState('idle');
    setSaveError(null);
  };

  const saveMyVersion = async () => {
    if (!selectedTemplate) return;
    const title = draftTitle.trim();
    const content = draftContent.trim();
    if (!content) {
      setSaveState('error');
      setSaveError('Template content cannot be empty.');
      return;
    }
    setSaveState('saving');
    setSaveError(null);
    const { override, error } = await upsertTemplateOverride(selectedTemplate.key, title, content);
    if (error || !override) {
      setSaveState('error');
      setSaveError(error?.message || 'Failed to save your version.');
      return;
    }
    setOverridesByKey((prev) => ({ ...prev, [override.template_key]: override }));
    setSaveState('saved');
    window.setTimeout(() => setSaveState('idle'), 1200);
  };

  const resetToDefault = async () => {
    if (!selectedTemplate) return;
    setSaveState('saving');
    setSaveError(null);
    const { error } = await deleteTemplateOverride(selectedTemplate.key);
    if (error) {
      setSaveState('error');
      setSaveError(error.message || 'Failed to reset template.');
      return;
    }
    setOverridesByKey((prev) => {
      const next = { ...prev };
      delete next[selectedTemplate.key];
      return next;
    });
    setDraftTitle(selectedTemplate.title);
    setDraftContent(selectedTemplate.content);
    setModalMode('default');
    setSaveState('saved');
    window.setTimeout(() => setSaveState('idle'), 1200);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Templates Library</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-xl">
            Proven scripts, emails, and proposals used by working freelancers. Copy, customize, and send.
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
            Your edits save as “My version” so defaults stay fresh.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white shadow-sm"
          />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar border-b border-slate-200 dark:border-slate-800">
        {(['All', 'Proposal', 'Outreach', 'Follow-up', 'Client Mgmt', 'Pricing', 'Social Proof', 'Contracts'] as UiTemplateCategory[]).map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`
              px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all
              ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-md'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map((template) => {
          const Icon = getCategoryIcon(template.category);
          const colorClass = getCategoryColor(template.category);
          const isCopied = copiedKey === template.key;

          return (
            <div
              key={template.key}
              onClick={() => openTemplate(template)}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-pointer group flex flex-col h-full"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-xl ${colorClass}`}>
                  <Icon size={20} />
                </div>
                <div className="flex gap-1">
                  {template.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] uppercase font-bold rounded-md"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                {template.effectiveTitle}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-6 line-clamp-2">
                {template.description}
              </p>

              <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                  <Star size={12} className="fill-slate-400" /> {template.likes} used
                </span>
                <div className="flex items-center gap-2">
                  {template.customized && (
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 text-[10px] uppercase font-bold rounded-md border border-indigo-100 dark:border-indigo-800">
                      Customized
                    </span>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopy(template.effectiveContent, template.key);
                    }}
                    className={`p-2 rounded-lg transition-all ${
                      isCopied
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                        : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600'
                    }`}
                    title="Copy to clipboard"
                  >
                    {isCopied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTemplates.length === 0 && (
        <div className="text-center py-20">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
            <Search size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">No templates found</h3>
          <p className="text-slate-500 dark:text-slate-400">Try adjusting your search or category filters.</p>
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
            }}
            className="mt-4 text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={closeModal} />
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${getCategoryColor(selectedTemplate.category)}`}>
                  {React.createElement(getCategoryIcon(selectedTemplate.category), { size: 20 })}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">{selectedTemplate.effectiveTitle}</h2>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{selectedTemplate.category} Template</span>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-50 dark:bg-slate-950/30">
              {overridesLoading && (
                <div className="mb-4 text-sm text-slate-500 dark:text-slate-400">Loading your saved edits...</div>
              )}
              {overridesError && (
                <div className="mb-4 text-sm text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-300 border border-rose-100 dark:border-rose-900/40 rounded-xl px-4 py-3">
                  {overridesError}
                </div>
              )}

              <div className="flex items-center gap-2 mb-4">
                <button
                  onClick={() => setModalMode('default')}
                  className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                    modalMode === 'default'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Default
                </button>
                <button
                  onClick={() => setModalMode('my')}
                  className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${
                    modalMode === 'my'
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  My version
                </button>
                <div className="ml-auto flex items-center gap-2">
                  {selectedTemplate.customized && selectedTemplate.overrideUpdatedAt && (
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Saved {new Date(selectedTemplate.overrideUpdatedAt).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              <div className="prose dark:prose-invert max-w-none">
                {modalMode === 'default' ? (
                  <div className="p-6 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm relative">
                    <pre className="whitespace-pre-wrap font-sans text-sm md:text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                      {selectedTemplate.content}
                    </pre>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                        Title
                      </label>
                      <input
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="My custom title"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1">
                        Content
                      </label>
                      <textarea
                        value={draftContent}
                        onChange={(e) => setDraftContent(e.target.value)}
                        rows={14}
                        className="w-full px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 font-sans text-sm leading-relaxed"
                        placeholder="Write your edited template here"
                      />
                      <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>Tip: Replace [Bracketed] fields before sending.</span>
                        <span>{draftContent.length.toLocaleString()} chars</span>
                      </div>
                    </div>

                    {saveError && (
                      <div className="text-sm text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/20 border border-rose-100 dark:border-rose-900/40 rounded-xl px-4 py-3">
                        {saveError}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {selectedTemplate.tags.map((tag) => (
                  <Badge key={tag} variant="neutral">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-2xl flex justify-between items-center">
              <p className="text-xs text-slate-400">Pro Tip: Customize the [Bracketed] text before sending.</p>
              <div className="flex items-center gap-2">
                {modalMode === 'my' && (
                  <>
                    {selectedTemplate.customized && (
                      <button
                        onClick={resetToDefault}
                        disabled={saveState === 'saving'}
                        className="px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-60"
                      >
                        Reset to Default
                      </button>
                    )}
                    <button
                      onClick={saveMyVersion}
                      disabled={saveState === 'saving'}
                      className="px-4 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold rounded-xl transition-colors disabled:opacity-60"
                    >
                      {saveState === 'saving' ? 'Saving...' : saveState === 'saved' ? 'Saved' : 'Save My Version'}
                    </button>
                  </>
                )}
                <button
                  onClick={() => handleCopy(modalMode === 'my' ? draftContent : selectedTemplate.content, selectedTemplate.key)}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                >
                  {copiedKey === selectedTemplate.key ? (
                    <>
                      <Check size={18} /> Copied
                    </>
                  ) : (
                    <>
                      <Copy size={18} /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


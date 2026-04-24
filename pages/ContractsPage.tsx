import React, { useEffect, useMemo, useState } from 'react';
import {
  ChevronDown,
  FileText,
  Printer,
  Plus,
  Search,
  Shield,
  X,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getClientsInsights } from '../services/supabaseService';
import { getBaseTemplates, TemplateDef } from '../templates/baseTemplates';
import { useToast } from '../components/ui';
import { supabase } from '../services/supabaseClient';

/* ────────────────────────────────── types ─── */
interface ContractDraft {
  id: string;
  template: string;
  clientName: string;
  clientEmail: string;
  projectName: string;
  content: string;
  status: 'Draft' | 'Sent' | 'Signed';
  createdAt: string;
}

const STORAGE_KEY = 'gsd_contracts_v1';

const loadContracts = (): ContractDraft[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};
const saveContracts = (c: ContractDraft[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(c));

const statusStyles: Record<string, string> = {
  Draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  Sent: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  Signed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
};

/* ────────────────────────────── component ─── */
export const ContractsPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [contracts, setContracts] = useState<ContractDraft[]>(loadContracts);
  const [showNewModal, setShowNewModal] = useState(false);
  const [editingContract, setEditingContract] = useState<ContractDraft | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Draft' | 'Sent' | 'Signed'>('All');

  // New contract form state
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [projectName, setProjectName] = useState('');
  const [knownClients, setKnownClients] = useState<Array<{ name: string }>>([]);

  // Load known clients from API
  useEffect(() => {
    const load = async () => {
      const { data } = await getClientsInsights();
      if (data?.clients) setKnownClients(data.clients.map((c) => ({ name: c.name })));
    };
    void load();
  }, []);

  // Contract templates (filtered from base)
  const contractTemplates = useMemo(() => {
    try {
      return getBaseTemplates().filter((t) => t.category === 'Contracts');
    } catch { return []; }
  }, []);

  // Filtered list
  const filteredContracts = useMemo(() => {
    let list = [...contracts];
    if (statusFilter !== 'All') list = list.filter((c) => c.status === statusFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) =>
        c.clientName.toLowerCase().includes(q) ||
        c.projectName.toLowerCase().includes(q) ||
        c.template.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [contracts, statusFilter, searchQuery]);

  const handleCreateContract = () => {
    if (!selectedTemplate) { showToast({ variant: 'error', message: 'Select a template' }); return; }
    if (!clientName.trim()) { showToast({ variant: 'error', message: 'Enter client name' }); return; }
    if (!projectName.trim()) { showToast({ variant: 'error', message: 'Enter project name' }); return; }

    const tpl = contractTemplates.find((t) => t.key === selectedTemplate);
    if (!tpl) return;

    const userName = user?.email?.split('@')[0] || 'Your Name';
    const userEmail = user?.email || '';

    // Auto-fill template placeholders
    let content = tpl.content;
    content = content.replace(/\[Your Full Name\]/g, userName);
    content = content.replace(/\[Your Name\]/g, userName);
    content = content.replace(/\[Your Email\]/g, userEmail);
    content = content.replace(/\[Client Name \/ Company\]/g, clientName);
    content = content.replace(/\[Client Name\]/g, clientName);
    content = content.replace(/\[Client Email\]/g, clientEmail);
    content = content.replace(/\[Project Name\]/g, projectName);
    content = content.replace(/\[Project Description\]/g, projectName);
    content = content.replace(/\[Date\]/g, new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }));

    const newContract: ContractDraft = {
      id: crypto.randomUUID(),
      template: tpl.title,
      clientName,
      clientEmail,
      projectName,
      content,
      status: 'Draft',
      createdAt: new Date().toISOString(),
    };

    const updated = [newContract, ...contracts];
    setContracts(updated);
    saveContracts(updated);
    setShowNewModal(false);
    setEditingContract(newContract);

    // Reset form
    setSelectedTemplate('');
    setClientName('');
    setClientEmail('');
    setProjectName('');

    showToast({ variant: 'success', message: 'Contract created! Edit below and print when ready.' });
  };

  const updateContractContent = (id: string, content: string) => {
    const updated = contracts.map((c) => (c.id === id ? { ...c, content } : c));
    setContracts(updated);
    saveContracts(updated);
    if (editingContract?.id === id) setEditingContract({ ...editingContract, content });
  };

  const updateContractStatus = (id: string, status: ContractDraft['status']) => {
    const updated = contracts.map((c) => (c.id === id ? { ...c, status } : c));
    setContracts(updated);
    saveContracts(updated);
    if (editingContract?.id === id) setEditingContract({ ...editingContract, status });
  };

  const deleteContract = (id: string) => {
    const updated = contracts.filter((c) => c.id !== id);
    setContracts(updated);
    saveContracts(updated);
    if (editingContract?.id === id) setEditingContract(null);
    showToast({ variant: 'success', message: 'Contract deleted' });
  };

  const printContract = (contract: ContractDraft) => {
    const userName = user?.email?.split('@')[0] || '';
    const html = `<!DOCTYPE html>
<html><head>
<meta charset="UTF-8">
<title>${contract.template} - ${contract.clientName}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Inter', serif; color: #1e293b; padding: 60px 72px; line-height: 1.8; font-size: 14px; }
@media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 40px 60px; } }
h1 { font-size: 22px; font-weight: 700; margin-bottom: 32px; letter-spacing: -0.3px; text-align: center; }
pre { white-space: pre-wrap; word-wrap: break-word; font-family: inherit; font-size: 14px; line-height: 1.8; }
.header-bar { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 16px 24px; border-radius: 12px; margin-bottom: 32px; display: flex; justify-content: space-between; align-items: center; }
.header-bar .title { font-weight: 700; font-size: 18px; }
.header-bar .meta { font-size: 12px; opacity: 0.9; }
.footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #e2e8f0; text-align: center; color: #94a3b8; font-size: 11px; }
</style></head><body>
<div class="header-bar">
  <div class="title">${contract.template}</div>
  <div class="meta">${contract.projectName} &bull; ${new Date(contract.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
</div>
<pre>${contract.content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
<div class="footer">Generated with GetSoloDesk &mdash; getsolodesk.com</div>
</body></html>`;

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      setTimeout(() => w.print(), 500);
    }
  };

  const inputCls = 'w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white px-4 py-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30';
  const labelCls = 'block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5';

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield size={28} className="text-purple-500" /> Contracts
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Create professional contracts from templates and send to clients.
          </p>
        </div>
        <button onClick={() => setShowNewModal(true)}
          className="px-5 py-3 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-lg shadow-purple-500/20 hover:shadow-purple-500/30 flex items-center gap-2">
          <Plus size={18} /> New Contract
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="Search contracts..." value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500 dark:text-white shadow-sm" />
        </div>
        <div className="flex gap-2">
          {(['All', 'Draft', 'Sent', 'Signed'] as const).map((s) => (
            <button key={s} onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${statusFilter === s
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Contract List or Editor */}
      {editingContract ? (
        /* ── CONTRACT EDITOR ── */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <button onClick={() => setEditingContract(null)}
              className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1">
              ← Back to contracts
            </button>
            <div className="flex items-center gap-2">
              <select value={editingContract.status}
                onChange={(e) => updateContractStatus(editingContract.id, e.target.value as ContractDraft['status'])}
                className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 dark:text-white px-3 py-2 text-xs font-semibold outline-none">
                <option value="Draft">Draft</option>
                <option value="Sent">Sent</option>
                <option value="Signed">Signed</option>
              </select>
              <button onClick={() => printContract(editingContract)}
                className="px-4 py-2 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl flex items-center gap-2 transition-all">
                <Printer size={16} /> Print / PDF
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            {/* Document header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold">{editingContract.template}</p>
                  <p className="text-sm text-purple-100 mt-0.5">
                    {editingContract.clientName} &bull; {editingContract.projectName}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${statusStyles[editingContract.status]}`}>
                  {editingContract.status}
                </span>
              </div>
            </div>

            {/* Editable content */}
            <div className="p-6">
              <textarea
                value={editingContract.content}
                onChange={(e) => updateContractContent(editingContract.id, e.target.value)}
                rows={Math.max(20, editingContract.content.split('\n').length + 2)}
                className="w-full font-mono text-sm leading-relaxed text-slate-800 dark:text-slate-200 bg-transparent outline-none resize-none"
                spellCheck
              />
            </div>
          </div>
        </div>
      ) : (
        /* ── CONTRACT LIST ── */
        <>
          {filteredContracts.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto mb-4">
                <Shield size={32} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No contracts yet</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-md mx-auto">
                Create professional contracts from templates. Pick a template, fill in client details, and generate a print-ready document.
              </p>
              <button onClick={() => setShowNewModal(true)}
                className="mt-6 px-6 py-3 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-lg shadow-purple-500/20 inline-flex items-center gap-2">
                <Plus size={18} /> Create Your First Contract
              </button>
            </div>
          ) : (
            <div className="grid gap-3">
              {filteredContracts.map((c) => (
                <button key={c.id} onClick={() => setEditingContract(c)}
                  className="w-full text-left bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 hover:border-purple-300 dark:hover:border-purple-700 hover:shadow-md transition-all group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center flex-shrink-0">
                        <FileText size={20} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 dark:text-white truncate">{c.template}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {c.clientName} &bull; {c.projectName} &bull; {new Date(c.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-bold ${statusStyles[c.status]}`}>
                        {c.status}
                      </span>
                      <button onClick={(e) => { e.stopPropagation(); deleteContract(c.id); }}
                        className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                        title="Delete">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── NEW CONTRACT MODAL ── */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl w-full max-w-lg mx-4 animate-in zoom-in-95">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">New Contract</h2>
              <button onClick={() => setShowNewModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Template */}
              <div>
                <label className={labelCls}>Template</label>
                <select value={selectedTemplate} onChange={(e) => setSelectedTemplate(e.target.value)} className={inputCls}>
                  <option value="">Select a template...</option>
                  {contractTemplates.map((t) => (
                    <option key={t.key} value={t.key}>{t.title}</option>
                  ))}
                </select>
                {selectedTemplate && (
                  <p className="text-xs text-slate-400 mt-1.5">
                    {contractTemplates.find((t) => t.key === selectedTemplate)?.description}
                  </p>
                )}
              </div>

              {/* Client */}
              <div>
                <label className={labelCls}>Client</label>
                <input list="known-clients" value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Client or company name" className={inputCls} />
                <datalist id="known-clients">
                  {knownClients.map((c) => (
                    <option key={c.name} value={c.name} />
                  ))}
                </datalist>
              </div>

              {/* Client Email */}
              <div>
                <label className={labelCls}>Client Email <span className="text-slate-400 font-normal">(optional)</span></label>
                <input type="email" value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="client@company.com" className={inputCls} />
              </div>

              {/* Project */}
              <div>
                <label className={labelCls}>Project Name</label>
                <input value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. Website Redesign" className={inputCls} />
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
              <button onClick={() => setShowNewModal(false)}
                className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={handleCreateContract}
                className="px-6 py-2.5 text-sm font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition-all shadow-md shadow-purple-500/20 flex items-center gap-2">
                <Shield size={16} /> Create Contract
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContractsPage;

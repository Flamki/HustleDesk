import React, { useEffect, useState } from 'react';
import { X, Calendar, Globe, Save, Wand2, FileText, StickyNote, Trash2 } from 'lucide-react';
import { Job, JobStatus } from '../../types';
import { Badge } from '../ui/Badge';

interface JobDetailModalProps {
  job: Job;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedJob: Job) => void;
  onDelete?: () => void;
  onGenerateProposal?: (jobId: string) => void;
  initialIsEditing?: boolean;
}

export const JobDetailModal: React.FC<JobDetailModalProps> = ({
  job,
  isOpen,
  onClose,
  onSave,
  onDelete,
  onGenerateProposal,
  initialIsEditing = false,
}) => {
  const [editedJob, setEditedJob] = useState<Job>(job);
  const [isEditing, setIsEditing] = useState(initialIsEditing);

  const formatDateTime = (value?: string) => {
    if (!value) return '-';
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return value;
    return `${dt.toLocaleDateString()} ${dt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
  };

  const toDatetimeLocalValue = (value?: string) => {
    if (!value) return '';
    const dt = new Date(value);
    if (Number.isNaN(dt.getTime())) return '';
    const local = new Date(dt.getTime() - dt.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 16);
  };

  useEffect(() => {
    setEditedJob(job);
    setIsEditing(initialIsEditing);
  }, [job, initialIsEditing]);

  if (!isOpen) return null;

  const handleChange = (field: keyof Job, value: any) => {
    setEditedJob((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onSave(editedJob);
    setIsEditing(false);
  };

  const statusVariant = (status: JobStatus) => {
    if (status === 'Won') return 'success';
    if (status === 'Lost') return 'danger';
    if (status === 'Applied') return 'blue';
    if (status === 'Replied') return 'purple';
    return 'neutral';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        <div className="flex items-start justify-between p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-1 w-full">
            {isEditing ? (
              <input
                className="text-xl font-bold text-slate-900 dark:text-white border-b border-slate-300 dark:border-slate-700 bg-transparent focus:border-indigo-500 outline-none w-full"
                value={editedJob.title}
                onChange={(e) => handleChange('title', e.target.value)}
              />
            ) : (
              <h2 className="text-xl font-bold text-slate-900 dark:text-white pr-8">{editedJob.title}</h2>
            )}
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              {isEditing ? (
                <input
                  className="border-b border-slate-300 dark:border-slate-700 bg-transparent focus:border-indigo-500 outline-none"
                  value={editedJob.company || ''}
                  onChange={(e) => handleChange('company', e.target.value)}
                  placeholder="Company Name"
                />
              ) : (
                <span>{editedJob.company || 'Unknown Company'}</span>
              )}
              <span>-</span>
              <span className="flex items-center gap-1">
                <Globe size={12} /> {editedJob.platform}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Status</label>
              <div>
                {isEditing ? (
                  <select
                    value={editedJob.status}
                    onChange={(e) => handleChange('status', e.target.value as JobStatus)}
                    className="text-sm border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white rounded-md py-1 px-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="Saved">Saved</option>
                    <option value="Applied">Applied</option>
                    <option value="Replied">Replied</option>
                    <option value="Won">Won</option>
                    <option value="Lost">Lost</option>
                  </select>
                ) : (
                  <Badge variant={statusVariant(editedJob.status)}>{editedJob.status}</Badge>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Budget</label>
              {isEditing ? (
                <div className="flex items-center gap-1 text-sm text-slate-900 dark:text-white">
                  <span className="text-slate-400 text-xs">{editedJob.currency}</span>
                  <input
                    className="w-16 bg-transparent border-b border-slate-300 dark:border-slate-700 focus:border-indigo-500 outline-none text-center"
                    value={editedJob.budgetMin || ''}
                    onChange={(e) => handleChange('budgetMin', Number(e.target.value))}
                    type="number"
                    placeholder="Min"
                  />
                  <span>-</span>
                  <input
                    className="w-16 bg-transparent border-b border-slate-300 dark:border-slate-700 focus:border-indigo-500 outline-none text-center"
                    value={editedJob.budgetMax || ''}
                    onChange={(e) => handleChange('budgetMax', Number(e.target.value))}
                    type="number"
                    placeholder="Max"
                  />
                </div>
              ) : (
                <div className="text-sm font-semibold text-slate-900 dark:text-white">
                  {editedJob.currency} {editedJob.budgetMin ?? '-'} {editedJob.budgetMax ? `- ${editedJob.budgetMax}` : ''}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Applied Date</label>
              <div className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Calendar size={14} className="text-slate-400" />
                {editedJob.appliedAt ? new Date(editedJob.appliedAt).toLocaleDateString() : '-'}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase">Follow-Up</label>
              <div className="text-sm text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Calendar size={14} className="text-slate-400" />
                {isEditing ? (
                  <input
                    type="datetime-local"
                    className="bg-transparent border-b border-slate-300 dark:border-slate-700 focus:border-indigo-500 outline-none text-xs w-full"
                    value={toDatetimeLocalValue(editedJob.followUpAt)}
                    onChange={(e) => handleChange('followUpAt', e.target.value ? new Date(e.target.value).toISOString() : undefined)}
                  />
                ) : editedJob.followUpAt ? (
                  formatDateTime(editedJob.followUpAt)
                ) : (
                  '-'
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Job Description</h3>
            {isEditing ? (
              <textarea
                className="w-full h-40 text-sm text-slate-600 dark:text-slate-300 bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg p-3 outline-none focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900/30"
                value={editedJob.description}
                onChange={(e) => handleChange('description', e.target.value)}
              />
            ) : (
              <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-lg p-3 max-h-60 overflow-y-auto">
                {editedJob.description}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <div className="p-1 bg-indigo-100 dark:bg-indigo-900/30 rounded text-indigo-600 dark:text-indigo-400">
                <StickyNote size={14} />
              </div>
              Notes
            </h3>
            <textarea
              className={`
                w-full min-h-[120px] text-sm text-slate-700 dark:text-slate-300 rounded-xl p-4 outline-none transition-all duration-200 resize-y
                ${
                  isEditing
                    ? 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm'
                    : 'bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-900/20'
                }
              `}
              value={editedJob.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Add private notes about this opportunity..."
              readOnly={!isEditing}
            />
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText size={16} />
                Proposal
              </h3>
              {!editedJob.proposal ? (
                <button
                  onClick={() => onGenerateProposal?.(editedJob.id)}
                  className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-full font-medium flex items-center gap-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                >
                  <Wand2 size={12} />
                  Generate Proposal
                </button>
              ) : (
                <button
                  onClick={() => onGenerateProposal?.(editedJob.id)}
                  className="text-xs bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-full font-medium hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                >
                  View Proposal
                </button>
              )}
            </div>
            {editedJob.proposal ? (
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 text-sm text-slate-600 dark:text-slate-300">
                {editedJob.proposal.substring(0, 180)}...
              </div>
            ) : (
              <div className="text-center py-6 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-dashed border-slate-200 dark:border-slate-700">
                <p className="text-sm text-slate-500 dark:text-slate-400">No proposal generated yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 rounded-b-2xl flex justify-between items-center">
          <button
            onClick={onDelete}
            className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
          >
            <Trash2 size={16} />
            Delete
          </button>
          <div className="flex gap-3">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setEditedJob(job);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors flex items-center gap-2"
                >
                  <Save size={16} />
                  Save Changes
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600 rounded-lg transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  Edit
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

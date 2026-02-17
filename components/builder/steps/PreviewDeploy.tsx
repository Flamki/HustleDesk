import React from 'react';
import { Copy, ExternalLink, Share2 } from 'lucide-react';
import type { PortfolioBuilderState } from '../builderTypes';

interface Props {
  state: PortfolioBuilderState;
  publicUrl: string | null;
  saving: boolean;
  onBack: () => void;
  onDeploy: () => void;
  onCopyUrl: () => void;
  preview: React.ReactNode;
}

export const PreviewDeploy: React.FC<Props> = ({ state, publicUrl, saving, onBack, onDeploy, onCopyUrl, preview }) => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[38px] font-semibold leading-tight text-slate-900 dark:text-white">Preview & Deploy</h2>
        <p className="text-slate-500 mt-2">Review your portfolio and deploy it live</p>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <button className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm inline-flex items-center gap-2">
          <ExternalLink size={14} />
          Full Screen Preview
        </button>
        <button className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm inline-flex items-center gap-2">
          <Share2 size={14} />
          Share Preview
        </button>
        {publicUrl ? (
          <button onClick={onCopyUrl} className="rounded-lg border border-slate-300 dark:border-slate-700 px-3 py-2 text-sm inline-flex items-center gap-2">
            <Copy size={14} />
            Copy URL
          </button>
        ) : null}
      </div>

      <div
        className="rounded-2xl border border-slate-300 dark:border-slate-700 overflow-auto max-h-[80vh]"
        data-template-preview-scroll="true"
      >
        {preview}
      </div>

      <div className="rounded-2xl border border-slate-300 dark:border-slate-700 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
        <div>
          <div className="text-lg font-semibold">Ready to Deploy?</div>
          <div className="text-sm opacity-80">Deploy your portfolio live and get a shareable URL.</div>
          <div className="text-xs mt-2 opacity-70">
            Template: <span className="font-semibold capitalize">{state.templateId.replace(/_/g, ' ')}</span>
          </div>
        </div>
        <button
          onClick={onDeploy}
          disabled={saving}
          className="rounded-xl px-5 py-2.5 bg-white text-slate-900 dark:bg-slate-900 dark:text-white font-semibold disabled:opacity-60"
        >
          {saving ? 'Deploying...' : 'Deploy Portfolio'}
        </button>
      </div>

      {publicUrl ? (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/20 dark:text-emerald-200 px-4 py-3 text-sm">
          Live URL: <a href={publicUrl} target="_blank" rel="noreferrer" className="underline font-semibold">{publicUrl}</a>
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        <button onClick={onBack} className="rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-sm">
          Back
        </button>
      </div>
    </div>
  );
};

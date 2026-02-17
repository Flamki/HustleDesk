import React from 'react';
import { Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Pricing: React.FC = () => {
  return (
    <section id="pricing" className="py-24 bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Invest in your career.
          </h2>
          <p className="text-lg text-slate-400">
            Start for free. Upgrade when you start winning more clients.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 flex flex-col">
                <div className="mb-4">
                    <span className="px-3 py-1 rounded-full bg-slate-700 text-sm font-medium text-slate-300">Starter</span>
                </div>
                <div className="mb-6">
                    <span className="text-4xl font-bold">Free</span>
                    <span className="text-slate-400"> / forever</span>
                </div>
                <p className="text-slate-400 mb-8">Perfect for getting organized and landing your first few gigs.</p>
                <div className="space-y-4 mb-8 flex-1">
                    <div className="flex items-start gap-3">
                        <Check className="text-indigo-400 mt-1" size={18} />
                        <span>Track up to 10 Active Jobs</span>
                    </div>
                    <div className="flex items-start gap-3">
                        <Check className="text-indigo-400 mt-1" size={18} />
                        <span>5 AI Generations/month</span>
                    </div>
                    {/* Visual cues for missing features compared to Pro */}
                    <div className="flex items-start gap-3 text-slate-500">
                        <X className="mt-1" size={18} />
                        <span>No Follow-up Reminders</span>
                    </div>
                    <div className="flex items-start gap-3 text-slate-500">
                        <X className="mt-1" size={18} />
                        <span>No Analytics</span>
                    </div>
                </div>
                <Link to="/signup" className="w-full py-4 rounded-xl bg-slate-700 hover:bg-slate-600 transition-colors font-semibold text-center">
                    Get Started Free
                </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-indigo-600 rounded-3xl p-8 border border-indigo-500 shadow-2xl relative overflow-hidden flex flex-col">
                <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">POPULAR</div>
                <div className="mb-4">
                    <span className="px-3 py-1 rounded-full bg-indigo-500 text-sm font-medium text-white">Pro</span>
                </div>
                <div className="mb-6">
                    <span className="text-4xl font-bold">$9</span>
                    <span className="text-indigo-200"> / month</span>
                </div>
                <p className="text-indigo-100 mb-8">For serious freelancers who want to scale their income.</p>
                <div className="space-y-4 mb-8 flex-1 text-white">
                    <div className="flex items-start gap-3">
                        <Check className="text-white mt-1" size={18} />
                        <span>Unlimited Job Tracking</span>
                    </div>
                    <div className="flex items-start gap-3">
                        <Check className="text-white mt-1" size={18} />
                        <span>Unlimited AI Proposals</span>
                    </div>
                    <div className="flex items-start gap-3">
                        <Check className="text-white mt-1" size={18} />
                        <span>Analytics Dashboard</span>
                    </div>
                    <div className="flex items-start gap-3">
                        <Check className="text-white mt-1" size={18} />
                        <span>Follow-up Reminders</span>
                    </div>
                </div>
                <Link to="/signup" className="w-full py-4 rounded-xl bg-white text-indigo-600 hover:bg-indigo-50 transition-colors font-bold text-center">
                    Start Pro Trial
                </Link>
            </div>
        </div>
      </div>
    </section>
  );
};
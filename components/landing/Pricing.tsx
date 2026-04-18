import React from 'react';
import { Check, ShieldCheck, Sparkles, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Pricing: React.FC = () => {
  const proCheckoutReturnTo = encodeURIComponent('/app/settings?tab=billing&action=checkout&source=landing_pricing');
  const proLoginPath = `/login?returnTo=${proCheckoutReturnTo}`;
  const proSignupPath = `/signup?returnTo=${proCheckoutReturnTo}`;
  const freeSignupPath = `/signup?returnTo=${encodeURIComponent('/app/dashboard?source=landing_free')}`;

  return (
    <section id="pricing" className="py-24 bg-slate-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Pick your plan in under 60 seconds.</h2>
          <p className="text-lg text-slate-400">
            Clear pricing, secure checkout, and instant plan activation after payment.
          </p>
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/15 text-sm">
            <ShieldCheck size={16} className="text-emerald-300" />
            Secure Razorpay checkout opens right after login
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="bg-slate-800 rounded-3xl p-8 border border-slate-700 flex flex-col">
            <div className="mb-4">
              <span className="px-3 py-1 rounded-full bg-slate-700 text-sm font-medium text-slate-300">Starter</span>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold">Free</span>
              <span className="text-slate-400"> / forever</span>
            </div>
            <p className="text-slate-400 mb-8">Great for early freelancers building pipeline discipline.</p>
            <div className="space-y-4 mb-8 flex-1">
              <div className="flex items-start gap-3">
                <Check className="text-indigo-400 mt-1" size={18} />
                <span>Track up to 10 active jobs</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="text-indigo-400 mt-1" size={18} />
                <span>5 AI generations per month</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="text-indigo-400 mt-1" size={18} />
                <span>5 follow-up reminders per month</span>
              </div>
              <div className="flex items-start gap-3 text-slate-500">
                <X className="mt-1" size={18} />
                <span>No analytics dashboard</span>
              </div>
            </div>
            <Link
              to={freeSignupPath}
              className="w-full py-4 rounded-xl bg-slate-700 hover:bg-slate-600 transition-colors font-semibold text-center"
            >
              Get Started Free
            </Link>
          </div>

          <div className="bg-indigo-600 rounded-3xl p-8 border border-indigo-500 shadow-2xl relative overflow-hidden flex flex-col">
            <div className="absolute top-0 right-0 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg">
              POPULAR
            </div>
            <div className="mb-4">
              <span className="px-3 py-1 rounded-full bg-indigo-500 text-sm font-medium text-white">Pro</span>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold">$9</span>
              <span className="text-indigo-200"> / month</span>
              <p className="text-sm text-indigo-100 mt-2">Win one extra project and this plan pays for itself.</p>
            </div>
            <p className="text-indigo-100 mb-8">For freelancers serious about consistent client wins and follow-ups.</p>
            <div className="space-y-4 mb-8 flex-1 text-white">
              <div className="flex items-start gap-3">
                <Check className="text-white mt-1" size={18} />
                <span>Unlimited job tracking</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="text-white mt-1" size={18} />
                <span>Unlimited AI proposals</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="text-white mt-1" size={18} />
                <span>Analytics dashboard</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="text-white mt-1" size={18} />
                <span>Smart follow-up reminders</span>
              </div>
            </div>
            <div className="space-y-3">
              <Link
                to={proLoginPath}
                className="w-full py-4 rounded-xl bg-white text-indigo-600 hover:bg-indigo-50 transition-colors font-bold text-center flex items-center justify-center gap-2"
              >
                <Sparkles size={18} />
                Start Pro Checkout
              </Link>
              <Link
                to={proSignupPath}
                className="w-full py-3 rounded-xl bg-indigo-500/60 border border-indigo-400/40 hover:bg-indigo-500/80 transition-colors font-semibold text-center"
              >
                New here? Create account + checkout
              </Link>
              <p className="text-xs text-indigo-100/90 text-center">No hidden fees. Cancel anytime from Billing.</p>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-8 grid md:grid-cols-3 gap-3 text-sm">
          <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center">
            Instant upgrade after successful payment
          </div>
          <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center">
            Cards, UPI, and netbanking support
          </div>
          <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center">
            Secure webhook confirmation enabled
          </div>
        </div>

        <div className="max-w-4xl mx-auto mt-4">
          <p className="text-center text-xs text-slate-400">
            Login first if prompted. We return you to Billing and open checkout automatically.
          </p>
        </div>
      </div>
    </section>
  );
};

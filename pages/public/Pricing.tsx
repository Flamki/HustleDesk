import React, { useState } from 'react';
import { Check, X, Sparkles, Zap, Rocket, Building2 } from 'lucide-react';
import { PublicPageLayout } from './PublicPageLayout';
import { SEO } from '../../components/SEO';
import { PRICING_PLANS, formatPrice, calculateYearlySavings, getLimitDisplayText } from '../../constants/pricing';

export const Pricing: React.FC = () => {
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'yearly'>('monthly');

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'free':
        return Sparkles;
      case 'starter':
        return Zap;
      case 'pro':
        return Rocket;
      case 'enterprise':
        return Building2;
      default:
        return Sparkles;
    }
  };

  return (
    <PublicPageLayout>
      <SEO
        title="Pricing - HustleDesk"
        description="Simple HustleDesk pricing for freelancers. Start free, then upgrade when you need advanced operations, billing, and automation."
        path="/pricing"
      />
      
      <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        {/* Header */}
        <div className="max-w-7xl mx-auto px-6 py-16 text-center">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 dark:text-white mb-6">
            Straightforward Pricing
          </h1>
          <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto mb-8">
            Start free, then upgrade when you need advanced operations, billing, and automation.
            No hidden fees or surprises.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-3 p-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-6 py-2 rounded-lg font-bold transition-all ${
                billingInterval === 'monthly'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingInterval('yearly')}
              className={`px-6 py-2 rounded-lg font-bold transition-all relative ${
                billingInterval === 'yearly'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-md'
                  : 'text-slate-600 dark:text-slate-400'
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="max-w-7xl mx-auto px-6 pb-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {PRICING_PLANS.map((plan) => {
              const Icon = getPlanIcon(plan.id);
              const price = plan.price[billingInterval];
              const savings = billingInterval === 'yearly' ? calculateYearlySavings(plan) : 0;
              
              return (
                <div
                  key={plan.id}
                  className={`relative bg-white dark:bg-slate-900 rounded-2xl border-2 transition-all ${
                    plan.popular
                      ? 'border-indigo-600 shadow-xl scale-105 z-10'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-600 text-white text-sm font-bold rounded-full">
                      Most Popular
                    </div>
                  )}

                  <div className="p-6">
                    {/* Icon */}
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${
                      plan.id === 'free' ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400' :
                      plan.id === 'starter' ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' :
                      plan.id === 'pro' ? 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' :
                      'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400'
                    }`}>
                      <Icon size={24} />
                    </div>

                    {/* Plan Name */}
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                      {plan.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-6">
                      {plan.description}
                    </p>

                    {/* Price */}
                    <div className="mb-6">
                      {price === 0 ? (
                        <div className="text-4xl font-bold text-slate-900 dark:text-white">
                          Free
                        </div>
                      ) : (
                        <>
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-slate-900 dark:text-white">
                              {formatPrice(price)}
                            </span>
                            <span className="text-slate-600 dark:text-slate-400">
                              /{billingInterval === 'monthly' ? 'mo' : 'yr'}
                            </span>
                          </div>
                          {savings > 0 && (
                            <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                              Save {formatPrice(savings)} per year
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    {/* CTA Button */}
                    <a
                      href={plan.id === 'free' ? '/signup' : '/app/settings?tab=billing'}
                      className={`block w-full py-3 px-4 rounded-xl font-bold text-center transition-all mb-6 ${
                        plan.popular
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20'
                          : plan.id === 'free'
                          ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-900 dark:text-white'
                          : 'bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900'
                      }`}
                    >
                      {plan.id === 'free' ? 'Get Started' : plan.id === 'enterprise' ? 'Contact Sales' : 'Start Trial'}
                    </a>

                    {/* Key Features */}
                    <div className="space-y-3 text-sm">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300">
                          {getLimitDisplayText(plan.features.jobs)} jobs
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300">
                          {getLimitDisplayText(plan.features.clients)} clients
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        <span className="text-slate-700 dark:text-slate-300">
                          {getLimitDisplayText(plan.features.aiCredits)} AI credits/mo
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {plan.features.aiProposalGeneration ? (
                          <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-slate-400 dark:text-slate-600 flex-shrink-0" />
                        )}
                        <span className={plan.features.aiProposalGeneration ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-600'}>
                          AI proposal generation
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {plan.features.clientPortal ? (
                          <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-slate-400 dark:text-slate-600 flex-shrink-0" />
                        )}
                        <span className={plan.features.clientPortal ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-600'}>
                          Client portal
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {plan.features.analytics ? (
                          <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-slate-400 dark:text-slate-600 flex-shrink-0" />
                        )}
                        <span className={plan.features.analytics ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-600'}>
                          Analytics dashboard
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {plan.features.prioritySupport ? (
                          <Check className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                        ) : (
                          <X className="w-4 h-4 text-slate-400 dark:text-slate-600 flex-shrink-0" />
                        )}
                        <span className={plan.features.prioritySupport ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400 dark:text-slate-600'}>
                          Priority support
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto px-6 pb-24">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 text-center">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">
                Can I switch plans at any time?
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately,
                and we'll prorate any charges or credits.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">
                What payment methods do you accept?
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                We accept all major credit cards through Stripe, including Visa, Mastercard, American Express, and more.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">
                Is there a free trial?
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                Yes! All paid plans come with a 14-day free trial. No credit card required to start.
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-xl p-6 border border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white mb-2">
                What happens if I exceed my plan limits?
              </h3>
              <p className="text-slate-600 dark:text-slate-300">
                You'll be prompted to upgrade your plan. We'll never charge you unexpectedly or lock you out
                of your data. You can always downgrade if needed.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicPageLayout>
  );
};

export default Pricing;

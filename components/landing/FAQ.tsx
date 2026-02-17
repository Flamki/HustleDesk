import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const FAQS = [
  {
    q: "Does HustleDesk apply to jobs for me?",
    a: "No. HustleDesk helps you manage your applications and generates proposals, but you stay in control and hit send yourself to avoid getting banned by platforms like Upwork. We provide the system, you execute the action."
  },
  {
    q: "Is it really free?",
    a: "Yes! The Starter plan is free forever and includes enough features to manage a small pipeline of jobs. As you grow, you can upgrade to Pro for unlimited access."
  },
  {
    q: "Can I use it for Upwork and Fiverr?",
    a: "Absolutely. HustleDesk is platform-agnostic. You can manually add jobs from Upwork, Fiverr, Freelancer, LinkedIn, or direct clients."
  },
  {
    q: "How does the AI Proposal Generator work?",
    a: "You paste the job description and your skills into HustleDesk. Our AI analyzes the client's needs and drafts a professional, persuasive cover letter that you can tweak and send."
  }
];

export const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-24 bg-slate-50 dark:bg-slate-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white mb-12">
          Frequently Asked Questions
        </h2>
        
        <div className="space-y-4">
          {FAQS.map((faq, idx) => (
            <div 
              key={idx}
              className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-all duration-300"
            >
              <button
                onClick={() => setOpenIndex(openIndex === idx ? null : idx)}
                className="w-full px-6 py-4 flex items-center justify-between text-left focus:outline-none"
              >
                <span className="font-semibold text-slate-900 dark:text-white">{faq.q}</span>
                {openIndex === idx ? (
                  <ChevronUp className="text-indigo-600 dark:text-indigo-400" size={20} />
                ) : (
                  <ChevronDown className="text-slate-400 dark:text-slate-500" size={20} />
                )}
              </button>
              
              <div 
                className={`px-6 transition-all duration-300 ease-in-out ${
                  openIndex === idx ? 'max-h-48 opacity-100 pb-6' : 'max-h-0 opacity-0'
                }`}
              >
                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

import React from 'react';

const LOGOS = [
  "Acme Corp", "Quantum", "Echo", "Nebula", "Vertex", "Horizon"
];

export const LogoCloud: React.FC = () => {
  return (
    <section className="py-12 border-y border-slate-100 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-sm font-semibold text-slate-500 uppercase tracking-wider mb-8">
          Trusted by high-growth teams at
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 items-center opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
           {LOGOS.map((logo, i) => (
             <div key={i} className="flex justify-center">
               <span className="text-xl font-bold text-slate-800">{logo}</span>
             </div>
           ))}
        </div>
      </div>
    </section>
  );
};
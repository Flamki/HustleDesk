import React from 'react';
import { BrandLogo } from '../brand/BrandLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
             <div className="flex items-center gap-2 text-white group cursor-default">
                <BrandLogo className="h-8 w-auto" tone="inverse" />
             </div>
             <p className="text-sm">
               The operating system for modern high-performance teams.
             </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/#features" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="/proposal-generator" className="hover:text-white transition-colors">AI Proposals</a></li>
              <li><a href="/#pricing" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="/time-tracking" className="hover:text-white transition-colors">Time Tracking</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/freelancer-crm" className="hover:text-white transition-colors">About Product</a></li>
              <li><a href="/client-portal" className="hover:text-white transition-colors">Client Portal</a></li>
              <li><a href="/features" className="hover:text-white transition-colors">Capabilities</a></li>
              <li><a href="/#faq" className="hover:text-white transition-colors">Contact & FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/#faq" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="/#faq" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="/#faq" className="hover:text-white transition-colors">Security</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">© 2024 GetSoloDesk Inc. All rights reserved.</p>
          <div className="flex gap-4">
            {/* Social icons placeholders */}
            <div className="w-5 h-5 bg-slate-800 rounded hover:bg-slate-700 cursor-pointer transition-colors"></div>
            <div className="w-5 h-5 bg-slate-800 rounded hover:bg-slate-700 cursor-pointer transition-colors"></div>
            <div className="w-5 h-5 bg-slate-800 rounded hover:bg-slate-700 cursor-pointer transition-colors"></div>
          </div>
        </div>
      </div>
    </footer>
  );
};

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
              <li><a href="/time-tracking" className="hover:text-white transition-colors">Time Tracking</a></li>
              <li><a href="/invoice-generator" className="hover:text-white transition-colors">Invoicing</a></li>
              <li><a href="/contract-builder" className="hover:text-white transition-colors">Contracts</a></li>
              <li><a href="/templates" className="hover:text-white transition-colors">Templates</a></li>
              <li><a href="/#pricing" className="hover:text-white transition-colors">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Resources</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="/blog" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="/freelancer-crm" className="hover:text-white transition-colors">About Product</a></li>
              <li><a href="/features" className="hover:text-white transition-colors">All Features</a></li>
              <li><a href="/#faq" className="hover:text-white transition-colors">FAQ</a></li>
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
          <p className="text-sm">© 2026 GetSoloDesk Inc. All rights reserved.</p>
          <div className="flex gap-3">
            <a href="https://x.com/Getsolodesk" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-slate-800 rounded-lg hover:bg-slate-700 cursor-pointer transition-colors flex items-center justify-center text-slate-400 hover:text-white" aria-label="X (Twitter)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
            </a>
            <a href="https://www.linkedin.com/in/ayush-s-singh/" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-slate-800 rounded-lg hover:bg-slate-700 cursor-pointer transition-colors flex items-center justify-center text-slate-400 hover:text-white" aria-label="LinkedIn">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
            </a>
            <a href="https://www.producthunt.com/products/getsolodesk" target="_blank" rel="noopener noreferrer" className="w-8 h-8 bg-slate-800 rounded-lg hover:bg-slate-700 cursor-pointer transition-colors flex items-center justify-center text-slate-400 hover:text-white" aria-label="Product Hunt">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M13.604 8.4h-3.405V12h3.405a1.8 1.8 0 100-3.6zM12 0C5.372 0 0 5.372 0 12s5.372 12 12 12 12-5.372 12-12S18.628 0 12 0zm1.604 14.4h-3.405V18H7.801V6h5.804a4.2 4.2 0 010 8.4z"/></svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

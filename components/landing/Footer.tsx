import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div className="space-y-4">
             <div className="flex items-center gap-2 text-white group cursor-default">
                <div className="bg-indigo-600 p-1.5 rounded-lg shadow-lg shadow-indigo-500/20">
                     <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M7 4V20" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                        <path d="M17 4V20" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                        <path d="M7 12H17" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                        <path d="M21 4L17 4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-50"/>
                        <path d="M7 20L3 20" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-50"/>
                    </svg>
                </div>
                <span className="text-xl font-bold">HustleDesk</span>
             </div>
             <p className="text-sm">
               The operating system for modern high-performance teams.
             </p>
          </div>
          
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Changelog</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm">© 2024 HustleDesk Inc. All rights reserved.</p>
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
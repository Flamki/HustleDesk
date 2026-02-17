import React, { useState } from 'react';
import { DollarSign, Send, Clock, Sparkles } from 'lucide-react';

export const RoiCalculator: React.FC = () => {
  const [hourlyRate, setHourlyRate] = useState(65);
  const [proposalsPerWeek, setProposalsPerWeek] = useState(10);
  const [timePerProposal, setTimePerProposal] = useState(30);

  // Calculation Logic
  // Manual: proposals * time per proposal
  // AI: proposals * 5 minutes (generation + quick edit)
  
  const manualMinutesPerWeek = proposalsPerWeek * timePerProposal;
  const aiMinutesPerWeek = proposalsPerWeek * 5; 
  
  const hoursSavedPerWeek = (manualMinutesPerWeek - aiMinutesPerWeek) / 60;
  const hoursReclaimedPerYear = Math.round(hoursSavedPerWeek * 52);
  
  // Value of time saved = potential billable hours recovered
  const moneySavedPerYear = Math.round(hoursSavedPerWeek * hourlyRate * 52);

  return (
    <section id="roi" className="py-24 bg-white dark:bg-slate-950 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          <div className="space-y-8">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white">
              What is manual work <br/>
              <span className="text-indigo-600 dark:text-indigo-400">costing you?</span>
            </h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">
              Calculate the value of the time you spend writing proposals instead of doing billable work.
            </p>
            
            <div className="space-y-8 pt-4">
              {/* Hourly Rate */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                    <DollarSign size={18} className="text-indigo-500"/>
                    Your Hourly Rate
                  </label>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">${hourlyRate}</span>
                </div>
                <input 
                  type="range" 
                  min="20" 
                  max="300" 
                  step="5"
                  value={hourlyRate} 
                  onChange={(e) => setHourlyRate(Number(e.target.value))}
                  className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Proposals Per Week */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                    <Send size={18} className="text-indigo-500"/>
                    Proposals Sent / Week
                  </label>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{proposalsPerWeek}</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="50" 
                  value={proposalsPerWeek} 
                  onChange={(e) => setProposalsPerWeek(Number(e.target.value))}
                  className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>

              {/* Time Per Proposal */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <label className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                    <Clock size={18} className="text-indigo-500"/>
                    Avg. Minutes / Proposal
                  </label>
                  <span className="text-2xl font-bold text-slate-900 dark:text-white">{timePerProposal}m</span>
                </div>
                <input 
                  type="range" 
                  min="10" 
                  max="120" 
                  step="5"
                  value={timePerProposal} 
                  onChange={(e) => setTimePerProposal(Number(e.target.value))}
                  className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
                <p className="text-xs text-slate-500 dark:text-slate-500 flex items-center gap-1">
                    <Sparkles size={12} />
                    HustleDesk reduces this to ~5 mins
                </p>
              </div>
            </div>
          </div>

          {/* Results Card */}
          <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
             {/* Decorative blob */}
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-overlay filter blur-3xl opacity-20"></div>
             
             <div className="relative z-10 flex flex-col items-center justify-center text-center h-full space-y-8">
                <div>
                   <p className="text-slate-400 font-medium mb-2 uppercase tracking-wide">Value of Time Saved</p>
                   <div className="text-5xl sm:text-7xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-300 to-white">
                      ${moneySavedPerYear.toLocaleString()}
                   </div>
                   <p className="text-sm text-slate-500 mt-2">per year</p>
                </div>
                
                <div className="w-full border-t border-slate-700/50"></div>
                
                <div className="grid grid-cols-2 gap-8 w-full">
                    <div>
                        <p className="text-slate-400 font-medium mb-1 text-xs uppercase tracking-wide">Hours Reclaimed</p>
                        <div className="text-3xl font-bold text-white">
                            {hoursReclaimedPerYear.toLocaleString()}
                        </div>
                    </div>
                    <div>
                         <p className="text-slate-400 font-medium mb-1 text-xs uppercase tracking-wide">More Proposals</p>
                         <div className="text-3xl font-bold text-indigo-400">
                             {Math.floor((hoursSavedPerWeek * 52) / (5/60)).toLocaleString()}
                         </div>
                    </div>
                </div>

                <button className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold hover:bg-indigo-50 transition-colors">
                    Reclaim Your Time
                </button>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};
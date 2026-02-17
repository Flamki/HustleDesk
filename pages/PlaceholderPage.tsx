import React from 'react';
import { Construction } from 'lucide-react';

interface PlaceholderPageProps {
    title: string;
}

export const PlaceholderPage: React.FC<PlaceholderPageProps> = ({ title }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 animate-in fade-in zoom-in duration-500">
            <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6">
                <Construction size={40} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">{title}</h1>
            <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                This feature is currently under construction. <br />
                We're working hard to bring you the best experience!
            </p>
            <div className="mt-8 flex gap-2">
                <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 animate-bounce delay-100"></div>
                <div className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700 animate-bounce delay-200"></div>
            </div>
        </div>
    );
};
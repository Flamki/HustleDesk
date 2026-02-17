
import React from 'react';
import { ProfileAssistant } from '../components/profile/ProfileAssistant';

export const ProfilePage: React.FC = () => {
    return (
        <div className="h-full flex flex-col">
            <div className="mb-6 flex-shrink-0">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">AI Profile Assistant</h1>
                <p className="text-slate-500 dark:text-slate-400 mt-1">
                    Chat with your assistant to build a professional profile that wins clients.
                </p>
            </div>
            <div className="flex-1 min-h-0">
                <ProfileAssistant />
            </div>
        </div>
    );
};

import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { AddJobForm } from '../components/jobs/AddJobForm';

export const AddJobPage: React.FC = () => {
  return (
    <div className="max-w-3xl mx-auto">
        <div className="mb-6">
            <Link to="/app/jobs" className="inline-flex items-center text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white mb-4 transition-colors">
                <ChevronLeft size={16} className="mr-1" />
                Back to Jobs
            </Link>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Add New Job</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
                Paste the job details to start tracking and generate a proposal.
            </p>
        </div>

        <AddJobForm />
    </div>
  );
};
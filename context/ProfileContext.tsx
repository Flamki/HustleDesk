
import React, { createContext, useContext, useState, useEffect } from 'react';
import { FreelancerProfile } from '../types';
import * as authService from '../services/supabaseService';
import { useAuth } from './AuthContext';

export interface ProfileStep {
    id: string;
    label: string;
    isComplete: boolean;
    path: string;
}

interface ProfileContextType {
  profile: FreelancerProfile | null;
  loading: boolean;
  updateProfile: (profile: FreelancerProfile) => Promise<void>;
  refreshProfile: () => Promise<void>;
  profileScore: number;
  onboardingSteps: ProfileStep[];
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

const INITIAL_PROFILE: FreelancerProfile = {
    id: 'draft',
    userId: '',
    skills: [],
    experienceLevel: 'Entry',
    yearsExperience: 0,
    bio: '',
    hourlyRate: 0,
    pastProjects: [],
    communicationStyle: 'Professional',
    completedOnboarding: false,
    preferences: {
        defaultTone: 'professional',
        defaultLength: 'standard'
    },
    notificationSettings: {
        emailFollowUp: true,
        emailReplies: true,
        emailWeeklyStats: true
    }
};

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileScore, setProfileScore] = useState(0);
  const [onboardingSteps, setOnboardingSteps] = useState<ProfileStep[]>([]);

  const fetchProfile = async () => {
    if (!user) return;
    try {
        const { data } = await authService.getProfile();
        if (data) {
            // Ensure new fields exist on old data
            const mergedProfile = { 
                ...INITIAL_PROFILE, 
                ...data,
                preferences: { ...INITIAL_PROFILE.preferences, ...data.preferences },
                notificationSettings: { ...INITIAL_PROFILE.notificationSettings, ...data.notificationSettings }
            };
            setProfile(mergedProfile);
        } else {
            // Set initial empty profile if none exists
            setProfile({ ...INITIAL_PROFILE, userId: user.id });
        }
    } catch (err) {
        console.error("Failed to load profile", err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
        fetchProfile();
    } else {
        setProfile(null);
    }
  }, [user]);

  // Calculate Profile Score
  useEffect(() => {
    if (profile) {
        const steps: ProfileStep[] = [
            { id: 'skills', label: 'Add skills', isComplete: profile.skills.length > 0, path: '/app/profile' },
            { id: 'portfolio', label: 'Add portfolio link', isComplete: !!profile.portfolioUrl, path: '/app/profile' },
            { id: 'projects', label: 'Add 2 projects', isComplete: profile.pastProjects.length >= 2, path: '/app/profile' },
            { id: 'rate', label: 'Set hourly rate', isComplete: profile.hourlyRate > 0, path: '/app/profile' },
            { id: 'bio', label: 'Complete bio', isComplete: (profile.bio?.length || 0) > 20, path: '/app/profile' },
        ];
        
        const completed = steps.filter(s => s.isComplete).length;
        const score = Math.round((completed / steps.length) * 100);
        
        setProfileScore(score);
        setOnboardingSteps(steps);
    }
  }, [profile]);

  const updateProfile = async (newProfile: FreelancerProfile) => {
      setProfile(newProfile);
      await authService.updateProfile(newProfile);
  };

  return (
    <ProfileContext.Provider value={{ profile, loading, updateProfile, refreshProfile: fetchProfile, profileScore, onboardingSteps }}>
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

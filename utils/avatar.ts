export const getUserAvatarUrl = (profile: any, user: any) => {
  const seed = profile?.userId || user?.id || user?.email || 'default-seed';
  const gender = profile?.preferences?.profileSetup?.gender || 'female';
  
  // Using distinct Dicebear 7.x styles that naturally avoid religious identifiers 
  // and inherently map better to the requested gender aesthetics without causing 400 errors.
  let style = 'lorelei'; // Default female-leaning aesthetic
  
  if (gender === 'male') {
    style = 'adventurer'; // Male-leaning aesthetic
  } else if (gender === 'non_binary' || gender === 'prefer_not_to_say') {
    style = 'notionists'; // Minimalist gender-neutral aesthetic
  }

  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf`;
};

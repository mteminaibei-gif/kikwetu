export type Comment = {
  id: string;
  body: string;
  author: {
    name: string;
    initials: string;
    verified: boolean;
  };
  upvotes: number;
  isAccepted: boolean;
  timeAgo: string;
  badges?: ('best' | 'helpful' | 'clear')[];
  isAIRecommended?: boolean;
  isGuest?: boolean;
};

export const AI_COMMENT_MODERATION = {
  analyzeComment: (text: string): { score: number; suggestions: string[] } => {
    const words = text.toLowerCase().trim().split(' ');
    const wordCount = words.length;
    const hasStructure = text.includes('.') || text.includes('\u2022') || text.includes('-');
    const hasSpecifics = words.some(w => ['steps', 'because', 'example', 'specifically', 'technique'].includes(w));
    const hasEngagement = words.some(w => ['please', 'help', 'guide', 'explain', 'can'].includes(w));

    const score = Math.min(100, (wordCount * 3) + (hasStructure ? 20 : 0) + (hasSpecifics ? 15 : 0) + (hasEngagement ? 10 : 0));

    const suggestions: string[] = [];
    if (!hasStructure) suggestions.push('Add punctuation to improve structure');
    if (!hasSpecifics) suggestions.push('Include specific examples or details');
    if (!hasEngagement) suggestions.push('Make it more engaging with clear language');

    return { score, suggestions };
  },
  filterAnswers: (comments: Comment[]): Comment[] => {
    return comments
      .filter(c => !c.isAIRecommended)
      .sort((a, b) => b.upvotes - a.upvotes)
      .slice(0, 3)
      .map(comment => ({ ...comment, isAIRecommended: true as const }));
  },
  awardBadges: (comment: Comment): Comment => {
    const badges: ('best' | 'helpful' | 'clear')[] = [];
    if (comment.upvotes >= 10) badges.push('best');
    if (comment.isAccepted || comment.upvotes >= 5) badges.push('helpful');
    if (comment.body.includes('.') && !comment.body.includes('...')) badges.push('clear');
    return { ...comment, badges };
  },
  getGuestReviews: (): Comment[] => [
    { id: 'guest-1', body: 'Excellent explanation! This really helped me understand the farming techniques.', author: { name: 'Amina Hassan', initials: 'AH', verified: true }, upvotes: 42, isAccepted: false, timeAgo: '2h ago', isGuest: true },
    { id: 'guest-2', body: 'Very detailed analysis. I can see the pattern now. Thank you for sharing your expertise!', author: { name: 'James Otieno', initials: 'JO', verified: true }, upvotes: 28, isAccepted: false, timeAgo: '4h ago', isGuest: true },
    { id: 'guest-3', body: 'Clear structure, great examples. Will apply this to my project. Appreciate the help!', author: { name: 'Wangui Mbithe', initials: 'WM', verified: false }, upvotes: 21, isAccepted: false, timeAgo: '6h ago', isGuest: true },
    { id: 'guest-4', body: 'Perfect timing! I was stuck on this exact issue. Your solution is exactly what I needed.', author: { name: 'David Kinuthia', initials: 'DK', verified: true }, upvotes: 19, isAccepted: false, timeAgo: '8h ago', isGuest: true },
    { id: 'guest-5', body: 'Very practical advice. Applied it and saved 3 hours of trial and error. Thanks!', author: { name: 'Esther Kimani', initials: 'EK', verified: false }, upvotes: 16, isAccepted: false, timeAgo: '10h ago', isGuest: true },
  ],
};
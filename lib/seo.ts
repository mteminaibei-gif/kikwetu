import type { Metadata } from 'next';

const baseUrl = 'https://kikwetuconnect.com';

export function getPageMetadata(path: string): Metadata {
  const titles: Record<string, string> = {
    '/': 'KikwetuConnect - Kenya in Conversation',
    '/baraza': 'Baraza Feed - Community Discussions | KikwetuConnect',
    '/explore': 'Explore Topics, People & Spaces | KikwetuConnect',
    '/spaces': 'Community Spaces | KikwetuConnect',
    '/students': 'Students Area - Learn from Experts | KikwetuConnect',
    '/professionals': 'Approved Professionals | KikwetuConnect',
    '/messages': 'Messages | KikwetuConnect',
    '/wallet': 'Wallet & Tips | KikwetuConnect',
    '/mtaa': 'Mtaa Exchange - Buy & Sell Locally | KikwetuConnect',
    '/nyumba-kumi': 'Nyumba Kumi - Neighbourhood Safety | KikwetuConnect',
    '/radio': 'Live Radio - Kenyan Stations | KikwetuConnect',
    '/quizzes': 'Quizzes & Learning | KikwetuConnect',
    '/profile': 'My Profile | KikwetuConnect',
    '/settings': 'Settings | KikwetuConnect',
    '/admin': 'Admin Dashboard | KikwetuConnect',
    '/thread': 'Discussion Thread | KikwetuConnect',
    '/onboarding': 'Welcome to KikwetuConnect',
    '/login': 'Sign In | KikwetuConnect',
    '/signup': 'Create Account | KikwetuConnect',
    '/landing': 'KikwetuConnect - Our Knowledge, Our Stories, Our Future',
    '/about': 'About KikwetuConnect | Our Mission',
    '/contact': 'Contact Us | KikwetuConnect',
    '/terms': 'Terms of Service | KikwetuConnect',
    '/privacy': 'Privacy Policy | KikwetuConnect',
    '/events': 'Events & Meetups | KikwetuConnect',
  };

  const descriptions: Record<string, string> = {
    '/': 'Kenya in conversation. Ask questions, share local knowledge, connect with professionals, and build community across all 47 counties.',
    '/baraza': 'Join community discussions, ask questions, share posts, polls, and audio notes with Kenyans across all 47 counties.',
    '/explore': 'Discover trending topics, professionals, spaces, and people across Kenya on KikwetuConnect.',
    '/spaces': 'Join focused communities for agriculture, tech, health, culture, and more on KikwetuConnect.',
    '/students': 'Ask questions, find approved professionals, book sessions, and learn from real experts on KikwetuConnect.',
    '/professionals': 'Find verified professionals for private consultations, tutoring, and expert guidance on KikwetuConnect.',
    '/messages': 'Send messages, share files, and connect privately with professionals and community members.',
    '/wallet': 'Manage your wallet, send tips to professionals via M-Pesa, and track your transactions.',
    '/mtaa': 'Buy and sell locally on Mtaa Exchange. Find produce, services, crafts, and tools in your county.',
    '/nyumba-kumi': 'Stay safe with Nyumba Kumi. Get neighbourhood safety alerts, traffic updates, and community patrol info.',
    '/radio': 'Listen to 31+ Kenyan radio stations including Capital FM, Classic 105, Kiss FM, and county stations.',
    '/quizzes': 'Test your knowledge with quizzes on Kenyan culture, agriculture, tech, health, and more.',
    '/landing': 'KikwetuConnect brings local knowledge, trusted people, and useful community action into one place for all 47 Kenyan counties.',
    '/about': 'Learn about KikwetuConnect\'s mission to connect Kenya through local knowledge and community.',
    '/contact': 'Get in touch with the KikwetuConnect team.',
    '/terms': 'Read the Terms of Service for using KikwetuConnect.',
    '/privacy': 'Read the Privacy Policy for KikwetuConnect.',
  };

  const title = titles[path] || 'KikwetuConnect';
  const description = descriptions[path] || 'Kenya in conversation. Ask questions, share knowledge, and connect with your community.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${baseUrl}${path}`,
      siteName: 'KikwetuConnect',
      locale: 'en_KE',
      type: 'website',
      images: [{ url: '/og-image.png', width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/og-image.png'],
    },
    alternates: {
      canonical: `${baseUrl}${path}`,
    },
  };
}

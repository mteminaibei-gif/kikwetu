'use client';

import Link from 'next/link';
import { Heart, Target, Sparkles, Users, TrendingUp, Globe } from 'lucide-react';

export default function AboutPage() {
  const values = [
    { icon: Heart, title: 'Community First', description: 'We believe in the power of communities to create change' },
    { icon: Sparkles, title: 'Innovation', description: 'Continuous improvement and cutting-edge features' },
    { icon: Globe, title: 'Inclusivity', description: 'Everyone has a voice and deserves to be heard' },
    { icon: TrendingUp, title: 'Growth', description: 'Empowering individuals and businesses to achieve their potential' },
  ];

  const team = [
    { name: 'Samuel Kipchoge', role: 'Founder & CEO', avatar: 'https://i.pravatar.cc/150?img=1' },
    { name: 'Victoria Ochieng', role: 'Head of Community', avatar: 'https://i.pravatar.cc/150?img=15' },
    { name: 'James Mwaura', role: 'CTO', avatar: 'https://i.pravatar.cc/150?img=25' },
    { name: 'Amina Hassan', role: 'Product Lead', avatar: 'https://i.pravatar.cc/150?img=35' },
  ];

  return (
    <div className="min-h-screen bg-[#0f1419] text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 sticky top-0 z-50 bg-[#0f1419]/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold">
            <span className="text-3xl">🌾</span>
            <span>KikwetuConnect</span>
          </Link>
          <Link href="/" className="text-gray-400 hover:text-white transition">← Back Home</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">About KikwetuConnect</h1>
          <p className="text-xl text-gray-400">Connecting Kenya through community, conversation, and collaboration</p>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-3xl font-bold mb-6">Our Story</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              KikwetuConnect was born from a simple idea: Kenya needed a platform where communities could thrive, voices could be heard, and connections could be made across the entire nation.
            </p>
            <p className="text-gray-300 leading-relaxed mb-4">
              What started as a passion project in 2024 has grown into a vibrant ecosystem connecting farmers, tech entrepreneurs, healthcare professionals, business leaders, and cultural advocates from every corner of Kenya.
            </p>
            <p className="text-gray-300 leading-relaxed">
              Today, over 50,000 active users trust KikwetuConnect to share knowledge, host live debates, discover events, and build meaningful relationships that make a real difference in their lives and communities.
            </p>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#2d7c4a] to-[#4a9d63] rounded-2xl opacity-20 blur-3xl" />
            <img 
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=500&fit=crop"
              alt="Our team"
              className="relative rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="max-w-7xl mx-auto px-4 py-20 bg-gradient-to-r from-[#1a2e1f] to-[#1a1f26] rounded-2xl p-12 md:p-16">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <div className="w-12 h-12 bg-[#2d7c4a]/20 rounded-lg flex items-center justify-center mb-4">
              <Target className="w-6 h-6 text-[#4a9d63]" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
            <p className="text-gray-300 leading-relaxed">
              To empower Kenyans by creating a digital platform where diverse communities can connect, share knowledge, engage in meaningful discussions, and collectively drive positive change across agriculture, technology, health, business, and culture.
            </p>
          </div>

          <div>
            <div className="w-12 h-12 bg-[#d97e3a]/20 rounded-lg flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6 text-[#d97e3a]" />
            </div>
            <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
            <p className="text-gray-300 leading-relaxed">
              A Kenya where every person has a platform to be heard, every community has resources to thrive, and every individual has the opportunity to grow and contribute to the nation's prosperity through meaningful connections and collaborative action.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold mb-16 text-center">Our Core Values</h2>

        <div className="grid md:grid-cols-2 gap-8">
          {values.map((value, idx) => {
            const Icon = value.icon;
            return (
              <div
                key={idx}
                className="bg-[#1a1f26] border border-gray-800 rounded-xl p-8 hover:border-[#2d7c4a] transition"
              >
                <div className="w-12 h-12 bg-[#2d7c4a]/20 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-[#4a9d63]" />
                </div>
                <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                <p className="text-gray-400">{value.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Team Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold mb-16 text-center">Meet Our Team</h2>

        <div className="grid md:grid-cols-4 gap-8">
          {team.map((member, idx) => (
            <div key={idx} className="text-center">
              <img 
                src={member.avatar}
                alt={member.name}
                className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-[#2d7c4a] shadow-lg"
              />
              <h3 className="text-xl font-bold">{member.name}</h3>
              <p className="text-[#4a9d63] font-medium">{member.role}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="grid md:grid-cols-4 gap-8 bg-gradient-to-r from-[#2d7c4a]/10 to-[#4a9d63]/10 rounded-2xl border border-gray-800 p-12">
          <div className="text-center">
            <p className="text-4xl font-bold text-[#4a9d63] mb-2">50K+</p>
            <p className="text-gray-400">Active Users</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-[#4a9d63] mb-2">200+</p>
            <p className="text-gray-400">Communities</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-[#4a9d63] mb-2">1M+</p>
            <p className="text-gray-400">Daily Interactions</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-[#4a9d63] mb-2">16</p>
            <p className="text-gray-400">Counties Covered</p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-[#2d7c4a] to-[#4a9d63] rounded-2xl p-12 md:p-20 text-center">
          <h2 className="text-4xl font-bold mb-6">Join the Community</h2>
          <p className="text-xl text-white/90 mb-8">Be part of Kenya's largest community platform</p>
          
          <Link 
            href="/signup"
            className="inline-block bg-white text-[#2d7c4a] px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition"
          >
            Get Started Today
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>&copy; 2026 KikwetuConnect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

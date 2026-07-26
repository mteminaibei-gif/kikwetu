'use client';

import Link from 'next/link';
import { Sparkles, Users, Zap, MessageSquare, ArrowRight, Check } from 'lucide-react';

export default function LandingPage() {
  const features = [
    {
      icon: Users,
      title: 'Community Spaces',
      description: 'Join communities around agriculture, tech, health, business and more',
    },
    {
      icon: Zap,
      title: 'Live Baraza',
      description: 'Participate in live audio discussions and debates with your peers',
    },
    {
      icon: MessageSquare,
      title: 'Direct Messages',
      description: 'Connect one-on-one or in groups with seamless messaging',
    },
    {
      icon: Sparkles,
      title: 'Events & Meetups',
      description: 'Discover and join events happening in your community',
    },
  ];

  const stats = [
    { number: '50K+', label: 'Active Users' },
    { number: '200+', label: 'Spaces' },
    { number: '10K+', label: 'Daily Events' },
    { number: '15K+', label: 'Live Discussions' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1419] via-[#1a2e1f] to-[#0f1419] text-white">
      {/* Navigation */}
      <nav className="border-b border-gray-800 bg-[#0f1419]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-2xl font-bold hover:opacity-80 transition">
            <span className="text-3xl">🌾</span>
            <span>KikwetuConnect</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-gray-400 hover:text-white transition">Features</Link>
            <Link href="#about" className="text-gray-400 hover:text-white transition">About</Link>
            <Link href="/contact" className="text-gray-400 hover:text-white transition">Contact</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link 
              href="/login"
              className="text-gray-400 hover:text-white px-4 py-2 rounded-lg transition"
            >
              Log In
            </Link>
            <Link 
              href="/signup"
              className="bg-[#2d7c4a] hover:bg-[#4a9d63] text-white px-6 py-2 rounded-lg font-semibold transition shadow-md"
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#2d7c4a]/20 border border-[#2d7c4a]/40 rounded-full px-4 py-2 mb-6">
              <Sparkles className="w-4 h-4 text-[#4a9d63]" />
              <span className="text-sm font-medium text-[#4a9d63]">Welcome to Kenya's Largest Community Platform</span>
            </div>

            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
              Connect, Share,
              <span className="text-transparent bg-gradient-to-r from-[#2d7c4a] to-[#4a9d63] bg-clip-text"> Grow Together</span>
            </h1>

            <p className="text-xl text-gray-400 mb-8 leading-relaxed">
              KikwetuConnect is the platform where Kenyans come together. Share ideas in communities, join live discussions, discover events, and build meaningful connections across agriculture, technology, health, and business.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/signup"
                className="bg-[#2d7c4a] hover:bg-[#4a9d63] text-white px-8 py-4 rounded-lg font-bold transition shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
              >
                Start For Free
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="#features"
                className="border-2 border-[#2d7c4a] text-[#4a9d63] hover:bg-[#2d7c4a]/10 px-8 py-4 rounded-lg font-bold transition"
              >
                Learn More
              </Link>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-[#2d7c4a] to-[#4a9d63] rounded-2xl opacity-20 blur-3xl" />
            <img 
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=600&h=600&fit=crop"
              alt="Community"
              className="relative rounded-2xl shadow-2xl"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-12 border-y border-gray-800">
          {stats.map((stat, idx) => (
            <div key={idx} className="text-center">
              <p className="text-4xl font-bold text-[#4a9d63] mb-2">{stat.number}</p>
              <p className="text-gray-400">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">Powerful Features</h2>
          <p className="text-xl text-gray-400">Everything you need to connect and grow</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-20">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="bg-[#1a1f26] border border-gray-800 rounded-xl p-8 hover:border-gray-700 hover:shadow-lg transition"
              >
                <div className="w-12 h-12 bg-[#2d7c4a]/20 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-[#4a9d63]" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            );
          })}
        </div>

        {/* Spaces Section */}
        <div className="bg-gradient-to-r from-[#1a2e1f] to-[#1a1f26] border border-gray-800 rounded-2xl p-12">
          <h3 className="text-3xl font-bold mb-8 text-center">Explore Popular Spaces</h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🌾', name: 'KilimoSmart', desc: 'Agricultural innovation & farming techniques' },
              { icon: '💻', name: 'NairobiTech', desc: 'Startup ecosystem & tech development' },
              { icon: '🏥', name: 'Health KE', desc: 'Wellness & healthcare discussions' },
              { icon: '🚀', name: 'StartupKE', desc: 'Building & scaling businesses' },
              { icon: '🎤', name: 'Sheng Life', desc: 'Kenyan culture & lifestyle' },
              { icon: '⚖️', name: 'Legal Kenya', desc: 'Legal advice & rights awareness' },
            ].map((space, idx) => (
              <div key={idx} className="bg-[#0f1419] border border-gray-800 rounded-lg p-6 hover:border-[#2d7c4a] transition text-center">
                <p className="text-4xl mb-3">{space.icon}</p>
                <h4 className="font-bold text-lg mb-2">{space.name}</h4>
                <p className="text-sm text-gray-400">{space.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 py-20">
        <div className="bg-gradient-to-r from-[#2d7c4a] to-[#4a9d63] rounded-2xl p-12 md:p-20 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">Ready to Join the Community?</h2>
          <p className="text-xl text-white/90 mb-8">Connect with thousands of Kenyans and start your journey today</p>
          
          <Link 
            href="/signup"
            className="inline-block bg-white text-[#2d7c4a] px-8 py-4 rounded-lg font-bold hover:bg-gray-100 transition shadow-lg"
          >
            Get Started Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-[#0f1419] py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-2xl">🌾</span>
                <span className="font-bold text-lg">KikwetuConnect</span>
              </div>
              <p className="text-gray-500 text-sm">Connecting Kenya, one community at a time</p>
            </div>

            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/landing" className="hover:text-white transition">Home</Link></li>
                <li><Link href="/about" className="hover:text-white transition">About</Link></li>
                <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4">Connect</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition">Twitter</a></li>
                <li><a href="#" className="hover:text-white transition">LinkedIn</a></li>
                <li><a href="#" className="hover:text-white transition">Facebook</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 text-center text-gray-500 text-sm">
            <p>&copy; 2026 KikwetuConnect. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

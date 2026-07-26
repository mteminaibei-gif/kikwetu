'use client';

import React from 'react';
import Link from 'next/link';

interface OnboardingScreenProps {
  onGetStarted?: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onGetStarted }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-kikwetu-green via-kikwetu-brown to-kikwetu-orange flex flex-col items-center justify-center px-4 py-8">
      {/* Maasai Pattern Background Accent */}
      <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="maasai-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M0,0 L10,10 M10,0 L0,10" stroke="white" strokeWidth="0.5" />
              <circle cx="5" cy="5" r="1" fill="white" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#maasai-pattern)" />
        </svg>
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full max-w-md flex flex-col items-center text-center">
        {/* Logo */}
        <div className="mb-8 animate-bounce">
          <div className="w-20 h-20 bg-white bg-opacity-20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white border-opacity-30">
            <div className="text-5xl">🛡️</div>
          </div>
        </div>

        {/* Illustration Placeholder - Three Diverse Figures */}
        <div className="mb-8 w-full h-48 flex items-center justify-center relative">
          {/* Left Figure - Farmer */}
          <div className="absolute left-0 w-20 h-32 bg-gradient-to-b from-orange-300 to-orange-400 rounded-lg opacity-80 transform -rotate-12 flex items-end justify-center pb-2">
            <div className="text-4xl">👨‍🌾</div>
          </div>

          {/* Center Figure - Professional with Shield */}
          <div className="relative z-10 w-24 h-40 bg-gradient-to-b from-orange-400 to-orange-500 rounded-xl flex flex-col items-center justify-center gap-2 shadow-2xl">
            <div className="text-5xl">👨</div>
            <div className="w-12 h-12 bg-gradient-to-br from-kikwetu-green to-kikwetu-orange rounded-full flex items-center justify-center text-white text-lg font-bold border-2 border-white">
              ✓
            </div>
          </div>

          {/* Right Figure - Woman */}
          <div className="absolute right-0 w-20 h-32 bg-gradient-to-b from-orange-300 to-orange-400 rounded-lg opacity-80 transform rotate-12 flex items-end justify-center pb-2">
            <div className="text-4xl">👩‍💼</div>
          </div>
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
          KikwetuConnect
        </h1>

        {/* Tagline */}
        <p className="text-xl md:text-2xl text-white text-opacity-90 mb-2 font-medium">
          Our Knowledge, Our Stories
        </p>

        {/* Subheading */}
        <p className="text-base md:text-lg text-white text-opacity-80 mb-8">
          Where education meets community
        </p>

        {/* CTA Button */}
        <button
          onClick={onGetStarted}
          className="w-full bg-kikwetu-orange hover:bg-kikwetu-orange-light text-white font-bold py-3 px-6 rounded-full text-lg transition transform hover:scale-105 active:scale-95 shadow-lg mb-6"
        >
          Get Started
        </button>

        {/* Login Link */}
        <div className="flex items-center justify-center gap-2 text-white text-opacity-90">
          <span className="text-sm">Already have an account?</span>
          <Link href="/login" className="font-semibold hover:text-opacity-100 transition underline">
            Log in
          </Link>
        </div>
      </div>

      {/* Bottom Accent */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black from-0% to-transparent to-100% opacity-10 pointer-events-none" />

      {/* Language Selector (Future) */}
      <div className="absolute top-4 right-4 text-white text-opacity-70 text-sm hidden">
        <select className="bg-transparent border border-white border-opacity-30 rounded-lg px-2 py-1 text-white text-opacity-90 focus:outline-none">
          <option>English</option>
          <option>Kiswahili</option>
        </select>
      </div>
    </div>
  );
};

export default OnboardingScreen;

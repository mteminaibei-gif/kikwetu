'use client';

import Link from 'next/link';

export default function Landing() {
  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center px-4 py-12">
      <div className="max-w-4xl mx-auto text-center space-y-8 animate-fadeIn">
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-6xl font-black font-logo tracking-tight">
            <span className="text-emerald-600 dark:text-emerald-400">Kikwetu</span>
            <span className="text-orange-500">Connect</span>
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-medium">
            Our Place. Maarifa Yetu, Hadithi Zetu, Mustakabali Wetu.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/onboarding"
            className="bg-orange-500 hover:bg-orange-400 text-white px-8 py-3.5 rounded-full text-sm font-bold shadow-lg transition-all transform active:scale-95"
          >
            Get Started Free
          </Link>
          <Link
            href="/feed"
            className="border-2 border-gray-300 dark:border-gray-700 hover:border-orange-500 text-gray-700 dark:text-gray-200 px-8 py-3.5 rounded-full text-sm font-bold transition-all"
          >
            Explore Baraza
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-12 max-w-3xl mx-auto">
          {[
            { title: 'Baraza', desc: 'Community discussions on farming, tech, education & more', color: 'text-emerald-500' },
            { title: 'Heshima', desc: 'Earn karma points by helping others with quality answers', color: 'text-orange-500' },
            { title: 'Sauti', desc: 'Live audio rooms for real-time conversations across counties', color: 'text-purple-500' },
          ].map(f => (
            <div key={f.title} className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-md transition-all">
              <h3 className={`text-xl font-black mb-2 ${f.color}`}>{f.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">{f.desc}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500 mt-8">
          Join thousands of Kenyans sharing knowledge and building communities.
        </p>
      </div>
    </div>
  );
}

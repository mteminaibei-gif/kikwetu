'use client';

import Link from 'next/link';

export default function TermsPage() {
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

      <div className="max-w-4xl mx-auto px-4 py-20">
        <h1 className="text-5xl font-bold mb-8">Terms of Service</h1>
        <p className="text-gray-400 mb-12">Last updated: January 2026</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-3xl font-bold mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-300 leading-relaxed">
              By accessing and using KikwetuConnect, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">2. Use License</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Permission is granted to temporarily download one copy of the materials (information or software) on KikwetuConnect for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>Modifying or copying the materials</li>
              <li>Using the materials for any commercial purpose or for any public display</li>
              <li>Attempting to decompile or reverse engineer any software contained on the site</li>
              <li>Removing any copyright or other proprietary notations from the materials</li>
              <li>Transferring the materials to another person or "mirroring" the materials on any other server</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">3. Disclaimer</h2>
            <p className="text-gray-300 leading-relaxed">
              The materials on KikwetuConnect are provided on an 'as is' basis. KikwetuConnect makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">4. Limitations</h2>
            <p className="text-gray-300 leading-relaxed">
              In no event shall KikwetuConnect or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on KikwetuConnect, even if KikwetuConnect or a KikwetuConnect authorized representative has been notified orally or in writing of the possibility of such damage.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">5. Accuracy of Materials</h2>
            <p className="text-gray-300 leading-relaxed">
              The materials appearing on KikwetuConnect could include technical, typographical, or photographic errors. KikwetuConnect does not warrant that any of the materials on its website are accurate, complete, or current. KikwetuConnect may make changes to the materials contained on its website at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">6. Links</h2>
            <p className="text-gray-300 leading-relaxed">
              KikwetuConnect has not reviewed all of the sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link does not imply endorsement by KikwetuConnect of the site. Use of any such linked website is at the user's own risk.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">7. Modifications</h2>
            <p className="text-gray-300 leading-relaxed">
              KikwetuConnect may revise these terms of service for its website at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">8. Governing Law</h2>
            <p className="text-gray-300 leading-relaxed">
              These terms and conditions are governed by and construed in accordance with the laws of Kenya, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.
            </p>
          </section>

          <section className="bg-[#1a1f26] border border-gray-800 rounded-xl p-8 mt-12">
            <p className="text-gray-300">
              If you have any questions about these Terms of Service, please contact us at{' '}
              <a href="mailto:legal@kikwetuconnect.co.ke" className="text-[#4a9d63] hover:text-[#2d7c4a] transition">
                legal@kikwetuconnect.co.ke
              </a>
            </p>
          </section>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-500 text-sm">
          <p>&copy; 2026 KikwetuConnect. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

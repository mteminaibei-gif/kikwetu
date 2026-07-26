'use client';

import Link from 'next/link';

export default function PrivacyPage() {
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
        <h1 className="text-5xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-gray-400 mb-12">Last updated: January 2026</p>

        <div className="prose prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-3xl font-bold mb-4">1. Introduction</h2>
            <p className="text-gray-300 leading-relaxed">
              KikwetuConnect ("we" or "us" or "our") operates the KikwetuConnect website and mobile application (the "Service"). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">2. Information Collection and Use</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              We collect several different types of information for various purposes to provide and improve our Service to you.
            </p>
            
            <h3 className="text-xl font-semibold mb-3 text-gray-200">Types of Data Collected:</h3>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li><strong>Personal Data:</strong> Email address, first name and last name, phone number, address, city, state, postal code, country</li>
              <li><strong>Usage Data:</strong> Browser type and version, pages visited, time and date of visit, time spent on pages</li>
              <li><strong>Device Data:</strong> Device type, operating system, unique device identifiers</li>
              <li><strong>Communication Data:</strong> Messages, posts, comments, and other content you create</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">3. Use of Data</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              KikwetuConnect uses the collected data for various purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>To provide and maintain our Service</li>
              <li>To notify you about changes to our Service</li>
              <li>To provide customer support</li>
              <li>To gather analysis or valuable information to improve our Service</li>
              <li>To monitor the usage of our Service</li>
              <li>To detect, prevent and address technical issues</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">4. Security of Data</h2>
            <p className="text-gray-300 leading-relaxed">
              The security of your data is important to us but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">5. Changes to This Privacy Policy</h2>
            <p className="text-gray-300 leading-relaxed">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "effective date" at the top of this Privacy Policy. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">6. Your Rights</h2>
            <p className="text-gray-300 leading-relaxed mb-4">
              Depending on your location, you may have certain rights regarding your personal data:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-300 ml-4">
              <li>The right to access your personal data</li>
              <li>The right to request correction of inaccurate data</li>
              <li>The right to request deletion of your data</li>
              <li>The right to restrict processing of your data</li>
              <li>The right to data portability</li>
            </ul>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">7. Children's Privacy</h2>
            <p className="text-gray-300 leading-relaxed">
              Our Service does not address anyone under the age of 18 ("Children"). We do not knowingly collect personally identifiable information from children under 18. If you are a parent or guardian and you are aware that your child has provided us with Personal Data, please contact us. If we become aware that we have collected Personal Data from children without verification of parental consent, we take steps to remove such information from our servers.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold mb-4">8. Contact Us</h2>
            <p className="text-gray-300 leading-relaxed">
              If you have any questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:privacy@kikwetuconnect.co.ke" className="text-[#4a9d63] hover:text-[#2d7c4a] transition">
                privacy@kikwetuconnect.co.ke
              </a>
            </p>
          </section>

          <section className="bg-[#1a1f26] border border-gray-800 rounded-xl p-8 mt-12">
            <h3 className="font-semibold mb-3">Data Protection Officer</h3>
            <p className="text-gray-300">
              For any data privacy concerns or to exercise your rights, you can reach our Data Protection Officer at{' '}
              <a href="mailto:dpo@kikwetuconnect.co.ke" className="text-[#4a9d63] hover:text-[#2d7c4a] transition">
                dpo@kikwetuconnect.co.ke
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

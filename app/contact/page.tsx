'use client';

import Link from 'next/link';
import { Mail, Phone, MapPin, Send } from 'lucide-react';
import { useState } from 'react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
      setSubmitted(false);
    }, 3000);
  };

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

      <div className="max-w-7xl mx-auto px-4 py-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">Get In Touch</h1>
          <p className="text-xl text-gray-400">We'd love to hear from you. Send us a message!</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* Contact Info Cards */}
          <div className="bg-[#1a1f26] border border-gray-800 rounded-xl p-8 hover:border-[#2d7c4a] transition">
            <div className="w-12 h-12 bg-[#2d7c4a]/20 rounded-lg flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-[#4a9d63]" />
            </div>
            <h3 className="text-xl font-bold mb-2">Email</h3>
            <p className="text-gray-400 mb-4">support@kikwetuconnect.co.ke</p>
            <a href="mailto:support@kikwetuconnect.co.ke" className="text-[#4a9d63] hover:text-[#2d7c4a] transition">
              Send Email →
            </a>
          </div>

          <div className="bg-[#1a1f26] border border-gray-800 rounded-xl p-8 hover:border-[#2d7c4a] transition">
            <div className="w-12 h-12 bg-[#2d7c4a]/20 rounded-lg flex items-center justify-center mb-4">
              <Phone className="w-6 h-6 text-[#4a9d63]" />
            </div>
            <h3 className="text-xl font-bold mb-2">Phone</h3>
            <p className="text-gray-400 mb-4">+254 (0) 123 456 789</p>
            <a href="tel:+254123456789" className="text-[#4a9d63] hover:text-[#2d7c4a] transition">
              Call Now →
            </a>
          </div>

          <div className="bg-[#1a1f26] border border-gray-800 rounded-xl p-8 hover:border-[#2d7c4a] transition">
            <div className="w-12 h-12 bg-[#2d7c4a]/20 rounded-lg flex items-center justify-center mb-4">
              <MapPin className="w-6 h-6 text-[#4a9d63]" />
            </div>
            <h3 className="text-xl font-bold mb-2">Office</h3>
            <p className="text-gray-400 mb-4">Nairobi, Kenya</p>
            <a href="#" className="text-[#4a9d63] hover:text-[#2d7c4a] transition">
              View Map →
            </a>
          </div>
        </div>

        {/* Contact Form */}
        <div className="grid md:grid-cols-3 gap-12">
          <div className="md:col-span-2">
            <div className="bg-[#1a1f26] border border-gray-800 rounded-xl p-8">
              <h2 className="text-2xl font-bold mb-6">Send us a Message</h2>

              {submitted ? (
                <div className="bg-[#2d7c4a]/20 border border-[#4a9d63] rounded-lg p-6 text-center">
                  <p className="text-[#4a9d63] font-semibold mb-2">✓ Message Sent!</p>
                  <p className="text-gray-400">Thank you for reaching out. We'll get back to you shortly.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">Full Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#2d7c4a] focus:outline-none transition"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-300">Email Address</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="w-full bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#2d7c4a] focus:outline-none transition"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Phone Number</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className="w-full bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#2d7c4a] focus:outline-none transition"
                      placeholder="+254 (0) XXX XXX XXX"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Subject</label>
                    <select
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className="w-full bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-3 text-white focus:border-[#2d7c4a] focus:outline-none transition"
                    >
                      <option value="">Select a subject</option>
                      <option value="support">Support</option>
                      <option value="feedback">Feedback</option>
                      <option value="partnership">Partnership</option>
                      <option value="bug">Report a Bug</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-gray-300">Message</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className="w-full bg-gray-900/50 border border-gray-800 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-[#2d7c4a] focus:outline-none transition resize-none"
                      placeholder="Your message here..."
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-[#2d7c4a] hover:bg-[#4a9d63] text-white font-bold py-3 rounded-lg transition flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                  >
                    <Send className="w-5 h-5" />
                    Send Message
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Info Sidebar */}
          <div>
            <div className="bg-gradient-to-br from-[#2d7c4a] to-[#1a5c33] rounded-xl p-8">
              <h3 className="text-2xl font-bold mb-6">Response Time</h3>
              
              <div className="space-y-4 mb-8">
                <div>
                  <p className="text-white/80 text-sm mb-1">Average Response</p>
                  <p className="text-2xl font-bold">4 Hours</p>
                </div>
                <div>
                  <p className="text-white/80 text-sm mb-1">Support Hours</p>
                  <p className="text-lg font-semibold">9 AM - 6 PM EAT</p>
                  <p className="text-white/70 text-sm">Monday - Friday</p>
                </div>
                <div>
                  <p className="text-white/80 text-sm mb-1">Languages</p>
                  <p className="text-lg font-semibold">English, Swahili, Sheng</p>
                </div>
              </div>

              <div className="bg-white/10 border border-white/20 rounded-lg p-4">
                <p className="text-sm text-white/80">
                  We're committed to responding to your inquiries quickly and helping you with any questions or concerns.
                </p>
              </div>
            </div>

            {/* FAQ Preview */}
            <div className="mt-8 bg-[#1a1f26] border border-gray-800 rounded-xl p-6">
              <h3 className="font-bold text-lg mb-4">Quick Links</h3>
              <ul className="space-y-3">
                <li><a href="#" className="text-[#4a9d63] hover:text-[#2d7c4a] transition flex items-center gap-2"><span>→</span> Help Center</a></li>
                <li><a href="#" className="text-[#4a9d63] hover:text-[#2d7c4a] transition flex items-center gap-2"><span>→</span> FAQ</a></li>
                <li><a href="#" className="text-[#4a9d63] hover:text-[#2d7c4a] transition flex items-center gap-2"><span>→</span> Documentation</a></li>
                <li><a href="#" className="text-[#4a9d63] hover:text-[#2d7c4a] transition flex items-center gap-2"><span>→</span> Community</a></li>
              </ul>
            </div>
          </div>
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

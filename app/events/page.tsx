'use client';

import AppLayout from '@/components/AppLayout';
import { Calendar, MapPin, Users, Clock, Plus } from 'lucide-react';

export default function EventsPage() {
  const upcomingEvents = [
    {
      title: 'Kenya Tech Summit 2026',
      date: 'Aug 15, 2026',
      time: '9:00 AM - 5:00 PM',
      location: 'KICC, Nairobi',
      attendees: 2543,
      image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop',
      category: 'Technology',
      price: 'KES 2,500',
    },
    {
      title: 'Agricultural Innovation Workshop',
      date: 'Aug 20, 2026',
      time: '10:00 AM - 3:00 PM',
      location: 'Nakuru County Hall',
      attendees: 456,
      image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&h=200&fit=crop',
      category: 'Agriculture',
      price: 'Free',
    },
    {
      title: 'Startup Pitch Night',
      date: 'Aug 22, 2026',
      time: '6:00 PM - 9:00 PM',
      location: 'iHub, Nairobi',
      attendees: 189,
      image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=200&fit=crop',
      category: 'Business',
      price: 'KES 500',
    },
    {
      title: 'Health & Wellness Expo',
      date: 'Aug 25, 2026',
      time: '8:00 AM - 6:00 PM',
      location: 'Sarit Centre, Nairobi',
      attendees: 1234,
      image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=200&fit=crop',
      category: 'Health',
      price: 'Free',
    },
  ];

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">Events</h1>
            <button className="bg-[#2d7c4a] hover:bg-[#4a9d63] text-white px-5 py-2.5 rounded-lg font-semibold transition flex items-center gap-2">
              <Plus className="w-5 h-5" />
              <span>Create Event</span>
            </button>
          </div>
          <p className="text-gray-400">Discover and join events happening in your community</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
          <button className="px-4 py-2 bg-[#2d7c4a] text-white rounded-lg font-semibold text-sm whitespace-nowrap">
            All Events
          </button>
          <button className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg font-semibold text-sm transition whitespace-nowrap">
            Technology
          </button>
          <button className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg font-semibold text-sm transition whitespace-nowrap">
            Agriculture
          </button>
          <button className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg font-semibold text-sm transition whitespace-nowrap">
            Business
          </button>
          <button className="px-4 py-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg font-semibold text-sm transition whitespace-nowrap">
            Health
          </button>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {upcomingEvents.map((event, idx) => (
            <div
              key={idx}
              className="bg-[#1a1f26] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition group"
            >
              {/* Event Image */}
              <div className="relative aspect-[2/1] overflow-hidden">
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-3 left-3 bg-[#2d7c4a] text-white text-xs font-bold px-3 py-1 rounded-lg">
                  {event.category}
                </div>
                <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-lg">
                  {event.price}
                </div>
              </div>

              {/* Event Details */}
              <div className="p-5">
                <h3 className="font-bold text-lg mb-3 line-clamp-2">{event.title}</h3>

                <div className="space-y-2 mb-4 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#2d7c4a]" />
                    <span>{event.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#2d7c4a]" />
                    <span>{event.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#2d7c4a]" />
                    <span>{event.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#2d7c4a]" />
                    <span>{event.attendees} attending</span>
                  </div>
                </div>

                <button className="w-full bg-[#2d7c4a] hover:bg-[#4a9d63] text-white py-2.5 rounded-lg font-semibold transition">
                  Register Now
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Load More */}
        <div className="text-center py-8">
          <button className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold transition">
            Load More Events
          </button>
        </div>
      </div>
    </AppLayout>
  );
}

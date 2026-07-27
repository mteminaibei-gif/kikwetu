'use client'

import { useState, useEffect } from 'react'
import { Calendar, MapPin, Users, Clock, Share2, CheckCircle, Plus, Tag, X } from 'lucide-react'
import AppLayout, { useApp } from '@/components/AppLayout'
import { supabase } from '@/lib/supabase'
import { createThread } from '@/lib/supabase-helpers'

const MOCK_EVENTS = [
  {
    title: 'Kenya Tech Summit 2026',
    date: '2026-08-15',
    time: '9:00 AM - 5:00 PM',
    location: 'KICC, Nairobi',
    attendees: 2543,
    image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop',
    category: 'Technology',
    price: 'KES 2,500',
    description: 'The premier technology conference bringing together innovators, founders, and tech leaders from across East Africa.',
  },
  {
    title: 'Agricultural Innovation Workshop',
    date: '2026-08-20',
    time: '10:00 AM - 3:00 PM',
    location: 'Nakuru County Hall',
    attendees: 456,
    image: 'https://images.unsplash.com/photo-1464226184884-fa280b87c399?w=400&h=200&fit=crop',
    category: 'Agriculture',
    price: 'Free',
    description: 'Learn about smart farming techniques, precision agriculture, and sustainable farming practices.',
  },
  {
    title: 'Startup Pitch Night',
    date: '2026-08-22',
    time: '6:00 PM - 9:00 PM',
    location: 'iHub, Nairobi',
    attendees: 189,
    image: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=200&fit=crop',
    category: 'Business',
    price: 'KES 500',
    description: 'Watch 10 exciting startups pitch their ideas to investors and the community.',
  },
  {
    title: 'Health & Wellness Expo',
    date: '2026-08-25',
    time: '8:00 AM - 6:00 PM',
    location: 'Sarit Centre, Nairobi',
    attendees: 1234,
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400&h=200&fit=crop',
    category: 'Health',
    price: 'Free',
    description: 'Explore the latest in health, wellness, nutrition, and fitness for all ages.',
  },
]

const CATEGORIES = ['All', 'Technology', 'Agriculture', 'Business', 'Health']

interface EventData {
  id: string
  title: string
  date: string
  time: string
  location: string
  attendees: number
  image?: string
  category: string
  price: string
  description?: string
  created_at?: string
}

export default function EventsPage() {
  const { user, showToast } = useApp()
  const [events, setEvents] = useState<EventData[]>([])
  const [registered, setRegistered] = useState<Record<string, boolean>>({})
  const [activeCategory, setActiveCategory] = useState('All')
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    time: '',
    location: '',
    category: 'Technology',
    price: 'Free',
    description: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('threads')
        .select('*, profiles:author_id(full_name, username, avatar_url)')
        .contains('tags', ['event'])
        .order('created_at', { ascending: false })
        .limit(20)

      if (data && data.length > 0) {
        setEvents(data.map((t) => {
          let meta: Record<string, string> = {}
          try { meta = JSON.parse(t.body || '{}') } catch { meta = {} }
          return {
            id: t.id,
            title: t.title,
            date: meta.date || 'TBD',
            time: meta.time || 'TBD',
            location: meta.location || 'TBD',
            attendees: t.likes_count || 0,
            image: undefined,
            category: meta.category || 'General',
            price: meta.price || 'Free',
            description: meta.description || t.body,
            created_at: t.created_at,
          }
        }))
      } else {
        setEvents(MOCK_EVENTS.map((e, i) => ({ ...e, id: `mock-${i}` })))
      }

      const saved = localStorage.getItem('kikwetu-event-registrations')
      if (saved) setRegistered(JSON.parse(saved))
      setLoading(false)
    }
    load()
  }, [])

  const filteredEvents = activeCategory === 'All'
    ? events
    : events.filter((e) => e.category === activeCategory)

  const handleRegister = (eventId: string) => {
    const newRegistered = { ...registered, [eventId]: !registered[eventId] }
    setRegistered(newRegistered)
    localStorage.setItem('kikwetu-event-registrations', JSON.stringify(newRegistered))
    if (newRegistered[eventId]) {
      setEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, attendees: e.attendees + 1 } : e))
    } else {
      setEvents((prev) => prev.map((e) => e.id === eventId ? { ...e, attendees: Math.max(0, e.attendees - 1) } : e))
    }
    showToast(newRegistered[eventId] ? 'Registered! See you there 🎉' : 'Unregistered')
  }

  const handleShare = async (event: EventData) => {
    const url = `${window.location.origin}/events?id=${event.id}`
    const text = `Check out "${event.title}" on KikwetuConnect!`
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, text, url })
      } else {
        await navigator.clipboard.writeText(`${text}\n${url}`)
        showToast('Link copied to clipboard!')
      }
    } catch {
      showToast('Share this event with friends')
    }
  }

  const handleCreateEvent = async () => {
    if (!user) {
      showToast('Sign in to create events')
      return
    }
    if (!newEvent.title || !newEvent.date) {
      showToast('Title and date are required')
      return
    }

    setSubmitting(true)
    const eventBody = JSON.stringify({
      date: newEvent.date,
      time: newEvent.time,
      location: newEvent.location,
      category: newEvent.category,
      price: newEvent.price,
    })
    const { error } = await createThread(
      user.id,
      newEvent.title,
      newEvent.description || eventBody,
      'post',
      ['event'],
    )

    if (error) {
      showToast('Failed to create event')
    } else {
      showToast('Event created!')
      setShowCreateModal(false)
      setNewEvent({ title: '', date: '', time: '', location: '', category: 'Technology', price: 'Free', description: '' })
      window.location.reload()
    }
    setSubmitting(false)
  }

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold">Events</h1>
            <button
              onClick={() => user ? setShowCreateModal(true) : showToast('Sign in to create events')}
              className="bg-[#2d7c4a] hover:bg-[#4a9d63] text-white px-5 py-2.5 rounded-lg font-semibold transition flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Event</span>
            </button>
          </div>
          <p className="text-gray-400">Discover and join events happening in your community</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-2 rounded-lg font-semibold text-sm transition whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-[#2d7c4a] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Events Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-[#1a1f26] border border-gray-800 rounded-xl overflow-hidden animate-pulse">
                <div className="aspect-[2/1] bg-gray-800" />
                <div className="p-5 space-y-3">
                  <div className="h-5 bg-gray-800 rounded w-3/4" />
                  <div className="h-4 bg-gray-800 rounded w-1/2" />
                  <div className="h-4 bg-gray-800 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No events found</p>
            <p className="text-gray-500 text-sm mt-1">Try a different category or create one</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredEvents.map((event) => (
              <div
                key={event.id}
                className="bg-[#1a1f26] border border-gray-800 rounded-xl overflow-hidden hover:border-gray-700 transition group"
              >
                {/* Event Image */}
                {event.image && (
                  <div className="relative aspect-[2/1] overflow-hidden">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                    <div className="absolute top-3 left-3 bg-[#2d7c4a] text-white text-xs font-bold px-3 py-1 rounded-lg">
                      {event.category}
                    </div>
                    <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-lg">
                      {event.price}
                    </div>
                  </div>
                )}

                {/* Event Details */}
                <div className="p-5">
                  {!event.image && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-[#2d7c4a] text-white text-xs font-bold px-3 py-1 rounded-lg">{event.category}</span>
                      <span className="bg-gray-800 text-gray-300 text-xs font-semibold px-3 py-1 rounded-lg">{event.price}</span>
                    </div>
                  )}

                  <h3 className="font-bold text-lg mb-3 line-clamp-2">{event.title}</h3>

                  <div className="space-y-2 mb-4 text-sm text-gray-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#2d7c4a]" />
                      <span>{event.date === 'TBD' ? 'TBD' : new Date(event.date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
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
                      <span>{event.attendees.toLocaleString()} attending</span>
                    </div>
                  </div>

                  {event.description && (
                    <p className="text-gray-400 text-sm mb-4 line-clamp-2">{event.description}</p>
                  )}

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRegister(event.id)}
                      className={`flex-1 py-2.5 rounded-lg font-semibold transition flex items-center justify-center gap-2 ${
                        registered[event.id]
                          ? 'bg-green-900/50 text-green-400 border border-green-800'
                          : 'bg-[#2d7c4a] hover:bg-[#4a9d63] text-white'
                      }`}
                    >
                      {registered[event.id] ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Registered
                        </>
                      ) : (
                        'Register Now'
                      )}
                    </button>
                    <button
                      onClick={() => handleShare(event)}
                      className="px-3 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition"
                      title="Share event"
                    >
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {!loading && filteredEvents.length > 0 && (
          <div className="text-center py-8">
            <button className="px-8 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold transition">
              Load More Events
            </button>
          </div>
        )}

        {/* Create Event Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1f26] border border-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-5 border-b border-gray-800">
                <h2 className="text-xl font-bold">Create Event</h2>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Event Title *</label>
                  <input
                    type="text"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    placeholder="e.g. Nairobi Tech Meetup"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#2d7c4a]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
                  <textarea
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="What's the event about?"
                    rows={3}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#2d7c4a] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Date *</label>
                    <input
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#2d7c4a]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Time</label>
                    <input
                      type="text"
                      value={newEvent.time}
                      onChange={(e) => setNewEvent({ ...newEvent, time: e.target.value })}
                      placeholder="e.g. 2:00 PM - 5:00 PM"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#2d7c4a]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">Location</label>
                  <input
                    type="text"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    placeholder="e.g. KICC, Nairobi"
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#2d7c4a]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Category</label>
                    <select
                      value={newEvent.category}
                      onChange={(e) => setNewEvent({ ...newEvent, category: e.target.value })}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[#2d7c4a]"
                    >
                      {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">Price</label>
                    <input
                      type="text"
                      value={newEvent.price}
                      onChange={(e) => setNewEvent({ ...newEvent, price: e.target.value })}
                      placeholder="e.g. KES 500 or Free"
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-[#2d7c4a]"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 p-5 border-t border-gray-800">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateEvent}
                  disabled={submitting || !newEvent.title || !newEvent.date}
                  className="flex-1 py-2.5 bg-[#2d7c4a] hover:bg-[#4a9d63] text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? 'Creating...' : 'Create Event'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

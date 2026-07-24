'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

interface RadioStation {
  id: string;
  name: string;
  slogan: string;
  streamUrl: string;
  logo: string;
  category: string;
  frequency: string;
}

const STATIONS: RadioStation[] = [
  { id: 'citizen', name: 'Citizen Radio', slogan: 'Kusikiliza ni Kutambua', streamUrl: 'https://streaming.appwhat.net/citizenradio', logo: '🎙️', category: 'News & Talk', frequency: 'FM 100.9' },
  { id: 'kiss', name: 'Kiss FM', slogan: 'The Biggest Hits', streamUrl: 'https://streaming.appwhat.net/kissfm', logo: '🎧', category: 'Pop Music', frequency: 'FM 100.3' },
  { id: 'classic105', name: 'Classic 105', slogan: 'It\'s a Classic', streamUrl: 'https://streaming.appwhat.net/classic105', logo: '🎵', category: 'Classic Hits', frequency: 'FM 105.3' },
  { id: 'hot96', name: 'Hot 96', slogan: 'The Urban Beat', streamUrl: 'https://streaming.appwhat.net/hot96', logo: '🔥', category: 'Urban Music', frequency: 'FM 96.3' },
  { id: 'homeboyz', name: 'Homeboyz Radio', slogan: 'The People\'s Station', streamUrl: 'https://streaming.appwhat.net/homeboyz', logo: '🏠', category: 'Hip Hop & Pop', frequency: 'FM 94.1' },
  { id: 'milele', name: 'Milele FM', slogan: 'Milele na Watu', streamUrl: 'https://streaming.appwhat.net/milele', logo: '🌅', category: 'Swahili Music', frequency: 'FM 96.1' },
  { id: 'maisha', name: 'Radio Maisha', slogan: 'Lango la Habari', streamUrl: 'https://streaming.appwhat.net/radiomaisha', logo: '🌟', category: 'Swahili Hits', frequency: 'FM 91.1' },
  { id: 'gukena', name: 'Gukena FM', slogan: 'Gukena na Watu', streamUrl: 'https://streaming.appwhat.net/gukenafm', logo: '🥁', category: 'Kikuyu Music', frequency: 'FM 96.1' },
  { id: 'kameme', name: 'Kameme FM', slogan: 'Kameme ni Wewe', streamUrl: 'https://streaming.appwhat.net/kameme', logo: '📻', category: 'Kikuyu Music', frequency: 'FM 102.7' },
  { id: 'coro', name: 'Coro FM', slogan: 'Fm ya Watu', streamUrl: 'https://streaming.appwhat.net/corofm', logo: '🎷', category: 'Kikuyu Music', frequency: 'FM 96.8' },
  { id: 'inooro', name: 'Inooro FM', slogan: 'Iri Wendo', streamUrl: 'https://streaming.appwhat.net/inoorofm', logo: '📡', category: 'Kikuyu Music', frequency: 'FM 93.6' },
  { id: 'ramogi', name: 'Ramogi FM', slogan: 'Dhumna gi Ramogi', streamUrl: 'https://streaming.appwhat.net/ramogifm', logo: '🌍', category: 'Luo Music', frequency: 'FM 91.7' },
  { id: 'muoroto', name: 'Muoroto FM', slogan: 'Sauti ya Watu', streamUrl: 'https://streaming.appwhat.net/muorotofm', logo: '🎶', category: 'Luo Music', frequency: 'FM 88.9' },
  { id: 'minto', name: 'Minto FM', slogan: 'Minto ni Wewe', streamUrl: 'https://streaming.appwhat.net/mintofm', logo: '🎤', category: 'Swahili Music', frequency: 'FM 91.3' },
  { id: 'sulwe', name: 'Sulwe FM', slogan: 'Sauti ya Mwanachi', streamUrl: 'https://streaming.appwhat.net/sulwefm', logo: '⭐', category: 'Swahili Music', frequency: 'FM 104.9' },
  { id: 'baraka', name: 'Baraka FM', slogan: 'Upendo na Amani', streamUrl: 'https://streaming.appwhat.net/barakafm', logo: '💚', category: 'Christian', frequency: 'FM 91.1' },
];

const CATEGORIES = [...new Set(STATIONS.map(s => s.category))];

export default function KenyanRadioPlayer() {
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null);
  const [playing, setPlaying] = useState(false);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [volume, setVolume] = useState(0.7);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    audioRef.current = new Audio();
    audioRef.current.volume = volume;
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const play = useCallback((station: RadioStation) => {
    setError(null);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    const audio = audioRef.current;
    if (!audio) return;
    audio.src = station.streamUrl;
    audio.play().then(() => {
      setCurrentStation(station);
      setPlaying(true);
    }).catch(() => {
      setError('Unable to play this station. It may be offline.');
      setPlaying(false);
    });
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !currentStation) return;
    if (playing) {
      audioRef.current.pause();
      setPlaying(false);
    } else {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {
        setError('Unable to resume playback.');
      });
    }
  }, [playing, currentStation]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setCurrentStation(null);
    setPlaying(false);
    setError(null);
  }, []);

  const filtered = STATIONS.filter(s => {
    if (categoryFilter && s.category !== categoryFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return s.name.toLowerCase().includes(q) || s.slogan.toLowerCase().includes(q) || s.frequency.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Now Playing Bar */}
      {currentStation && (
        <div className="sun-card p-4 sm:p-5 bg-gradient-to-r from-brand-deep to-brand-red text-white">
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="text-4xl">{currentStation.logo}</span>
              {playing && (
                <span className="absolute -bottom-1 -right-1 flex gap-0.5">
                  <span className="w-1 h-3 bg-white rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
                  <span className="w-1 h-2 bg-white/80 rounded-full animate-pulse" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 h-4 bg-white/90 rounded-full animate-pulse" style={{ animationDelay: '300ms' }} />
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-white/70 uppercase tracking-wider">Now Playing</p>
              <h3 className="text-lg font-black truncate">{currentStation.name}</h3>
              <p className="text-sm text-white/80 truncate">{currentStation.slogan} &middot; {currentStation.frequency}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={togglePlay}
                className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all active:scale-90">
                {playing ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" /></svg>
                ) : (
                  <svg className="w-5 h-5 ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                )}
              </button>
              <button onClick={stop}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all active:scale-90">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <svg className="w-3 h-3 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
            <input type="range" min="0" max="1" step="0.05" value={volume} onChange={e => setVolume(parseFloat(e.target.value))}
              className="flex-1 h-1 rounded-full appearance-none bg-white/20 accent-white cursor-pointer" />
            <svg className="w-3 h-3 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>
          </div>
          {error && <p className="text-xs text-red-200 mt-2">{error}</p>}
        </div>
      )}

      {/* Search & Filter */}
      <div className="flex flex-wrap gap-2">
        <div className="flex-1 min-w-[200px] relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search stations..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50" />
        </div>
        <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-brand-terracotta/50">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Station Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.map(station => (
          <button key={station.id} onClick={() => play(station)}
            className={cn(
              'sun-card p-4 text-left hover:shadow-md transition-all active:scale-[0.98]',
              currentStation?.id === station.id && 'ring-2 ring-brand-red'
            )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center text-2xl',
                currentStation?.id === station.id ? 'bg-brand-red/10' : 'bg-gray-100 dark:bg-gray-800'
              )}>
                {station.logo}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{station.name}</p>
                <p className="text-[10px] text-gray-400 truncate">{station.slogan}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[9px] bg-brand-terracotta/10 text-brand-red px-1.5 py-0.5 rounded font-medium">{station.frequency}</span>
                  <span className="text-[9px] text-gray-400">{station.category}</span>
                </div>
              </div>
              {currentStation?.id === station.id && playing && (
                <div className="flex gap-0.5 items-end h-4">
                  <span className="w-1 bg-brand-red rounded-full animate-pulse h-3" />
                  <span className="w-1 bg-brand-red rounded-full animate-pulse h-4" style={{ animationDelay: '200ms' }} />
                  <span className="w-1 bg-brand-red rounded-full animate-pulse h-2" style={{ animationDelay: '400ms' }} />
                </div>
              )}
            </div>
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-12 text-sm text-gray-400">
            No stations found matching your search.
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/components/AppLayout';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/supabase-helpers';
import {
  Radio, Play, Pause, Volume2, VolumeX, Heart, Share2,
  Star, Wifi, Clock, ExternalLink,
} from 'lucide-react';

/* ---------- types ---------- */
interface Station {
  id: string;
  name: string;
  city: string;
  genre: string;
  category: string;
  color: string;
  initials: string;
  nowPlaying: string;
  signal: 1 | 2 | 3;
  streamUrl: string | null;
}

/* ---------- simulated catalogue ---------- */
const STATIONS: Station[] = [
  // National
  { id: 'capital-fm', name: 'Capital FM', city: 'Nairobi', genre: 'Pop / Hits', category: 'National', color: '#d42027', initials: 'CF', nowPlaying: 'Bien – Inauma', signal: 3, streamUrl: 'https://streaming.capitalfm.co.ke/capital' },
  { id: 'classic-105', name: 'Classic 105', city: 'Nairobi', genre: 'Classic Hits', category: 'National', color: '#1a1a2e', initials: 'C1', nowPlaying: 'Lionel Richie – Hello', signal: 3, streamUrl: 'https://streaming.classic105.com/classic105' },
  { id: 'kiss-fm', name: 'Kiss FM', city: 'Nairobi', genre: 'Urban', category: 'National', color: '#e91e8c', initials: 'KF', nowPlaying: 'Sauti Sol – Suzanna', signal: 3, streamUrl: 'https://stream.kissfm.co.ke/kiss' },
  { id: 'nrg-fm', name: 'NRG FM', city: 'Nairobi', genre: 'Gen Z / Urban', category: 'National', color: '#ff6b00', initials: 'NR', nowPlaying: 'Otile Brown – Dusuma', signal: 3, streamUrl: 'https://streaming.nrg.fm/nrg' },
  { id: 'homeboyz', name: 'Homeboyz Radio', city: 'Nairobi', genre: 'Reggae / Hip Hop', category: 'National', color: '#8b0000', initials: 'HR', nowPlaying: 'Chronicle – Reggae Life', signal: 2, streamUrl: 'https://stream.homeboyzradio.com/homeboyz' },
  { id: 'radio-jambo', name: 'Radio Jambo', city: 'Nairobi', genre: 'Entertainment', category: 'National', color: '#00843d', initials: 'RJ', nowPlaying: 'DJ Creme – Mix Session', signal: 3, streamUrl: 'https://streaming.radiojambo.co.ke/jambo' },
  { id: 'nation-fm', name: 'Nation FM', city: 'Nairobi', genre: 'News / Talk', category: 'National', color: '#003580', initials: 'NF', nowPlaying: 'Jeff Koinange Live', signal: 3, streamUrl: 'https://streaming.nation.africa/nationfm' },
  { id: 'ktn-news', name: 'KTN News', city: 'Nairobi', genre: 'News', category: 'National', color: '#cc0000', initials: 'KN', nowPlaying: 'KTN Prime Time', signal: 3, streamUrl: null },
  { id: 'kiss-tv', name: 'Kiss TV', city: 'Nairobi', genre: 'Entertainment', category: 'National', color: '#e91e8c', initials: 'KT', nowPlaying: 'The Trend', signal: 2, streamUrl: null },
  { id: 'ntv', name: 'NTV', city: 'Nairobi', genre: 'News', category: 'National', color: '#0066cc', initials: 'NT', nowPlaying: 'NTV At One', signal: 3, streamUrl: null },

  // County
  { id: 'radio-lake-victoria', name: 'Radio Lake Victoria', city: 'Kisumu', genre: 'Luo Music', category: 'County', color: '#2196f3', initials: 'LV', nowPlaying: 'Otile Brown – Malaika', signal: 2, streamUrl: null },
  { id: 'musyi-fm', name: 'Musyi FM', city: 'Central', genre: 'Kikuyu', category: 'County', color: '#4caf50', initials: 'MF', nowPlaying: 'Kamene Goro Show', signal: 2, streamUrl: null },
  { id: 'ramogi-fm', name: 'Ramogi FM', city: 'Nairobi', genre: 'Luo', category: 'County', color: '#ff9800', initials: 'RF', nowPlaying: 'Rogi Dhe Bwo', signal: 3, streamUrl: null },
  { id: 'egesa-fm', name: 'Egesa FM', city: 'Western', genre: 'Luhya', category: 'County', color: '#795548', initials: 'EF', nowPlaying: 'Bukusu Vibes', signal: 2, streamUrl: null },
  { id: 'coro-fm', name: 'Coro FM', city: 'Central', genre: 'Kikuyu', category: 'County', color: '#009688', initials: 'CR', nowPlaying: 'Ngemi ya Muthoni', signal: 2, streamUrl: null },
  { id: 'mwago-fm', name: 'Mwago FM', city: 'Rift Valley', genre: 'Kalenjin', category: 'County', color: '#607d8b', initials: 'MG', nowPlaying: 'Kalenjin Hits Mix', signal: 2, streamUrl: null },
  { id: 'bahari-fm', name: 'Bahari FM', city: 'Coast', genre: 'Swahili', category: 'County', color: '#00bcd4', initials: 'BF', nowPlaying: 'Taarab za Mjini', signal: 2, streamUrl: null },
  { id: 'pwani-tv', name: 'Pwani TV', city: 'Coast', genre: 'Swahili', category: 'County', color: '#ff5722', initials: 'PT', nowPlaying: 'Coast Business Hub', signal: 2, streamUrl: null },

  // Religious
  { id: 'inooro-fm', name: 'Inooro FM', city: 'Central', genre: 'Christian / Kikuyu', category: 'Religious', color: '#ffd600', initials: 'IF', nowPlaying: 'Mwathi wa Kiria', signal: 3, streamUrl: null },
  { id: 'bahari-radio', name: 'Bahari Radio', city: 'Coast', genre: 'Islamic', category: 'Religious', color: '#00695c', initials: 'BR', nowPlaying: 'Quran Recitation', signal: 2, streamUrl: null },
  { id: 'trm-tv', name: 'TRM TV', city: 'Nairobi', genre: 'Christian', category: 'Religious', color: '#7c4dff', initials: 'TR', nowPlaying: 'Gospel Sunday', signal: 3, streamUrl: null },

  // Music
  { id: 'capital-xtra', name: 'Capital Xtra', city: 'Nairobi', genre: 'Afrobeats', category: 'Music', color: '#ff1744', initials: 'CX', nowPlaying: 'Burna Boy – City Boys', signal: 3, streamUrl: null },
  { id: 'soundcity', name: 'Soundcity Radio', city: 'Nairobi', genre: 'Afrobeats', category: 'Music', color: '#651fff', initials: 'SR', nowPlaying: 'Tyla – Water', signal: 3, streamUrl: null },
  { id: '4408', name: '4408', city: 'Nairobi', genre: 'Gen Z', category: 'Music', color: '#00e676', initials: '48', nowPlaying: 'Sauti Sol – Midnightrain', signal: 3, streamUrl: null },

  // News
  { id: 'kbc-radio', name: 'KBC Radio', city: 'Nairobi', genre: 'National', category: 'News', color: '#1565c0', initials: 'KB', nowPlaying: 'KBC English Service', signal: 3, streamUrl: 'https://stream.kbc.co.ke/kbc' },
  { id: 'kameme-fm', name: 'Kameme FM', city: 'Central', genre: 'Kikuyu News', category: 'News', color: '#2e7d32', initials: 'KM', nowPlaying: 'Gikuyu News Hour', signal: 3, streamUrl: 'https://streaming.kameme.co.ke/kameme' },
  { id: 'musyi-news', name: 'Musyi FM News', city: 'Central', genre: 'Kikuyu News', category: 'News', color: '#4caf50', initials: 'MN', nowPlaying: 'Haki FM Express', signal: 2, streamUrl: null },
];

const CATEGORIES = ['All', 'National', 'County', 'Religious', 'Music', 'News'] as const;
type Category = typeof CATEGORIES[number];

const SONGS: Record<string, string[]> = {
  'capital-fm': ['Bien – Inauma', 'Sauti Sol – Suzanna', 'Nviiri – Pombe Sigara', 'Otile Brown – Dusuma'],
  'classic-105': ['Lionel Richie – Hello', 'Eagles – Hotel California', 'Whitney Houston – I Will Always Love You'],
  'kiss-fm': ['Sauti Sol – Suzanna', 'Naiboi – 2 in 1', 'Khaligraph – Tujibambe'],
  'nrg-fm': ['Otile Brown – Dusuma', 'Harmonize – Kwangwaru', 'Zuchu – Sukari'],
};

/* ---------- helpers ---------- */
function randomSong(station: Station): string {
  const pool = SONGS[station.id];
  if (pool) return pool[Math.floor(Math.random() * pool.length)];
  return station.nowPlaying;
}

function getSignalIcon(s: 1 | 2 | 3) {
  return (
    <Wifi
      size={14}
      style={{
        color: s === 3 ? 'var(--green)' : s === 2 ? 'var(--gold)' : 'var(--red)',
        opacity: s === 1 ? 0.5 : 1,
      }}
    />
  );
}

/* ================================================================ */
export default function RadioPage() {
  const { showToast } = useApp();

  const [category, setCategory] = useState<Category>('All');
  const [search, setSearch] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [volume, setVolume] = useState(75);
  const [muted, setMuted] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [nowPlaying, setNowPlaying] = useState<Record<string, string>>({});
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const progressTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  /* --- load favorites from localStorage --- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem('kikwetu-radio-favs');
      if (raw) setFavorites(new Set(JSON.parse(raw)));
    } catch { /* ignore */ }
  }, []);

  const persistFavs = useCallback((next: Set<string>) => {
    setFavorites(next);
    localStorage.setItem('kikwetu-radio-favs', JSON.stringify([...next]));
  }, []);

  const toggleFav = useCallback((id: string) => {
    persistFavs(
      favorites.has(id)
        ? new Set([...favorites].filter(x => x !== id))
        : new Set([...favorites, id]),
    );
    showToast(favorites.has(id) ? 'Removed from favorites' : 'Added to favorites');
  }, [favorites, persistFavs, showToast]);

  /* --- simulated now-playing rotation --- */
  useEffect(() => {
    const initial: Record<string, string> = {};
    STATIONS.forEach(s => { initial[s.id] = s.nowPlaying; });
    setNowPlaying(initial);

    const iv = setInterval(() => {
      setNowPlaying(prev => {
        const copy = { ...prev };
        const randomStation = STATIONS[Math.floor(Math.random() * STATIONS.length)];
        copy[randomStation.id] = randomSong(randomStation);
        return copy;
      });
    }, 15_000);
    return () => clearInterval(iv);
  }, []);

  /* --- play / pause --- */
  const play = useCallback((id: string) => {
    setPlayingId(prev => prev === id ? null : id);
    setProgress(0);
    setElapsed(0);
  }, []);

  /* --- progress ticker --- */
  useEffect(() => {
    if (progressTimer.current) clearInterval(progressTimer.current);

    if (playingId) {
      progressTimer.current = setInterval(() => {
        setElapsed(e => e + 1);
        setProgress(p => {
          if (p >= 100) return 0;
          return p + 0.15;
        });
      }, 1000);
    }

    return () => { if (progressTimer.current) clearInterval(progressTimer.current); };
  }, [playingId]);

  /* --- filtered list --- */
  const filtered = STATIONS.filter(s => {
    const matchCat = category === 'All' || s.category === category;
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase())
      || s.genre.toLowerCase().includes(search.toLowerCase())
      || s.city.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const activeStation = playingId ? STATIONS.find(s => s.id === playingId) : null;

  return (
    <AppLayout showRightSidebar={false}>
      <div className="radio-page">

        {/* ---- styles ---- */}
        <style jsx global>{`
          .radio-page { padding-bottom: 100px; }
          .radio-page .radio-header { margin-bottom: 28px; }
          .radio-page .radio-header h1 {
            font-size: 1.75rem; font-weight: 800; color: var(--text);
            display: flex; align-items: center; gap: 10px; margin: 0 0 4px;
          }
          .radio-page .radio-header h1 .live-dot {
            width: 10px; height: 10px; border-radius: 50%; background: var(--red);
            animation: pulse 1.5s infinite;
          }
          .radio-page .radio-header p { color: var(--text3); font-size: .9rem; margin: 0; }

          /* search */
          .radio-search {
            display: flex; align-items: center; gap: 8px;
            background: var(--surface); border: 1px solid var(--line);
            border-radius: 12px; padding: 0 14px; height: 44px;
            transition: border-color .2s;
          }
          .radio-search:focus-within { border-color: var(--green); }
          .radio-search input {
            flex: 1; background: none; border: none; outline: none;
            color: var(--text); font-size: .88rem; font-family: inherit;
          }
          .radio-search input::placeholder { color: var(--text3); }

          /* categories */
          .cat-tabs {
            display: flex; gap: 8px; margin: 20px 0 22px;
            overflow-x: auto; padding-bottom: 4px;
            scrollbar-width: none;
          }
          .cat-tabs::-webkit-scrollbar { display: none; }
          .cat-tab {
            padding: 7px 18px; border-radius: 999px; font-size: .8rem;
            font-weight: 600; white-space: nowrap; cursor: pointer;
            border: 1px solid var(--line); background: var(--surface);
            color: var(--text2); transition: all .2s;
          }
          .cat-tab:hover { background: var(--surface2); }
          .cat-tab.active {
            background: var(--green); color: #fff; border-color: var(--green);
          }

          /* grid */
          .station-grid {
            display: grid; gap: 16px;
            grid-template-columns: repeat(4, 1fr);
          }
          @media (max-width: 1100px) { .station-grid { grid-template-columns: repeat(3, 1fr); } }
          @media (max-width: 800px)  { .station-grid { grid-template-columns: repeat(2, 1fr); } }
          @media (max-width: 500px)  { .station-grid { grid-template-columns: 1fr; } }

          /* card */
          .station-card {
            background: var(--surface); border: 1px solid var(--line);
            border-radius: 16px; overflow: hidden; transition: all .25s var(--ease);
            display: flex; flex-direction: column; position: relative;
          }
          .station-card:hover {
            transform: translateY(-3px); box-shadow: var(--shadow1);
            border-color: var(--line2);
          }
          .station-card.now-playing { border-color: var(--green); }

          .card-top {
            position: relative; padding: 20px 16px 14px; display: flex;
            flex-direction: column; align-items: center; text-align: center; gap: 10px;
          }
          .station-avatar {
            width: 56px; height: 56px; border-radius: 14px;
            display: flex; align-items: center; justify-content: center;
            font-weight: 800; font-size: .85rem; color: #fff; letter-spacing: .02em;
            position: relative;
          }
          .station-avatar .pulse-ring {
            position: absolute; inset: -4px; border-radius: 18px;
            border: 2px solid var(--green); opacity: 0;
            animation: pulseRing 2s ease-out infinite;
          }
          .now-playing .station-avatar .pulse-ring { opacity: 1; }

          .card-name { font-weight: 700; font-size: .92rem; color: var(--text); }
          .card-city { font-size: .72rem; color: var(--text3); margin-top: -4px; }

          .genre-tag {
            display: inline-flex; align-items: center; gap: 4px;
            padding: 3px 10px; border-radius: 999px; font-size: .68rem;
            font-weight: 600; background: var(--surface2); color: var(--text2);
          }

          .card-bottom {
            padding: 0 16px 16px; display: flex; flex-direction: column; gap: 10px;
          }
          .now-text {
            font-size: .72rem; color: var(--text3); text-align: center;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          }
          .now-text strong { color: var(--text2); }

          .card-actions {
            display: flex; align-items: center; gap: 8px;
          }
          .card-actions .play-btn {
            flex: 1; display: flex; align-items: center; justify-content: center;
            gap: 6px; padding: 9px 0; border-radius: 12px; border: none;
            font-weight: 700; font-size: .78rem; cursor: pointer; transition: all .2s;
            font-family: inherit;
          }
          .card-actions .play-btn.play {
            background: var(--green); color: #fff;
          }
          .card-actions .play-btn.play:hover { background: var(--green2); }
          .card-actions .play-btn.pause {
            background: var(--redSoft); color: var(--red);
          }
          .card-actions .play-btn.pause:hover { background: var(--red); color: #fff; }

          .card-actions .fav-btn, .card-actions .share-btn {
            width: 38px; height: 38px; border-radius: 10px; border: 1px solid var(--line);
            background: var(--surface2); display: flex; align-items: center;
            justify-content: center; cursor: pointer; transition: all .2s;
          }
          .card-actions .fav-btn:hover { border-color: var(--red); color: var(--red); }
          .card-actions .fav-btn.is-fav { color: var(--red); border-color: var(--red); background: var(--redSoft); }
          .card-actions .share-btn:hover { border-color: var(--blue); color: var(--blue); }

          .signal-badge {
            position: absolute; top: 12px; right: 12px; display: flex;
            align-items: center; gap: 3px;
          }

          /* ---- player bar ---- */
          .player-bar {
            position: fixed; bottom: 60px; left: 50%; transform: translateX(-50%);
            width: min(100% - 32px, 960px); background: var(--surface);
            border: 1px solid var(--line); border-radius: 18px;
            box-shadow: var(--shadow2); z-index: 50;
            display: flex; align-items: center; gap: 14px;
            padding: 12px 20px; transition: all .3s var(--ease);
            backdrop-filter: blur(12px);
          }
          @media (max-width: 600px) {
            .player-bar { bottom: 72px; left: 8px; right: 8px; width: auto; transform: none; padding: 10px 14px; gap: 10px; }
          }

          .player-avatar {
            width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
            display: flex; align-items: center; justify-content: center;
            font-weight: 800; font-size: .75rem; color: #fff;
          }
          .player-info { flex: 1; min-width: 0; }
          .player-info .p-name { font-weight: 700; font-size: .85rem; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          .player-info .p-song { font-size: .72rem; color: var(--text3); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

          .player-center { display: flex; align-items: center; gap: 10px; }
          .player-center .big-play {
            width: 42px; height: 42px; border-radius: 50%; border: none;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: all .2s;
          }
          .player-center .big-play.on { background: var(--green); color: #fff; }
          .player-center .big-play.on:hover { background: var(--green2); transform: scale(1.06); }
          .player-center .big-play.off { background: var(--surface2); color: var(--text); border: 1px solid var(--line); }
          .player-center .big-play.off:hover { border-color: var(--green); color: var(--green); }

          .progress-track {
            width: 120px; height: 4px; background: var(--surface3); border-radius: 999px;
            overflow: hidden; position: relative;
          }
          .progress-fill {
            height: 100%; background: var(--green); border-radius: 999px;
            transition: width 1s linear;
          }
          .player-elapsed { font-size: .65rem; color: var(--text3); min-width: 28px; text-align: right; }

          .player-right { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
          .vol-wrap { display: flex; align-items: center; gap: 6px; }
          .vol-slider {
            -webkit-appearance: none; appearance: none; width: 72px; height: 4px;
            background: var(--surface3); border-radius: 999px; outline: none;
            cursor: pointer;
          }
          .vol-slider::-webkit-slider-thumb {
            -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%;
            background: var(--green); cursor: pointer; border: 2px solid var(--surface);
          }
          .vol-slider::-moz-range-thumb {
            width: 14px; height: 14px; border-radius: 50%;
            background: var(--green); cursor: pointer; border: 2px solid var(--surface);
          }
          .player-right .player-share {
            width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--line);
            background: var(--surface2); display: flex; align-items: center;
            justify-content: center; cursor: pointer; transition: all .2s;
          }
          .player-right .player-share:hover { border-color: var(--blue); color: var(--blue); }

          .radio-empty {
            grid-column: 1 / -1; text-align: center; padding: 48px 16px;
            color: var(--text3);
          }
          .radio-empty .empty-icon { margin-bottom: 12px; color: var(--line2); }

          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: .4; }
          }
          @keyframes pulseRing {
            0% { transform: scale(1); opacity: .5; }
            100% { transform: scale(1.25); opacity: 0; }
          }

          @media (max-width: 600px) {
            .player-bar .vol-wrap .vol-slider { display: none; }
          }
        `}</style>

        {/* ---- header ---- */}
        <div className="radio-header">
          <h1>
            <Radio size={26} style={{ color: 'var(--green)' }} />
            Live Radio
            <span className="live-dot" />
          </h1>
          <p>Listen to Kenya&apos;s top radio stations</p>
        </div>

        {/* ---- search ---- */}
        <label className="radio-search">
          <Radio size={16} style={{ color: 'var(--text3)', flexShrink: 0 }} />
          <input
            placeholder="Search stations, genres, cities..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </label>

        {/* ---- category tabs ---- */}
        <div className="cat-tabs">
          {CATEGORIES.map(c => (
            <button
              key={c}
              className={`cat-tab ${category === c ? 'active' : ''}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>

        {/* ---- station grid ---- */}
        <div className="station-grid">
          {filtered.length === 0 && (
            <div className="radio-empty">
              <Radio size={40} className="empty-icon" />
              <p>No stations match your search</p>
            </div>
          )}

          {filtered.map(station => {
            const isPlaying = playingId === station.id;
            const isFav = favorites.has(station.id);
            const track = nowPlaying[station.id] || station.nowPlaying;

            return (
              <div key={station.id} className={`station-card ${isPlaying ? 'now-playing' : ''}`}>
                <span className="signal-badge">{getSignalIcon(station.signal)}</span>

                <div className="card-top">
                  <div className="station-avatar" style={{ background: station.color }}>
                    {station.initials}
                    {isPlaying && <span className="pulse-ring" />}
                  </div>
                  <div className="card-name">{station.name}</div>
                  <div className="card-city">{station.city}</div>
                  <span className="genre-tag">
                    <Star size={10} /> {station.genre}
                  </span>
                </div>

                <div className="card-bottom">
                  <div className="now-text">
                    <Clock size={10} style={{ display: 'inline', verticalAlign: '-1px', marginRight: 4 }} />
                    <strong>NOW:</strong> {track}
                  </div>
                  <div className="card-actions">
                    <button
                      className={`play-btn ${isPlaying ? 'pause' : 'play'}`}
                      onClick={() => {
                        if (station.streamUrl) {
                          window.open(station.streamUrl, '_blank');
                        } else {
                          play(station.id);
                        }
                      }}
                    >
                      {isPlaying ? <Pause size={15} /> : station.streamUrl ? <ExternalLink size={15} /> : <Play size={15} />}
                      {isPlaying ? 'Pause' : station.streamUrl ? 'Open Stream' : 'Play'}
                    </button>
                    <button
                      className={`fav-btn ${isFav ? 'is-fav' : ''}`}
                      onClick={() => toggleFav(station.id)}
                      aria-label="Favorite"
                    >
                      <Heart size={15} fill={isFav ? 'currentColor' : 'none'} />
                    </button>
                    <button
                      className="share-btn"
                      onClick={() => showToast(`Link copied for ${station.name}`)}
                      aria-label="Share"
                    >
                      <Share2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ---- player bar ---- */}
        {activeStation && (
          <div className="player-bar">
            <div className="player-avatar" style={{ background: activeStation.color }}>
              {activeStation.initials}
            </div>

            <div className="player-info">
              <div className="p-name">{activeStation.name}</div>
              <div className="p-song">{nowPlaying[activeStation.id]}</div>
            </div>

            <div className="player-center">
              <button
                className={`big-play ${playingId ? 'on' : 'off'}`}
                onClick={() => {
                  if (activeStation.streamUrl) {
                    window.open(activeStation.streamUrl, '_blank');
                  } else {
                    play(activeStation.id);
                  }
                }}
              >
                {playingId ? <Pause size={18} /> : <Play size={18} />}
              </button>

              <span className="player-elapsed">
                {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
              </span>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
              </div>
            </div>

            <div className="player-right">
              <div className="vol-wrap">
                <button
                  className="icon-btn"
                  style={{ width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text2)' }}
                  onClick={() => setMuted(m => !m)}
                  aria-label="Toggle mute"
                >
                  {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={muted ? 0 : volume}
                  onChange={e => { setVolume(Number(e.target.value)); setMuted(false); }}
                  className="vol-slider"
                  aria-label="Volume"
                />
              </div>
              <button
                className="player-share"
                onClick={() => showToast(`Link copied for ${activeStation.name}`)}
                aria-label="Share station"
              >
                <Share2 size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

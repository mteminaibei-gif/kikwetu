'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import AppLayout from '@/components/AppLayout';
import { useApp } from '@/components/AppLayout';
import {
  Play, Pause, Volume2, VolumeX, Heart, Share2, SkipForward, SkipBack,
  Radio, Wifi, Clock, ExternalLink,
} from 'lucide-react';

/* ---------- types ---------- */
interface Station {
  id: number;
  name: string;
  genre: string;
  icon: string;
  color: string;
  show: string;
  hosts: string;
  song: string;
  listeners: number;
  streamUrl: string;
  isLive: boolean;
}

interface Podcast {
  id: number;
  title: string;
  host: string;
  episode: string;
  duration: string;
  icon: string;
  gradient: string;
}

interface ScheduleSlot {
  time: string;
  show: string;
  hosts: string;
  status: 'live' | 'done' | 'upcoming';
}

type GenreFilter = 'All' | 'Live' | 'Podcasts' | 'Music' | 'Talk' | 'News';

/* ---------- data ---------- */
const STATIONS: Station[] = [
  { id: 1, name: 'NRG Radio', genre: 'Urban / Gengetone', icon: '📻', color: 'var(--red-soft)', show: 'The Drive Show', hosts: 'Kamene & Obinna', song: 'Sauti Sol ft. Burna Boy — "Afrikan Star"', listeners: 4230, streamUrl: 'https://stream.nrgradio.co.ke/nrg.mp3', isLive: true },
  { id: 2, name: 'Kiss FM', genre: 'Pop / R&B / Hip Hop', icon: '🎙️', color: 'var(--gold-soft)', show: 'Evening Show', hosts: 'Ciku Muiruri', song: 'Bien — "Inauma"', listeners: 3100, streamUrl: 'https://live.kenyans.co.ke/kissfm', isLive: true },
  { id: 3, name: 'Citizen Radio', genre: 'News / Talk', icon: '🌿', color: 'var(--green-soft)', show: 'Jambo Kenya', hosts: 'Team Citizen', song: 'News update', listeners: 2800, streamUrl: 'https://live.citizentv.co.ke/radio', isLive: true },
  { id: 4, name: 'Capital FM', genre: 'International / Charts', icon: '🎵', color: 'var(--blue-soft)', show: 'Capital in the Morning', hosts: 'Capital Team', song: 'Top 40 Countdown', listeners: 2500, streamUrl: 'https://kenya.shoutcast.com/CapitalFM', isLive: true },
  { id: 5, name: 'Hope FM', genre: 'Gospel / Inspirational', icon: '✝️', color: 'var(--purple-soft)', show: 'Morning Devotion', hosts: 'Hope Team', song: 'Wahu — "God Over Everything"', listeners: 1800, streamUrl: 'https://live.hopefm.co.ke/hope.mp3', isLive: true },
  { id: 6, name: 'Clouds FM', genre: 'Bongo Flava / TZ', icon: '🥁', color: 'var(--earth-soft)', show: 'Bongo Hits', hosts: 'Clouds Team', song: 'Diamond — "Komasava"', listeners: 2200, streamUrl: 'https://live.clouds.co.ke/clouds.mp3', isLive: true },
  { id: 7, name: 'BBC Swahili', genre: 'News / Current Affairs', icon: '📰', color: 'oklch(90% .05 0)', show: 'Habari za Jioni', hosts: 'BBC Team', song: 'Latest headlines', listeners: 3500, streamUrl: 'https://stream.bbc.co.ke/swahili.mp3', isLive: true },
  { id: 8, name: 'Trace Mziki', genre: 'Afrobeats / Amapiano', icon: '🎶', color: 'oklch(90% .05 200)', show: 'AfroVibes Mix', hosts: 'DJ Trace', song: 'Burna Boy — "Last Last"', listeners: 2900, streamUrl: 'https://live.trace.fm/mziki.mp3', isLive: true },
  { id: 9, name: 'Classic 105', genre: 'Oldies / Classic Hits', icon: '🎸', color: 'var(--gold-soft)', show: 'Maina & Kingangi', hosts: 'Maina & Kingangi', song: 'Bob Marley — "Is This Love"', listeners: 2600, streamUrl: 'https://live.classic105.com/classic.mp3', isLive: true },
  { id: 10, name: 'Radio Jambo', genre: 'Gengetone / Urban', icon: '🎤', color: 'var(--red-soft)', show: 'Genge Tone Show', hosts: 'Pompi & crew', song: 'Navivi — "Sherehe"', listeners: 1900, streamUrl: 'https://live.radijambo.co.ke/jambo.mp3', isLive: false },
  { id: 11, name: 'Nation FM', genre: 'Talk / News / Business', icon: '📊', color: 'var(--blue-soft)', show: 'Business Today', hosts: 'Nation Team', song: 'Market update', listeners: 1500, streamUrl: 'https://live.nationmedia.com/nation.mp3', isLive: true },
  { id: 12, name: 'Homeboyz Radio', genre: 'Urban / Gengetone', icon: '🏠', color: 'var(--green-soft)', show: 'The Homeboyz Show', hosts: 'Jalango & team', song: 'Otile Brown — "Dusuma"', listeners: 2100, streamUrl: 'https://live.homeboyz.co.ke/homeboyz.mp3', isLive: false },
];

const PODCASTS: Podcast[] = [
  { id: 1, title: 'The Swahili Tech Pod', host: 'James Kariuki & Amani', episode: 'Ep. 47: AI in East Africa', duration: '42 min', icon: '🎧', gradient: 'linear-gradient(135deg, oklch(40% .1 158), oklch(55% .1 42))' },
  { id: 2, title: 'Hustler Diaries', host: 'Wambui Kamau', episode: 'Ep. 112: Side Hustle to Startup', duration: '38 min', icon: '💼', gradient: 'linear-gradient(135deg, oklch(50% .1 241), oklch(40% .1 310))' },
  { id: 3, title: 'Mama Afrika Stories', host: 'Fatuma Ali', episode: 'Ep. 89: Mombasa Old Town', duration: '55 min', icon: '🌍', gradient: 'linear-gradient(135deg, oklch(55% .12 42), oklch(45% .1 78))' },
];

const SCHEDULE: ScheduleSlot[] = [
  { time: '6:00 AM', show: 'Morning Vibes', hosts: 'DJ Kalonje — Wake-up mix', status: 'done' },
  { time: '10:00 AM', show: 'Mid-Morning Show', hosts: 'MC Jesse — Requests & interviews', status: 'done' },
  { time: '3:00 PM', show: 'The Drive Show', hosts: 'Kamene & Obinna — Entertainment & traffic', status: 'live' },
  { time: '7:00 PM', show: 'The Night Frequency', hosts: 'DJ Xclusive — Club mixes & new releases', status: 'upcoming' },
  { time: '10:00 PM', show: 'Late Night Love', hosts: 'Mwalimu Rachel — Slow jams & dedications', status: 'upcoming' },
];

const GENRE_FILTERS: GenreFilter[] = ['All', 'Live', 'Podcasts', 'Music', 'Talk', 'News'];

/* ---------- helpers ---------- */
function formatListeners(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

/* ================================================================ */
export default function RadioPage() {
  const { showToast } = useApp();

  const [activeGenre, setActiveGenre] = useState<GenreFilter>('All');
  const [playingId, setPlayingId] = useState<number | null>(null);
  const [volume, setVolume] = useState(75);
  const [muted, setMuted] = useState(false);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [showPodcasts, setShowPodcasts] = useState(true);

  /* --- load favorites from localStorage --- */
  useEffect(() => {
    try {
      const raw = localStorage.getItem('kikwetu-radio-favs');
      if (raw) setFavorites(new Set(JSON.parse(raw)));
    } catch { /* ignore */ }
  }, []);

  const persistFavs = useCallback((next: Set<number>) => {
    setFavorites(next);
    localStorage.setItem('kikwetu-radio-favs', JSON.stringify([...next]));
  }, []);

  const toggleFav = useCallback((id: number) => {
    persistFavs(
      favorites.has(id)
        ? new Set([...favorites].filter(x => x !== id))
        : new Set([...favorites, id]),
    );
    showToast(favorites.has(id) ? 'Removed from favorites' : 'Added to favorites');
  }, [favorites, persistFavs, showToast]);

  /* --- play / pause --- */
  const play = useCallback((id: number) => {
    setPlayingId(prev => prev === id ? null : id);
  }, []);

  const openStream = useCallback((station: Station) => {
    window.open(station.streamUrl, '_blank');
  }, []);

  /* --- filtered stations --- */
  const filtered = STATIONS.filter(s => {
    if (activeGenre === 'All') return true;
    if (activeGenre === 'Live') return s.isLive;
    if (activeGenre === 'Music') return s.genre.toLowerCase().includes('music') || s.genre.toLowerCase().includes('pop') || s.genre.toLowerCase().includes('urban') || s.genre.toLowerCase().includes('bongo') || s.genre.toLowerCase().includes('afrobeats') || s.genre.toLowerCase().includes('oldies') || s.genre.toLowerCase().includes('gengetone');
    if (activeGenre === 'Talk') return s.genre.toLowerCase().includes('talk') || s.genre.toLowerCase().includes('business');
    if (activeGenre === 'News') return s.genre.toLowerCase().includes('news');
    return true;
  });

  const activeStation = playingId ? STATIONS.find(s => s.id === playingId) : null;
  const liveStation = STATIONS[0]; // NRG Radio as the "now playing" hero

  return (
    <AppLayout>
      <div className="radio-page">

        {/* ---- styles ---- */}
        <style jsx global>{`
          .radio-page {
            padding-bottom: 120px;
            max-width: 1100px;
            margin: 0 auto;
          }

          /* Header */
          .radio-header { margin-bottom: 28px; }
          .radio-header h1 {
            font-family: 'Fraunces', serif;
            font-size: 2rem; font-weight: 700; color: var(--text);
            margin: 0 0 6px; letter-spacing: -0.02em;
          }
          .radio-header p { color: var(--text3); font-size: .9rem; margin: 0; }

          /* Genre Pills */
          .genre-pills {
            display: flex; gap: 8px; margin: 20px 0 24px;
            overflow-x: auto; padding-bottom: 4px;
            scrollbar-width: none;
          }
          .genre-pills::-webkit-scrollbar { display: none; }
          .genre-pill {
            padding: 7px 20px; border-radius: 999px; font-size: .82rem;
            font-weight: 600; white-space: nowrap; cursor: pointer;
            border: 1px solid var(--line); background: var(--surface);
            color: var(--text2); transition: all .2s; font-family: inherit;
          }
          .genre-pill:hover { background: var(--surface2); }
          .genre-pill.active {
            background: var(--green); color: #fff; border-color: var(--green);
          }

          /* Hero Card */
          .hero-card {
            position: relative; border-radius: 20px; overflow: hidden;
            background: linear-gradient(135deg, oklch(25% .08 158), oklch(20% .06 158));
            padding: 32px; margin-bottom: 36px; color: #fff;
          }
          .hero-card::before {
            content: ''; position: absolute; inset: 0;
            background: linear-gradient(135deg, rgba(0,0,0,.15), rgba(0,0,0,.35));
            pointer-events: none;
          }
          .hero-content { position: relative; z-index: 1; }

          .hero-top {
            display: flex; align-items: flex-start; justify-content: space-between;
            margin-bottom: 20px;
          }
          .hero-eq {
            display: flex; align-items: flex-end; gap: 3px; height: 32px;
          }
          .hero-eq .eq-bar {
            width: 5px; border-radius: 3px; background: var(--gold);
            animation: eqBounce .8s ease-in-out infinite alternate;
          }
          .hero-eq .eq-bar:nth-child(1) { height: 18px; animation-delay: 0s; }
          .hero-eq .eq-bar:nth-child(2) { height: 28px; animation-delay: .1s; }
          .hero-eq .eq-bar:nth-child(3) { height: 14px; animation-delay: .2s; }
          .hero-eq .eq-bar:nth-child(4) { height: 24px; animation-delay: .15s; }
          .hero-eq .eq-bar:nth-child(5) { height: 20px; animation-delay: .25s; }
          .hero-eq .eq-bar:nth-child(6) { height: 16px; animation-delay: .05s; }

          .live-badge {
            display: inline-flex; align-items: center; gap: 6px;
            background: var(--red); color: #fff; padding: 4px 12px;
            border-radius: 999px; font-size: .7rem; font-weight: 700;
            letter-spacing: .05em;
          }
          .live-badge .live-dot {
            width: 7px; height: 7px; border-radius: 50%; background: #fff;
            animation: livePulse 1.5s ease-in-out infinite;
          }

          .hero-station-icon {
            font-size: 2.2rem; margin-bottom: 8px; display: block;
          }
          .hero-station-name {
            font-family: 'Fraunces', serif; font-size: 1.5rem; font-weight: 700;
            margin: 0 0 4px;
          }
          .hero-show-name {
            font-size: .9rem; opacity: .85; margin: 0 0 2px;
          }
          .hero-song {
            font-size: .8rem; opacity: .65; margin: 0 0 16px;
          }
          .hero-listeners {
            display: inline-flex; align-items: center; gap: 6px;
            font-size: .78rem; opacity: .7; margin-bottom: 20px;
          }

          .hero-controls {
            display: flex; align-items: center; gap: 16px;
          }
          .hero-play {
            width: 52px; height: 52px; border-radius: 50%; border: none;
            background: var(--gold); color: #000; display: flex;
            align-items: center; justify-content: center; cursor: pointer;
            transition: all .2s; flex-shrink: 0;
          }
          .hero-play:hover { transform: scale(1.08); box-shadow: 0 4px 20px rgba(212,168,84,.4); }
          .hero-play svg { width: 22px; height: 22px; }

          .hero-volume {
            display: flex; align-items: center; gap: 8px; margin-left: auto;
          }
          .hero-vol-slider {
            -webkit-appearance: none; appearance: none; width: 80px; height: 4px;
            background: rgba(255,255,255,.25); border-radius: 999px; outline: none;
            cursor: pointer;
          }
          .hero-vol-slider::-webkit-slider-thumb {
            -webkit-appearance: none; width: 14px; height: 14px; border-radius: 50%;
            background: #fff; cursor: pointer;
          }
          .hero-vol-slider::-moz-range-thumb {
            width: 14px; height: 14px; border-radius: 50%;
            background: #fff; cursor: pointer; border: none;
          }

          /* Section titles */
          .section-title {
            font-family: 'Fraunces', serif; font-size: 1.15rem; font-weight: 700;
            color: var(--text); margin: 0 0 16px; letter-spacing: -0.01em;
          }

          /* Station Grid */
          .station-grid {
            display: grid; gap: 14px;
            grid-template-columns: repeat(4, 1fr);
            margin-bottom: 40px;
          }
          @media (max-width: 1100px) { .station-grid { grid-template-columns: repeat(3, 1fr); } }
          @media (max-width: 800px)  { .station-grid { grid-template-columns: repeat(2, 1fr); } }
          @media (max-width: 500px)  { .station-grid { grid-template-columns: 1fr; } }

          .station-card {
            background: var(--surface); border: 1px solid var(--line);
            border-radius: 14px; overflow: hidden; transition: all .25s var(--ease);
            display: flex; flex-direction: column; position: relative;
            padding: 14px;
          }
          .station-card:hover {
            transform: translateY(-3px); box-shadow: var(--shadow1);
          }
          .station-card.now-playing {
            border-color: var(--green);
          }
          .station-card.now-playing::before {
            content: ''; position: absolute; top: 0; left: 0; right: 0;
            height: 3px; background: linear-gradient(90deg, var(--green), var(--gold));
            border-radius: 14px 14px 0 0;
          }

          .card-icon {
            font-size: 1.8rem; margin-bottom: 10px;
          }
          .card-name {
            font-weight: 700; font-size: .88rem; color: var(--text);
            margin-bottom: 2px;
          }
          .card-genre {
            font-size: .72rem; color: var(--text3); margin-bottom: 8px;
          }
          .card-now {
            font-size: .7rem; color: var(--text3); margin-bottom: 10px;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          }
          .card-now strong { color: var(--text2); }

          .card-actions {
            display: flex; align-items: center; gap: 6px; margin-top: auto;
          }
          .card-play {
            width: 34px; height: 34px; border-radius: 10px; border: none;
            background: var(--green); color: #fff; display: flex;
            align-items: center; justify-content: center; cursor: pointer;
            transition: all .2s; flex-shrink: 0;
          }
          .card-play:hover { background: var(--green2); transform: scale(1.06); }
          .card-play.playing { background: var(--red); }
          .card-play.playing:hover { background: var(--red2); }
          .card-play svg { width: 16px; height: 16px; }

          .card-fav {
            width: 34px; height: 34px; border-radius: 10px; border: 1px solid var(--line);
            background: var(--surface2); display: flex; align-items: center;
            justify-content: center; cursor: pointer; transition: all .2s;
            margin-left: auto;
          }
          .card-fav:hover { border-color: var(--red); color: var(--red); }
          .card-fav.is-fav { color: var(--red); border-color: var(--red); background: var(--redSoft); }
          .card-fav svg { width: 15px; height: 15px; }

          .card-listeners {
            font-size: .68rem; color: var(--text3); display: flex;
            align-items: center; gap: 4px; margin-top: 8px;
          }
          .card-listeners .live-dot {
            width: 6px; height: 6px; border-radius: 50%; background: var(--green);
          }

          /* Podcasts Grid */
          .podcasts-grid {
            display: grid; gap: 16px;
            grid-template-columns: repeat(3, 1fr);
            margin-bottom: 40px;
          }
          @media (max-width: 900px) { .podcasts-grid { grid-template-columns: repeat(2, 1fr); } }
          @media (max-width: 500px) { .podcasts-grid { grid-template-columns: 1fr; } }

          .podcast-card {
            background: var(--surface); border: 1px solid var(--line);
            border-radius: 14px; overflow: hidden; transition: all .25s var(--ease);
            cursor: pointer;
          }
          .podcast-card:hover {
            transform: translateY(-3px); box-shadow: var(--shadow1);
          }
          .podcast-art {
            height: 100px; display: flex; align-items: center; justify-content: center;
            font-size: 2.5rem;
          }
          .podcast-info {
            padding: 14px;
          }
          .podcast-title {
            font-weight: 700; font-size: .88rem; color: var(--text);
            margin-bottom: 4px;
          }
          .podcast-host {
            font-size: .72rem; color: var(--text3); margin-bottom: 6px;
          }
          .podcast-episode {
            font-size: .76rem; color: var(--text2); margin-bottom: 6px;
          }
          .podcast-duration {
            font-size: .68rem; color: var(--text3);
          }

          /* Schedule */
          .schedule-list {
            background: var(--surface); border: 1px solid var(--line);
            border-radius: 14px; overflow: hidden; margin-bottom: 20px;
          }
          .schedule-item {
            display: flex; align-items: center; gap: 14px;
            padding: 14px 18px;
            border-bottom: 1px solid var(--line);
            transition: background .2s;
          }
          .schedule-item:last-child { border-bottom: none; }
          .schedule-item:hover { background: var(--surface2); }
          .schedule-item.live {
            background: oklch(96% .02 158);
            border-left: 3px solid var(--green);
          }

          .schedule-time {
            font-size: .78rem; font-weight: 600; color: var(--text2);
            min-width: 72px; white-space: nowrap;
          }
          .schedule-show {
            font-weight: 700; font-size: .88rem; color: var(--text);
            margin-bottom: 2px;
          }
          .schedule-hosts {
            font-size: .72rem; color: var(--text3);
          }
          .schedule-status {
            margin-left: auto; flex-shrink: 0;
          }
          .status-badge {
            display: inline-flex; align-items: center; gap: 5px;
            padding: 3px 10px; border-radius: 999px; font-size: .68rem;
            font-weight: 700; letter-spacing: .03em;
          }
          .status-badge.live {
            background: var(--red); color: #fff;
          }
          .status-badge.live .status-dot {
            width: 6px; height: 6px; border-radius: 50%; background: #fff;
            animation: livePulse 1.5s ease-in-out infinite;
          }
          .status-badge.done {
            background: var(--surface2); color: var(--text3);
          }
          .status-badge.upcoming {
            background: var(--surface2); color: var(--text3);
          }

          /* Sticky Player Bar */
          .player-bar {
            position: fixed; bottom: 0; left: 0; right: 0;
            background: var(--surface); border-top: 1px solid var(--line);
            box-shadow: 0 -4px 20px rgba(0,0,0,.08);
            z-index: 100; padding: 10px 24px;
            display: flex; align-items: center; gap: 16px;
            backdrop-filter: blur(16px);
          }
          @media (max-width: 600px) {
            .player-bar { padding: 8px 12px; gap: 10px; }
          }

          .player-info {
            display: flex; align-items: center; gap: 10px; min-width: 0; flex: 1;
          }
          .player-icon {
            font-size: 1.5rem; flex-shrink: 0;
          }
          .player-text { min-width: 0; }
          .player-name {
            font-weight: 700; font-size: .82rem; color: var(--text);
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
          }
          .player-song {
            font-size: .7rem; color: var(--text3); white-space: nowrap;
            overflow: hidden; text-overflow: ellipsis;
          }

          .player-controls {
            display: flex; align-items: center; gap: 8px; flex-shrink: 0;
          }
          .player-btn {
            width: 36px; height: 36px; border-radius: 50%; border: none;
            display: flex; align-items: center; justify-content: center;
            cursor: pointer; transition: all .2s; background: var(--surface2);
            color: var(--text2);
          }
          .player-btn:hover { background: var(--surface3); color: var(--text); }
          .player-btn.main {
            width: 42px; height: 42px; background: var(--green); color: #fff;
          }
          .player-btn.main:hover { background: var(--green2); transform: scale(1.06); }
          .player-btn.main svg { width: 18px; height: 18px; }
          .player-btn svg { width: 16px; height: 16px; }

          .player-right {
            display: flex; align-items: center; gap: 10px; flex-shrink: 0;
          }
          .player-eq {
            display: flex; align-items: flex-end; gap: 2px; height: 18px;
          }
          .player-eq .pe-bar {
            width: 3px; border-radius: 2px; background: var(--green);
            animation: eqBounce .6s ease-in-out infinite alternate;
          }
          .player-eq .pe-bar:nth-child(1) { height: 10px; animation-delay: 0s; }
          .player-eq .pe-bar:nth-child(2) { height: 14px; animation-delay: .1s; }
          .player-eq .pe-bar:nth-child(3) { height: 8px; animation-delay: .2s; }
          .player-eq .pe-bar:nth-child(4) { height: 12px; animation-delay: .15s; }

          .player-vol-wrap {
            display: flex; align-items: center; gap: 6px;
          }
          .player-vol-btn {
            width: 30px; height: 30px; border-radius: 8px; border: none;
            background: none; color: var(--text2); cursor: pointer;
            display: flex; align-items: center; justify-content: center;
            transition: color .2s;
          }
          .player-vol-btn:hover { color: var(--text); }
          .player-vol-btn svg { width: 16px; height: 16px; }
          .player-vol-slider {
            -webkit-appearance: none; appearance: none; width: 72px; height: 4px;
            background: var(--surface3); border-radius: 999px; outline: none;
            cursor: pointer;
          }
          .player-vol-slider::-webkit-slider-thumb {
            -webkit-appearance: none; width: 12px; height: 12px; border-radius: 50%;
            background: var(--green); cursor: pointer;
          }
          .player-vol-slider::-moz-range-thumb {
            width: 12px; height: 12px; border-radius: 50%;
            background: var(--green); cursor: pointer; border: none;
          }

          .player-fav {
            width: 34px; height: 34px; border-radius: 10px; border: 1px solid var(--line);
            background: var(--surface2); display: flex; align-items: center;
            justify-content: center; cursor: pointer; transition: all .2s;
          }
          .player-fav:hover { border-color: var(--red); color: var(--red); }
          .player-fav.is-fav { color: var(--red); border-color: var(--red); background: var(--redSoft); }
          .player-fav svg { width: 15px; height: 15px; }

          @media (max-width: 700px) {
            .player-vol-wrap { display: none; }
          }

          /* Animations */
          @keyframes eqBounce {
            0% { transform: scaleY(1); }
            100% { transform: scaleY(.4); }
          }
          @keyframes livePulse {
            0%, 100% { opacity: 1; }
            50% { opacity: .4; }
          }
        `}</style>

        {/* ---- header ---- */}
        <div className="radio-header">
          <h1>Radio</h1>
          <p>Live stations, podcasts, and shows from across East Africa.</p>
        </div>

        {/* ---- genre pills ---- */}
        <div className="genre-pills">
          {GENRE_FILTERS.map(g => (
            <button
              key={g}
              className={`genre-pill ${activeGenre === g ? 'active' : ''}`}
              onClick={() => {
                setActiveGenre(g);
                setShowPodcasts(g === 'All' || g === 'Podcasts');
              }}
            >
              {g}
            </button>
          ))}
        </div>

        {/* ---- hero now playing ---- */}
        <div className="hero-card">
          <div className="hero-content">
            <div className="hero-top">
              <div className="hero-eq">
                {[1,2,3,4,5,6].map(i => <span key={i} className="eq-bar" />)}
              </div>
              <span className="live-badge"><span className="live-dot" /> LIVE NOW</span>
            </div>
            <span className="hero-station-icon">{liveStation.icon}</span>
            <h2 className="hero-station-name">{liveStation.name}</h2>
            <p className="hero-show-name">{liveStation.show} &middot; {liveStation.hosts}</p>
            <p className="hero-song">{liveStation.song}</p>
            <div className="hero-listeners">
              <Wifi size={14} /> {formatListeners(liveStation.listeners)} listeners
            </div>
            <div className="hero-controls">
              <button className="hero-play" onClick={() => openStream(liveStation)}>
                {playingId === liveStation.id ? <Pause /> : <Play />}
              </button>
              <div className="hero-volume">
                <button
                  className="player-vol-btn"
                  onClick={() => setMuted(m => !m)}
                  style={{ color: 'rgba(255,255,255,.7)' }}
                >
                  {muted ? <VolumeX /> : <Volume2 />}
                </button>
                <input
                  type="range" min={0} max={100}
                  value={muted ? 0 : volume}
                  onChange={e => { setVolume(Number(e.target.value)); setMuted(false); }}
                  className="hero-vol-slider"
                  aria-label="Volume"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ---- live stations grid ---- */}
        <h2 className="section-title">Live Stations</h2>
        <div className="station-grid">
          {filtered.map(station => {
            const isPlaying = playingId === station.id;
            const isFav = favorites.has(station.id);

            return (
              <div key={station.id} className={`station-card ${isPlaying ? 'now-playing' : ''}`}>
                <span className="card-icon">{station.icon}</span>
                <div className="card-name">{station.name}</div>
                <div className="card-genre">{station.genre}</div>
                <div className="card-now">
                  <strong>NOW:</strong> {station.song}
                </div>
                <div className="card-actions">
                  <button
                    className={`card-play ${isPlaying ? 'playing' : ''}`}
                    onClick={() => openStream(station)}
                    title={station.isLive ? 'Open stream' : 'Offline'}
                  >
                    {isPlaying ? <Pause /> : <Play />}
                  </button>
                  <button
                    className={`card-fav ${isFav ? 'is-fav' : ''}`}
                    onClick={() => toggleFav(station.id)}
                    aria-label="Favorite"
                  >
                    <Heart fill={isFav ? 'currentColor' : 'none'} />
                  </button>
                </div>
                <div className="card-listeners">
                  {station.isLive && <span className="live-dot" />}
                  {formatListeners(station.listeners)} listeners
                </div>
              </div>
            );
          })}
        </div>

        {/* ---- popular podcasts ---- */}
        {showPodcasts && (
          <>
            <h2 className="section-title">Popular Podcasts</h2>
            <div className="podcasts-grid">
              {PODCASTS.map(p => (
                <div key={p.id} className="podcast-card">
                  <div className="podcast-art" style={{ background: p.gradient }}>
                    {p.icon}
                  </div>
                  <div className="podcast-info">
                    <div className="podcast-title">{p.title}</div>
                    <div className="podcast-host">{p.host}</div>
                    <div className="podcast-episode">{p.episode}</div>
                    <div className="podcast-duration">{p.duration}</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ---- today's schedule ---- */}
        <h2 className="section-title">Today&apos;s Schedule</h2>
        <div className="schedule-list">
          {SCHEDULE.map((slot, i) => (
            <div key={i} className={`schedule-item ${slot.status === 'live' ? 'live' : ''}`}>
              <div className="schedule-time">{slot.time}</div>
              <div>
                <div className="schedule-show">{slot.show}</div>
                <div className="schedule-hosts">{slot.hosts}</div>
              </div>
              <div className="schedule-status">
                <span className={`status-badge ${slot.status}`}>
                  {slot.status === 'live' && <span className="status-dot" />}
                  {slot.status === 'live' ? 'LIVE' : slot.status === 'done' ? 'Ended' : 'Upcoming'}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* ---- sticky player bar ---- */}
        {activeStation && (
          <div className="player-bar">
            <div className="player-info">
              <span className="player-icon">{activeStation.icon}</span>
              <div className="player-text">
                <div className="player-name">{activeStation.name}</div>
                <div className="player-song">{activeStation.song}</div>
              </div>
            </div>

            <div className="player-controls">
              <button className="player-btn" aria-label="Previous">
                <SkipBack />
              </button>
              <button
                className="player-btn main"
                onClick={() => openStream(activeStation)}
              >
                {playingId === activeStation.id ? <Pause /> : <Play />}
              </button>
              <button className="player-btn" aria-label="Next">
                <SkipForward />
              </button>
            </div>

            <div className="player-right">
              <div className="player-eq">
                <span className="pe-bar" /><span className="pe-bar" />
                <span className="pe-bar" /><span className="pe-bar" />
              </div>
              <div className="player-vol-wrap">
                <button
                  className="player-vol-btn"
                  onClick={() => setMuted(m => !m)}
                  aria-label="Toggle mute"
                >
                  {muted ? <VolumeX /> : <Volume2 />}
                </button>
                <input
                  type="range" min={0} max={100}
                  value={muted ? 0 : volume}
                  onChange={e => { setVolume(Number(e.target.value)); setMuted(false); }}
                  className="player-vol-slider"
                  aria-label="Volume"
                />
              </div>
              <button
                className={`player-fav ${favorites.has(activeStation.id) ? 'is-fav' : ''}`}
                onClick={() => toggleFav(activeStation.id)}
                aria-label="Favorite"
              >
                <Heart fill={favorites.has(activeStation.id) ? 'currentColor' : 'none'} />
              </button>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

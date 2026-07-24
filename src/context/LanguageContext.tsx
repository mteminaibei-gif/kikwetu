'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';

export type ContentLanguage = 'en' | 'sw';

interface LanguageContextType {
  contentLang: ContentLanguage;
  setContentLang: (lang: ContentLanguage) => void;
  uiLang: ContentLanguage;
  setUiLang: (lang: ContentLanguage) => void;
  tr: (en: string, sw: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const CONTENT_LANG_KEY = 'kikwetu_content_lang';
const UI_LANG_KEY = 'kikwetu_ui_lang';

// Helper to get initial value from localStorage (synchronous, runs during render)
function getInitialLang(key: string, defaultLang: ContentLanguage): ContentLanguage {
  if (typeof window === 'undefined') return defaultLang;
  try {
    const saved = localStorage.getItem(key) as ContentLanguage | null;
    return saved || defaultLang;
  } catch {
    return defaultLang;
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [contentLang, setContentLangState] = useState<ContentLanguage>(() => getInitialLang(CONTENT_LANG_KEY, 'en'));
  const [uiLang, setUiLangState] = useState<ContentLanguage>(() => getInitialLang(UI_LANG_KEY, 'en'));

  const setContentLang = useCallback((lang: ContentLanguage) => {
    setContentLangState(lang);
    try { localStorage.setItem(CONTENT_LANG_KEY, lang); } catch {}
  }, []);

  const setUiLang = useCallback((lang: ContentLanguage) => {
    setUiLangState(lang);
    try { localStorage.setItem(UI_LANG_KEY, lang); } catch {}
  }, []);

  const tr = useCallback((en: string, sw: string) => {
    return contentLang === 'sw' ? sw : en;
  }, [contentLang]);

  return (
    <LanguageContext.Provider value={{ contentLang, setContentLang, uiLang, setUiLang, tr }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}

export function useContentLang() {
  const { contentLang, setContentLang, tr } = useLanguage();
  return { contentLang, setContentLang, tr };
}

export function useUiLang() {
  const { uiLang, setUiLang, tr } = useLanguage();
  return { uiLang, setUiLang, tr };
}
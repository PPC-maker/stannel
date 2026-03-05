'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Accessibility,
  X,
  ZoomIn,
  ZoomOut,
  Contrast,
  MousePointer2,
  Link2,
  RotateCcw,
  Type
} from 'lucide-react';

interface AccessibilitySettings {
  fontSize: number;
  highContrast: boolean;
  highlightLinks: boolean;
  bigCursor: boolean;
}

const defaultSettings: AccessibilitySettings = {
  fontSize: 100,
  highContrast: false,
  highlightLinks: false,
  bigCursor: false,
};

export default function AccessibilityWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>(defaultSettings);

  useEffect(() => {
    const saved = localStorage.getItem('accessibility-settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      setSettings(parsed);
      applySettings(parsed);
    }
  }, []);

  const applySettings = (newSettings: AccessibilitySettings) => {
    const html = document.documentElement;
    html.style.fontSize = `${newSettings.fontSize}%`;

    if (newSettings.highContrast) {
      html.classList.add('high-contrast');
    } else {
      html.classList.remove('high-contrast');
    }

    if (newSettings.highlightLinks) {
      html.classList.add('highlight-links');
    } else {
      html.classList.remove('highlight-links');
    }

    if (newSettings.bigCursor) {
      html.classList.add('big-cursor');
    } else {
      html.classList.remove('big-cursor');
    }
  };

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('accessibility-settings', JSON.stringify(newSettings));
    applySettings(newSettings);
  };

  const increaseFontSize = () => {
    if (settings.fontSize < 150) {
      updateSetting('fontSize', settings.fontSize + 10);
    }
  };

  const decreaseFontSize = () => {
    if (settings.fontSize > 80) {
      updateSetting('fontSize', settings.fontSize - 10);
    }
  };

  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem('accessibility-settings');
    applySettings(defaultSettings);
  };

  const toggleSetting = (key: keyof Omit<AccessibilitySettings, 'fontSize'>) => {
    updateSetting(key, !settings[key]);
  };

  return (
    <>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-gold-400 to-gold-600 text-primary-900 shadow-lg flex items-center justify-center hover:scale-110 transition-transform"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        aria-label="פתח תפריט נגישות"
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={24} /> : <Accessibility size={24} />}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.9 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-24 right-6 z-50 w-72 glass-card p-4"
            >
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Accessibility size={20} className="text-gold-400" />
                הגדרות נגישות
              </h3>

              <div className="space-y-3">
                {/* Font Size */}
                <div className="flex items-center justify-between">
                  <span className="text-white/70 text-sm flex items-center gap-2">
                    <Type size={16} />
                    גודל טקסט
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={decreaseFontSize}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors disabled:opacity-50"
                      aria-label="הקטן טקסט"
                      disabled={settings.fontSize <= 80}
                    >
                      <ZoomOut size={16} />
                    </button>
                    <span className="text-white text-sm w-12 text-center">
                      {settings.fontSize}%
                    </span>
                    <button
                      onClick={increaseFontSize}
                      className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors disabled:opacity-50"
                      aria-label="הגדל טקסט"
                      disabled={settings.fontSize >= 150}
                    >
                      <ZoomIn size={16} />
                    </button>
                  </div>
                </div>

                {/* High Contrast */}
                <button
                  onClick={() => toggleSetting('highContrast')}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    settings.highContrast ? 'bg-gold-500/20 border border-gold-500/50' : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <span className="text-white/70 text-sm flex items-center gap-2">
                    <Contrast size={16} />
                    ניגודיות גבוהה
                  </span>
                  <div className={`w-10 h-6 rounded-full transition-colors ${
                    settings.highContrast ? 'bg-gold-500' : 'bg-white/20'
                  }`}>
                    <div className={`w-4 h-4 rounded-full bg-white mt-1 transition-transform ${
                      settings.highContrast ? 'translate-x-1' : 'translate-x-5'
                    }`} />
                  </div>
                </button>

                {/* Highlight Links */}
                <button
                  onClick={() => toggleSetting('highlightLinks')}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    settings.highlightLinks ? 'bg-gold-500/20 border border-gold-500/50' : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <span className="text-white/70 text-sm flex items-center gap-2">
                    <Link2 size={16} />
                    הדגשת קישורים
                  </span>
                  <div className={`w-10 h-6 rounded-full transition-colors ${
                    settings.highlightLinks ? 'bg-gold-500' : 'bg-white/20'
                  }`}>
                    <div className={`w-4 h-4 rounded-full bg-white mt-1 transition-transform ${
                      settings.highlightLinks ? 'translate-x-1' : 'translate-x-5'
                    }`} />
                  </div>
                </button>

                {/* Big Cursor */}
                <button
                  onClick={() => toggleSetting('bigCursor')}
                  className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                    settings.bigCursor ? 'bg-gold-500/20 border border-gold-500/50' : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  <span className="text-white/70 text-sm flex items-center gap-2">
                    <MousePointer2 size={16} />
                    סמן גדול
                  </span>
                  <div className={`w-10 h-6 rounded-full transition-colors ${
                    settings.bigCursor ? 'bg-gold-500' : 'bg-white/20'
                  }`}>
                    <div className={`w-4 h-4 rounded-full bg-white mt-1 transition-transform ${
                      settings.bigCursor ? 'translate-x-1' : 'translate-x-5'
                    }`} />
                  </div>
                </button>

                {/* Reset */}
                <button
                  onClick={resetSettings}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 text-sm transition-colors mt-4"
                >
                  <RotateCcw size={16} />
                  איפוס הגדרות
                </button>
              </div>

              <a
                href="/accessibility"
                className="block mt-4 text-center text-gold-400 text-sm hover:underline"
              >
                הצהרת נגישות מלאה
              </a>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

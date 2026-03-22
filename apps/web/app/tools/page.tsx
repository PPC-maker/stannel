'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/layout/GlassCard';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
import {
  Palette,
  Briefcase,
  Phone,
  Mail,
  Globe,
  ExternalLink,
  Wrench,
  Users,
} from 'lucide-react';
import { useServiceProviders, useServiceProviderCategories } from '@/lib/api-hooks';
import { useAuth } from '@/lib/auth-context';
import { useAuthGuard, AuthGuardLoader } from '@/lib/useAuthGuard';

// Nirlat color families
const COLOR_FAMILIES = [
  { name: 'אדומים', key: 'red', colors: [
    { name: 'IS 0062', hex: '#C0392B' },
    { name: 'IS 0063', hex: '#E74C3C' },
    { name: 'IS 0064', hex: '#D35400' },
    { name: 'IS 0065', hex: '#CB4335' },
    { name: 'IS 0066', hex: '#B03A2E' },
  ]},
  { name: 'כתומים', key: 'orange', colors: [
    { name: 'IS 0030', hex: '#E67E22' },
    { name: 'IS 0031', hex: '#D35400' },
    { name: 'IS 0032', hex: '#F39C12' },
    { name: 'IS 0033', hex: '#E59866' },
  ]},
  { name: 'צהובים', key: 'yellow', colors: [
    { name: 'IS 0020', hex: '#F4D03F' },
    { name: 'IS 0021', hex: '#F7DC6F' },
    { name: 'IS 0022', hex: '#D4AC0D' },
    { name: 'IS 0023', hex: '#E8C03B' },
  ]},
  { name: 'ירוקים', key: 'green', colors: [
    { name: 'IS 0080', hex: '#27AE60' },
    { name: 'IS 0081', hex: '#2ECC71' },
    { name: 'IS 0082', hex: '#1E8449' },
    { name: 'IS 0083', hex: '#A9DFBF' },
  ]},
  { name: 'כחולים', key: 'blue', colors: [
    { name: 'IS 0070', hex: '#2E86C1' },
    { name: 'IS 0071', hex: '#3498DB' },
    { name: 'IS 0072', hex: '#1A5276' },
    { name: 'IS 0073', hex: '#85C1E9' },
  ]},
  { name: 'סגולים', key: 'purple', colors: [
    { name: 'IS 0090', hex: '#8E44AD' },
    { name: 'IS 0091', hex: '#9B59B6' },
    { name: 'IS 0092', hex: '#6C3483' },
    { name: 'IS 0093', hex: '#BB8FCE' },
  ]},
  { name: 'אפורים', key: 'gray', colors: [
    { name: 'IS 0010', hex: '#7F8C8D' },
    { name: 'IS 0011', hex: '#95A5A6' },
    { name: 'IS 0012', hex: '#5D6D7E' },
    { name: 'IS 0013', hex: '#ABB2B9' },
  ]},
  { name: 'לבנים', key: 'white', colors: [
    { name: 'IS 0001', hex: '#FDFEFE' },
    { name: 'IS 0002', hex: '#F8F9F9' },
    { name: 'IS 0003', hex: '#F2F3F4' },
    { name: 'IS 0004', hex: '#EAEDED' },
  ]},
];

const CATEGORY_LABELS: Record<string, string> = {
  CONTRACTOR: 'קבלן',
  ELECTRICIAN: 'חשמלאי',
  PLUMBER: 'אינסטלטור',
  PAINTER: 'צבעי',
  CARPENTER: 'נגר',
  LANDSCAPER: 'גנן',
  INTERIOR_DESIGNER: 'מעצב פנים',
  OTHER: 'אחר',
};

export default function ToolsPage() {
  const { isReady } = useAuthGuard();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'colors' | 'providers'>('colors');
  const [selectedColor, setSelectedColor] = useState<{ name: string; hex: string } | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  const { data: providersData, isLoading: providersLoading } = useServiceProviders(selectedCategory);
  const { data: categoriesData } = useServiceProviderCategories();

  const providers = providersData?.data || [];
  const categories = categoriesData?.categories || [];

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  // Only architects can access tools
  if (user?.role !== 'ARCHITECT') {
    return (
      <div className="relative">
        <PageSlider images={sliderImages.dashboard} />
        <div className="p-6 max-w-4xl mx-auto relative z-10 text-center py-20">
          <Wrench size={64} className="mx-auto text-white/20 mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">גישה מוגבלת</h1>
          <p className="text-white/60">עמוד זה זמין לאדריכלים בלבד</p>
        </div>
      </div>
    );
  }

  const TABS = [
    { key: 'colors' as const, label: 'מניפת צבעים', icon: Palette },
    { key: 'providers' as const, label: 'נותני שירות', icon: Users },
  ];

  return (
    <div className="relative">
      <PageSlider images={sliderImages.dashboard} />
      <div className="p-6 max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <Wrench className="text-gold-400" />
            כלים לאדריכלים
          </h1>
          <p className="text-white/60 mt-1">מניפות צבעים ונותני שירות</p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-6"
        >
          <div className="flex gap-2">
            {TABS.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-gold-400 text-primary-900'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white'
                }`}
              >
                <tab.icon size={18} />
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Color Catalog */}
        {activeTab === 'colors' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Palette size={20} className="text-gold-400" />
                  קטלוג צבעי נירלאט
                </h2>
                <a
                  href="https://nirlat.com/fan/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-white/60 hover:text-gold-400 transition-colors"
                >
                  <ExternalLink size={16} />
                  מניפה מלאה באתר נירלאט
                </a>
              </div>

              {selectedColor && (
                <div className="mb-6 p-4 bg-white/10 rounded-xl flex items-center gap-4">
                  <div
                    className="w-16 h-16 rounded-lg border-2 border-white/20"
                    style={{ backgroundColor: selectedColor.hex }}
                  />
                  <div>
                    <p className="text-white font-medium">{selectedColor.name}</p>
                    <p className="text-white/50 text-sm">HEX: {selectedColor.hex}</p>
                  </div>
                  <button
                    onClick={() => setSelectedColor(null)}
                    className="mr-auto text-white/40 hover:text-white text-sm"
                  >
                    סגור
                  </button>
                </div>
              )}

              <div className="space-y-6">
                {COLOR_FAMILIES.map((family, familyIndex) => (
                  <motion.div
                    key={family.key}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: familyIndex * 0.05 }}
                    className="bg-white/5 rounded-xl p-4"
                  >
                    <p className="text-white/60 text-sm uppercase tracking-wider mb-3 font-medium">
                      {family.name}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {family.colors.map(color => (
                        <button
                          key={color.name}
                          onClick={() => setSelectedColor(color)}
                          className={`group relative transition-transform hover:scale-110 ${
                            selectedColor?.hex === color.hex ? 'ring-2 ring-gold-400 ring-offset-2 ring-offset-primary-900' : ''
                          }`}
                          title={`${color.name} — ${color.hex}`}
                        >
                          <div
                            className="w-12 h-12 rounded-lg border border-white/20"
                            style={{ backgroundColor: color.hex }}
                          />
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {/* Service Providers */}
        {activeTab === 'providers' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                  <Users size={20} className="text-gold-400" />
                  נותני שירות
                </h2>
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => setSelectedCategory(undefined)}
                  className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                    !selectedCategory
                      ? 'bg-gold-400 text-primary-900'
                      : 'bg-white/10 text-white/70 hover:bg-white/20'
                  }`}
                >
                  הכל
                </button>
                {categories.map(cat => (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                      selectedCategory === cat.value
                        ? 'bg-gold-400 text-primary-900'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {providersLoading ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-4 animate-pulse">
                      <div className="h-5 w-32 bg-white/10 rounded mb-3" />
                      <div className="h-4 w-48 bg-white/5 rounded mb-2" />
                      <div className="h-3 w-24 bg-white/5 rounded" />
                    </div>
                  ))}
                </div>
              ) : providers.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase size={48} className="mx-auto text-white/20 mb-4" />
                  <p className="text-white/50">אין נותני שירות בקטגוריה זו</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {providers.map((provider: any, index: number) => (
                    <motion.div
                      key={provider.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="bg-white/5 rounded-xl p-4 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-white font-medium">{provider.name}</p>
                        {provider.isVerified && (
                          <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">
                            מאומת
                          </span>
                        )}
                      </div>
                      <p className="text-white/40 text-xs mb-2">
                        {CATEGORY_LABELS[provider.category] || provider.category}
                      </p>
                      {provider.description && (
                        <p className="text-white/60 text-sm mb-3">{provider.description}</p>
                      )}
                      <div className="space-y-1.5">
                        {provider.phone && (
                          <a
                            href={`tel:${provider.phone}`}
                            className="flex items-center gap-2 text-sm text-white/50 hover:text-gold-400 transition-colors"
                          >
                            <Phone size={14} /> {provider.phone}
                          </a>
                        )}
                        {provider.email && (
                          <a
                            href={`mailto:${provider.email}`}
                            className="flex items-center gap-2 text-sm text-white/50 hover:text-gold-400 transition-colors"
                          >
                            <Mail size={14} /> {provider.email}
                          </a>
                        )}
                        {provider.website && (
                          <a
                            href={provider.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-white/50 hover:text-gold-400 transition-colors"
                          >
                            <Globe size={14} /> אתר
                          </a>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </GlassCard>
          </motion.div>
        )}
      </div>
    </div>
  );
}

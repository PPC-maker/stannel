'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/layout/GlassCard';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
import { Calendar, MapPin, Users, Clock, CheckCircle, Loader2 } from 'lucide-react';

// Helper to check if URL is a valid image URL
function isValidImageUrl(url: string | undefined): boolean {
  if (!url) return false;
  // Check if URL ends with common image extensions or is from known image hosts
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|avif|svg)(\?.*)?$/i;
  const imageHosts = ['images.unsplash.com', 'unsplash.com', 'storage.googleapis.com', 'cloudinary.com', 'imgur.com'];
  try {
    const parsedUrl = new URL(url);
    return imageExtensions.test(parsedUrl.pathname) || imageHosts.some(host => parsedUrl.hostname.includes(host));
  } catch {
    return false;
  }
}
import { useEvents, useRegisterForEvent } from '@/lib/api-hooks';
import { useAuthGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import Swal from 'sweetalert2';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('he-IL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function EventsPage() {
  const { isReady } = useAuthGuard();
  const [registeredEvents, setRegisteredEvents] = useState<string[]>([]);
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  const { data: eventsResponse, isLoading } = useEvents();
  const registerMutation = useRegisterForEvent();

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  // לא חוסמים - מציגים מיידית
  const events = (eventsResponse as any)?.data || eventsResponse || [];

  const handleRegister = async (eventId: string) => {
    setRegisteringId(eventId);
    try {
      await registerMutation.mutateAsync(eventId);
      setRegisteredEvents([...registeredEvents, eventId]);
      Swal.fire({
        title: 'נרשמת בהצלחה!',
        text: 'ההרשמה לאירוע בוצעה בהצלחה',
        icon: 'success',
        confirmButtonText: 'אישור',
        background: '#1a1a2e',
        color: '#fff',
      });
    } catch (error: any) {
      Swal.fire({
        title: 'שגיאה',
        text: error.message || 'שגיאה בהרשמה לאירוע',
        icon: 'error',
        confirmButtonText: 'אישור',
        background: '#1a1a2e',
        color: '#fff',
      });
    } finally {
      setRegisteringId(null);
    }
  };

  const isRegistered = (eventId: string) => registeredEvents.includes(eventId);

  const isFull = (event: any) => event.registered >= event.capacity;

  return (
    <div className="relative bg-[#F8FAFC] min-h-screen">
      <PageSlider images={sliderImages.events} />
      <div className="p-6 max-w-7xl mx-auto relative z-10">
      {/* Header */}
      <div className="mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-display font-bold text-gray-900">אירועים</h1>
          <p className="text-gray-600 mt-2">הצטרפו לאירועים בלעדיים וצברו נקודות</p>
        </motion.div>
      </div>

      {/* Stats Banner */}
      <GlassCard gold className="mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
              <Calendar size={28} className="text-primary-900" />
            </div>
            <div>
              <p className="text-white/80 text-sm">אירועים קרובים</p>
              <p className="text-4xl font-bold text-white">
                {events.length} <span className="text-lg">אירועים</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-white/80 text-sm">נרשמתם ל</p>
              <p className="text-2xl font-semibold text-white">{registeredEvents.length} אירועים</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          // Skeleton
          [...Array(6)].map((_, i) => (
            <div key={i} className="glass-card overflow-hidden animate-pulse">
              <div className="h-48 bg-gray-100" />
              <div className="p-6">
                <div className="h-6 w-3/4 bg-gray-200 rounded mb-2" />
                <div className="h-4 w-full bg-gray-100 rounded mb-4" />
                <div className="space-y-2 mb-4">
                  <div className="h-3 w-24 bg-gray-100 rounded" />
                  <div className="h-3 w-32 bg-gray-100 rounded" />
                </div>
                <div className="flex justify-between pt-4 border-t border-gray-200">
                  <div className="h-5 w-16 bg-gold-400/20 rounded" />
                  <div className="h-8 w-20 bg-gray-200 rounded-lg" />
                </div>
              </div>
            </div>
          ))
        ) : events.map((event: any, index: number) => {
          const registered = isRegistered(event.id);
          const full = isFull(event);
          const spotsLeft = (event.capacity || 0) - (event.registered || 0);
          const isRegistering = registeringId === event.id;

          return (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 }}
            >
              <GlassCard
                className={`overflow-hidden group ${
                  registered ? 'ring-2 ring-green-400' : ''
                }`}
              >
                {/* Event Image */}
                <div className="relative h-48 -mx-6 -mt-6 mb-4 overflow-hidden">
                  {event.imageUrl && isValidImageUrl(event.imageUrl) ? (
                    <img
                      src={event.imageUrl}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        // Hide broken image and show placeholder
                        (e.target as HTMLImageElement).style.display = 'none';
                        (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <div className={`w-full h-full bg-gray-100 flex items-center justify-center absolute inset-0 ${event.imageUrl && isValidImageUrl(event.imageUrl) ? 'hidden' : ''}`}>
                    <Calendar size={48} className="text-gray-300" />
                  </div>
                  {event.isVip && (
                    <div className="absolute top-3 right-3 bg-gold-400 text-primary-900 text-xs font-bold px-3 py-1 rounded-full">
                      VIP
                    </div>
                  )}
                  {spotsLeft <= 5 && spotsLeft > 0 && (
                    <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                      נשארו {spotsLeft} מקומות!
                    </div>
                  )}
                  {full && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-white/80 text-sm font-semibold">האירוע מלא</span>
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                    <div className="flex items-center gap-2 text-white text-sm">
                      <Calendar size={14} />
                      <span>{formatDate(event.date || event.startDate)}</span>
                    </div>
                  </div>
                </div>

                {/* Event Info */}
                <h3 className="text-gray-800 font-semibold text-lg mb-2">{event.title}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">{event.description}</p>

                {/* Event Details */}
                <div className="space-y-2 mb-4">
                  {event.time && (
                    <div className="flex items-center gap-2 text-gray-700 text-sm">
                      <Clock size={14} />
                      <span>{event.time}</span>
                    </div>
                  )}
                  {event.location && (
                    <div className="flex items-center gap-2 text-gray-700 text-sm">
                      <MapPin size={14} />
                      <span>{event.location}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-gray-700 text-sm">
                    <Users size={14} />
                    <span>{event.registered || 0} / {event.capacity || '∞'} משתתפים</span>
                  </div>
                </div>

                {/* Points & Action */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="text-gold-400 font-bold">
                    +{event.pointsReward || 0} נק׳
                  </div>
                  <button
                    onClick={() => handleRegister(event.id)}
                    disabled={full || registered || isRegistering}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                      registered
                        ? 'bg-green-500/20 text-green-400 cursor-default'
                        : full
                        ? 'bg-gray-100 text-gray-600 cursor-not-allowed'
                        : 'bg-gold-400 text-primary-900 hover:bg-gold-300'
                    }`}
                  >
                    {isRegistering ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : registered ? (
                      <>
                        <CheckCircle size={16} />
                        <span>נרשמת</span>
                      </>
                    ) : full ? (
                      <span>מלא</span>
                    ) : (
                      <span>הרשמה</span>
                    )}
                  </button>
                </div>
              </GlassCard>
            </motion.div>
          );
        })}
      </div>

      {/* Empty State */}
      {events.length === 0 && (
        <GlassCard className="text-center py-12">
          <Calendar size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600">אין אירועים קרובים כרגע</p>
        </GlassCard>
      )}
      </div>
    </div>
  );
}

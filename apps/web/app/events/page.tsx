'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Calendar, MapPin, Users, Clock, CheckCircle, Loader2 } from 'lucide-react';

function isValidImageUrl(url: string | undefined): boolean {
  if (!url) return false;
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
        background: '#0f2620',
        color: '#fff',
        confirmButtonColor: '#10b981',
      });
    } catch (error: any) {
      Swal.fire({
        title: 'שגיאה',
        text: error.message || 'שגיאה בהרשמה לאירוע',
        icon: 'error',
        confirmButtonText: 'אישור',
        background: '#0f2620',
        color: '#fff',
      });
    } finally {
      setRegisteringId(null);
    }
  };

  const isRegistered = (eventId: string) => registeredEvents.includes(eventId);
  const isFull = (event: any) => event.registered >= event.capacity;

  return (
    <div className="min-h-screen bg-[#0f2620] -mt-16">
      {/* Hero Background */}
      <div className="absolute inset-x-0 top-0 h-[45vh]">
        <Image
          src="https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1920&q=80"
          alt="Events"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f2620]/30 via-transparent to-[#0f2620]" />
      </div>

      <div className="relative z-10 px-4 sm:px-6 pt-24 sm:pt-28 pb-6 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-white">אירועים</h1>
          <p className="text-white/60 mt-1 text-sm sm:text-base">הצטרפו לאירועים בלעדיים וצברו נקודות</p>
        </motion.div>

        {/* Stats Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-emerald-600/30 to-emerald-800/30 backdrop-blur-md border border-emerald-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-4 sm:mb-8"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <Calendar size={20} className="text-emerald-400 sm:hidden" />
                <Calendar size={28} className="text-emerald-400 hidden sm:block" />
              </div>
              <div>
                <p className="text-white/70 text-xs sm:text-sm">אירועים קרובים</p>
                <p className="text-2xl sm:text-4xl font-bold text-white">
                  {events.length} <span className="text-sm sm:text-lg">אירועים</span>
                </p>
              </div>
            </div>
            <div className="text-center flex-shrink-0">
              <p className="text-white/70 text-xs sm:text-sm">נרשמתם ל</p>
              <p className="text-lg sm:text-2xl font-semibold text-white">{registeredEvents.length} אירועים</p>
            </div>
          </div>
        </motion.div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {isLoading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden animate-pulse">
                <div className="h-48 bg-white/10" />
                <div className="p-6">
                  <div className="h-6 w-3/4 bg-white/10 rounded mb-2" />
                  <div className="h-4 w-full bg-white/5 rounded mb-4" />
                  <div className="space-y-2 mb-4">
                    <div className="h-3 w-24 bg-white/5 rounded" />
                    <div className="h-3 w-32 bg-white/5 rounded" />
                  </div>
                  <div className="flex justify-between pt-4 border-t border-white/10">
                    <div className="h-5 w-16 bg-emerald-500/20 rounded" />
                    <div className="h-8 w-20 bg-white/10 rounded-lg" />
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
                <div
                  className={`bg-white/5 backdrop-blur-md border rounded-2xl overflow-hidden group hover:bg-white/10 transition-all ${
                    registered ? 'border-green-500/50 ring-1 ring-green-500/30' : 'border-white/10'
                  }`}
                >
                  {/* Event Image */}
                  <div className="relative h-48 overflow-hidden">
                    {event.imageUrl && isValidImageUrl(event.imageUrl) ? (
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                          (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`w-full h-full bg-white/5 flex items-center justify-center absolute inset-0 ${event.imageUrl && isValidImageUrl(event.imageUrl) ? 'hidden' : ''}`}>
                      <Calendar size={48} className="text-white/30" />
                    </div>
                    {event.isVip && (
                      <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                        VIP
                      </div>
                    )}
                    {spotsLeft <= 5 && spotsLeft > 0 && (
                      <div className="absolute top-3 left-3 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                        נשארו {spotsLeft} מקומות!
                      </div>
                    )}
                    {full && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
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
                  <div className="p-4 sm:p-6">
                    <h3 className="text-white font-semibold text-base sm:text-lg mb-1 sm:mb-2">{event.title}</h3>
                    <p className="text-white/60 text-sm mb-4 line-clamp-2">{event.description}</p>

                    {/* Event Details */}
                    <div className="space-y-2 mb-4">
                      {event.time && (
                        <div className="flex items-center gap-2 text-white/60 text-sm">
                          <Clock size={14} />
                          <span>{event.time}</span>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-2 text-white/60 text-sm">
                          <MapPin size={14} />
                          <span>{event.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-white/60 text-sm">
                        <Users size={14} />
                        <span>{event.registered || 0} / {event.capacity || '∞'} משתתפים</span>
                      </div>
                    </div>

                    {/* Points & Action */}
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="text-emerald-400 font-bold">
                        +{event.pointsReward || 0} נק׳
                      </div>
                      <button
                        onClick={() => handleRegister(event.id)}
                        disabled={full || registered || isRegistering}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                          registered
                            ? 'bg-green-500/20 text-green-400 cursor-default'
                            : full
                            ? 'bg-white/10 text-white/40 cursor-not-allowed'
                            : 'bg-emerald-500 text-white hover:bg-emerald-600'
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
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {!isLoading && events.length === 0 && (
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-12 text-center">
            <Calendar size={48} className="mx-auto text-white/30 mb-4" />
            <p className="text-white/60">אין אירועים קרובים כרגע</p>
          </div>
        )}
      </div>
    </div>
  );
}

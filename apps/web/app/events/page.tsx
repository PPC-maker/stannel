'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ImgWithLoader } from '@/components/ui/ImageWithLoader';
import { Calendar, MapPin, Users, Clock, CheckCircle, Loader2, Building2, FileText, XCircle } from 'lucide-react';
import { meetingsApi } from '@stannel/api-client';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth-context';

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

import { useEvents, useRegisterForEvent, useCancelEventRegistration } from '@/lib/api-hooks';
import { eventsApi } from '@stannel/api-client';
// Auth guard removed - events are public
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
  const isReady = true;
  const { user } = useAuth();
  const [registeredEvents, setRegisteredEvents] = useState<string[]>([]);
  const [registeringId, setRegisteringId] = useState<string | null>(null);

  const { data: eventsResponse, isLoading } = useEvents();
  const registerMutation = useRegisterForEvent();
  const cancelMutation = useCancelEventRegistration();

  // Fetch user's registered events from server on mount
  const { data: myEventsData } = useQuery({
    queryKey: ['my-events'],
    queryFn: () => eventsApi.getMyEvents(),
    enabled: !!user,
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Sync server registrations into local state
  useEffect(() => {
    if (myEventsData && Array.isArray(myEventsData)) {
      const ids = myEventsData.map((e: any) => e.id);
      setRegisteredEvents(ids);
    }
  }, [myEventsData]);

  const isArchitect = user?.role === 'ARCHITECT';
  const { data: meetingsData, isLoading: meetingsLoading } = useQuery({
    queryKey: ['my-meetings'],
    queryFn: () => meetingsApi.getAll(),
    enabled: isReady && isArchitect,
  });
  const meetings = (meetingsData?.data || []).filter((m: any) => m.status !== 'cancelled');

  // Events page is public - no auth required

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
        background: '#f7f3f2',
        color: '#2b241d',
        confirmButtonColor: '#c99b4a',
      });
    } catch (error: any) {
      const isAlreadyRegistered = error.message?.includes('Already registered') || error.message?.includes('כבר רשום');
      if (isAlreadyRegistered) {
        setRegisteredEvents(prev => prev.includes(eventId) ? prev : [...prev, eventId]);
        Swal.fire({
          title: 'כבר רשום!',
          text: 'אתה כבר רשום לאירוע הזה',
          icon: 'info',
          confirmButtonText: 'אישור',
          background: '#f7f3f2',
          color: '#2b241d',
          confirmButtonColor: '#c99b4a',
        });
      } else {
        Swal.fire({
          title: 'שגיאה',
          text: error.message || 'שגיאה בהרשמה לאירוע',
          icon: 'error',
          confirmButtonText: 'אישור',
          background: '#f7f3f2',
          color: '#2b241d',
        });
      }
    } finally {
      setRegisteringId(null);
    }
  };

  const handleCancel = async (eventId: string) => {
    const result = await Swal.fire({
      title: 'ביטול הרשמה',
      text: 'האם אתה בטוח שברצונך לבטל את ההרשמה לאירוע?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'כן, בטל הרשמה',
      cancelButtonText: 'לא',
      confirmButtonColor: '#ef4444',
      background: '#f7f3f2',
      color: '#2b241d',
    });
    if (!result.isConfirmed) return;

    setRegisteringId(eventId);
    try {
      await cancelMutation.mutateAsync(eventId);
      setRegisteredEvents(prev => prev.filter(id => id !== eventId));
      Swal.fire({
        title: 'ההרשמה בוטלה',
        text: 'ההרשמה לאירוע בוטלה בהצלחה',
        icon: 'success',
        confirmButtonText: 'אישור',
        background: '#f7f3f2',
        color: '#2b241d',
        confirmButtonColor: '#c99b4a',
      });
    } catch (error: any) {
      Swal.fire({
        title: 'שגיאה',
        text: error.message || 'שגיאה בביטול ההרשמה',
        icon: 'error',
        confirmButtonText: 'אישור',
        background: '#f7f3f2',
        color: '#2b241d',
      });
    } finally {
      setRegisteringId(null);
    }
  };

  const isRegistered = (eventId: string) => registeredEvents.includes(eventId);
  const isFull = (event: any) => (event.registeredCount || 0) >= event.capacity;

  return (
    <div className="min-h-screen">
      <div className="relative z-10 px-4 sm:px-6 pt-8 pb-24 max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 sm:mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-[#2b241d]">אירועים</h1>
          <p className="text-[#8b7c69] mt-1 text-sm sm:text-base">הצטרפו לאירועים בלעדיים וצברו נקודות</p>
        </motion.div>

        {/* Stats Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-[#c99b4a]/10 to-[#c99b4a]/20 border border-[rgba(201,155,74,0.15)] rounded-2xl sm:rounded-3xl p-4 sm:p-6 mb-4 sm:mb-8"
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-[#c99b4a]/20 flex items-center justify-center flex-shrink-0">
                <Calendar size={20} className="text-[#c99b4a] sm:hidden" />
                <Calendar size={28} className="text-[#c99b4a] hidden sm:block" />
              </div>
              <div>
                <p className="text-[#8b7c69] text-xs sm:text-sm">אירועים קרובים</p>
                <p className="text-2xl sm:text-4xl font-bold text-[#2b241d]">
                  {events.length} <span className="text-sm sm:text-lg">אירועים</span>
                </p>
              </div>
            </div>
            <div className="text-center flex-shrink-0">
              <p className="text-[#8b7c69] text-xs sm:text-sm">נרשמתם ל</p>
              <p className="text-lg sm:text-2xl font-semibold text-[#2b241d]">{registeredEvents.length} אירועים</p>
            </div>
          </div>
        </motion.div>

        {/* My Meetings Section */}
        {isArchitect && meetings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6"
          >
            <h2 className="text-xl font-bold text-[#2b241d] mb-4 flex items-center gap-2">
              <Building2 size={22} className="text-amber-400" />
              הפגישות שלי עם ספקים
            </h2>
            <div className="space-y-3">
              {meetings.map((meeting: any) => {
                const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
                  pending: { label: 'ממתין לאישור', color: 'text-amber-400', bg: 'bg-amber-500/15' },
                  approved: { label: 'אושרה', color: 'text-[#c99b4a]', bg: 'bg-[#c99b4a]/15' },
                  rejected: { label: 'נדחתה', color: 'text-red-400', bg: 'bg-red-500/15' },
                };
                const st = statusConfig[meeting.status] || statusConfig.pending;

                return (
                  <motion.div
                    key={meeting.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-4 hover:bg-[#f7f3f2] transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="text-[#2b241d] font-semibold text-base">{meeting.subject}</h3>
                        <p className="text-[#a89b8a] text-sm">
                          {meeting.supplier?.companyName || 'ספק'}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${st.bg} ${st.color}`}>
                        {st.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-[#a89b8a] text-sm">
                      <div className="flex items-center gap-1">
                        <Calendar size={14} />
                        <span>{new Date(meeting.date).toLocaleDateString('he-IL')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={14} />
                        <span>{meeting.time}</span>
                      </div>
                      {meeting.documentUrl && (
                        <a href={meeting.documentUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline">
                          <FileText size={14} />
                          <span>מסמך</span>
                        </a>
                      )}
                    </div>
                    {meeting.notes && (
                      <p className="text-[#a89b8a] text-xs mt-2">{meeting.notes}</p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {isArchitect && !meetingsLoading && meetings.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mb-6 bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-6 text-center"
          >
            <Building2 size={32} className="mx-auto text-[#a89b8a]/40 mb-2" />
            <p className="text-[#a89b8a] text-sm">אין פגישות מתוכננות</p>
            <p className="text-[#a89b8a] text-xs mt-1">קבעו פגישה עם ספק מעמוד הספקים</p>
          </motion.div>
        )}

        {/* Events Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {isLoading ? (
            [...Array(6)].map((_, i) => (
              <div key={i} className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl overflow-hidden animate-pulse">
                <div className="h-48 bg-[#f7f3f2]" />
                <div className="p-6">
                  <div className="h-6 w-3/4 bg-[#f7f3f2] rounded mb-2" />
                  <div className="h-4 w-full bg-[#f7f3f2] rounded mb-4" />
                  <div className="space-y-2 mb-4">
                    <div className="h-3 w-24 bg-[#f7f3f2] rounded" />
                    <div className="h-3 w-32 bg-[#f7f3f2] rounded" />
                  </div>
                  <div className="flex justify-between pt-4 border-t border-[rgba(201,155,74,0.08)]">
                    <div className="h-5 w-16 bg-[#c99b4a]/20 rounded" />
                    <div className="h-8 w-20 bg-[#f7f3f2] rounded-lg" />
                  </div>
                </div>
              </div>
            ))
          ) : events.map((event: any, index: number) => {
            const registered = isRegistered(event.id);
            const full = isFull(event);
            const spotsLeft = (event.capacity || 0) - (event.registeredCount || 0);
            const isRegistering = registeringId === event.id;

            return (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08 }}
              >
                <div
                  className={`bg-[#f7f3f2] border rounded-2xl overflow-hidden group hover:bg-[#f7f3f2] transition-all ${
                    registered ? 'border-[#c99b4a]/30 ring-1 ring-[#c99b4a]/30' : 'border-[rgba(201,155,74,0.08)]'
                  }`}
                >
                  {/* Event Image */}
                  <div className="relative h-48 overflow-hidden bg-[#f7f3f2]">
                    {event.imageUrl && isValidImageUrl(event.imageUrl) ? (
                      <ImgWithLoader
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 relative z-[2]"
                      />
                    ) : null}
                    <div className={`w-full h-full bg-[#f7f3f2] flex items-center justify-center absolute inset-0 ${event.imageUrl && isValidImageUrl(event.imageUrl) ? 'hidden' : ''}`}>
                      <Calendar size={48} className="text-[#a89b8a]/40" />
                    </div>
                    {event.isVip && (
                      <div className="absolute top-3 right-3 bg-[#c99b4a] text-white text-xs font-bold px-3 py-1 rounded-full">
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
                    <h3 className="text-[#2b241d] font-semibold text-base sm:text-lg mb-1 sm:mb-2">{event.title}</h3>
                    <p className="text-[#8b7c69] text-sm mb-4 line-clamp-2">{event.description}</p>

                    {/* Event Details */}
                    <div className="space-y-2 mb-4">
                      {(event.date || event.startDate) && (
                        <div className="flex items-center gap-2 text-[#8b7c69] text-sm">
                          <Calendar size={14} />
                          <span>{formatDate(event.date || event.startDate)}</span>
                        </div>
                      )}
                      {event.time && (
                        <div className="flex items-center gap-2 text-[#8b7c69] text-sm">
                          <Clock size={14} />
                          <span>{event.time}</span>
                        </div>
                      )}
                      {event.location && (
                        <div className="flex items-center gap-2 text-[#8b7c69] text-sm">
                          <MapPin size={14} />
                          <span>{event.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-[#8b7c69] text-sm">
                        <Users size={14} />
                        <span>{event.registeredCount || 0} / {event.capacity || '∞'} משתתפים</span>
                      </div>
                    </div>

                    {/* Points & Action */}
                    <div className="flex items-center justify-between pt-4 border-t border-[rgba(201,155,74,0.08)]">
                      <div className="text-[#c99b4a] font-bold">
                        +{event.pointsCost || 0} נק׳
                      </div>
                      {registered ? (
                        <button
                          onClick={() => handleCancel(event.id)}
                          disabled={isRegistering}
                          className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 bg-[#c99b4a]/20 text-[#c99b4a] hover:bg-red-100 hover:text-red-600"
                        >
                          {isRegistering ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <>
                              <XCircle size={16} />
                              <span>ביטול הרשמה</span>
                            </>
                          )}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRegister(event.id)}
                          disabled={full || isRegistering}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                            full
                              ? 'bg-[#f7f3f2] text-[#a89b8a] cursor-not-allowed'
                              : 'bg-[#c99b4a] text-white hover:bg-[#9e7746]'
                          }`}
                        >
                          {isRegistering ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : full ? (
                            <span>מלא</span>
                          ) : (
                            <span>הרשמה</span>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Empty State */}
        {!isLoading && events.length === 0 && (
          <div className="bg-[#f7f3f2] border border-[rgba(201,155,74,0.08)] rounded-2xl p-12 text-center">
            <Calendar size={48} className="mx-auto text-[#a89b8a]/40 mb-4" />
            <p className="text-[#8b7c69]">אין אירועים קרובים כרגע</p>
          </div>
        )}
      </div>
    </div>
  );
}

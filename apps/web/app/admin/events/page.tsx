'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/layout/GlassCard';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
import { useAdminGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import { useAdminEvents, useCreateEvent, useUpdateEvent, useDeleteEvent } from '@/lib/api-hooks';
import { adminApi } from '@stannel/api-client';
import {
  Calendar,
  ArrowRight,
  Loader2,
  Plus,
  MapPin,
  Users,
  Eye,
  EyeOff,
  Edit2,
  Trash2,
  Coins,
  Upload,
  X,
} from 'lucide-react';
import Link from 'next/link';
import Swal from 'sweetalert2';

interface EventItem {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  capacity: number;
  registeredCount: number;
  pointsCost: number;
  imageUrl?: string;
  isHidden: boolean;
  createdAt: string;
}

export default function ManageEventsPage() {
  const { isReady } = useAdminGuard();
  const { data: events, isLoading } = useAdminEvents();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();

  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    location: '',
    capacity: 50,
    pointsCost: 0,
    imageUrl: '',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      location: '',
      capacity: 50,
      pointsCost: 0,
      imageUrl: '',
    });
    setImageFile(null);
    setImagePreview(null);
    setEditingEvent(null);
    setShowForm(false);
  };

  const handleEdit = (event: any) => {
    setFormData({
      title: event.title,
      description: event.description,
      date: new Date(event.date).toISOString().split('T')[0],
      location: event.location,
      capacity: event.capacity,
      pointsCost: event.pointsCost || 0,
      imageUrl: event.imageUrl || '',
    });
    setImagePreview(event.imageUrl || null);
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, imageUrl: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUploading(true);
      let finalImageUrl = formData.imageUrl;

      // Upload image if a new file was selected
      if (imageFile) {
        const uploadResult = await adminApi.uploadImage(imageFile);
        finalImageUrl = uploadResult.url;
      }

      const eventData = { ...formData, imageUrl: finalImageUrl };

      if (editingEvent) {
        await updateEvent.mutateAsync({
          id: editingEvent.id,
          data: eventData,
        });
        Swal.fire({
          title: 'האירוע עודכן בהצלחה!',
          icon: 'success',
          confirmButtonText: 'אישור',
          background: '#1a1a2e',
          color: '#fff',
        });
      } else {
        await createEvent.mutateAsync(eventData);
        Swal.fire({
          title: 'האירוע נוצר בהצלחה!',
          icon: 'success',
          confirmButtonText: 'אישור',
          background: '#1a1a2e',
          color: '#fff',
        });
      }
      resetForm();
    } catch (error) {
      Swal.fire({
        title: 'שגיאה',
        text: 'אירעה שגיאה בשמירת האירוע',
        icon: 'error',
        confirmButtonText: 'אישור',
        background: '#1a1a2e',
        color: '#fff',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleToggleVisibility = async (event: any) => {
    try {
      await updateEvent.mutateAsync({
        id: event.id,
        data: { isHidden: !event.isHidden },
      });
    } catch (error) {
      Swal.fire({
        title: 'שגיאה',
        text: 'אירעה שגיאה בעדכון הנראות',
        icon: 'error',
        confirmButtonText: 'אישור',
        background: '#1a1a2e',
        color: '#fff',
      });
    }
  };

  const handleDelete = async (event: any) => {
    const result = await Swal.fire({
      title: 'מחיקת אירוע',
      text: `האם אתה בטוח שברצונך למחוק את האירוע "${event.title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'כן, מחק',
      cancelButtonText: 'ביטול',
      confirmButtonColor: '#dc2626',
      background: '#1a1a2e',
      color: '#fff',
    });

    if (result.isConfirmed) {
      try {
        await deleteEvent.mutateAsync(event.id);
        Swal.fire({
          title: 'נמחק!',
          text: 'האירוע נמחק בהצלחה',
          icon: 'success',
          confirmButtonText: 'אישור',
          background: '#1a1a2e',
          color: '#fff',
        });
      } catch (error) {
        Swal.fire({
          title: 'שגיאה',
          text: 'אירעה שגיאה במחיקת האירוע',
          icon: 'error',
          confirmButtonText: 'אישור',
          background: '#1a1a2e',
          color: '#fff',
        });
      }
    }
  };

  const isEventPast = (date: string | Date) => new Date(date) < new Date();
  const upcomingEvents = events?.filter((e: any) => !isEventPast(e.date)) || [];
  const pastEvents = events?.filter((e: any) => isEventPast(e.date)) || [];

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  return (
    <div className="relative min-h-screen">
      <PageSlider images={sliderImages.dashboard}  />
      <div className="p-6 max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowRight size={18} />
            חזרה לפאנל ניהול
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-900 flex items-center gap-3">
                <Calendar className="text-[#0066CC]" />
                ניהול אירועים
              </h1>
              <p className="text-gray-600 mt-1">יצירה וניהול אירועים לאדריכלים</p>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="btn-gold flex items-center gap-2"
            >
              <Plus size={18} />
              אירוע חדש
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6"
        >
          <GlassCard hover={false}>
            <div className="text-center">
              <p className="text-gray-500 text-sm">סה״כ אירועים</p>
              <p className="text-3xl font-bold text-gray-900">{events?.length || 0}</p>
            </div>
          </GlassCard>
          <GlassCard hover={false} className="bg-green-500/10">
            <div className="text-center">
              <p className="text-green-400/70 text-sm">אירועים קרובים</p>
              <p className="text-3xl font-bold text-green-400">{upcomingEvents.length}</p>
            </div>
          </GlassCard>
          <GlassCard hover={false} className="bg-blue-500/10">
            <div className="text-center">
              <p className="text-blue-400/70 text-sm">אירועים שעברו</p>
              <p className="text-3xl font-bold text-blue-400">{pastEvents.length}</p>
            </div>
          </GlassCard>
          <GlassCard hover={false} className="bg-gold-500/10">
            <div className="text-center">
              <p className="text-gold-400/70 text-sm">סה״כ נרשמים</p>
              <p className="text-3xl font-bold text-gold-400">
                {events?.reduce((sum: number, e: any) => sum + (e.registeredCount || 0), 0) || 0}
              </p>
            </div>
          </GlassCard>
        </motion.div>

        {/* Events List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <GlassCard hover={false}>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="text-[#0066CC]" size={20} />
              רשימת אירועים
            </h2>

            {isLoading ? (
              <div className="text-center py-12">
                <Loader2 className="w-10 h-10 mx-auto text-gold-400 animate-spin" />
                <p className="text-gray-600 mt-4">טוען אירועים...</p>
              </div>
            ) : !events || events.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-600">אין אירועים במערכת</p>
                <button
                  onClick={() => setShowForm(true)}
                  className="btn-gold mt-4 flex items-center gap-2 mx-auto"
                >
                  <Plus size={18} />
                  צור אירוע ראשון
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event: any) => {
                  const isPast = isEventPast(event.date);

                  return (
                    <div
                      key={event.id}
                      className={`p-4 rounded-lg border ${
                        event.isHidden
                          ? 'border-red-500/30 bg-red-500/5'
                          : isPast
                          ? 'border-gray-200 bg-gray-50 opacity-60'
                          : 'border-green-500/30 bg-green-500/5'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          {event.imageUrl ? (
                            <img
                              src={event.imageUrl}
                              alt={event.title}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center">
                              <Calendar size={24} className="text-gray-400" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-gray-900 font-bold">{event.title}</p>
                              {event.isHidden && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400">
                                  מוסתר
                                </span>
                              )}
                              {isPast && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-gray-200 text-gray-600">
                                  עבר
                                </span>
                              )}
                            </div>
                            <p className="text-gray-500 text-sm line-clamp-1">{event.description}</p>
                            <div className="flex items-center gap-4 mt-2 text-gray-400 text-sm">
                              <span className="flex items-center gap-1">
                                <Calendar size={12} />
                                {new Date(event.date).toLocaleDateString('he-IL')}
                              </span>
                              <span className="flex items-center gap-1">
                                <MapPin size={12} />
                                {event.location}
                              </span>
                              <span className="flex items-center gap-1">
                                <Users size={12} />
                                {event.registeredCount}/{event.capacity}
                              </span>
                              {event.pointsCost > 0 && (
                                <span className="flex items-center gap-1 text-gold-400">
                                  <Coins size={12} />
                                  {event.pointsCost} נקודות
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleVisibility(event)}
                            className={`p-2 rounded-lg hover:bg-gray-100 transition-colors ${
                              event.isHidden ? 'text-red-400' : 'text-green-400'
                            }`}
                            title={event.isHidden ? 'הצג אירוע' : 'הסתר אירוע'}
                          >
                            {event.isHidden ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button
                            onClick={() => handleEdit(event)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-600 hover:text-gray-900 transition-colors"
                            title="ערוך"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(event)}
                            className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                            title="מחק"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </GlassCard>
        </motion.div>

        {/* Create/Edit Event Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              <GlassCard hover={false}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    {editingEvent ? 'עריכת אירוע' : 'יצירת אירוע חדש'}
                  </h2>
                  <button
                    onClick={resetForm}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="text-gray-600 text-sm mb-2 block">כותרת</label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-gray-900"
                      placeholder="שם האירוע"
                    />
                  </div>

                  <div>
                    <label className="text-gray-600 text-sm mb-2 block">תיאור</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      required
                      rows={3}
                      className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-gray-900 resize-none"
                      placeholder="תיאור האירוע"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-600 text-sm mb-2 block">תאריך</label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                        className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="text-gray-600 text-sm mb-2 block">מיקום</label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        required
                        className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-gray-900"
                        placeholder="כתובת האירוע"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-gray-600 text-sm mb-2 block">קיבולת</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: parseInt(e.target.value) })}
                        required
                        className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="text-gray-600 text-sm mb-2 block">עלות בנקודות</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.pointsCost}
                        onChange={(e) => setFormData({ ...formData, pointsCost: parseInt(e.target.value) })}
                        className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-2 text-gray-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-600 text-sm mb-2 block">תמונת אירוע (אופציונלי)</label>
                    {imagePreview ? (
                      <div className="relative">
                        <img
                          src={imagePreview}
                          alt="תצוגה מקדימה"
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute top-2 left-2 p-1.5 rounded-full bg-red-500 text-white hover:bg-red-600 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-gold-400 transition-colors">
                        <Upload size={32} className="text-gray-400 mb-2" />
                        <span className="text-gray-600 text-sm">לחץ להעלאת תמונה</span>
                        <span className="text-gray-400 text-xs mt-1">JPG, PNG, GIF, WebP עד 5MB</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/gif,image/webp"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="flex-1 btn-secondary"
                    >
                      ביטול
                    </button>
                    <button
                      type="submit"
                      disabled={createEvent.isPending || updateEvent.isPending || uploading}
                      className="flex-1 btn-gold flex items-center justify-center gap-2"
                    >
                      {(createEvent.isPending || updateEvent.isPending || uploading) ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          {uploading ? 'מעלה תמונה...' : 'שומר...'}
                        </>
                      ) : editingEvent ? (
                        <>
                          <Edit2 size={18} />
                          עדכן אירוע
                        </>
                      ) : (
                        <>
                          <Plus size={18} />
                          צור אירוע
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </GlassCard>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

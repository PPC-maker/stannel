'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowRight,
  MapPin,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import { useSupplierProject } from '@/lib/api-hooks';
import { useAuthGuard, AuthGuardLoader } from '@/lib/useAuthGuard';

export default function ProjectDetailPage() {
  const { isReady } = useAuthGuard();
  const params = useParams();
  const supplierId = params.id as string;
  const projectId = params.projectId as string;

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const { data: project, isLoading, error } = useSupplierProject(projectId, isReady);

  const openLightbox = (index: number) => {
    setCurrentImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextImage = () => {
    if (project?.images) {
      setCurrentImageIndex((prev) => (prev + 1) % project.images.length);
    }
  };

  const prevImage = () => {
    if (project?.images) {
      setCurrentImageIndex((prev) => (prev - 1 + project.images.length) % project.images.length);
    }
  };

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <Loader2 size={40} className="text-emerald-400 animate-spin" />
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex flex-col items-center justify-center">
        <FolderOpen size={64} className="text-white/20 mb-4" />
        <p className="text-white/60 text-lg mb-4">הפרויקט לא נמצא</p>
        <Link href={`/suppliers/${supplierId}`} className="text-emerald-400 hover:underline">
          חזרה לפרופיל הספק
        </Link>
      </div>
    );
  }

  const heroImage = project.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80';

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Fixed Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a]/80 backdrop-blur-md">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href={`/suppliers/${supplierId}`} className="w-10 h-10 flex items-center justify-center">
            <ArrowRight size={24} className="text-white" />
          </Link>
          <h1 className="text-white font-semibold">{project.title}</h1>
          <div className="w-10" />
        </div>
      </div>

      {/* Hero Image */}
      <div className="relative h-[40vh] min-h-[280px] pt-14">
        <Image
          src={heroImage}
          alt={project.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1a] via-transparent to-[#1a1a1a]/30" />

        {/* Project Title on Hero */}
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-white mb-2">{project.title}</h1>
            <div className="flex items-center gap-4 text-white/70">
              {project.location && (
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {project.location}
                </span>
              )}
              {project.year && (
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {project.year}
                </span>
              )}
            </div>
          </motion.div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-6">
        {/* Quick Stats */}
        {(project.area || project.duration) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 gap-3 mb-6"
          >
            {project.area && (
              <div className="bg-[#242424] rounded-2xl p-4 border border-white/5">
                <p className="text-white/50 text-xs mb-1">שטח</p>
                <p className="text-white font-semibold">{project.area}</p>
              </div>
            )}
            {project.duration && (
              <div className="bg-[#242424] rounded-2xl p-4 border border-white/5">
                <p className="text-white/50 text-xs mb-1">משך הפרויקט</p>
                <p className="text-white font-semibold">{project.duration}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Description */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-[#242424] rounded-2xl p-5 border border-white/5 mb-6"
        >
          <h2 className="text-white font-semibold mb-3">אודות הפרויקט</h2>
          <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line">
            {project.description}
          </p>
        </motion.div>

        {/* Photo Gallery */}
        {project.images && project.images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-white font-semibold mb-4 flex items-center gap-2">
              גלריית תמונות
              <span className="text-white/40 text-xs">{project.images.length} תמונות</span>
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {project.images.map((image: string, index: number) => (
                <motion.button
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 + index * 0.05 }}
                  onClick={() => openLightbox(index)}
                  className="relative aspect-[4/3] rounded-2xl overflow-hidden group"
                >
                  <Image
                    src={image}
                    alt={`${project.title} - תמונה ${index + 1}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                    <ZoomIn size={24} className="text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom spacing */}
      <div className="h-8" />

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && project.images && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            onClick={closeLightbox}
          >
            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className="absolute top-4 right-4 w-10 h-10 bg-white/10 rounded-full flex items-center justify-center z-10"
            >
              <X size={24} className="text-white" />
            </button>

            {/* Navigation */}
            {project.images.length > 1 && (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center z-10 hover:bg-white/20 transition-colors"
                >
                  <ChevronRight size={28} className="text-white" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 rounded-full flex items-center justify-center z-10 hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft size={28} className="text-white" />
                </button>
              </>
            )}

            {/* Image */}
            <motion.div
              key={currentImageIndex}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full h-full max-w-5xl max-h-[80vh] m-4"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={project.images[currentImageIndex]}
                alt={`${project.title} - תמונה ${currentImageIndex + 1}`}
                fill
                className="object-contain"
              />
            </motion.div>

            {/* Counter */}
            {project.images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/10 px-4 py-2 rounded-full">
                <span className="text-white text-sm">
                  {currentImageIndex + 1} / {project.images.length}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { useAuthGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { config, getHeaders } from '@stannel/api-client';
import Swal from 'sweetalert2';
import {
  ArrowRight,
  Plus,
  Pencil,
  Trash2,
  ImagePlus,
  X,
  Save,
  Loader2,
  FolderOpen,
  Upload,
  GripVertical,
} from 'lucide-react';

interface Project {
  id: string;
  title: string;
  description: string;
  location?: string;
  year?: number;
  area?: string;
  duration?: string;
  images: string[];
  isActive: boolean;
  order: number;
}

// API functions
const projectsApi = {
  async getMyProjects(): Promise<{ data: Project[] }> {
    const response = await fetch(`${config.baseUrl}/projects/my`, {
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to fetch projects');
    return response.json();
  },

  async createProject(data: Partial<Project>): Promise<Project> {
    const response = await fetch(`${config.baseUrl}/projects`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create project');
    return response.json();
  },

  async updateProject(id: string, data: Partial<Project>): Promise<Project> {
    const response = await fetch(`${config.baseUrl}/projects/${id}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update project');
    return response.json();
  },

  async deleteProject(id: string): Promise<void> {
    const response = await fetch(`${config.baseUrl}/projects/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    if (!response.ok) throw new Error('Failed to delete project');
  },

  async uploadImage(file: File): Promise<string> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${config.baseUrl}/supplier/upload-business-image`, {
      method: 'POST',
      headers: {
        Authorization: getHeaders()['Authorization'],
      },
      body: formData,
    });
    if (!response.ok) throw new Error('Failed to upload image');
    const data = await response.json();
    return data.url;
  },
};

export default function ProjectsManagementPage() {
  const { isReady } = useAuthGuard();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    year: new Date().getFullYear(),
    area: '',
    duration: '',
    images: [] as string[],
  });

  // Fetch projects
  const { data: projectsData, isLoading } = useQuery({
    queryKey: ['my-projects'],
    queryFn: projectsApi.getMyProjects,
    enabled: isReady && user?.role === 'SUPPLIER',
  });

  const projects = projectsData?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: projectsApi.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
      closeModal();
      Swal.fire({
        title: 'הפרויקט נוצר!',
        icon: 'success',
        background: '#1a1a1a',
        color: '#fff',
        confirmButtonColor: '#0d7a5f',
      });
    },
    onError: () => {
      Swal.fire({
        title: 'שגיאה',
        text: 'לא ניתן ליצור את הפרויקט',
        icon: 'error',
        background: '#1a1a1a',
        color: '#fff',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) =>
      projectsApi.updateProject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
      closeModal();
      Swal.fire({
        title: 'הפרויקט עודכן!',
        icon: 'success',
        background: '#1a1a1a',
        color: '#fff',
        confirmButtonColor: '#0d7a5f',
      });
    },
    onError: () => {
      Swal.fire({
        title: 'שגיאה',
        text: 'לא ניתן לעדכן את הפרויקט',
        icon: 'error',
        background: '#1a1a1a',
        color: '#fff',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: projectsApi.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
      Swal.fire({
        title: 'הפרויקט נמחק!',
        icon: 'success',
        background: '#1a1a1a',
        color: '#fff',
        confirmButtonColor: '#0d7a5f',
      });
    },
  });

  const openCreateModal = () => {
    setEditingProject(null);
    setFormData({
      title: '',
      description: '',
      location: '',
      year: new Date().getFullYear(),
      area: '',
      duration: '',
      images: [],
    });
    setIsModalOpen(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setFormData({
      title: project.title,
      description: project.description,
      location: project.location || '',
      year: project.year || new Date().getFullYear(),
      area: project.area || '',
      duration: project.duration || '',
      images: project.images || [],
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map((file) =>
        projectsApi.uploadImage(file)
      );
      const uploadedUrls = await Promise.all(uploadPromises);
      setFormData((prev) => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls],
      }));
    } catch (error) {
      Swal.fire({
        title: 'שגיאה בהעלאת תמונה',
        icon: 'error',
        background: '#1a1a1a',
        color: '#fff',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.description) {
      Swal.fire({
        title: 'שדות חובה',
        text: 'יש למלא כותרת ותיאור',
        icon: 'warning',
        background: '#1a1a1a',
        color: '#fff',
      });
      return;
    }

    if (editingProject) {
      updateMutation.mutate({
        id: editingProject.id,
        data: formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (project: Project) => {
    Swal.fire({
      title: 'מחיקת פרויקט',
      text: `האם למחוק את "${project.title}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'מחק',
      cancelButtonText: 'ביטול',
      confirmButtonColor: '#dc2626',
      background: '#1a1a1a',
      color: '#fff',
    }).then((result) => {
      if (result.isConfirmed) {
        deleteMutation.mutate(project.id);
      }
    });
  };

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  if (user?.role !== 'SUPPLIER') {
    return (
      <div className="min-h-screen bg-[#0f2620] flex flex-col items-center justify-center">
        <FolderOpen size={64} className="text-white/20 mb-4" />
        <p className="text-white/60 text-lg mb-4">עמוד זה זמין לספקים בלבד</p>
        <Link href="/profile" className="text-emerald-400 hover:underline">
          חזרה לפרופיל
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f2620] -mt-16">
      {/* Header */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1920&q=80"
          alt="Projects"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-[#0f2620]" />

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 pt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">הפרויקטים שלי</h1>
            <p className="text-white/70">ניהול תיק העבודות שלך</p>
          </motion.div>
        </div>

        {/* Back Button */}
        <Link
          href="/profile"
          className="absolute top-20 right-4 w-10 h-10 bg-white/10 backdrop-blur rounded-full flex items-center justify-center"
        >
          <ArrowRight size={20} className="text-white" />
        </Link>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Add Project Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={openCreateModal}
          className="w-full mb-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-2xl transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={24} />
          הוספת פרויקט חדש
        </motion.button>

        {/* Projects List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={40} className="text-emerald-400 animate-spin" />
          </div>
        ) : projects.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <FolderOpen size={64} className="mx-auto text-white/20 mb-4" />
            <p className="text-white/60 text-lg mb-2">עדיין אין פרויקטים</p>
            <p className="text-white/40 text-sm">לחץ על "הוספת פרויקט חדש" להתחיל</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {projects.map((project, index) => (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden"
              >
                <div className="flex">
                  {/* Project Image */}
                  <div className="relative w-32 h-32 md:w-40 md:h-40 flex-shrink-0">
                    {project.images?.[0] ? (
                      <Image
                        src={project.images[0]}
                        alt={project.title}
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center">
                        <ImagePlus size={32} className="text-white/20" />
                      </div>
                    )}
                  </div>

                  {/* Project Info */}
                  <div className="flex-1 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-white font-semibold text-lg">{project.title}</h3>
                        <p className="text-white/50 text-sm mt-1">
                          {project.location && `${project.location} • `}
                          {project.year}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditModal(project)}
                          className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors"
                        >
                          <Pencil size={16} className="text-white" />
                        </button>
                        <button
                          onClick={() => handleDelete(project)}
                          className="w-8 h-8 bg-red-500/20 rounded-lg flex items-center justify-center hover:bg-red-500/30 transition-colors"
                        >
                          <Trash2 size={16} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                    <p className="text-white/60 text-sm mt-2 line-clamp-2">
                      {project.description}
                    </p>
                    <div className="flex gap-3 mt-3 text-xs text-white/40">
                      {project.area && <span>{project.area}</span>}
                      {project.duration && <span>{project.duration}</span>}
                      <span>{project.images?.length || 0} תמונות</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
            onClick={closeModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1a1a1a] rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-[#1a1a1a] px-6 py-4 border-b border-white/10 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {editingProject ? 'עריכת פרויקט' : 'פרויקט חדש'}
                </h2>
                <button
                  onClick={closeModal}
                  className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center"
                >
                  <X size={20} className="text-white" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-5">
                {/* Title */}
                <div>
                  <label className="block text-white/70 text-sm mb-2">כותרת הפרויקט *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="למשל: פנטהאוז מודרני"
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:outline-none"
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-white/70 text-sm mb-2">תיאור הפרויקט *</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="ספר על הפרויקט, האתגרים והפתרונות..."
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:outline-none resize-none"
                  />
                </div>

                {/* Location & Year */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 text-sm mb-2">מיקום</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="תל אביב"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-2">שנה</label>
                    <input
                      type="number"
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Area & Duration */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/70 text-sm mb-2">שטח</label>
                    <input
                      type="text"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      placeholder='350 מ"ר'
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-white/70 text-sm mb-2">משך הפרויקט</label>
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      placeholder="8 חודשים"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:border-emerald-500/50 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Images */}
                <div>
                  <label className="block text-white/70 text-sm mb-2">תמונות</label>
                  <div className="grid grid-cols-3 gap-3">
                    {formData.images.map((image, index) => (
                      <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                        <Image src={image} alt="" fill className="object-cover" />
                        <button
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X size={14} className="text-white" />
                        </button>
                        {index === 0 && (
                          <span className="absolute bottom-1 right-1 text-xs bg-emerald-500 px-2 py-0.5 rounded-full text-white">
                            ראשית
                          </span>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="aspect-square rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-2 hover:border-emerald-500/50 transition-colors"
                    >
                      {isUploading ? (
                        <Loader2 size={24} className="text-white/40 animate-spin" />
                      ) : (
                        <>
                          <Upload size={24} className="text-white/40" />
                          <span className="text-white/40 text-xs">העלאה</span>
                        </>
                      )}
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <p className="text-white/30 text-xs mt-2">התמונה הראשונה תשמש כתמונת שער</p>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="sticky bottom-0 bg-[#1a1a1a] px-6 py-4 border-t border-white/10 flex gap-3">
                <button
                  onClick={closeModal}
                  className="flex-1 py-3 bg-white/10 text-white rounded-xl font-medium hover:bg-white/20 transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {(createMutation.isPending || updateMutation.isPending) ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <>
                      <Save size={20} />
                      {editingProject ? 'שמור שינויים' : 'צור פרויקט'}
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

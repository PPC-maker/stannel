'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useSupplierGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import { supplierApi } from '@stannel/api-client';
import {
  Building2,
  ArrowRight,
  Globe,
  Phone,
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Linkedin,
  Image as ImageIcon,
  Save,
  Loader2,
  ExternalLink,
  Trash2,
  Camera,
  FileText,
  Briefcase,
  Plus,
  X,
  Upload,
} from 'lucide-react';
import Swal from 'sweetalert2';

export default function SupplierProfilePage() {
  const { isReady, user } = useSupplierGuard();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [formData, setFormData] = useState({
    companyName: '',
    description: '',
    phone: '',
    email: '',
    address: '',
    website: '',
    facebook: '',
    instagram: '',
    linkedin: '',
  });

  const [images, setImages] = useState<string[]>([]);
  const [catalogFiles, setCatalogFiles] = useState<{ name: string; url: string }[]>([]);
  const [projects, setProjects] = useState<{ title: string; description: string; images: string[] }[]>([]);
  const [uploadingCatalog, setUploadingCatalog] = useState(false);
  const [newProject, setNewProject] = useState({ title: '', description: '' });
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [projectImages, setProjectImages] = useState<string[]>([]);
  const [uploadingProjectImage, setUploadingProjectImage] = useState(false);
  const catalogInputRef = useRef<HTMLInputElement>(null);
  const projectImageInputRef = useRef<HTMLInputElement>(null);

  // Load profile data on mount
  useEffect(() => {
    if (isReady && user) {
      loadProfile();
    }
  }, [isReady, user]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const profile = await supplierApi.getProfile();
      setFormData({
        companyName: profile.companyName || '',
        description: profile.description || '',
        phone: profile.phone || '',
        email: profile.user?.email || user?.email || '',
        address: profile.address || '',
        website: profile.website || '',
        facebook: profile.facebook || '',
        instagram: profile.instagram || '',
        linkedin: profile.linkedin || '',
      });
      setImages(profile.businessImages || []);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await supplierApi.updateProfile({
        companyName: formData.companyName,
        description: formData.description,
        phone: formData.phone,
        address: formData.address,
        website: formData.website || undefined,
        facebook: formData.facebook || undefined,
        instagram: formData.instagram || undefined,
        linkedin: formData.linkedin || undefined,
      });
      Swal.fire({
        title: 'נשמר בהצלחה!',
        text: 'השינויים בפרופיל נשמרו',
        icon: 'success',
        confirmButtonColor: '#10b981',
        background: '#0a1f18',
        color: '#ffffff',
      });
    } catch (error: any) {
      Swal.fire({
        title: 'שגיאה',
        text: error.message || 'לא ניתן לשמור את הפרופיל',
        icon: 'error',
        confirmButtonColor: '#10b981',
        background: '#0a1f18',
        color: '#ffffff',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const result = await supplierApi.uploadBusinessImage(file);
      setImages(prev => [...prev, result.url]);
      Swal.fire({
        title: 'התמונה הועלתה!',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#0a1f18',
        color: '#ffffff',
      });
    } catch (error: any) {
      Swal.fire({
        title: 'שגיאה',
        text: error.message || 'לא ניתן להעלות את התמונה',
        icon: 'error',
        confirmButtonColor: '#10b981',
        background: '#0a1f18',
        color: '#ffffff',
      });
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async (imageUrl: string) => {
    const result = await Swal.fire({
      title: 'מחיקת תמונה',
      text: 'האם למחוק את התמונה?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#374151',
      confirmButtonText: 'מחק',
      cancelButtonText: 'ביטול',
      background: '#0a1f18',
      color: '#ffffff',
    });

    if (result.isConfirmed) {
      setImages(prev => prev.filter(img => img !== imageUrl));
    }
  };

  // Catalog handlers
  const handleCatalogUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCatalog(true);
    try {
      const result = await supplierApi.uploadBusinessImage(file);
      setCatalogFiles(prev => [...prev, { name: file.name, url: result.url }]);
      Swal.fire({
        title: 'הקטלוג הועלה!',
        icon: 'success',
        timer: 1500,
        showConfirmButton: false,
        background: '#0a1f18',
        color: '#ffffff',
      });
    } catch (error: any) {
      Swal.fire({
        title: 'שגיאה',
        text: error.message || 'לא ניתן להעלות את הקטלוג',
        icon: 'error',
        confirmButtonColor: '#10b981',
        background: '#0a1f18',
        color: '#ffffff',
      });
    } finally {
      setUploadingCatalog(false);
      if (catalogInputRef.current) {
        catalogInputRef.current.value = '';
      }
    }
  };

  const handleRemoveCatalog = (url: string) => {
    setCatalogFiles(prev => prev.filter(cat => cat.url !== url));
  };

  // Project handlers
  const handleProjectImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingProjectImage(true);
    try {
      const result = await supplierApi.uploadBusinessImage(file);
      setProjectImages(prev => [...prev, result.url]);
    } catch (error: any) {
      Swal.fire({
        title: 'שגיאה',
        text: error.message || 'לא ניתן להעלות את התמונה',
        icon: 'error',
        confirmButtonColor: '#10b981',
        background: '#0a1f18',
        color: '#ffffff',
      });
    } finally {
      setUploadingProjectImage(false);
      if (projectImageInputRef.current) {
        projectImageInputRef.current.value = '';
      }
    }
  };

  const handleAddProject = () => {
    if (!newProject.title.trim()) return;

    setProjects(prev => [...prev, {
      title: newProject.title,
      description: newProject.description,
      images: projectImages
    }]);
    setNewProject({ title: '', description: '' });
    setProjectImages([]);
    setShowProjectForm(false);

    Swal.fire({
      title: 'הפרויקט נוסף!',
      icon: 'success',
      timer: 1500,
      showConfirmButton: false,
      background: '#0a1f18',
      color: '#ffffff',
    });
  };

  const handleRemoveProject = (index: number) => {
    setProjects(prev => prev.filter((_, i) => i !== index));
  };

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  return (
    <div className="min-h-screen bg-[#0f2620] -mt-16">
      {/* Hero Section with Image */}
      <div className="relative h-80 overflow-hidden">
        {/* Background Image */}
        <Image
          src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2000&q=80"
          alt="Office Interior"
          fill
          className="object-cover"
          priority
        />
        {/* Dark Overlay with Fade */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f2620]/60 via-[#0f2620]/70 to-[#0f2620]" />
        {/* Emerald Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(16,185,129,0.15),transparent_60%)]" />
      </div>

      <div className="px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto -mt-48 relative z-10 pb-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            href="/supplier"
            className="inline-flex items-center gap-2 text-white/60 hover:text-emerald-400 mb-4 transition-colors font-medium"
          >
            <ArrowRight size={16} />
            חזרה לדשבורד
          </Link>
          <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
            <Building2 className="text-emerald-400" />
            פרטי העסק
          </h1>
          <p className="text-white/60 mt-1 font-medium">המידע הזה יוצג לאדריכלים</p>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Basic Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6"
            >
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Building2 size={20} className="text-emerald-400" />
                פרטים כלליים
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-white/60 text-sm mb-2">שם העסק</label>
                  <input
                    type="text"
                    name="companyName"
                    value={formData.companyName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="שם העסק..."
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-white/60 text-sm mb-2">תיאור העסק</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                    placeholder="ספר על העסק שלך..."
                  />
                </div>
              </div>
            </motion.div>

            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6"
            >
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Phone size={20} className="text-emerald-400" />
                פרטי התקשרות
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/60 text-sm mb-2 flex items-center gap-2">
                    <Phone size={14} />
                    טלפון
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="050-0000000"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-2 flex items-center gap-2">
                    <Mail size={14} />
                    אימייל
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white/50 cursor-not-allowed"
                    dir="ltr"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-white/60 text-sm mb-2 flex items-center gap-2">
                    <MapPin size={14} />
                    כתובת
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="כתובת העסק..."
                  />
                </div>
              </div>
            </motion.div>

            {/* Social Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6"
            >
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <Globe size={20} className="text-emerald-400" />
                קישורים
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-white/60 text-sm mb-2 flex items-center gap-2">
                    <ExternalLink size={14} />
                    אתר אינטרנט
                  </label>
                  <input
                    type="url"
                    name="website"
                    value={formData.website}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="https://www.example.com"
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-2 flex items-center gap-2">
                    <Facebook size={14} />
                    פייסבוק
                  </label>
                  <input
                    type="url"
                    name="facebook"
                    value={formData.facebook}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="https://facebook.com/..."
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-white/60 text-sm mb-2 flex items-center gap-2">
                    <Instagram size={14} />
                    אינסטגרם
                  </label>
                  <input
                    type="url"
                    name="instagram"
                    value={formData.instagram}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="https://instagram.com/..."
                    dir="ltr"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-white/60 text-sm mb-2 flex items-center gap-2">
                    <Linkedin size={14} />
                    לינקדאין
                  </label>
                  <input
                    type="url"
                    name="linkedin"
                    value={formData.linkedin}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 transition-colors"
                    placeholder="https://linkedin.com/company/..."
                    dir="ltr"
                  />
                </div>
              </div>
            </motion.div>

            {/* Business Images */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6"
            >
              <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <ImageIcon size={20} className="text-emerald-400" />
                תמונות העסק
              </h2>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {images.map((img, index) => (
                  <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                    <Image
                      src={img}
                      alt={`Business image ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      onClick={() => handleRemoveImage(img)}
                      className="absolute top-2 left-2 p-2 bg-red-500/80 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} className="text-white" />
                    </button>
                  </div>
                ))}

                {/* Upload Button */}
                <label className="aspect-square rounded-xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500/50 hover:bg-white/5 transition-colors">
                  {uploadingImage ? (
                    <Loader2 size={24} className="text-emerald-400 animate-spin" />
                  ) : (
                    <>
                      <Camera size={24} className="text-white/40 mb-2" />
                      <span className="text-white/40 text-xs">הוסף תמונה</span>
                    </>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={uploadingImage}
                  />
                </label>
              </div>
            </motion.div>

            {/* Product Catalog */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6"
            >
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <FileText size={20} className="text-emerald-400" />
                קטלוג מוצרים
              </h2>
              <p className="text-white/50 text-sm mb-6">
                העלה קטלוגים, מחירונים או מצגות של המוצרים שלך
              </p>

              <div className="space-y-3">
                {catalogFiles.map((catalog, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl group hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        <FileText size={20} className="text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{catalog.name}</p>
                        <a href={catalog.url} target="_blank" rel="noopener noreferrer" className="text-emerald-400 text-sm hover:underline flex items-center gap-1">
                          צפה בקובץ <ExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveCatalog(catalog.url)}
                      className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}

                {/* Upload Catalog Button */}
                <label className="flex items-center justify-center gap-3 p-6 border-2 border-dashed border-white/20 rounded-xl cursor-pointer hover:border-emerald-500/50 hover:bg-white/5 transition-colors">
                  {uploadingCatalog ? (
                    <Loader2 size={24} className="text-emerald-400 animate-spin" />
                  ) : (
                    <>
                      <Upload size={24} className="text-white/40" />
                      <span className="text-white/60">העלה קטלוג (PDF, תמונה או מסמך)</span>
                    </>
                  )}
                  <input
                    ref={catalogInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.ppt,.pptx"
                    onChange={handleCatalogUpload}
                    className="hidden"
                    disabled={uploadingCatalog}
                  />
                </label>
              </div>
            </motion.div>

            {/* Projects Portfolio */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                  <Briefcase size={20} className="text-emerald-400" />
                  פרויקטים
                </h2>
                {!showProjectForm && (
                  <button
                    onClick={() => setShowProjectForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 hover:bg-emerald-500/30 transition-colors"
                  >
                    <Plus size={18} />
                    הוסף פרויקט
                  </button>
                )}
              </div>
              <p className="text-white/50 text-sm mb-6">
                הצג את הפרויקטים המרשימים שלך לאדריכלים
              </p>

              {/* Add Project Form */}
              {showProjectForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mb-6 p-4 bg-white/5 border border-emerald-500/30 rounded-xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-medium">פרויקט חדש</h3>
                    <button
                      onClick={() => {
                        setShowProjectForm(false);
                        setNewProject({ title: '', description: '' });
                        setProjectImages([]);
                      }}
                      className="p-1 text-white/40 hover:text-white transition-colors"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-white/60 text-sm mb-2">שם הפרויקט *</label>
                      <input
                        type="text"
                        value={newProject.title}
                        onChange={(e) => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 transition-colors"
                        placeholder="שם הפרויקט..."
                      />
                    </div>
                    <div>
                      <label className="block text-white/60 text-sm mb-2">תיאור הפרויקט</label>
                      <textarea
                        value={newProject.description}
                        onChange={(e) => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                        placeholder="ספר על הפרויקט..."
                      />
                    </div>

                    {/* Project Images */}
                    <div>
                      <label className="block text-white/60 text-sm mb-2">תמונות הפרויקט</label>
                      <div className="grid grid-cols-4 gap-3">
                        {projectImages.map((img, index) => (
                          <div key={index} className="relative aspect-square rounded-lg overflow-hidden group">
                            <Image src={img} alt={`Project ${index + 1}`} fill className="object-cover" />
                            <button
                              onClick={() => setProjectImages(prev => prev.filter((_, i) => i !== index))}
                              className="absolute top-1 left-1 p-1 bg-red-500/80 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={12} className="text-white" />
                            </button>
                          </div>
                        ))}
                        <label className="aspect-square rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-emerald-500/50 transition-colors">
                          {uploadingProjectImage ? (
                            <Loader2 size={20} className="text-emerald-400 animate-spin" />
                          ) : (
                            <Camera size={20} className="text-white/40" />
                          )}
                          <input
                            ref={projectImageInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleProjectImageUpload}
                            className="hidden"
                            disabled={uploadingProjectImage}
                          />
                        </label>
                      </div>
                    </div>

                    <button
                      onClick={handleAddProject}
                      disabled={!newProject.title.trim()}
                      className="w-full py-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 font-medium hover:bg-emerald-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      הוסף פרויקט
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Projects List */}
              <div className="space-y-4">
                {projects.length === 0 && !showProjectForm ? (
                  <div className="text-center py-8">
                    <Briefcase size={48} className="mx-auto text-white/20 mb-3" />
                    <p className="text-white/40">טרם נוספו פרויקטים</p>
                    <p className="text-white/30 text-sm">הוסף את הפרויקטים המרשימים שלך</p>
                  </div>
                ) : (
                  projects.map((project, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-white/5 border border-white/10 rounded-xl group hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="text-white font-medium">{project.title}</h3>
                          {project.description && (
                            <p className="text-white/50 text-sm mt-1">{project.description}</p>
                          )}
                        </div>
                        <button
                          onClick={() => handleRemoveProject(index)}
                          className="p-2 text-white/40 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                      {project.images.length > 0 && (
                        <div className="grid grid-cols-4 gap-2">
                          {project.images.map((img, imgIndex) => (
                            <div key={imgIndex} className="relative aspect-square rounded-lg overflow-hidden">
                              <Image src={img} alt={`${project.title} ${imgIndex + 1}`} fill className="object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>

            {/* Save Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl text-white font-semibold hover:from-emerald-600 hover:to-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    שומר...
                  </>
                ) : (
                  <>
                    <Save size={20} />
                    שמור שינויים
                  </>
                )}
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}

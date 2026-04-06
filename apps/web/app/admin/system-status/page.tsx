'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import GlassCard from '@/components/layout/GlassCard';
import PageSlider, { sliderImages } from '@/components/layout/PageSlider';
import { useAdminGuard, AuthGuardLoader } from '@/lib/useAuthGuard';
import { adminApi } from '@stannel/api-client';
import {
  Activity,
  Database,
  Server,
  Cloud,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  RefreshCw,
  ArrowRight,
  Loader2,
  Mail,
  ExternalLink,
  Bell,
  Clock,
  BarChart3,
  Wifi,
  WifiOff,
} from 'lucide-react';
import Link from 'next/link';

interface ServiceStatus {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  message: string;
  lastCheck: string;
  responseTime?: number;
}

interface SystemAlert {
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  action?: string;
}

interface SystemHealth {
  overall: 'healthy' | 'degraded' | 'down';
  services: ServiceStatus[];
  alerts: SystemAlert[];
  lastUpdated: string;
}

export default function SystemStatusPage() {
  const { isReady } = useAdminGuard();
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sendingAlert, setSendingAlert] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [alertSent, setAlertSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    setError(null);

    try {
      const data = await adminApi.getSystemStatus();
      setHealth(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load system status');
      // Create a degraded status when we can't reach the API
      setHealth({
        overall: 'down',
        services: [{
          name: 'API Server',
          status: 'down',
          message: err.message || 'Cannot reach API server',
          lastCheck: new Date().toISOString(),
        }],
        alerts: [{
          type: 'critical',
          title: '🚨 API לא זמין',
          message: err.message || 'לא ניתן להתחבר לשרת. ייתכן שיש בעיית תשלום או שהשרת לא פועל.',
          action: 'https://console.cloud.google.com/run?project=stannel-app',
        }],
        lastUpdated: new Date().toISOString(),
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const sendAlert = async () => {
    setSendingAlert(true);
    try {
      await adminApi.sendSystemAlert({
        subject: '🔔 STANNEL System Status Check',
        message: 'Manual status check triggered from admin panel.',
      });
      setAlertSent(true);
      setTimeout(() => setAlertSent(false), 5000);
    } catch (err: any) {
      alert('Failed to send alert: ' + err.message);
    } finally {
      setSendingAlert(false);
    }
  };

  const sendTestEmail = async () => {
    setSendingTest(true);
    try {
      const result = await adminApi.sendTestEmail();
      alert(`Test email sent to: ${result.sentTo.join(', ')}`);
    } catch (err: any) {
      alert('Failed to send test email: ' + err.message);
    } finally {
      setSendingTest(false);
    }
  };

  useEffect(() => {
    if (isReady) {
      loadStatus();
      // Auto-refresh every 30 seconds
      const interval = setInterval(() => loadStatus(), 30000);
      return () => clearInterval(interval);
    }
  }, [isReady]);

  if (!isReady) {
    return <AuthGuardLoader />;
  }

  const getStatusIcon = (status: 'healthy' | 'degraded' | 'down') => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="text-green-500" size={24} />;
      case 'degraded':
        return <AlertTriangle className="text-yellow-500" size={24} />;
      case 'down':
        return <XCircle className="text-red-500" size={24} />;
    }
  };

  const getStatusColor = (status: 'healthy' | 'degraded' | 'down') => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500/20 border-green-500/30';
      case 'degraded':
        return 'bg-yellow-500/20 border-yellow-500/30';
      case 'down':
        return 'bg-red-500/20 border-red-500/30';
    }
  };

  const getAlertIcon = (type: 'critical' | 'warning' | 'info') => {
    switch (type) {
      case 'critical':
        return <XCircle className="text-red-500" size={20} />;
      case 'warning':
        return <AlertTriangle className="text-yellow-500" size={20} />;
      case 'info':
        return <Bell className="text-blue-500" size={20} />;
    }
  };

  const getAlertColor = (type: 'critical' | 'warning' | 'info') => {
    switch (type) {
      case 'critical':
        return 'bg-red-500/10 border-red-500/30';
      case 'warning':
        return 'bg-yellow-500/10 border-yellow-500/30';
      case 'info':
        return 'bg-blue-500/10 border-blue-500/30';
    }
  };

  const getServiceIcon = (name: string) => {
    if (name.includes('Database') || name.includes('PostgreSQL')) return <Database size={20} />;
    if (name.includes('Redis')) return <Server size={20} />;
    if (name.includes('Firebase')) return <Shield size={20} />;
    if (name.includes('Storage') || name.includes('Cloud')) return <Cloud size={20} />;
    return <Activity size={20} />;
  };

  return (
    <div className="relative min-h-screen">
      <PageSlider images={sliderImages.dashboard} />
      <div className="p-6 max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8 bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm"
        >
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-gray-700 hover:text-gray-800 mb-4 transition-colors font-medium"
          >
            <ArrowRight size={18} />
            חזרה לפאנל ניהול
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-gray-900 flex items-center gap-3">
                <Activity className="text-gold-500" />
                סטטוס מערכת
              </h1>
              <p className="text-gray-600 mt-1 font-medium">מעקב בזמן אמת אחרי תקינות השירותים</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={sendTestEmail}
                disabled={sendingTest}
                className="px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {sendingTest ? <Loader2 size={18} className="animate-spin" /> : <Mail size={18} />}
                בדיקת מייל
              </button>
              <button
                onClick={sendAlert}
                disabled={sendingAlert || alertSent}
                className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                  alertSent
                    ? 'bg-green-500 text-white'
                    : 'bg-gold-400 text-primary-900 hover:bg-gold-500'
                }`}
              >
                {sendingAlert ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : alertSent ? (
                  <CheckCircle size={18} />
                ) : (
                  <Bell size={18} />
                )}
                {alertSent ? 'נשלח!' : 'שלח התראה'}
              </button>
              <button
                onClick={() => loadStatus(true)}
                disabled={refreshing}
                className="px-4 py-2 rounded-lg bg-primary-900 text-white hover:bg-primary-800 transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                רענון
              </button>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="text-center py-20">
            <Loader2 className="w-12 h-12 mx-auto text-gold-400 animate-spin mb-4" />
            <p className="text-gray-600">טוען סטטוס מערכת...</p>
          </div>
        ) : (
          <>
            {/* Overall Status Banner */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-6"
            >
              <div
                className={`p-6 rounded-2xl border-2 ${getStatusColor(health?.overall || 'down')}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {health?.overall === 'healthy' ? (
                      <Wifi className="text-green-500" size={48} />
                    ) : health?.overall === 'degraded' ? (
                      <AlertTriangle className="text-yellow-500" size={48} />
                    ) : (
                      <WifiOff className="text-red-500" size={48} />
                    )}
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {health?.overall === 'healthy' && 'המערכת תקינה'}
                        {health?.overall === 'degraded' && 'המערכת פועלת עם הגבלות'}
                        {health?.overall === 'down' && 'המערכת לא זמינה'}
                      </h2>
                      <p className="text-gray-600">
                        עדכון אחרון: {health?.lastUpdated ? new Date(health.lastUpdated).toLocaleString('he-IL') : 'לא זמין'}
                      </p>
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-4xl font-bold text-gray-900">
                      {health?.services.filter(s => s.status === 'healthy').length || 0}/
                      {health?.services.length || 0}
                    </div>
                    <p className="text-gray-600">שירותים תקינים</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Alerts */}
            {health?.alerts && health.alerts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mb-6 space-y-3"
              >
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <AlertTriangle className="text-yellow-500" />
                  התראות פעילות ({health.alerts.length})
                </h3>
                {health.alerts.map((alert, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border ${getAlertColor(alert.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      {getAlertIcon(alert.type)}
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">{alert.title}</h4>
                        <p className="text-gray-600 text-sm mt-1">{alert.message}</p>
                        {alert.action && (
                          <a
                            href={alert.action}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm mt-2"
                          >
                            <ExternalLink size={14} />
                            פתח בקונסול
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* Services Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Server className="text-gray-600" />
                שירותים
              </h3>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                {health?.services.map((service, index) => (
                  <GlassCard key={index} hover={false}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg ${
                        service.status === 'healthy' ? 'bg-green-500/20' :
                        service.status === 'degraded' ? 'bg-yellow-500/20' : 'bg-red-500/20'
                      }`}>
                        {getServiceIcon(service.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900 truncate">{service.name}</h4>
                          {getStatusIcon(service.status)}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{service.message}</p>
                        {service.responseTime && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-2">
                            <Clock size={12} />
                            {service.responseTime}ms
                          </div>
                        )}
                      </div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <GlassCard hover={false}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <ExternalLink className="text-gray-600" />
                  קישורים מהירים לקונסול
                </h3>
                <div className="grid md:grid-cols-3 gap-4">
                  <a
                    href="https://console.cloud.google.com/sql/instances?project=stannel-app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <Database className="text-blue-500" />
                    <div>
                      <p className="font-medium text-gray-900">Cloud SQL</p>
                      <p className="text-sm text-gray-500">מסד נתונים</p>
                    </div>
                  </a>
                  <a
                    href="https://console.cloud.google.com/run?project=stannel-app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <Server className="text-green-500" />
                    <div>
                      <p className="font-medium text-gray-900">Cloud Run</p>
                      <p className="text-sm text-gray-500">API Server</p>
                    </div>
                  </a>
                  <a
                    href="https://console.cloud.google.com/billing?project=stannel-app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    <BarChart3 className="text-gold-500" />
                    <div>
                      <p className="font-medium text-gray-900">Billing</p>
                      <p className="text-sm text-gray-500">חיוב ותשלום</p>
                    </div>
                  </a>
                </div>
              </GlassCard>
            </motion.div>

            {/* Email Recipients Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-6"
            >
              <GlassCard hover={false}>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Mail className="text-gray-600" />
                  מיילים להתראות
                </h3>
                <p className="text-gray-600 text-sm mb-2">התראות מערכת נשלחות אוטומטית לכתובות הבאות:</p>
                <div className="flex gap-3 flex-wrap">
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    PPC@newpost.co.il
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    orenshp77@gmail.com
                  </span>
                </div>
              </GlassCard>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}

import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, MapPin, Users, Plus, Send, Upload } from "lucide-react";
import PageHeader from "../components/shared/PageHeader";
import EmptyState from "../components/shared/EmptyState";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function ManageEvents() {
  const [events, setEvents] = useState([]);
  const [architects, setArchitects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [form, setForm] = useState({
    event_name: "",
    description: "",
    location: "",
    event_date: "",
    max_participants: "",
    event_type: "networking",
    contact_person: "",
    notes: "",
    image_url: ""
  });
  const [selectedArchitects, setSelectedArchitects] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const evs = await base44.entities.Event.list("-event_date");
    setEvents(evs);
    const archs = await base44.entities.ArchitectProfile.filter({ onboarding_status: "approved" });
    setArchitects(archs);
    setLoading(false);
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(prev => ({ ...prev, image_url: file_url }));
  };

  const handleCreate = async () => {
    const user = await base44.auth.me();
    
    const eventData = {
      event_name: form.event_name,
      description: form.description,
      location: form.location,
      event_date: form.event_date,
      max_participants: parseFloat(form.max_participants),
      event_type: form.event_type,
      contact_person: form.contact_person,
      notes: form.notes,
      image_url: form.image_url,
      registered_architects: selectedArchitects,
      status: "upcoming"
    };

    const newEvent = await base44.entities.Event.create(eventData);

    // Send notifications to selected architects
    for (const email of selectedArchitects) {
      await base44.entities.Notification.create({
        recipient_email: email,
        title: "הזמנה לאירוע חדש",
        message: `הוזמנת לאירוע: ${form.event_name} בתאריך ${format(new Date(form.event_date), "dd/MM/yyyy")}`,
        type: "info",
        related_entity: "Event",
        related_id: newEvent.id
      });
    }

    await base44.entities.AuditLog.create({
      action: "event_created",
      entity_type: "Event",
      entity_id: newEvent.id,
      performed_by: user.email,
      details: `Created event: ${form.event_name}`,
      timestamp: new Date().toISOString()
    });

    setShowCreate(false);
    setForm({
      event_name: "",
      description: "",
      location: "",
      event_date: "",
      max_participants: "",
      event_type: "networking",
      contact_person: "",
      notes: "",
      image_url: ""
    });
    setSelectedArchitects([]);
    loadData();
  };

  const handleArchitectToggle = (email) => {
    setSelectedArchitects(prev => 
      prev.includes(email) 
        ? prev.filter(e => e !== email)
        : [...prev, email]
    );
  };

  const sendReminders = async (event) => {
    for (const email of event.registered_architects || []) {
      await base44.entities.Notification.create({
        recipient_email: email,
        title: "תזכורת לאירוע",
        message: `תזכורת: ${event.event_name} בתאריך ${format(new Date(event.event_date), "dd/MM/yyyy")} במיקום ${event.location}`,
        type: "info",
        related_entity: "Event",
        related_id: event.id
      });
    }
    alert(`נשלחו תזכורות ל-${event.registered_architects?.length || 0} משתתפים`);
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />
    </div>;
  }

  return (
    <div>
      <PageHeader
        title="ניהול אירועים"
        subtitle={`${events.length} אירועים במערכת`}
        actions={
          <Button onClick={() => setShowCreate(true)} className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700">
            <Plus className="w-4 h-4" />
            אירוע חדש
          </Button>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {events.length === 0 ? (
          <EmptyState icon={Calendar} title="אין אירועים" description="צור אירוע ראשון" />
        ) : (
          events.map((event, idx) => (
            <motion.div
              key={event.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                {event.image_url && (
                  <div className="h-40 bg-gradient-to-br from-indigo-500 to-purple-600 relative">
                    <img src={event.image_url} className="w-full h-full object-cover" alt={event.event_name} />
                  </div>
                )}
                <CardContent className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-base font-semibold">{event.event_name}</h3>
                      <p className="text-xs text-gray-500 mt-1">{event.description}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      event.status === "upcoming" ? "bg-blue-100 text-blue-700" :
                      event.status === "ongoing" ? "bg-green-100 text-green-700" :
                      event.status === "completed" ? "bg-gray-100 text-gray-700" :
                      "bg-red-100 text-red-700"
                    }`}>
                      {event.status === "upcoming" ? "קרוב" :
                       event.status === "ongoing" ? "מתקיים" :
                       event.status === "completed" ? "הסתיים" : "בוטל"}
                    </span>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(event.event_date), "dd/MM/yyyy HH:mm")}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <MapPin className="w-4 h-4" />
                      {event.location}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Users className="w-4 h-4" />
                      {event.registered_architects?.length || 0} משתתפים
                      {event.max_participants && ` / ${event.max_participants}`}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setSelectedEvent(event)}
                      className="flex-1"
                    >
                      צפה
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={() => sendReminders(event)}
                      className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600"
                    >
                      <Send className="w-3 h-3 ml-1" />
                      שלח תזכורות
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader>
            <DialogTitle>אירוע חדש</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">שם האירוע</Label>
              <Input value={form.event_name} onChange={e => setForm({ ...form, event_name: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label className="text-xs">תיאור</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="mt-1" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">מיקום</Label>
                <Input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">תאריך ושעה</Label>
                <Input type="datetime-local" value={form.event_date} onChange={e => setForm({ ...form, event_date: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">סוג אירוע</Label>
                <Select value={form.event_type} onValueChange={v => setForm({ ...form, event_type: v })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="conference">כנס</SelectItem>
                    <SelectItem value="workshop">סדנה</SelectItem>
                    <SelectItem value="networking">נטוורקינג</SelectItem>
                    <SelectItem value="training">הדרכה</SelectItem>
                    <SelectItem value="other">אחר</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">מקסימום משתתפים</Label>
                <Input type="number" value={form.max_participants} onChange={e => setForm({ ...form, max_participants: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div>
              <Label className="text-xs">תמונה</Label>
              <div className="mt-1">
                {form.image_url ? (
                  <div className="relative">
                    <img src={form.image_url} className="w-full h-32 object-cover rounded-lg" />
                    <Button size="sm" variant="outline" onClick={() => setForm({ ...form, image_url: "" })} className="absolute top-2 left-2">
                      הסר
                    </Button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-gray-300">
                    <Upload className="w-4 h-4 text-gray-400" />
                    <span className="text-xs text-gray-500">העלה תמונה</span>
                    <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                  </label>
                )}
              </div>
            </div>
            <div>
              <Label className="text-xs mb-2 block">בחר אדריכלים משתתפים ({selectedArchitects.length})</Label>
              <div className="border rounded-lg p-3 max-h-48 overflow-y-auto space-y-2">
                {architects.map(arch => (
                  <div key={arch.id} className="flex items-center gap-2">
                    <Checkbox 
                      checked={selectedArchitects.includes(arch.user_email)}
                      onCheckedChange={() => handleArchitectToggle(arch.user_email)}
                    />
                    <span className="text-sm">{arch.full_name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>ביטול</Button>
            <Button onClick={handleCreate} disabled={!form.event_name || !form.event_date || !form.location}>
              צור אירוע
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>{selectedEvent?.event_name}</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="space-y-3">
              {selectedEvent.image_url && (
                <img src={selectedEvent.image_url} className="w-full h-40 object-cover rounded-lg" />
              )}
              <p className="text-sm text-gray-600">{selectedEvent.description}</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-400" />
                  {format(new Date(selectedEvent.event_date), "dd/MM/yyyy HH:mm")}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  {selectedEvent.location}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Users className="w-4 h-4 text-gray-400" />
                  {selectedEvent.registered_architects?.length || 0} משתתפים
                </div>
              </div>
              {selectedEvent.registered_architects && selectedEvent.registered_architects.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">רשימת משתתפים:</p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {selectedEvent.registered_architects.map(email => {
                      const arch = architects.find(a => a.user_email === email);
                      return (
                        <div key={email} className="text-xs bg-gray-50 p-2 rounded">
                          {arch?.full_name || email}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Calendar, 
  Ticket as TicketIcon, 
  PlusCircle, 
  LogOut, 
  TrendingUp, 
  Users, 
  CreditCard, 
  Trash2, 
  X, 
  Search, 
  CheckCircle2, 
  XCircle,
  QrCode,
  RefreshCw,
  Heart,
  Home,
  Download,
  Settings,
  Activity,
  FileText,
  Mail,
  Tag,
  Percent,
  Eye,
  EyeOff,
  Sparkles,
  Info,
  Edit,
  Inbox,
  AlertCircle,
  Check,
  Clock,
  MapPin,
} from 'lucide-react';
import { cn, convertGoogleDriveUrl } from '../lib/utils';
import { fetchApi } from '../lib/api';
import TicketVerification from './TicketVerification';

const AddEventForm = ({ onSuccess }: { onSuccess: () => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    organizer: '',
    venue: '',
    date: '',
    time: '',
    banner_url: '',
    description: '',
    category: 'Concert',
    is_free: false,
    rsvp_limit: 0,
    ticketTypes: [
      { name: 'Regular', price: 1000, quantity: 100 },
      { name: 'VIP', price: 3000, quantity: 20 }
    ]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addTicketType = () => {
    setFormData({
      ...formData,
      ticketTypes: [...formData.ticketTypes, { name: '', price: 0, quantity: 0 }]
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.banner_url) {
      alert("Banner filename is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await fetchApi('/api/events', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      alert('Event published successfully!');
      setFormData({
        name: '',
        organizer: '',
        venue: '',
        date: '',
        time: '',
        banner_url: '',
        description: '',
        category: 'Concert',
        is_free: false,
        rsvp_limit: 0,
        ticketTypes: [
          { name: 'Regular', price: 1000, quantity: 100 },
          { name: 'VIP', price: 3000, quantity: 20 }
        ]
      });
      onSuccess();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'An error occurred while publishing the event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="text-sm font-bold text-white/70 uppercase tracking-wider">Event Name</label>
          <input required className="w-full p-4 bg-primary/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-secondary text-white placeholder:text-white/30" 
            placeholder="e.g. Gospel Explosion 2025"
            value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-white/70 uppercase tracking-wider">Organizer / Church</label>
          <input required className="w-full p-4 bg-primary/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-secondary text-white placeholder:text-white/30" 
            placeholder="e.g. Nairobi Chapel"
            value={formData.organizer} onChange={e => setFormData({...formData, organizer: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-white/70 uppercase tracking-wider">Venue</label>
          <input required className="w-full p-4 bg-primary/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-secondary text-white placeholder:text-white/30" 
            placeholder="e.g. Kasarani Stadium"
            value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-white/70 uppercase tracking-wider">Category</label>
          <select required className="w-full p-4 bg-primary/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-secondary text-white" 
            value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
            <option value="Concert">Concert</option>
            <option value="Worship">Worship Night</option>
            <option value="Conference">Conference</option>
            <option value="Youth">Youth Event</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div className="space-y-4 p-4 bg-white/5 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-bold text-white uppercase tracking-wider">Free Event / RSVP Only</label>
              <p className="text-xs text-white/50">No payment required for this event</p>
            </div>
            <button 
              type="button"
              onClick={() => setFormData({...formData, is_free: !formData.is_free})}
              className={cn(
                "w-14 h-8 rounded-full transition-all relative",
                formData.is_free ? "bg-secondary" : "bg-white/10"
              )}
            >
              <div className={cn(
                "absolute top-1 w-6 h-6 rounded-full bg-white transition-all",
                formData.is_free ? "left-7" : "left-1"
              )} />
            </button>
          </div>
          {formData.is_free && (
            <div className="space-y-2 pt-2 border-t border-white/10">
              <label className="text-xs font-bold text-white/70 uppercase">RSVP Capacity Limit (0 for unlimited)</label>
              <input 
                type="number" 
                className="w-full p-3 bg-primary/20 border border-white/10 rounded-xl text-white"
                value={formData.rsvp_limit}
                onChange={e => setFormData({...formData, rsvp_limit: parseInt(e.target.value)})}
              />
            </div>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-sm font-bold text-white/70 uppercase tracking-wider">Banner Filename (in public/assets)</label>
          <div className="flex flex-col space-y-4">
            <input 
              required
              className="w-full p-4 bg-primary/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-secondary text-white placeholder:text-white/30 transition-all"
              placeholder="e.g. TheLaunch.jpg"
              value={formData.banner_url.replace('/assets/', '')} 
              onChange={e => {
                const val = e.target.value;
                if (val.startsWith('http')) {
                  setFormData({...formData, banner_url: val});
                } else {
                  setFormData({...formData, banner_url: val ? `/assets/${val}` : ''});
                }
              }} 
            />
            <div className={cn(
              "relative w-full h-48 rounded-2xl overflow-hidden border-2 border-white/5 bg-white/5 flex items-center justify-center group transition-all",
              formData.banner_url ? "border-secondary/30" : "border-dashed"
            )}>
              {formData.banner_url ? (
                <>
                  <img 
                    src={formData.banner_url} 
                    alt="Preview" 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/error/800/400?blur=2';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-bold text-xs bg-primary/60 px-4 py-2 rounded-full backdrop-blur-sm uppercase tracking-widest">Asset Preview: {formData.banner_url}</span>
                  </div>
                </>
              ) : (
                <div className="text-center space-y-2">
                  <Calendar className="w-8 h-8 text-white/10 mx-auto" />
                  <p className="text-white/20 text-[10px] font-bold uppercase tracking-widest">Enter filename <br /> to preview asset</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-bold text-white/70 uppercase tracking-wider">Date</label>
            <input required type="date" className="w-full p-4 bg-primary/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-secondary text-white" 
              value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-white/70 uppercase tracking-wider">Time</label>
            <input required type="time" className="w-full p-4 bg-primary/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-secondary text-white" 
              value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-bold text-white/70 uppercase tracking-wider">Description</label>
        <textarea required rows={4} className="w-full p-4 bg-primary/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-secondary text-white placeholder:text-white/30" 
          placeholder="Tell people what to expect..."
          value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
      </div>
      
      {!formData.is_free && (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold text-white">Ticket Tiers</h3>
          <button 
            type="button"
            onClick={addTicketType}
            className="text-secondary font-bold flex items-center space-x-2 hover:underline"
          >
            <PlusCircle size={20} />
            <span>Add Tier</span>
          </button>
        </div>
        
        <div className="space-y-4">
          {formData.ticketTypes.map((tt, idx) => (
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4 p-6 bg-white/5 rounded-3xl relative group">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/30 uppercase">Tier Name</label>
                  <input required placeholder="e.g. VIP" className="w-full p-3 bg-primary/20 border border-white/10 rounded-xl text-sm text-white" value={tt.name} 
                    onChange={e => {
                      const newTypes = [...formData.ticketTypes];
                      newTypes[idx].name = e.target.value;
                      setFormData({...formData, ticketTypes: newTypes});
                    }} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/30 uppercase">Price (KES)</label>
                  <input required type="number" className="w-full p-3 bg-primary/20 border border-white/10 rounded-xl text-sm text-white" value={tt.price} 
                    onChange={e => {
                      const newTypes = [...formData.ticketTypes];
                      newTypes[idx].price = parseInt(e.target.value);
                      setFormData({...formData, ticketTypes: newTypes});
                    }} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/30 uppercase">Flash Price</label>
                  <input type="number" className="w-full p-3 bg-primary/20 border border-white/10 rounded-xl text-sm text-white" value={tt.flash_sale_price || 0} 
                    onChange={e => {
                      const newTypes = [...formData.ticketTypes];
                      newTypes[idx].flash_sale_price = parseInt(e.target.value);
                      setFormData({...formData, ticketTypes: newTypes});
                    }} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/30 uppercase">Flash Start</label>
                  <input type="datetime-local" className="w-full p-3 bg-primary/20 border border-white/10 rounded-xl text-xs text-white" value={tt.flash_sale_start || ''} 
                    onChange={e => {
                      const newTypes = [...formData.ticketTypes];
                      newTypes[idx].flash_sale_start = e.target.value;
                      setFormData({...formData, ticketTypes: newTypes});
                    }} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-white/30 uppercase">Flash End</label>
                  <input type="datetime-local" className="w-full p-3 bg-primary/20 border border-white/10 rounded-xl text-xs text-white" value={tt.flash_sale_end || ''} 
                    onChange={e => {
                      const newTypes = [...formData.ticketTypes];
                      newTypes[idx].flash_sale_end = e.target.value;
                      setFormData({...formData, ticketTypes: newTypes});
                    }} />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/30 uppercase">Qty</label>
                    <input required type="number" className="w-full p-3 bg-primary/20 border border-white/10 rounded-xl text-sm text-white" value={tt.quantity} 
                      onChange={e => {
                        const newTypes = [...formData.ticketTypes];
                        newTypes[idx].quantity = parseInt(e.target.value);
                        setFormData({...formData, ticketTypes: newTypes});
                      }} />
                  </div>
                  <div className="flex items-end pb-1">
                    <button 
                      type="button"
                      onClick={() => {
                        const newTypes = formData.ticketTypes.filter((_, i) => i !== idx);
                        setFormData({...formData, ticketTypes: newTypes});
                      }}
                      className="p-3 text-red-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              </div>
          ))}
        </div>
      </div>
      )}

      <button 
        disabled={isSubmitting}
        className="w-full bg-secondary text-primary py-5 rounded-2xl font-bold text-xl hover:bg-opacity-90 transition-all disabled:opacity-50 shadow-xl shadow-secondary/20"
      >
        {isSubmitting ? 'Processing...' : 'Create Event (Draft)'}
      </button>
    </form>
  );
};

const CreateEventModal = ({ isOpen, onClose, onSuccess }: { isOpen: boolean, onClose: () => void, onSuccess: () => void }) => {
  const [formData, setFormData] = useState({
    name: '',
    organizer: '',
    venue: '',
    banner_url: '',
    date: '',
    time: '',
    category: 'Concert',
    description: '',
    is_free: false,
    rsvp_limit: 0,
    ticketTypes: [
      { name: 'Regular', price: 1000, quantity: 100, flash_sale_price: 0, flash_sale_start: '', flash_sale_end: '' },
      { name: 'VIP', price: 3000, quantity: 20, flash_sale_price: 0, flash_sale_start: '', flash_sale_end: '' }
    ]
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addTicketType = () => {
    setFormData({
      ...formData,
      ticketTypes: [...formData.ticketTypes, { name: '', price: 0, quantity: 0, flash_sale_price: 0, flash_sale_start: '', flash_sale_end: '' }]
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.banner_url) {
      alert("Banner filename is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await fetchApi('/api/events', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      alert('Event created successfully!');
      onSuccess();
      onClose();
      setFormData({
        name: '',
        organizer: '',
        venue: '',
        banner_url: '',
        date: '',
        time: '',
        category: 'Concert',
        description: '',
        is_free: false,
        rsvp_limit: 0,
        ticketTypes: [
          { name: 'Regular', price: 1000, quantity: 100, flash_sale_price: 0, flash_sale_start: '', flash_sale_end: '' },
          { name: 'VIP', price: 3000, quantity: 20, flash_sale_price: 0, flash_sale_start: '', flash_sale_end: '' }
        ]
      });
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'An error occurred while creating the event');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-surface w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-white/10"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-primary text-white">
          <h2 className="text-xl font-bold">Create New Event</h2>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full"><X /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/70">Event Name</label>
              <input required className="w-full p-3 bg-primary/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-secondary text-white" 
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/70">Organizer / Church</label>
              <input required className="w-full p-3 bg-primary/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-secondary text-white" 
                value={formData.organizer} onChange={e => setFormData({...formData, organizer: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/70">Venue</label>
              <input required className="w-full p-3 bg-primary/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-secondary text-white" 
                value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/70">Banner Filename (in public/assets)</label>
              <div className="flex flex-col space-y-2">
                <input 
                  required 
                  className="w-full p-3 bg-primary/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-secondary text-white"
                  placeholder="e.g. TheLaunch.jpg"
                  value={formData.banner_url.replace('/assets/', '')} 
                  onChange={e => {
                    const val = e.target.value;
                    if (val.startsWith('http')) {
                      setFormData({...formData, banner_url: val});
                    } else {
                      setFormData({...formData, banner_url: val ? `/assets/${val}` : ''});
                    }
                  }} 
                />
                <div className={cn(
                  "relative w-full h-32 rounded-xl overflow-hidden border-2 border-white/5 bg-white/5 flex items-center justify-center group transition-all",
                  formData.banner_url ? "border-secondary/30" : "border-dashed"
                )}>
                  {formData.banner_url ? (
                    <>
                      <img 
                        src={formData.banner_url} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://picsum.photos/seed/error/800/400?blur=2';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white font-bold text-[10px] bg-primary/60 px-3 py-1 rounded-full backdrop-blur-sm uppercase tracking-widest">Preview: {formData.banner_url}</span>
                      </div>
                    </>
                  ) : (
                    <div className="text-center space-y-1">
                      <Calendar className="w-6 h-6 text-white/10 mx-auto" />
                      <p className="text-white/20 text-[8px] font-bold uppercase tracking-widest">Enter filename <br /> to preview</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/70">Date</label>
              <input required type="date" className="w-full p-3 bg-primary/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-secondary text-white" 
                value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/70">Time</label>
              <input required type="time" className="w-full p-3 bg-primary/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-secondary text-white" 
                value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/70">Category</label>
              <select required className="w-full p-3 bg-primary/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-secondary text-white" 
                value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option value="Concert">Concert</option>
                <option value="Worship">Worship Night</option>
                <option value="Conference">Conference</option>
                <option value="Youth">Youth Event</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-4 p-4 bg-white/5 rounded-2xl border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-sm font-bold text-white uppercase tracking-wider">Free Event / RSVP Only</label>
                  <p className="text-[10px] text-white/50">No payment required</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, is_free: !formData.is_free})}
                  className={cn(
                    "w-12 h-6 rounded-full transition-all relative",
                    formData.is_free ? "bg-secondary" : "bg-white/10"
                  )}
                >
                  <div className={cn(
                    "absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all",
                    formData.is_free ? "left-6.5" : "left-0.5"
                  )} />
                </button>
              </div>
              {formData.is_free && (
                <div className="space-y-1 pt-2 border-t border-white/10">
                  <label className="text-[10px] font-bold text-white/70 uppercase">RSVP Capacity Limit</label>
                  <input 
                    type="number" 
                    className="w-full p-2 bg-primary/20 border border-white/10 rounded-lg text-white text-sm"
                    value={formData.rsvp_limit}
                    onChange={e => setFormData({...formData, rsvp_limit: parseInt(e.target.value)})}
                  />
                </div>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-white/70">Description</label>
            <textarea required rows={3} className="w-full p-3 bg-primary/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-secondary text-white" 
              value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          
          {!formData.is_free && (
          <div className="space-y-4">
            <h3 className="font-bold text-white">Ticket Types</h3>
            {formData.ticketTypes.map((tt, idx) => (
              <div key={idx} className="space-y-4 p-4 bg-white/5 rounded-2xl">
                <div className="grid grid-cols-3 gap-4">
                  <input placeholder="Name" className="p-2 bg-primary/20 border border-white/10 rounded-lg text-sm text-white" value={tt.name} 
                    onChange={e => {
                      const newTypes = [...formData.ticketTypes];
                      newTypes[idx].name = e.target.value;
                      setFormData({...formData, ticketTypes: newTypes});
                    }} />
                  <input type="number" placeholder="Price" className="p-2 bg-primary/20 border border-white/10 rounded-lg text-sm text-white" value={tt.price} 
                    onChange={e => {
                      const newTypes = [...formData.ticketTypes];
                      newTypes[idx].price = parseInt(e.target.value);
                      setFormData({...formData, ticketTypes: newTypes});
                    }} />
                  <input type="number" placeholder="Qty" className="p-2 bg-primary/20 border border-white/10 rounded-lg text-sm text-white" value={tt.quantity} 
                    onChange={e => {
                      const newTypes = [...formData.ticketTypes];
                      newTypes[idx].quantity = parseInt(e.target.value);
                      setFormData({...formData, ticketTypes: newTypes});
                    }} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/30 uppercase">Flash Price</label>
                    <input type="number" className="w-full p-2 bg-primary/20 border border-white/10 rounded-lg text-xs text-white" value={tt.flash_sale_price || 0} 
                      onChange={e => {
                        const newTypes = [...formData.ticketTypes];
                        newTypes[idx].flash_sale_price = parseInt(e.target.value);
                        setFormData({...formData, ticketTypes: newTypes});
                      }} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/30 uppercase">Flash Start</label>
                    <input type="datetime-local" className="w-full p-2 bg-primary/20 border border-white/10 rounded-lg text-[10px] text-white" value={tt.flash_sale_start || ''} 
                      onChange={e => {
                        const newTypes = [...formData.ticketTypes];
                        newTypes[idx].flash_sale_start = e.target.value;
                        setFormData({...formData, ticketTypes: newTypes});
                      }} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-white/30 uppercase">Flash End</label>
                    <input type="datetime-local" className="w-full p-2 bg-primary/20 border border-white/10 rounded-lg text-[10px] text-white" value={tt.flash_sale_end || ''} 
                      onChange={e => {
                        const newTypes = [...formData.ticketTypes];
                        newTypes[idx].flash_sale_end = e.target.value;
                        setFormData({...formData, ticketTypes: newTypes});
                      }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}

          <button 
            disabled={isSubmitting}
            className="w-full bg-secondary text-primary py-4 rounded-2xl font-bold text-lg hover:bg-opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-secondary/20"
          >
            {isSubmitting ? 'Creating Event...' : 'Create Event (Draft)'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const EditEventModal = ({ event, onClose, onSuccess }: { event: any, onClose: () => void, onSuccess: () => void }) => {
  const [formData, setFormData] = useState({
    name: event.name,
    organizer: event.organizer,
    venue: event.venue,
    banner_url: event.banner_url,
    date: event.date,
    time: event.time,
    category: event.category,
    description: event.description,
    is_free: event.is_free === 1,
    rsvp_limit: event.rsvp_limit || 0
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetchApi(`/api/admin/events/${event.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });
      alert('Event updated successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'An error occurred while updating the event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-surface w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-white/10"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-primary text-white">
          <h2 className="text-xl font-bold">Edit Event</h2>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full"><X /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/70">Event Name</label>
              <input required className="w-full p-3 bg-primary/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-secondary text-white" 
                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/70">Organizer / Church</label>
              <input required className="w-full p-3 bg-primary/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-secondary text-white" 
                value={formData.organizer} onChange={e => setFormData({...formData, organizer: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/70">Venue</label>
              <input required className="w-full p-3 bg-primary/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-secondary text-white" 
                value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/70">Banner URL</label>
              <input required className="w-full p-3 bg-primary/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-secondary text-white" 
                value={formData.banner_url} onChange={e => setFormData({...formData, banner_url: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/70">Date</label>
              <input required type="date" className="w-full p-3 bg-primary/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-secondary text-white" 
                value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/70">Time</label>
              <input required type="time" className="w-full p-3 bg-primary/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-secondary text-white" 
                value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-white/70">Category</label>
            <select required className="w-full p-3 bg-primary/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-secondary text-white" 
              value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
              <option value="Concert">Concert</option>
              <option value="Worship">Worship Night</option>
              <option value="Conference">Conference</option>
              <option value="Youth">Youth Event</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-white/70">Description</label>
            <textarea required rows={4} className="w-full p-3 bg-primary/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-secondary text-white" 
              value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
          </div>
          
          <button 
            disabled={isSubmitting}
            className="w-full bg-secondary text-primary py-4 rounded-2xl font-bold text-lg hover:bg-opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-secondary/20"
          >
            {isSubmitting ? 'Updating...' : 'Update Event'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const ManualTicketModal = ({ isOpen, onClose, onSuccess, events }: { isOpen: boolean, onClose: () => void, onSuccess: () => void, events: any[] }) => {
  const [formData, setFormData] = useState({
    eventId: '',
    ticketTypeId: '',
    name: '',
    email: '',
    amount: 0,
    manualTicketId: '',
    mpesaReceiptNumber: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedEvent = events.find(e => e.id === formData.eventId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.eventId || !formData.ticketTypeId) return alert('Please select event and ticket type');
    setIsSubmitting(true);
    try {
      await fetchApi('/api/admin/tickets', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      onSuccess();
      onClose();
      setFormData({
        eventId: '',
        ticketTypeId: '',
        name: '',
        email: '',
        amount: 0,
        manualTicketId: '',
        mpesaReceiptNumber: ''
      });
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to add manual ticket');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-surface w-full max-w-md rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-white/10"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-primary text-white">
          <h2 className="text-xl font-bold">Add Manual Purchase</h2>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full"><X /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <label className="text-sm font-bold text-white/70">Select Event</label>
            <select 
              required 
              className="w-full p-3 bg-primary/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-secondary text-white"
              value={formData.eventId}
              onChange={e => {
                const eventId = e.target.value;
                setFormData({ ...formData, eventId, ticketTypeId: '' });
              }}
            >
              <option value="">Choose an event...</option>
              {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>

          {selectedEvent && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/70">Ticket Type</label>
              <select 
                required 
                className="w-full p-3 bg-primary/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-secondary text-white"
                value={formData.ticketTypeId}
                onChange={e => {
                  const ttId = e.target.value;
                  const tt = selectedEvent.ticketTypes?.find((t: any) => t.id === ttId);
                  setFormData({ ...formData, ticketTypeId: ttId, amount: tt?.price || 0 });
                }}
              >
                <option value="">Choose ticket type...</option>
                {selectedEvent.ticketTypes?.map((tt: any) => (
                  <option key={tt.id} value={tt.id}>{tt.name} (KES {tt.price})</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-bold text-white/70">Attendee Name</label>
            <input required className="w-full p-3 bg-primary/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-secondary text-white" 
              value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-white/70">Attendee Email</label>
            <input required type="email" className="w-full p-3 bg-primary/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-secondary text-white" 
              value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-white/70">Ticket Number (Optional)</label>
            <input className="w-full p-3 bg-primary/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-secondary font-mono text-white" 
              placeholder="TKT-XXXXXX"
              value={formData.manualTicketId} onChange={e => setFormData({...formData, manualTicketId: e.target.value})} />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-white/70">M-Pesa Transaction Number (Optional)</label>
            <input className="w-full p-3 bg-primary/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-secondary font-mono text-white" 
              placeholder="SAB1234567"
              value={formData.mpesaReceiptNumber} onChange={e => setFormData({...formData, mpesaReceiptNumber: e.target.value})} />
          </div>

          <button 
            disabled={isSubmitting}
            className="w-full bg-secondary text-primary py-4 rounded-2xl font-bold text-lg hover:bg-opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-secondary/20"
          >
            {isSubmitting ? 'Processing...' : 'Add Ticket'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const CouponModal = ({ isOpen, onClose, onSuccess, events }: { isOpen: boolean, onClose: () => void, onSuccess: () => void, events: any[] }) => {
  const [formData, setFormData] = useState({
    code: '',
    discount_percentage: 10,
    event_id: '',
    ticket_type_id: '',
    expiry_date: '',
    usage_limit: 0,
    per_user_limit: 1
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedEvent = events.find(e => e.id === formData.event_id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await fetchApi('/api/admin/coupons', {
        method: 'POST',
        body: JSON.stringify({ ...formData, adminEmail: 'Admin' })
      });
      onSuccess();
      onClose();
      setFormData({
        code: '',
        discount_percentage: 10,
        event_id: '',
        ticket_type_id: '',
        expiry_date: '',
        usage_limit: 0,
        per_user_limit: 1
      });
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to create coupon');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-surface w-full max-w-md rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-white/10"
      >
        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-primary text-white">
          <h2 className="text-xl font-bold">Create Coupon</h2>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full"><X /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-4 overflow-y-auto">
          <div className="space-y-2">
            <label className="text-sm font-bold text-white/70 uppercase tracking-wider">Coupon Code</label>
            <input required className="w-full p-4 bg-primary/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-secondary text-white placeholder:text-white/30 uppercase" 
              placeholder="e.g. SAVE20"
              value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-white/70 uppercase tracking-wider">Discount Percentage (%)</label>
            <div className="relative">
              <input required type="number" min="1" max="100" className="w-full p-4 bg-primary/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-secondary text-white" 
                value={formData.discount_percentage} onChange={e => setFormData({...formData, discount_percentage: parseInt(e.target.value)})} />
              <Percent className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-white/70 uppercase tracking-wider">Applicable Event (Optional)</label>
            <select 
              className="w-full p-4 bg-primary/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-secondary text-white"
              value={formData.event_id}
              onChange={e => setFormData({ ...formData, event_id: e.target.value, ticket_type_id: '' })}
            >
              <option value="">All Events</option>
              {events.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
            </select>
          </div>

          {selectedEvent && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/70 uppercase tracking-wider">Applicable Ticket Type (Optional)</label>
              <select 
                className="w-full p-4 bg-primary/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-secondary text-white"
                value={formData.ticket_type_id}
                onChange={e => setFormData({ ...formData, ticket_type_id: e.target.value })}
              >
                <option value="">All Ticket Types</option>
                {selectedEvent.ticketTypes?.map((tt: any) => (
                  <option key={tt.id} value={tt.id}>{tt.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/70 uppercase tracking-wider">Expiry Date</label>
              <input type="date" className="w-full p-4 bg-primary/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-secondary text-white" 
                value={formData.expiry_date} onChange={e => setFormData({...formData, expiry_date: e.target.value})} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-white/70 uppercase tracking-wider">Total Usage Limit</label>
              <input type="number" className="w-full p-4 bg-primary/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-secondary text-white" 
                value={formData.usage_limit} onChange={e => setFormData({...formData, usage_limit: parseInt(e.target.value)})} />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-white/70 uppercase tracking-wider">Per User Limit</label>
            <input type="number" className="w-full p-4 bg-primary/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-secondary text-white" 
              value={formData.per_user_limit} onChange={e => setFormData({...formData, per_user_limit: parseInt(e.target.value)})} />
          </div>

          <button 
            disabled={isSubmitting}
            className="w-full bg-secondary text-primary py-5 rounded-2xl font-bold text-xl hover:bg-opacity-90 transition-all disabled:opacity-50 shadow-xl shadow-secondary/20"
          >
            {isSubmitting ? 'Creating...' : 'Create Coupon'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const CompleteSetupModal = ({ isOpen, onClose, onSuccess, submission }: { isOpen: boolean, onClose: () => void, onSuccess: () => void, submission: any }) => {
  const [bannerUrl, setBannerUrl] = useState('');
  const [isFree, setIsFree] = useState(true);
  const [rsvpLimit, setRsvpLimit] = useState(0);
  const [ticketTypes, setTicketTypes] = useState([{ name: 'Regular', price: 0, quantity: 100, description: '' }]);
  const [preUploadedImages, setPreUploadedImages] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchApi('/api/assets/images')
        .then(data => setPreUploadedImages(data))
        .catch(err => console.error(err));
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerUrl) {
      alert('Please select an image');
      return;
    }
    setIsSubmitting(true);
    try {
      await fetchApi(`/api/admin/events/${submission.id}/complete-setup`, {
        method: 'PUT',
        body: JSON.stringify({
          banner_url: bannerUrl,
          is_free: isFree,
          rsvp_limit: rsvpLimit,
          ticketTypes: isFree ? [] : ticketTypes
        })
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to complete setup');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !submission) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-surface w-full max-w-4xl rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col border border-white/10"
      >
        <div className="p-8 border-b border-white/10 flex justify-between items-center bg-primary text-white">
          <div>
            <h2 className="text-2xl font-bold">Complete Event Setup</h2>
            <p className="text-white/50 text-sm">{submission.name}</p>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-3 rounded-2xl transition-colors"><X /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-10">
          {/* Step 1: Image Selection */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-secondary/20 text-secondary rounded-lg flex items-center justify-center font-bold">1</div>
              <h3 className="text-xl font-bold text-white">Select Event Banner</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {preUploadedImages.map((url, idx) => (
                <div 
                  key={idx}
                  onClick={() => setBannerUrl(url)}
                  className={cn(
                    "relative aspect-video rounded-2xl overflow-hidden cursor-pointer border-4 transition-all hover:scale-105",
                    bannerUrl === url ? "border-secondary ring-4 ring-secondary/20" : "border-transparent opacity-60 grayscale hover:grayscale-0 hover:opacity-100"
                  )}
                >
                  <img src={url} alt={`Option ${idx}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  {bannerUrl === url && (
                    <div className="absolute inset-0 bg-secondary/20 flex items-center justify-center">
                      <CheckCircle2 className="text-secondary" size={32} />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Step 2: Ticketing / RSVP */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-secondary/20 text-secondary rounded-lg flex items-center justify-center font-bold">2</div>
              <h3 className="text-xl font-bold text-white">Ticketing & RSVP Setup</h3>
            </div>
            
            <div className="bg-primary/20 p-6 rounded-3xl border border-white/5 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">Free Event (RSVP)</div>
                  <div className="text-sm text-white/50">Users register for free with a limit</div>
                </div>
                <button 
                  type="button"
                  onClick={() => setIsFree(!isFree)}
                  className={cn(
                    "w-14 h-8 rounded-full transition-all relative",
                    isFree ? "bg-secondary" : "bg-white/10"
                  )}
                >
                  <div className={cn(
                    "absolute top-1 w-6 h-6 rounded-full bg-white transition-all",
                    isFree ? "right-1" : "left-1"
                  )} />
                </button>
              </div>

              {isFree ? (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                  <label className="text-sm font-bold text-white/50 uppercase tracking-widest">RSVP Limit (0 for unlimited)</label>
                  <input 
                    type="number" 
                    className="w-full p-4 bg-primary/40 border border-white/10 rounded-2xl focus:ring-2 focus:ring-secondary text-white"
                    value={rsvpLimit}
                    onChange={e => setRsvpLimit(parseInt(e.target.value))}
                  />
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-bold text-white/50 uppercase tracking-widest">Ticket Tiers</label>
                    <button 
                      type="button"
                      onClick={() => setTicketTypes([...ticketTypes, { name: '', price: 0, quantity: 100, description: '' }])}
                      className="text-secondary text-sm font-bold hover:underline flex items-center space-x-1"
                    >
                      <PlusCircle size={14} />
                      <span>Add Tier</span>
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {ticketTypes.map((tt, idx) => (
                      <div key={idx} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 relative group">
                        <div className="md:col-span-2 space-y-1">
                          <input 
                            placeholder="Tier Name (e.g. VIP)"
                            className="w-full bg-transparent border-b border-white/10 p-2 text-white focus:border-secondary outline-none"
                            value={tt.name}
                            onChange={e => {
                              const newTts = [...ticketTypes];
                              newTts[idx].name = e.target.value;
                              setTicketTypes(newTts);
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <input 
                            type="number"
                            placeholder="Price"
                            className="w-full bg-transparent border-b border-white/10 p-2 text-white focus:border-secondary outline-none"
                            value={tt.price}
                            onChange={e => {
                              const newTts = [...ticketTypes];
                              newTts[idx].price = parseInt(e.target.value);
                              setTicketTypes(newTts);
                            }}
                          />
                        </div>
                        <div className="space-y-1">
                          <input 
                            type="number"
                            placeholder="Qty"
                            className="w-full bg-transparent border-b border-white/10 p-2 text-white focus:border-secondary outline-none"
                            value={tt.quantity}
                            onChange={e => {
                              const newTts = [...ticketTypes];
                              newTts[idx].quantity = parseInt(e.target.value);
                              setTicketTypes(newTts);
                            }}
                          />
                        </div>
                        {ticketTypes.length > 1 && (
                          <button 
                            type="button"
                            onClick={() => setTicketTypes(ticketTypes.filter((_, i) => i !== idx))}
                            className="absolute -right-2 -top-2 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <button 
            disabled={isSubmitting}
            className="w-full bg-secondary text-primary py-6 rounded-3xl font-black text-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-secondary/20 disabled:opacity-50"
          >
            {isSubmitting ? 'Finalizing Setup...' : 'Complete Setup & Move to Draft'}
          </button>
        </form>
      </motion.div>
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('admin_logged_in') === 'true' && !!localStorage.getItem('admin_token');
  });

  useEffect(() => {
    const handleLogout = () => setIsLoggedIn(false);
    window.addEventListener('admin-logout', handleLogout);
    return () => window.removeEventListener('admin-logout', handleLogout);
  }, []);
  const [prefilledTicketId, setPrefilledTicketId] = useState<string | undefined>(undefined);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'events' | 'tickets' | 'scan' | 'add-event' | 'inventory' | 'scan-history' | 'coupons' | 'contracts' | 'rsvps' | 'submissions'>('stats');
  const [editingEvent, setEditingEvent] = useState<any>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<any>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [scanLogs, setScanLogs] = useState<any[]>([]);
  const [eventActivities, setEventActivities] = useState<any[]>([]);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [selectedInventoryEvent, setSelectedInventoryEvent] = useState<string>('');
  const [inventorySearch, setInventorySearch] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [adminEvents, setAdminEvents] = useState<any[]>([]);
  const [pendingSubmissions, setPendingSubmissions] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isContractModalOpen, setIsContractModalOpen] = useState(false);
  const [isCompleteSetupModalOpen, setIsCompleteSetupModalOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    
    try {
      const data = await fetchApi('/api/admin/login', {
        method: 'POST',
        body: JSON.stringify({ password })
      });
      
      if (data.success) {
        setIsLoggedIn(true);
        localStorage.setItem('admin_token', data.token);
        if (rememberMe) {
          localStorage.setItem('admin_logged_in', 'true');
        }
        fetchData();
      }
    } catch (err) {
      console.error(err);
      alert('Invalid credentials or connection error');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const fetchData = async () => {
    try {
      const [statsData, eventsData, ticketsData, logsData, activitiesData, couponsData, contractsData, submissionsData] = await Promise.all([
        fetchApi('/api/admin/stats'),
        fetchApi('/api/admin/events'),
        fetchApi(`/api/admin/tickets?includeDeleted=${showDeleted}`),
        fetchApi('/api/admin/scan-logs'),
        fetchApi(`/api/admin/event-activities?includeInactive=${includeInactive}`),
        fetchApi('/api/admin/coupons'),
        fetchApi('/api/admin/contracts'),
        fetchApi('/api/admin/submissions')
      ]);
      
      setStats(statsData);
      setScanLogs(logsData);
      setEventActivities(activitiesData);
      setCoupons(couponsData);
      setContracts(contractsData);
      setPendingSubmissions(submissionsData);
      
      // Fetch ticket types for each event to ensure we have them for manual entry
      const eventsWithTypes = await Promise.all(eventsData.map(async (event: any) => {
        return await fetchApi(`/api/events/${event.id}`);
      }));
      
      setAdminEvents(eventsWithTypes);
      setTickets(ticketsData);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchData();
    }
  }, [showDeleted, includeInactive, isLoggedIn]);

  const handleUpdateStatus = async (id: string, status: string) => {
    if (status === 'PUBLISHED') {
      const event = adminEvents.find(e => e.id === id);
      if (event) {
        if (!event.banner_url || event.banner_url.includes('picsum.photos')) {
          alert('Cannot publish event: A custom banner image must be selected first.');
          return;
        }
        // If not free and no ticket types, or if free and no capacity
        if (!event.is_free && (!event.ticketTypes || event.ticketTypes.length === 0)) {
          // We might need to fetch ticket types if they aren't in the event object
          // But for now, let's assume the backend will also validate
        }
      }
    }

    let confirmMsg = '';
    if (status === 'PUBLISHED') confirmMsg = 'Are you sure you want to PUBLISH this event? It will be visible on the public page.';
    if (status === 'DRAFT') confirmMsg = 'Are you sure you want to UNPUBLISH this event? It will be hidden from the public page.';
    if (status === 'COMPLETED') confirmMsg = 'Are you sure you want to mark this event as COMPLETED? This will hide it from the public page.';
    
    if (!confirm(confirmMsg)) return;

    try {
      await fetchApi(`/api/admin/events/${id}/status`, { 
        method: 'POST',
        body: JSON.stringify({ status, adminEmail: 'Admin' })
      });
      alert(`Event status updated to ${status}`);
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'An error occurred while updating status');
    }
  };

  const handleHideEvent = async (id: string) => {
    if (!confirm('Are you sure you want to remove this event from the public page? Sales data will be preserved.')) return;
    try {
      await fetchApi(`/api/admin/events/${id}/hide`, { method: 'POST' });
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to hide event');
    }
  };

  const handleCompleteEvent = async (id: string) => {
    if (!confirm('Are you sure you want to mark this event as COMPLETED? This will hide it from the public page and automatically email a summary report to you.')) return;
    try {
      await fetchApi(`/api/admin/events/${id}/complete`, { 
        method: 'POST',
        body: JSON.stringify({ adminEmail: 'Admin' })
      });
      alert('Event marked as completed. Report email has been initiated.');
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to complete event');
    }
  };

  const handleDownloadReport = async (id: string, eventName: string) => {
    try {
      const res = await fetchApi(`/api/admin/events/${id}/report`);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Report-${eventName.replace(/\s+/g, '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to download report');
    }
  };

  const handleEmailReport = async (id: string) => {
    if (!confirm('Email this report to the admin?')) return;
    try {
      await fetchApi(`/api/admin/events/${id}/email-report`, { 
        method: 'POST',
        body: JSON.stringify({ adminEmail: 'Admin' })
      });
      alert('Report email sent successfully.');
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to send report email');
    }
  };

  const handleDeleteEvent = async (id: string, isSubmission: boolean = false) => {
    const msg = isSubmission 
      ? 'Are you sure you want to REJECT this submission? It will be deleted permanently.'
      : 'Are you sure you want to PERMANENTLY delete this event? This action cannot be undone and all associated tickets will be lost.';
    
    if (!confirm(msg)) return;
    try {
      await fetchApi(`/api/admin/events/${id}`, { method: 'DELETE' });
      if (isSubmission) alert('Submission rejected and deleted.');
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to delete event');
    }
  };

  const handleRegenerateCode = async (id: string) => {
    if (!confirm('Are you sure you want to regenerate the event code? This will only affect NEW tickets. Existing tickets will keep their current IDs.')) return;
    try {
      await fetchApi(`/api/admin/events/${id}/regenerate-code`, { 
        method: 'POST',
        body: JSON.stringify({ adminEmail: 'Admin' }) // In a real app, use actual admin email
      });
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to regenerate code');
    }
  };

  const handleDeleteTicket = async (id: string, status: string) => {
    if (status === 'USED') {
      if (!confirm('This ticket has already been used. Are you sure you want to delete it?')) return;
    } else {
      if (!confirm('Are you sure you want to delete this ticket? This will cancel the ticket.')) return;
    }

    try {
      await fetchApi(`/api/admin/tickets/${id}`, { method: 'DELETE' });
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error deleting ticket');
    }
  };

  const handleRestoreTicket = async (id: string) => {
    if (!confirm('Are you sure you want to restore this ticket?')) return;
    try {
      await fetchApi(`/api/admin/tickets/${id}/restore`, { method: 'POST' });
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to restore ticket');
    }
  };

  const handleQuickCheckIn = async (ticketId: string) => {
    try {
      const data = await fetchApi('/api/verify', {
        method: 'POST',
        body: JSON.stringify({ ticketId })
      });
      alert(data.message);
      fetchData(); // Refresh to show updated status
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to check in ticket.');
    }
  };

  const handleToggleCoupon = async (id: string, currentStatus: number) => {
    try {
      await fetchApi(`/api/admin/coupons/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ is_active: currentStatus === 0 ? 1 : 0, adminEmail: 'Admin' })
      });
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to toggle coupon');
    }
  };

  const handleDeleteCoupon = async (id: string) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await fetchApi(`/api/admin/coupons/${id}`, {
        method: 'DELETE',
        body: JSON.stringify({ adminEmail: 'Admin' })
      });
      fetchData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to delete coupon');
    }
  };

  const handleResendEmail = async (ticketId: string) => {
    try {
      await fetchApi('/api/admin/tickets/resend', {
        method: 'POST',
        body: JSON.stringify({ ticketId })
      });
      alert('Email resend initiated successfully!');
      fetchData(); // Refresh to show updated status
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to resend email.');
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary p-6 md:p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-surface p-8 md:p-10 rounded-[40px] shadow-2xl border border-white/10"
        >
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mx-auto mb-6 text-secondary border border-white/10 shadow-xl shadow-secondary/5">
              <Sparkles size={40} />
            </div>
            <h1 className="text-3xl font-bold text-white tracking-tight">Welcome Back</h1>
            <p className="text-white/50 mt-2">Manage your Xtraordinary events</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-white/40 uppercase tracking-[0.2em] ml-1">Access Password</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  required
                  className="w-full p-5 bg-primary/40 border border-white/10 rounded-2xl focus:ring-2 focus:ring-secondary transition-all text-white pr-14 placeholder:text-white/20 text-lg"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 hover:text-secondary transition-colors touch-target"
                >
                  {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center space-x-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input 
                    type="checkbox" 
                    className="peer sr-only"
                    checked={rememberMe}
                    onChange={() => setRememberMe(!rememberMe)}
                  />
                  <div className="w-6 h-6 bg-primary/40 border border-white/10 rounded-lg peer-checked:bg-secondary peer-checked:border-secondary transition-all" />
                  <CheckCircle2 className="absolute inset-0 m-auto w-4 h-4 text-primary opacity-0 peer-checked:opacity-100 transition-opacity" />
                </div>
                <span className="text-sm font-bold text-white/60 group-hover:text-white transition-colors">Remember Me</span>
              </label>
              <button type="button" className="text-sm font-bold text-secondary hover:underline">Forgot?</button>
            </div>

            <button 
              disabled={isLoggingIn}
              className="w-full bg-secondary text-primary py-5 rounded-2xl font-black text-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl shadow-secondary/20 flex items-center justify-center space-x-3"
            >
              {isLoggingIn ? (
                <>
                  <RefreshCw className="animate-spin" size={24} />
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Enter Dashboard</span>
              )}
            </button>
          </form>
          
          <div className="mt-10 pt-8 border-t border-white/5">
            <button 
              type="button"
              onClick={() => navigate('/')}
              className="w-full bg-white/5 border border-white/10 text-white/50 py-4 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-white/10 hover:text-secondary transition-all flex items-center justify-center space-x-3 group"
            >
              <Home size={18} className="group-hover:scale-110 transition-transform" />
              <span>Back to Website</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const menuItems = [
    { id: 'stats', label: 'Overview', icon: LayoutDashboard },
    { id: 'submissions', label: 'Submissions', icon: Inbox, badge: pendingSubmissions.length > 0 ? pendingSubmissions.length : null },
    { id: 'events', label: 'Events', icon: Calendar },
    { id: 'add-event', label: 'Add Event', icon: PlusCircle },
    { id: 'tickets', label: 'Tickets', icon: TicketIcon },
    { id: 'rsvps', label: 'RSVPs', icon: Heart },
    { id: 'scan', label: 'Scanner', icon: QrCode },
    { id: 'contracts', label: 'Contracts', icon: FileText },
    { id: 'coupons', label: 'Coupons', icon: Tag },
    { id: 'inventory', label: 'Inventory', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-primary flex flex-col md:flex-row">
      {/* Sidebar (Desktop Only) */}
      <div className="hidden md:flex w-72 bg-surface text-white p-8 flex-col border-r border-white/10">
        <div className="flex items-center space-x-3 mb-12">
          <LayoutDashboard className="text-secondary" size={32} />
          <span className="text-2xl font-bold tracking-tight">Admin</span>
        </div>
        
        <nav className="space-y-2 flex-grow">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "w-full flex items-center justify-between p-4 rounded-2xl transition-all font-bold",
                activeTab === item.id ? "bg-secondary text-primary" : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              <div className="flex items-center space-x-4">
                <item.icon size={20} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-black",
                  activeTab === item.id ? "bg-primary text-secondary" : "bg-secondary text-primary"
                )}>
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        <button 
          onClick={() => {
            setIsLoggedIn(false);
            localStorage.removeItem('admin_logged_in');
            navigate('/');
          }}
          className="mt-8 flex items-center space-x-4 p-4 text-white/40 hover:text-red-400 transition-colors font-bold"
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>

        <button 
          onClick={() => navigate('/')}
          className="flex items-center space-x-4 p-4 text-white/40 hover:text-secondary transition-colors font-bold"
        >
          <Home size={20} />
          <span>Back to Website</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 md:p-12 overflow-y-auto max-h-screen">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 md:mb-12 gap-4">
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {activeTab === 'stats' ? 'Dashboard' : 
               activeTab === 'add-event' ? 'Create Event' :
               activeTab === 'events' ? 'Events' : 
               activeTab === 'scan' ? 'Scanner' : 
               activeTab === 'contracts' ? 'Contracts' :
               activeTab === 'scan-history' ? 'Scan Activity' :
               activeTab === 'inventory' ? 'Inventory' : 
               activeTab === 'rsvps' ? 'RSVPs' :
               activeTab === 'coupons' ? 'Coupons' : 'Tickets'}
            </h1>
            <div className="flex items-center space-x-3 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 no-scrollbar">
              <button 
                onClick={() => {
                  setIsLoggedIn(false);
                  localStorage.removeItem('admin_logged_in');
                  navigate('/');
                }}
                className="bg-red-500/10 text-red-400 p-3 rounded-2xl hover:bg-red-500/20 transition-all border border-red-500/10 flex items-center space-x-2"
                title="Logout"
              >
                <LogOut size={20} />
                <span className="hidden md:inline text-sm font-bold">Logout</span>
              </button>
              {activeTab === 'tickets' && (
                <button 
                  onClick={() => setIsManualModalOpen(true)}
                  className="bg-secondary text-primary px-5 py-3 rounded-2xl font-bold flex items-center space-x-2 hover:bg-opacity-90 transition-all shadow-lg shadow-secondary/20 whitespace-nowrap text-sm"
                >
                  <PlusCircle size={18} />
                  <span>Manual Purchase</span>
                </button>
              )}
              {activeTab === 'coupons' && (
                <button 
                  onClick={() => setIsCouponModalOpen(true)}
                  className="bg-secondary text-primary px-5 py-3 rounded-2xl font-bold flex items-center space-x-2 hover:bg-opacity-90 transition-all shadow-lg shadow-secondary/20 whitespace-nowrap text-sm"
                >
                  <PlusCircle size={18} />
                  <span>Create Coupon</span>
                </button>
              )}
              {(activeTab === 'events' || activeTab === 'stats') && (
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-secondary text-primary px-5 py-3 rounded-2xl font-bold flex items-center space-x-2 hover:bg-opacity-90 transition-all shadow-lg shadow-secondary/20 whitespace-nowrap text-sm"
                >
                  <PlusCircle size={18} />
                  <span>New Event</span>
                </button>
              )}
              {activeTab === 'stats' && (
                <button 
                  onClick={async () => {
                    if (window.confirm("Are you sure you want to clear ALL event, ticket, and revenue data? This action CANNOT be undone.")) {
                      try {
                        await fetchApi('/api/admin/reset-data', { method: 'POST' });
                        alert("All data has been reset successfully.");
                        fetchData();
                      } catch (err: any) {
                        console.error(err);
                        alert(err.message || "An error occurred while resetting data");
                      }
                    }
                  }}
                  className="bg-red-500/10 text-red-400 px-5 py-3 rounded-2xl font-bold flex items-center space-x-2 hover:bg-red-500/20 transition-all whitespace-nowrap text-sm border border-red-500/10"
                >
                  <Trash2 size={18} />
                  <span>Reset Data</span>
                </button>
              )}
              {activeTab === 'stats' && (
                <button 
                  onClick={() => setActiveTab('scan')}
                  className="bg-white/10 text-white px-5 py-3 rounded-2xl font-bold flex items-center space-x-2 hover:bg-white/20 transition-all whitespace-nowrap text-sm border border-white/10"
                >
                  <QrCode size={18} />
                  <span>Scan Ticket</span>
                </button>
              )}
            </div>
          </div>

          {activeTab === 'submissions' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-3xl font-bold text-white tracking-tight">Event Submissions</h2>
                  <p className="text-white/50 mt-1">Review and complete setup for public submissions</p>
                </div>
              </div>

              {pendingSubmissions.length === 0 ? (
                <div className="bg-surface p-20 rounded-[40px] text-center border border-white/10">
                  <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-white/20">
                    <Inbox size={40} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">No pending submissions</h3>
                  <p className="text-white/50">All caught up! New submissions will appear here.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-6">
                  {pendingSubmissions.map((sub) => (
                    <motion.div 
                      key={sub.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-surface p-8 rounded-[40px] border border-white/10 hover:border-secondary/30 transition-all group"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <span className="px-3 py-1 bg-yellow-500/10 text-yellow-500 text-[10px] font-bold uppercase tracking-widest rounded-full border border-yellow-500/20">
                              Pending Approval
                            </span>
                            <span className="text-white/30 text-xs font-mono">{sub.id}</span>
                          </div>
                          <h3 className="text-2xl font-bold text-white group-hover:text-secondary transition-colors">{sub.name}</h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                            <div className="flex items-center space-x-3 text-white/60">
                              <Calendar size={16} className="text-secondary" />
                              <span>{new Date(sub.date).toLocaleDateString()} at {sub.time}</span>
                            </div>
                            <div className="flex items-center space-x-3 text-white/60">
                              <MapPin size={16} className="text-secondary" />
                              <span>{sub.venue}</span>
                            </div>
                            <div className="flex items-center space-x-3 text-white/60">
                              <Users size={16} className="text-secondary" />
                              <span>By: {sub.organizer}</span>
                            </div>
                            <div className="flex items-center space-x-3 text-white/60">
                              <Mail size={16} className="text-secondary" />
                              <span>{sub.organizer_email}</span>
                            </div>
                          </div>
                          <p className="text-white/50 text-sm line-clamp-2 max-w-2xl">{sub.description}</p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-4">
                          <button 
                            onClick={() => {
                              setSelectedSubmission(sub);
                              setIsCompleteSetupModalOpen(true);
                            }}
                            className="bg-secondary text-primary px-8 py-4 rounded-2xl font-bold hover:scale-105 transition-all shadow-lg shadow-secondary/10 flex items-center justify-center space-x-2"
                          >
                            <Edit size={18} />
                            <span>Complete Setup</span>
                          </button>
                          <button 
                            onClick={() => handleDeleteEvent(sub.id)}
                            className="bg-red-500/10 text-red-500 px-8 py-4 rounded-2xl font-bold hover:bg-red-500/20 transition-all border border-red-500/20 flex items-center justify-center space-x-2"
                          >
                            <Trash2 size={18} />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && stats && (
            <div className="space-y-8 pb-24 md:pb-0">
              {/* Quick Stats Grid */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8">
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-surface p-5 md:p-8 rounded-[24px] md:rounded-[32px] shadow-sm border border-white/10"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-green-100/10 rounded-xl md:rounded-2xl flex items-center justify-center text-green-400 mb-4 md:mb-6">
                    <TrendingUp size={20} md:size={24} />
                  </div>
                  <div className="text-[10px] md:text-xs text-white/30 uppercase font-bold tracking-wider mb-1">Revenue</div>
                  <div className="text-xl md:text-3xl font-bold text-white">KES {stats.revenue.toLocaleString()}</div>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="bg-surface p-5 md:p-8 rounded-[24px] md:rounded-[32px] shadow-sm border border-white/10"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-100/10 rounded-xl md:rounded-2xl flex items-center justify-center text-blue-400 mb-4 md:mb-6">
                    <Users size={20} md:size={24} />
                  </div>
                  <div className="text-[10px] md:text-xs text-white/30 uppercase font-bold tracking-wider mb-1">Sold</div>
                  <div className="text-xl md:text-3xl font-bold text-white">{stats.ticketsSold}</div>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="bg-surface p-5 md:p-8 rounded-[24px] md:rounded-[32px] shadow-sm border border-white/10"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-orange-100/10 rounded-xl md:rounded-2xl flex items-center justify-center text-orange-400 mb-4 md:mb-6">
                    <QrCode size={20} md:size={24} />
                  </div>
                  <div className="text-[10px] md:text-xs text-white/30 uppercase font-bold tracking-wider mb-1">Scanned</div>
                  <div className="text-xl md:text-3xl font-bold text-white">{tickets.filter(t => t.status === 'USED').length}</div>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="bg-surface p-5 md:p-8 rounded-[24px] md:rounded-[32px] shadow-sm border border-white/10"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-purple-100/10 rounded-xl md:rounded-2xl flex items-center justify-center text-purple-400 mb-4 md:mb-6">
                    <Heart size={20} md:size={24} />
                  </div>
                  <div className="text-[10px] md:text-xs text-white/30 uppercase font-bold tracking-wider mb-1">RSVPs</div>
                  <div className="text-xl md:text-3xl font-bold text-white">{stats.totalRSVPs || 0}</div>
                </motion.div>
              </div>

              {/* Quick Actions (Mobile Only) */}
              <div className="md:hidden grid grid-cols-3 gap-3">
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex flex-col items-center justify-center p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2 active:bg-white/10 transition-all"
                >
                  <PlusCircle size={24} className="text-secondary" />
                  <span className="text-[10px] font-bold text-white/60 uppercase">Event</span>
                </button>
                <button 
                  onClick={() => setActiveTab('scan')}
                  className="flex flex-col items-center justify-center p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2 active:bg-white/10 transition-all"
                >
                  <QrCode size={24} className="text-secondary" />
                  <span className="text-[10px] font-bold text-white/60 uppercase">Scan</span>
                </button>
                <button 
                  onClick={() => setActiveTab('contracts')}
                  className="flex flex-col items-center justify-center p-4 bg-white/5 border border-white/10 rounded-2xl space-y-2 active:bg-white/10 transition-all"
                >
                  <FileText size={24} className="text-secondary" />
                  <span className="text-[10px] font-bold text-white/60 uppercase">Contracts</span>
                </button>
              </div>

              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-white">Event Activity Logs</h3>
                <div className="flex items-center space-x-3 bg-white/5 p-2 rounded-2xl border border-white/10">
                  <span className="text-xs text-white/40 font-bold uppercase tracking-wider ml-2">Show Inactive Events</span>
                  <button 
                    onClick={() => setIncludeInactive(!includeInactive)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      includeInactive ? "bg-accent" : "bg-white/10"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 rounded-full bg-white transition-all",
                      includeInactive ? "right-1" : "left-1"
                    )} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {eventActivities.map((event) => (
                  <div key={event.id} className="bg-surface rounded-[32px] border border-white/10 overflow-hidden flex flex-col">
                    <div className="p-8 border-b border-white/5 bg-white/[0.02]">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="text-xl font-bold text-white">{event.name}</h4>
                          <p className="text-xs text-white/40 uppercase tracking-widest font-bold mt-1">
                            {new Date(event.date).toLocaleDateString()} • {event.is_hidden ? 'INACTIVE' : 'ACTIVE'}
                          </p>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <div className="text-2xl font-bold text-accent">{event.total_scanned}</div>
                          <div className="text-[10px] text-white/30 uppercase font-bold tracking-wider">Total Scanned</div>
                          <button 
                            onClick={() => {
                              const headers = ['Type', 'Attendee', 'Timestamp', 'Details'];
                              const rows = event.activities.map((a: any) => [
                                a.type,
                                a.attendee,
                                new Date(a.timestamp).toLocaleString(),
                                a.details
                              ]);
                              const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
                              const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                              const link = document.createElement("a");
                              const url = URL.createObjectURL(blob);
                              link.setAttribute("href", url);
                              link.setAttribute("download", `${event.name}_activities.csv`);
                              link.style.visibility = 'hidden';
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                            }}
                            className="mt-2 text-[10px] text-accent hover:text-accent/80 font-bold uppercase tracking-widest flex items-center space-x-1"
                          >
                            <Download size={10} />
                            <span>Export CSV</span>
                          </button>
                          <div className="flex space-x-2 mt-2">
                            <button 
                              onClick={() => handleDownloadReport(event.id, event.name)}
                              className="text-[10px] text-secondary hover:text-secondary/80 font-bold uppercase tracking-widest flex items-center space-x-1"
                            >
                              <FileText size={10} />
                              <span>PDF Report</span>
                            </button>
                            <button 
                              onClick={() => handleEmailReport(event.id)}
                              className="text-[10px] text-white/40 hover:text-white/60 font-bold uppercase tracking-widest flex items-center space-x-1"
                            >
                              <Mail size={10} />
                              <span>Email</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex-1 p-6 space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar">
                      {event.activities.length > 0 ? (
                        event.activities.map((activity: any, idx: number) => (
                          <div key={idx} className="flex items-start space-x-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-white/10 transition-all">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                              activity.type === 'TICKET_CREATED' ? "bg-green-500/10 text-green-500" :
                              activity.type === 'TICKET_SCANNED' ? "bg-blue-500/10 text-blue-500" :
                              "bg-purple-500/10 text-purple-500"
                            )}>
                              {activity.type === 'TICKET_CREATED' ? <Users size={18} /> :
                               activity.type === 'TICKET_SCANNED' ? <QrCode size={18} /> :
                               <Settings size={18} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <p className="text-sm font-bold text-white truncate">{activity.attendee}</p>
                                <span className="text-[10px] text-white/30 font-mono">{new Date(activity.timestamp).toLocaleTimeString()}</span>
                              </div>
                              <p className="text-xs text-white/50 mt-1">{activity.details}</p>
                              <p className="text-[10px] text-white/20 uppercase tracking-tighter mt-1 font-bold">
                                {activity.type.replace('_', ' ')}
                              </p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center py-12">
                          <Activity className="text-white/10 mb-4" size={40} />
                          <p className="text-white/30 text-sm">No recent activity for this event</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'events' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {adminEvents.map((event) => (
                <div key={event.id} className="bg-surface p-8 rounded-[32px] shadow-sm border border-white/10 group">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center space-x-4">
                      <img src={event.banner_url} className="w-16 h-16 rounded-2xl object-cover" alt="" referrerPolicy="no-referrer" />
                      <div>
                        <div className="flex items-center space-x-2">
                          <h3 className="font-bold text-white text-lg">{event.name}</h3>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1",
                            event.status === 'PUBLISHED' ? "bg-green-500/20 text-green-500" : 
                            event.status === 'COMPLETED' ? "bg-blue-500/20 text-blue-500" :
                            "bg-yellow-500/20 text-yellow-500"
                          )}>
                            {event.status === 'PUBLISHED' && <Sparkles size={10} />}
                            {event.status === 'COMPLETED' && <CheckCircle2 size={10} />}
                            {event.status === 'DRAFT' && <FileText size={10} />}
                            <span>{event.status || 'DRAFT'}</span>
                          </span>
                        </div>
                        <div className="text-xs text-white/40">{new Date(event.date).toLocaleDateString()} • {event.venue}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {event.status === 'DRAFT' && (
                        <button 
                          onClick={() => handleUpdateStatus(event.id, 'PUBLISHED')}
                          className="p-2 text-white/30 hover:text-green-500 transition-colors"
                          title="Publish to Live Events"
                        >
                          <Sparkles size={20} />
                        </button>
                      )}
                      {event.status === 'PUBLISHED' && (
                        <button 
                          onClick={() => handleUpdateStatus(event.id, 'DRAFT')}
                          className="p-2 text-white/30 hover:text-yellow-500 transition-colors"
                          title="Unpublish (Move to Draft)"
                        >
                          <XCircle size={20} />
                        </button>
                      )}
                      {event.status !== 'COMPLETED' && (
                        <button 
                          onClick={() => handleUpdateStatus(event.id, 'COMPLETED')}
                          className="p-2 text-white/30 hover:text-blue-500 transition-colors"
                          title="Mark as Completed"
                        >
                          <CheckCircle2 size={20} />
                        </button>
                      )}
                      <button 
                        onClick={() => setEditingEvent(event)}
                        className="p-2 text-white/30 hover:text-secondary transition-colors"
                        title="Edit Event"
                      >
                        <Edit size={20} />
                      </button>
                      <button 
                        onClick={() => handleDownloadReport(event.id, event.name)}
                        className="p-2 text-white/30 hover:text-accent transition-colors"
                        title="Download PDF Report"
                      >
                        <FileText size={20} />
                      </button>
                      <button 
                        onClick={() => handleEmailReport(event.id)}
                        className="p-2 text-white/30 hover:text-secondary transition-colors"
                        title="Email Report to Admin"
                      >
                        <Mail size={20} />
                      </button>
                      <button 
                        onClick={() => {
                          const eventDate = new Date(event.date);
                          const now = new Date();
                          if (eventDate < now) {
                            handleHideEvent(event.id);
                          } else {
                            alert("Events can only be removed from the public page after they have ended.");
                          }
                        }}
                        className="p-2 text-white/30 hover:text-accent transition-colors"
                        title="Hide from Public Page"
                      >
                        <XCircle size={20} />
                      </button>
                      <button 
                        onClick={() => handleDeleteEvent(event.id)}
                        className="p-2 text-white/30 hover:text-red-500 transition-colors"
                        title="Delete Permanently"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div className="bg-white/5 p-4 rounded-2xl text-center sm:text-left">
                      <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">{event.is_free ? 'RSVPs' : 'Sales'}</div>
                      <div className="text-xl font-bold text-accent">{event.is_free ? event.total_rsvps : event.total_sold} / {event.total_capacity || '∞'}</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl text-center sm:text-left">
                      <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Attendance</div>
                      <div className="text-xl font-bold text-secondary">{event.total_checked_in}</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl text-center sm:text-left">
                      <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Status</div>
                      <div className="text-xl font-bold text-green-500">{event.is_free ? 'Free' : 'Paid'}</div>
                    </div>
                    <div className="bg-white/5 p-4 rounded-2xl text-center sm:text-left relative group/code">
                      <div className="text-[10px] text-white/40 uppercase font-bold tracking-wider mb-1">Event Code</div>
                      <div className="text-xl font-bold text-white font-mono">{event.event_code}</div>
                      <button 
                        onClick={() => handleRegenerateCode(event.id)}
                        className="absolute top-2 right-2 p-1 text-white/20 hover:text-secondary opacity-0 group-hover/code:opacity-100 transition-all"
                        title="Regenerate Code"
                      >
                        <RefreshCw size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {adminEvents.length === 0 && (
                <div className="md:col-span-2 text-center py-20 bg-white/5 rounded-[32px] border border-dashed border-white/10">
                  <Calendar className="mx-auto text-white/10 mb-4" size={48} />
                  <p className="text-white/40">No events found. Start by creating one.</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'submissions' && (
            <div className="space-y-8">
              <div className="bg-surface p-8 rounded-[32px] border border-white/10">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-white">Pending Submissions</h2>
                    <p className="text-white/40 text-sm mt-1">Review and complete setup for public event submissions</p>
                  </div>
                  <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                    <span className="text-accent font-bold">{pendingSubmissions.length}</span>
                    <span className="text-white/40 text-xs ml-2 uppercase tracking-widest">Pending</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {pendingSubmissions.map((submission) => (
                  <div key={submission.id} className="bg-surface p-8 rounded-[32px] shadow-sm border border-white/10 group">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="font-bold text-white text-xl mb-1">{submission.name}</h3>
                        <div className="flex items-center space-x-2 text-white/40 text-xs">
                          <Calendar size={12} />
                          <span>{new Date(submission.date).toLocaleDateString()}</span>
                          <span>•</span>
                          <Clock size={12} />
                          <span>{submission.time}</span>
                        </div>
                        <div className="flex items-center space-x-2 text-white/40 text-xs mt-1">
                          <MapPin size={12} />
                          <span>{submission.venue}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setIsCompleteSetupModalOpen(true);
                          }}
                          className="px-4 py-2 bg-secondary text-primary rounded-xl text-xs font-bold uppercase tracking-widest hover:scale-105 transition-all"
                        >
                          Complete Setup
                        </button>
                        <button 
                          onClick={() => handleDeleteEvent(submission.id, true)}
                          className="p-2 bg-white/5 text-white/30 hover:text-red-500 rounded-xl transition-all"
                          title="Reject Submission"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>

                    <div className="bg-white/5 p-6 rounded-2xl mb-6">
                      <div className="text-[10px] text-white/30 uppercase font-bold tracking-widest mb-2">Organizer Details</div>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent font-bold">
                          {submission.organizer_name?.charAt(0)}
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{submission.organizer_name}</div>
                          <div className="text-xs text-white/40">{submission.organizer_email}</div>
                        </div>
                      </div>
                    </div>

                    <div className="text-sm text-white/60 line-clamp-3 italic">
                      "{submission.description}"
                    </div>
                  </div>
                ))}
                {pendingSubmissions.length === 0 && (
                  <div className="md:col-span-2 text-center py-20 bg-white/5 rounded-[32px] border border-dashed border-white/10">
                    <Inbox className="mx-auto text-white/10 mb-4" size={48} />
                    <p className="text-white/40">No pending submissions at the moment.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tickets' && (
            <div className="bg-surface rounded-[32px] shadow-sm border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-white/40 uppercase tracking-wider bg-white/5">
                      <th className="px-8 py-4">Attendee</th>
                      <th className="px-8 py-4">Event</th>
                      <th className="px-8 py-4">Type</th>
                      <th className="px-8 py-4">Amount</th>
                      <th className="px-8 py-4">Discount</th>
                      <th className="px-8 py-4">Receipt</th>
                      <th className="px-8 py-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {tickets.map((t: any) => (
                      <tr key={t.id} className="text-sm hover:bg-white/5 transition-colors">
                        <td className="px-8 py-6">
                          <div className="font-bold text-white">{t.attendee_name}</div>
                          <div className="text-xs text-white/40">{t.attendee_email}</div>
                        </td>
                        <td className="px-8 py-6 text-white/60">{t.event_name}</td>
                        <td className="px-8 py-6">
                          <span className="bg-accent/10 text-accent px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                            {t.ticket_type_name || 'Free / RSVP'}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-white font-bold">
                          {t.total_amount ? `KES ${(t.total_amount / t.quantity).toLocaleString()}` : 'FREE'}
                        </td>
                        <td className="px-8 py-6">
                          {t.discount_amount ? (
                            <div className="flex flex-col">
                              <span className="text-green-500 font-bold">- KES {(t.discount_amount / t.quantity).toLocaleString()}</span>
                              <span className="text-[10px] text-white/30 font-mono uppercase">{t.coupon_code}</span>
                            </div>
                          ) : (
                            <span className="text-white/20">-</span>
                          )}
                        </td>
                        <td className="px-8 py-6 font-mono text-xs text-white/40">{t.mpesa_receipt_number || 'MANUAL'}</td>
                        <td className="px-8 py-6">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                            t.status === 'VALID' ? "bg-green-500/10 text-green-500" : "bg-yellow-500/10 text-yellow-500"
                          )}>{t.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'inventory' && (
            <div className="space-y-8">
              <div className="bg-surface p-8 rounded-[32px] border border-white/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">Inventory Management</h2>
                    <p className="text-white/40">
                      {tickets.filter(t => (!selectedInventoryEvent || t.event_id === selectedInventoryEvent) && !t.id.includes('RSVP')).length} Sold • {tickets.filter(t => (!selectedInventoryEvent || t.event_id === selectedInventoryEvent) && t.status === 'USED' && !t.id.includes('RSVP')).length} Scanned
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 min-w-[300px] lg:min-w-[500px] items-center">
                    <div className="flex items-center space-x-2 mr-4">
                      <input 
                        type="checkbox" 
                        id="showDeleted" 
                        checked={showDeleted} 
                        onChange={e => setShowDeleted(e.target.checked)}
                        className="w-4 h-4 bg-primary/20 border-white/10 rounded focus:ring-secondary"
                      />
                      <label htmlFor="showDeleted" className="text-xs text-white/60 cursor-pointer">Show Deleted</label>
                    </div>
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                      <input 
                        type="text" 
                        placeholder="Search Ticket ID or Name..."
                        className="w-full pl-12 pr-4 py-3 bg-primary/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-secondary text-white text-sm"
                        value={inventorySearch}
                        onChange={e => setInventorySearch(e.target.value)}
                      />
                    </div>
                    <select 
                      className="p-3 bg-primary/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-secondary text-white text-sm min-w-[200px]"
                      value={selectedInventoryEvent}
                      onChange={e => setSelectedInventoryEvent(e.target.value)}
                    >
                      <option value="">All Events</option>
                      {adminEvents.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                    {(selectedInventoryEvent || inventorySearch) && (
                      <button 
                        onClick={() => {
                          setSelectedInventoryEvent('');
                          setInventorySearch('');
                        }}
                        className="text-xs font-bold text-white/40 hover:text-white transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-surface rounded-[32px] shadow-sm border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-white/40 uppercase tracking-wider bg-white/5">
                        <th className="px-8 py-4">Ticket ID</th>
                        <th className="px-8 py-4">Attendee</th>
                        <th className="px-8 py-4">Event</th>
                        <th className="px-8 py-4">Type</th>
                        <th className="px-8 py-4">Amount</th>
                        <th className="px-8 py-4">Discount</th>
                        <th className="px-8 py-4">Status</th>
                        <th className="px-8 py-4">Email</th>
                        <th className="px-8 py-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {tickets
                        .filter(t => !selectedInventoryEvent || t.event_id === selectedInventoryEvent)
                        .filter(t => !t.id.includes('RSVP'))
                        .filter(t => 
                          t.id.toLowerCase().includes(inventorySearch.toLowerCase()) || 
                          t.attendee_name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                          t.attendee_email.toLowerCase().includes(inventorySearch.toLowerCase())
                        )
                        .map((t: any) => (
                        <tr key={t.id} className="text-sm hover:bg-white/5 transition-colors">
                          <td className="px-8 py-6 font-mono text-xs text-secondary">{t.id}</td>
                          <td className="px-8 py-6">
                            <div className="font-bold text-white">{t.attendee_name}</div>
                            <div className="text-xs text-white/40">{t.attendee_email}</div>
                          </td>
                          <td className="px-8 py-6 text-white/60 text-xs">{t.event_name}</td>
                          <td className="px-8 py-6">
                            <span className="bg-accent/10 text-accent px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                              {t.ticket_type_name || 'Free / RSVP'}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-white font-bold">
                            {t.total_amount ? `KES ${(t.total_amount / t.quantity).toLocaleString()}` : 'FREE'}
                          </td>
                          <td className="px-8 py-6">
                            {t.discount_amount ? (
                              <div className="flex flex-col">
                                <span className="text-green-500 font-bold">- KES {(t.discount_amount / t.quantity).toLocaleString()}</span>
                                <span className="text-[10px] text-white/30 font-mono uppercase">{t.coupon_code}</span>
                              </div>
                            ) : (
                              <span className="text-white/20">-</span>
                            )}
                          </td>
                          <td className="px-8 py-6">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                              t.status === 'VALID' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                            )}>{t.status}</span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col space-y-1">
                              <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest inline-block text-center",
                                t.email_status === 'SENT' ? "bg-blue-500/10 text-blue-500" : 
                                t.email_status === 'FAILED' ? "bg-red-500/10 text-red-500" : "bg-white/10 text-white/40"
                              )}>{t.email_status || 'PENDING'}</span>
                              {t.email_sent_at && (
                                <span className="text-[9px] text-white/30 text-center">
                                  {new Date(t.email_sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center space-x-4">
                              {t.deleted_at ? (
                                <button 
                                  onClick={() => handleRestoreTicket(t.id)}
                                  className="text-xs font-bold text-green-400 hover:underline"
                                >
                                  Restore
                                </button>
                              ) : (
                                <>
                                  <button 
                                    onClick={() => {
                                      // Simple way to "confirm" or view details
                                      alert(`Ticket: ${t.id}\nAttendee: ${t.attendee_name}\nEmail: ${t.attendee_email}\nEvent: ${t.event_name}\nStatus: ${t.status}\nEmail Status: ${t.email_status || 'PENDING'}`);
                                    }}
                                    className="text-xs font-bold text-white/40 hover:text-white transition-colors"
                                  >
                                    Details
                                  </button>
                                  {t.status === 'VALID' && (
                                    <button 
                                      onClick={() => handleQuickCheckIn(t.id)}
                                      className="text-xs font-bold text-green-500 hover:underline"
                                    >
                                      Check-in
                                    </button>
                                  )}
                                  <button 
                                    onClick={() => handleResendEmail(t.id)}
                                    className="text-xs font-bold text-blue-400 hover:underline"
                                  >
                                    Resend
                                  </button>
                                  <a 
                                    href={`/api/tickets/${t.id}/download`}
                                    download
                                    className="text-xs font-bold text-orange-400 hover:underline"
                                  >
                                    Download
                                  </a>
                                  <button 
                                    onClick={() => {
                                      setPrefilledTicketId(t.id);
                                      setActiveTab('scan');
                                    }}
                                    className="text-xs font-bold text-secondary hover:underline"
                                  >
                                    Scan
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteTicket(t.id, t.status)}
                                    className="text-xs font-bold text-red-400 hover:text-red-600 transition-colors"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'rsvps' && (
            <div className="space-y-8">
              <div className="bg-surface p-8 rounded-[32px] border border-white/10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">RSVP Management</h2>
                    <p className="text-white/40">
                      {tickets.filter(t => (!selectedInventoryEvent || t.event_id === selectedInventoryEvent) && t.id.includes('RSVP')).length} Registered • {tickets.filter(t => (!selectedInventoryEvent || t.event_id === selectedInventoryEvent) && t.status === 'USED' && t.id.includes('RSVP')).length} Checked-in
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 min-w-[300px] lg:min-w-[500px] items-center">
                    <div className="relative flex-1">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={18} />
                      <input 
                        type="text" 
                        placeholder="Search RSVPs..."
                        className="w-full pl-12 pr-4 py-3 bg-primary/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-secondary text-white text-sm"
                        value={inventorySearch}
                        onChange={e => setInventorySearch(e.target.value)}
                      />
                    </div>
                    <select 
                      className="p-3 bg-primary/20 border border-white/10 rounded-xl focus:ring-2 focus:ring-secondary text-white text-sm min-w-[200px]"
                      value={selectedInventoryEvent}
                      onChange={e => setSelectedInventoryEvent(e.target.value)}
                    >
                      <option value="">All Free Events</option>
                      {adminEvents.filter(e => e.is_free).map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-surface rounded-[32px] shadow-sm border border-white/10 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-white/40 uppercase tracking-wider bg-white/5">
                        <th className="px-8 py-4">RSVP ID</th>
                        <th className="px-8 py-4">Attendee</th>
                        <th className="px-8 py-4">Event</th>
                        <th className="px-8 py-4">Status</th>
                        <th className="px-8 py-4">Email</th>
                        <th className="px-8 py-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {tickets
                        .filter(t => !selectedInventoryEvent || t.event_id === selectedInventoryEvent)
                        .filter(t => t.id.includes('RSVP'))
                        .filter(t => 
                          t.id.toLowerCase().includes(inventorySearch.toLowerCase()) || 
                          t.attendee_name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
                          t.attendee_email.toLowerCase().includes(inventorySearch.toLowerCase())
                        )
                        .map((t: any) => (
                        <tr key={t.id} className="text-sm hover:bg-white/5 transition-colors">
                          <td className="px-8 py-6 font-mono text-xs text-secondary">{t.id}</td>
                          <td className="px-8 py-6">
                            <div className="font-bold text-white">{t.attendee_name}</div>
                            <div className="text-xs text-white/40">{t.attendee_email}</div>
                          </td>
                          <td className="px-8 py-6 text-white/60 text-xs">{t.event_name}</td>
                          <td className="px-8 py-6">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                              t.status === 'VALID' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                            )}>{t.status}</span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col space-y-1">
                              <span className={cn(
                                "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest inline-block text-center",
                                t.email_status === 'SENT' ? "bg-blue-500/10 text-blue-500" : 
                                t.email_status === 'FAILED' ? "bg-red-500/10 text-red-500" : "bg-white/10 text-white/40"
                              )}>{t.email_status || 'PENDING'}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center space-x-4">
                              <button 
                                onClick={() => handleQuickCheckIn(t.id)}
                                className="text-xs font-bold text-green-500 hover:underline"
                                disabled={t.status !== 'VALID'}
                              >
                                Check-in
                              </button>
                              <button 
                                onClick={() => handleResendEmail(t.id)}
                                className="text-xs font-bold text-blue-400 hover:underline"
                              >
                                Resend
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'coupons' && (
            <div className="bg-surface rounded-[32px] shadow-sm border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-white/40 uppercase tracking-wider bg-white/5">
                      <th className="px-8 py-4">Coupon Code</th>
                      <th className="px-8 py-4">Discount</th>
                      <th className="px-8 py-4">Applicability</th>
                      <th className="px-8 py-4">Usage</th>
                      <th className="px-8 py-4">Expiry</th>
                      <th className="px-8 py-4">Status</th>
                      <th className="px-8 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {coupons.map((c: any) => (
                      <tr key={c.id} className="text-sm hover:bg-white/5 transition-colors">
                        <td className="px-8 py-6">
                          <div className="font-bold text-white font-mono">{c.code}</div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="bg-secondary/10 text-secondary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                            {c.discount_percentage}% OFF
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="text-xs text-white/60">
                            {c.event_name ? `Event: ${c.event_name}` : 'All Events'}
                          </div>
                          {c.ticket_type_name && (
                            <div className="text-[10px] text-white/30 italic">
                              Ticket: {c.ticket_type_name}
                            </div>
                          )}
                        </td>
                        <td className="px-8 py-6">
                          <div className="text-white font-bold">{c.used_count} / {c.usage_limit || '∞'}</div>
                          <div className="text-[10px] text-white/30 uppercase">Per User: {c.per_user_limit || '∞'}</div>
                        </td>
                        <td className="px-8 py-6 text-white/60 text-xs">
                          {c.expiry_date ? new Date(c.expiry_date).toLocaleDateString() : 'No Expiry'}
                        </td>
                        <td className="px-8 py-6">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                            c.is_active ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                          )}>{c.is_active ? 'Active' : 'Inactive'}</span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-3">
                            <button 
                              onClick={() => handleToggleCoupon(c.id, c.is_active)}
                              className={cn(
                                "text-xs font-bold transition-colors",
                                c.is_active ? "text-red-400 hover:text-red-500" : "text-green-400 hover:text-green-500"
                              )}
                            >
                              {c.is_active ? 'Deactivate' : 'Activate'}
                            </button>
                            <button 
                              onClick={() => handleDeleteCoupon(c.id)}
                              className="text-white/30 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {coupons.length === 0 && (
                      <tr>
                        <td colSpan={7} className="px-8 py-20 text-center text-white/30">
                          <Tag className="mx-auto mb-4 opacity-20" size={48} />
                          No coupons created yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'contracts' && (
            <div className="bg-surface rounded-[32px] shadow-sm border border-white/10 overflow-hidden">
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white">Service Contracts</h2>
                  <p className="text-white/40 text-sm mt-1">Manage and view generated event contracts</p>
                </div>
                <div className="bg-white/5 px-4 py-2 rounded-xl border border-white/10">
                  <span className="text-accent font-bold">{contracts.length}</span>
                  <span className="text-white/40 text-xs ml-2 uppercase tracking-widest">Total</span>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-white/40 uppercase tracking-wider bg-white/5">
                      <th className="px-8 py-4">Contract ID</th>
                      <th className="px-8 py-4">Event</th>
                      <th className="px-8 py-4">Generated At</th>
                      <th className="px-8 py-4">Status</th>
                      <th className="px-8 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {contracts.map((c: any) => (
                      <tr key={c.id} className="text-sm hover:bg-white/5 transition-colors">
                        <td className="px-8 py-6 font-mono text-xs text-secondary">{c.id}</td>
                        <td className="px-8 py-6">
                          <div className="font-bold text-white">{c.event_name}</div>
                          <div className="text-xs text-white/40">{c.organizer_email}</div>
                        </td>
                        <td className="px-8 py-6 text-white/60 text-xs">
                          {new Date(c.created_at).toLocaleString()}
                        </td>
                        <td className="px-8 py-6">
                          <span className="bg-green-500/10 text-green-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">
                            Generated
                          </span>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex items-center space-x-4">
                            <a 
                              href={`/api/admin/contracts/${c.id}/download`}
                              download
                              className="text-xs font-bold text-accent hover:underline flex items-center space-x-1"
                            >
                              <Download size={14} />
                              <span>Download</span>
                            </a>
                            <button 
                              onClick={() => {
                                alert(`Contract Details:\nID: ${c.id}\nEvent: ${c.event_name}\nOrganizer: ${c.organizer_email}\nGenerated: ${new Date(c.created_at).toLocaleString()}`);
                              }}
                              className="text-xs font-bold text-white/40 hover:text-white transition-colors"
                            >
                              View Info
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {contracts.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center text-white/20">
                          <FileText className="mx-auto mb-4 opacity-10" size={48} />
                          No contracts generated yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'scan-history' && (
            <div className="bg-surface rounded-[32px] shadow-sm border border-white/10 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-white/40 uppercase tracking-wider bg-white/5">
                      <th className="px-8 py-4">Time</th>
                      <th className="px-8 py-4">Ticket ID</th>
                      <th className="px-8 py-4">Attendee</th>
                      <th className="px-8 py-4">Event</th>
                      <th className="px-8 py-4">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {scanLogs.map((log: any) => (
                      <tr key={log.id} className="text-sm hover:bg-white/5 transition-colors">
                        <td className="px-8 py-6 text-white/40">
                          {new Date(log.scanned_at).toLocaleString()}
                        </td>
                        <td className="px-8 py-6 font-mono text-xs text-secondary">{log.ticket_id}</td>
                        <td className="px-8 py-6 font-bold text-white">{log.attendee_name}</td>
                        <td className="px-8 py-6 text-white/60">{log.event_name}</td>
                        <td className="px-8 py-6">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest",
                            log.status === 'SUCCESS' ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
                          )}>{log.message}</span>
                        </td>
                      </tr>
                    ))}
                    {scanLogs.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-8 py-20 text-center text-white/20">
                          No scan activity recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'scan' && (
            <div className="bg-surface rounded-[32px] border border-white/10 overflow-hidden shadow-2xl">
              <TicketVerification isDashboardView={true} onBack={() => setActiveTab('stats')} onSuccess={fetchData} />
            </div>
          )}

          {activeTab === 'contracts' && (
            <div className="space-y-6 pb-24 md:pb-0">
              <div className="bg-surface rounded-[32px] border border-white/10 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5">
                        <th className="p-6 text-xs font-bold text-white/30 uppercase tracking-widest">Organizer</th>
                        <th className="p-6 text-xs font-bold text-white/30 uppercase tracking-widest">Event</th>
                        <th className="p-6 text-xs font-bold text-white/30 uppercase tracking-widest">Status</th>
                        <th className="p-6 text-xs font-bold text-white/30 uppercase tracking-widest">Effective Date</th>
                        <th className="p-6 text-xs font-bold text-white/30 uppercase tracking-widest text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {contracts.map((contract: any) => (
                        <tr key={contract.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="p-6">
                            <div className="font-bold text-white">{contract.organizer_name}</div>
                            <div className="text-xs text-white/40">{contract.organizer_email}</div>
                          </td>
                          <td className="p-6">
                            <div className="text-sm text-white/80">{contract.event_name || 'N/A'}</div>
                          </td>
                          <td className="p-6">
                            <span className={cn(
                              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
                              contract.status === 'SIGNED' ? "bg-green-500/10 text-green-400" : "bg-yellow-500/10 text-yellow-400"
                            )}>
                              {contract.status}
                            </span>
                          </td>
                          <td className="p-6">
                            <div className="text-sm text-white/60">{new Date(contract.effective_date).toLocaleDateString()}</div>
                          </td>
                          <td className="p-6 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button 
                                onClick={() => window.open(`/api/admin/contracts/${contract.id}/pdf`, '_blank')}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 hover:text-secondary transition-all"
                                title="Download PDF"
                              >
                                <Download size={18} />
                              </button>
                              <button 
                                onClick={() => setIsContractModalOpen(true)}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 hover:text-secondary transition-all"
                                title="View Details"
                              >
                                <Info size={18} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {contracts.length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-12 text-center text-white/30 font-bold">
                            No contracts found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'add-event' && (
            <div className="bg-surface p-8 md:p-12 rounded-[40px] shadow-sm border border-white/10">
              <AddEventForm onSuccess={() => {
                setActiveTab('events');
                fetchData();
              }} />
            </div>
          )}
        </div>
      </div>

      <ManualTicketModal 
        isOpen={isManualModalOpen} 
        onClose={() => setIsManualModalOpen(false)} 
        onSuccess={fetchData}
        events={adminEvents}
      />

      <CouponModal
        isOpen={isCouponModalOpen}
        onClose={() => setIsCouponModalOpen(false)}
        onSuccess={fetchData}
        events={adminEvents}
      />

      <CompleteSetupModal
        isOpen={isCompleteSetupModalOpen}
        onClose={() => setIsCompleteSetupModalOpen(false)}
        onSuccess={fetchData}
        submission={selectedSubmission}
      />

      <CreateEventModal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        onSuccess={fetchData}
      />

      {editingEvent && (
        <EditEventModal 
          event={editingEvent}
          onClose={() => setEditingEvent(null)}
          onSuccess={fetchData}
        />
      )}

      {/* Mobile Add Event FAB */}
      {isLoggedIn && (
        <div className="md:hidden fixed bottom-24 right-6 z-40">
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-secondary text-primary w-14 h-14 rounded-full flex items-center justify-center shadow-2xl shadow-secondary/40 active:scale-90 transition-transform border-4 border-primary"
          >
            <PlusCircle size={28} />
          </button>
        </div>
      )}

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-white/10 px-4 py-3 flex justify-between items-center z-50 shadow-[0_-10px_30px_rgba(0,0,0,0.5)]">
        {menuItems.slice(0, 4).map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={cn(
              "flex flex-col items-center space-y-1 transition-all flex-1",
              activeTab === item.id ? "text-secondary" : "text-white/30"
            )}
          >
            <item.icon size={20} className={cn(activeTab === item.id && "scale-110")} />
            <span className="text-[8px] font-bold uppercase tracking-tighter truncate w-full text-center">{item.label}</span>
          </button>
        ))}
        
        {/* More Menu Trigger */}
        <div className="relative flex-1">
          <button
            onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
            className={cn(
              "flex flex-col items-center space-y-1 transition-all w-full",
              ['contracts', 'coupons', 'inventory'].includes(activeTab) ? "text-secondary" : "text-white/30"
            )}
          >
            <Sparkles size={20} />
            <span className="text-[8px] font-bold uppercase tracking-tighter">More</span>
          </button>
          
          <AnimatePresence>
            {isMoreMenuOpen && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMoreMenuOpen(false)}
                  className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
                />
                <motion.div 
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20, scale: 0.95 }}
                  className="absolute bottom-full right-0 mb-4 bg-surface border border-white/10 rounded-2xl p-2 shadow-2xl z-50 min-w-[160px]"
                >
                  {menuItems.slice(4).map(item => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id as any);
                        setIsMoreMenuOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center space-x-3 p-4 rounded-xl transition-all text-left",
                        activeTab === item.id ? "bg-secondary text-primary" : "text-white/60 hover:bg-white/5"
                      )}
                    >
                      <item.icon size={18} />
                      <span className="text-sm font-bold">{item.label}</span>
                    </button>
                  ))}
                  <div className="h-px bg-white/5 my-2" />
                  <button
                    onClick={() => {
                      setIsLoggedIn(false);
                      localStorage.removeItem('admin_logged_in');
                      navigate('/');
                    }}
                    className="w-full flex items-center space-x-3 p-4 rounded-xl text-red-400 hover:bg-red-400/10 transition-all text-left"
                  >
                    <LogOut size={18} />
                    <span className="text-sm font-bold">Logout</span>
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

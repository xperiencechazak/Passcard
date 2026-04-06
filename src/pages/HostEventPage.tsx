import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Users, TrendingUp, CheckCircle2, ArrowRight, Mail, Phone, MapPin, Send } from 'lucide-react';
import { fetchApi } from '../lib/api';

const HostEventPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    organizer: '',
    organizer_email: '',
    venue: '',
    date: '',
    time: '',
    description: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    try {
      await fetchApi('/api/events/submit', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      
      setIsSubmitted(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const features = [
    {
      icon: <Calendar className="text-secondary" size={32} />,
      title: "Submit Your Details",
      description: "Provide basic event info and our team will handle the rest."
    },
    {
      icon: <Users className="text-secondary" size={32} />,
      title: "Admin Review",
      description: "Our admins will review, add posters, and set up ticket tiers."
    },
    {
      icon: <TrendingUp className="text-secondary" size={32} />,
      title: "Go Live",
      description: "Once approved, your event goes live for ticket sales and RSVPs."
    }
  ];

  return (
    <div className="min-h-screen bg-primary">
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 overflow-hidden bg-primary">
        <div className="absolute inset-0 bg-[url('https://picsum.photos/seed/crowd/1920/1080?blur=4')] bg-cover bg-center opacity-20" />
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight"
          >
            Submit Your <span className="text-secondary">Event</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-white/80 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Ready to host? Submit your event details below. Our admin team will review and complete the setup for you.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <a 
              href="#submit-form" 
              className="inline-flex items-center space-x-3 bg-secondary text-primary px-10 py-5 rounded-2xl font-bold text-lg hover:bg-opacity-90 transition-all shadow-xl shadow-secondary/20"
            >
              <span>Submit Event Now</span>
              <ArrowRight size={20} />
            </a>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 md:py-32 max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {features.map((feature, idx) => (
            <motion.div 
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1 }}
              className="p-10 rounded-[40px] bg-surface border border-white/10 hover:shadow-xl transition-all group"
            >
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-8 shadow-sm group-hover:scale-110 transition-transform">
                {feature.icon}
              </div>
              <h3 className="text-2xl font-bold text-white mb-4">{feature.title}</h3>
              <p className="text-white/70 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Submit Form Section */}
      <section id="submit-form" className="py-24 md:py-32 bg-primary/30">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tight">
                Event <span className="text-secondary">Submission</span>
              </h2>
              <p className="text-xl text-white/70 mb-12 leading-relaxed">
                Provide the basic details of your event. Once submitted, our admin team will review it, assign a professional poster, and set up the ticketing structure.
              </p>
              
              <div className="space-y-8">
                <div className="flex items-center space-x-6">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <div className="text-xs text-white/50 uppercase font-bold tracking-widest mb-1">Step 1</div>
                    <div className="font-bold text-white">Public Submission (Pending Approval)</div>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
                    <Users size={24} />
                  </div>
                  <div>
                    <div className="text-xs text-white/50 uppercase font-bold tracking-widest mb-1">Step 2</div>
                    <div className="font-bold text-white">Admin Review & Setup</div>
                  </div>
                </div>
                <div className="flex items-center space-x-6">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white">
                    <Send size={24} />
                  </div>
                  <div>
                    <div className="text-xs text-white/50 uppercase font-bold tracking-widest mb-1">Step 3</div>
                    <div className="font-bold text-white">Live Publishing</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-surface p-8 md:p-12 rounded-[40px] shadow-2xl border border-white/10">
              {isSubmitted ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-12"
                >
                  <div className="w-20 h-20 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 size={48} />
                  </div>
                  <h3 className="text-3xl font-bold text-white mb-4">Submitted!</h3>
                  <p className="text-white/70 mb-8 leading-relaxed">
                    Your event has been submitted for review. Our team will contact you at <strong>{formData.organizer_email}</strong> once it's ready.
                  </p>
                  <button 
                    onClick={() => setIsSubmitted(false)}
                    className="text-secondary font-bold hover:underline"
                  >
                    Submit another event
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-sm">
                      {error}
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Event Name</label>
                    <input required type="text" className="w-full p-4 bg-primary/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-secondary transition-all text-white" 
                      value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="e.g. Worship Night 2024" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Organizer Name</label>
                      <input required type="text" className="w-full p-4 bg-primary/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-secondary transition-all text-white" 
                        value={formData.organizer} onChange={e => setFormData({...formData, organizer: e.target.value})} placeholder="Church or Group Name" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Organizer Email</label>
                      <input required type="email" className="w-full p-4 bg-primary/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-secondary transition-all text-white" 
                        value={formData.organizer_email} onChange={e => setFormData({...formData, organizer_email: e.target.value})} placeholder="contact@example.com" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Venue / Location</label>
                    <input required type="text" className="w-full p-4 bg-primary/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-secondary transition-all text-white" 
                      value={formData.venue} onChange={e => setFormData({...formData, venue: e.target.value})} placeholder="Full address or venue name" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Date</label>
                      <input required type="date" className="w-full p-4 bg-primary/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-secondary transition-all text-white" 
                        value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Time</label>
                      <input required type="time" className="w-full p-4 bg-primary/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-secondary transition-all text-white" 
                        value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Description</label>
                    <textarea required rows={4} className="w-full p-4 bg-primary/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-secondary transition-all text-white" 
                      value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Tell us about your event..." />
                  </div>

                  <button 
                    disabled={isSubmitting}
                    className="w-full bg-secondary text-primary py-5 rounded-2xl font-bold text-xl hover:bg-opacity-90 transition-all shadow-xl shadow-secondary/20 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Event for Review'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HostEventPage;

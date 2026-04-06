import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Calendar, MapPin, Ticket as TicketIcon, ArrowRight, Search, Filter, Loader2, Sparkles, Music, Users, Heart, PlusCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { fetchApi } from '../lib/api';

const HomePage = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const data = await fetchApi('/api/events');
      setEvents(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['All', 'Concert', 'Worship', 'Conference', 'Youth', 'Other'];

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         event.organizer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || event.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredEvent = events[0];

  return (
    <div className="min-h-screen bg-primary">
      {/* Featured Event Banner (Top Poster) */}
      {featuredEvent && (
        <section className="relative w-full h-[80vh] overflow-hidden">
          <div className="absolute inset-0">
            <img 
              src={featuredEvent.banner_url} 
              alt={featuredEvent.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/40 to-transparent" />
          </div>
          
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-20 z-10">
            <div className="max-w-7xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="max-w-3xl"
              >
                <div className="inline-flex items-center space-x-3 bg-secondary text-primary px-6 py-3 rounded-full text-sm font-black uppercase tracking-[0.2em] mb-8 shadow-2xl shadow-secondary/40">
                  <div className="w-6 h-6 flex items-center justify-center overflow-hidden">
                    <img 
                      src="/images/passcardlogo.png" 
                      alt="Logo" 
                      className="w-full h-full object-contain brightness-0"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const parent = e.currentTarget.parentElement;
                        if (parent) {
                          const icon = document.createElement('div');
                          icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkles"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>';
                          parent.appendChild(icon.firstChild as Node);
                        }
                      }}
                    />
                  </div>
                  <span>Top Experience</span>
                </div>
                <h1 className="text-6xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.9] uppercase">
                  {featuredEvent.name}
                </h1>
                <p className="text-xl text-white/80 mb-10 line-clamp-3 max-w-2xl font-medium leading-relaxed">
                  {featuredEvent.description}
                </p>
                <div className="flex flex-wrap gap-6 items-center">
                  <Link 
                    to={`/event/${featuredEvent.id}`}
                    className="bg-secondary text-primary px-12 py-5 rounded-2xl font-bold text-xl hover:scale-105 transition-all shadow-2xl shadow-secondary/30 flex items-center space-x-4"
                  >
                    <span>{featuredEvent.is_free ? 'RSVP Now' : 'Get Tickets'}</span>
                    <ArrowRight size={24} />
                  </Link>
                  <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 text-white/70 font-bold uppercase tracking-widest text-sm">
                    <div className="flex items-center space-x-3">
                      <Calendar size={24} className="text-secondary" />
                      <span>{new Date(featuredEvent.date).toLocaleDateString('en-KE', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <MapPin size={24} className="text-secondary" />
                      <span>{featuredEvent.venue}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* Hero Section with Tagline (Now below the featured poster) */}
      <section className="relative py-32 md:py-48 overflow-hidden bg-primary">
        <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-12"
          >
            <div className="inline-flex items-center bg-white/5 backdrop-blur-md border border-white/10 text-secondary px-6 py-4 rounded-full text-sm font-bold uppercase tracking-[0.3em] mb-4">
              <div className="w-8 h-8 flex items-center justify-center overflow-hidden">
                <img 
                  src="/images/passcardlogo.png" 
                  alt="Logo" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const parent = e.currentTarget.parentElement;
                    if (parent) {
                      const icon = document.createElement('div');
                      icon.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-sparkles animate-pulse"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>';
                      parent.appendChild(icon.firstChild as Node);
                    }
                  }}
                />
              </div>
            </div>
            
            <div className="relative">
              <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-[10rem] font-black text-white tracking-tighter leading-[0.8] uppercase select-none">
                Access <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary via-orange-400 to-secondary animate-gradient-x italic">
                  the Xtraordinary
                </span>
              </h1>
            </div>

            <p className="text-xl md:text-3xl text-white/40 max-w-3xl mx-auto font-medium leading-relaxed tracking-tight">
              The ultimate ticketing platform for seamless event experiences. <br className="hidden md:block" />
              Discover, book, and attend the best events in Kenya.
            </p>
          </motion.div>
        </div>
        
        {/* Immersive Background Elements */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute top-1/2 left-1/4 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[150px] animate-pulse" />
          <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-primary/40 rounded-full blur-[150px]" />
        </div>
      </section>

      {/* Search & Filter Section */}
      <section id="events" className="py-12 bg-primary">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="bg-surface/50 backdrop-blur-xl p-6 md:p-8 rounded-[32px] border border-white/10 relative z-20"
          >
            <div className="flex flex-col lg:flex-row gap-6 items-center">
              <div className="flex-1 relative w-full">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-white/50" size={20} />
                <input 
                  type="text" 
                  placeholder="Search events, artists, or venues..."
                  className="w-full pl-14 pr-6 py-4 bg-primary/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-secondary transition-all text-white placeholder:text-white/30"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-6 py-3 rounded-xl font-bold text-xs transition-all border",
                      selectedCategory === cat 
                        ? "bg-secondary text-primary border-secondary" 
                        : "bg-white/5 border-white/10 text-white/70 hover:border-secondary/30"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Horizontal Events List */}
          <div className="mt-16">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex justify-between items-end mb-8"
            >
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white tracking-tight mb-2">Upcoming Events</h2>
                <p className="text-white/50">Swipe to explore more experiences</p>
              </div>
              <div className="hidden md:block">
                <div className="text-xs font-bold text-white uppercase tracking-widest bg-white/5 px-4 py-2 rounded-full border border-white/10">
                  {filteredEvents.length} Events
                </div>
              </div>
            </motion.div>

            {loading ? (
              <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="animate-spin text-secondary mb-4" size={40} />
                <p className="text-white/30 font-bold uppercase tracking-widest text-xs">Loading...</p>
              </div>
            ) : filteredEvents.length > 0 ? (
              <div className="flex overflow-x-auto pb-8 gap-6 snap-x no-scrollbar">
                {filteredEvents.map((event, idx) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.05 }}
                    className="min-w-[300px] md:min-w-[400px] snap-start group"
                  >
                    <Link to={`/event/${event.id}`} className="block">
                      <div className="relative aspect-[4/5] rounded-[32px] overflow-hidden mb-4 shadow-xl transition-all group-hover:-translate-y-2">
                        <img 
                          src={event.banner_url} 
                          alt={event.name}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                          referrerPolicy="no-referrer"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary via-transparent to-transparent opacity-80" />
                        
                        <div className="absolute top-6 left-6 flex flex-col gap-2">
                          <div className="bg-white/20 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-widest">
                            {event.category}
                          </div>
                          {event.is_free === 1 && (
                            <div className="bg-secondary text-primary px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-tighter shadow-lg shadow-secondary/20">
                              Free Event
                            </div>
                          )}
                          {event.is_flash_sale_active === 1 && (
                            <div className="bg-secondary text-primary px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-tighter shadow-lg shadow-secondary/20 animate-pulse">
                              Flash Sale!
                            </div>
                          )}
                          {event.total_sold >= event.total_capacity && (
                            <div className="bg-red-500 text-white px-4 py-2 rounded-2xl text-[10px] font-bold uppercase tracking-widest shadow-lg shadow-red-500/20">
                              Sold Out
                            </div>
                          )}
                        </div>

                        <div className="absolute bottom-6 left-6 right-6">
                          <div className="flex items-center space-x-2 text-secondary font-bold text-[10px] uppercase tracking-widest mb-2">
                            <Calendar size={12} />
                            <span>{new Date(event.date).toLocaleDateString('en-KE', { month: 'short', day: 'numeric' })}</span>
                          </div>
                          <h3 className="text-xl font-bold text-white leading-tight mb-3 group-hover:text-secondary transition-colors line-clamp-2">
                            {event.name}
                          </h3>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-white/60 text-xs">
                              <MapPin size={12} />
                              <span className="truncate max-w-[150px]">{event.venue}</span>
                            </div>
                            <div className="bg-secondary text-primary p-2 rounded-xl">
                              <ArrowRight size={16} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-surface/30 rounded-[32px] border-2 border-dashed border-white/10">
                <Search className="mx-auto text-white/10 mb-4" size={32} />
                <h3 className="text-xl font-bold text-white mb-2">No events found</h3>
                <p className="text-white/40 text-sm">Try adjusting your search or filters.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Host CTA Section */}
      <section className="py-24 md:py-32">
        <div className="max-w-7xl mx-auto px-6 md:px-12">
          <div className="bg-primary rounded-[60px] p-12 md:p-24 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-1/2 h-full bg-[url('https://picsum.photos/seed/crowd-2/800/800')] bg-cover bg-center opacity-20 hidden lg:block" />
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary to-transparent" />
            
            <div className="relative z-10 max-w-2xl">
              <h2 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tighter leading-[0.9]">
                Are you an <br />
                <span className="text-secondary">Event Organizer?</span>
              </h2>
              <p className="text-xl text-white/60 mb-12 leading-relaxed">
                Join hundreds of organizers who trust PassCard KE to power their events. Get access to real-time analytics, secure payments, and easy ticket verification.
              </p>
              <Link to="/host" className="inline-flex items-center space-x-4 bg-secondary text-primary px-10 py-5 rounded-2xl font-bold text-lg hover:scale-105 transition-all shadow-xl shadow-secondary/20">
                <span>Start Hosting Today</span>
                <ArrowRight size={20} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;

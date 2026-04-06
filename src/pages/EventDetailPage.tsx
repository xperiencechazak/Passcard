import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  MapPin, 
  Clock, 
  Ticket as TicketIcon, 
  ChevronRight, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Download, 
  Printer, 
  Share2 
} from 'lucide-react';
import { cn } from '../lib/utils';
import { fetchApi } from '../lib/api';

const EventDetailPage = () => {
  const { id } = useParams();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [attendeeName, setAttendeeName] = useState('');
  const [attendeeEmail, setAttendeeEmail] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'IDLE' | 'PENDING' | 'SUCCESS' | 'ERROR' | 'RSVP_SUCCESS'>('IDLE');
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [ticketIds, setTicketIds] = useState<string[]>([]);
  const [ticketId, setTicketId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTermsError, setShowTermsError] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!event?.ticketTypes) return;
      
      const now = new Date();
      let earliestEnd: Date | null = null;
      
      event.ticketTypes.forEach((tt: any) => {
        if (tt.flash_sale_price > 0 && tt.flash_sale_start && tt.flash_sale_end) {
          const start = new Date(tt.flash_sale_start);
          const end = new Date(tt.flash_sale_end);
          if (now >= start && now <= end) {
            if (!earliestEnd || end < earliestEnd) earliestEnd = end;
          }
        }
      });
      
      if (earliestEnd) {
        const diff = (earliestEnd as Date).getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(null);
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [event]);

  const getTicketPrice = (tt: any) => {
    if (tt.flash_sale_price > 0 && tt.flash_sale_start && tt.flash_sale_end) {
      const now = new Date();
      const start = new Date(tt.flash_sale_start);
      const end = new Date(tt.flash_sale_end);
      if (now >= start && now <= end) {
        return tt.flash_sale_price;
      }
    }
    return tt.price;
  };
  
  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      const data = await fetchApi(`/api/events/${id}`);
      setEvent(data);
      if (data.ticketTypes?.length > 0) {
        // Find first available ticket
        const available = data.ticketTypes.find((tt: any) => tt.sold < tt.quantity);
        setSelectedTicket(available || data.ticketTypes[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRSVP = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentStatus('PENDING');
    setError(null);

    try {
      const data = await fetchApi('/api/rsvp', {
        method: 'POST',
        body: JSON.stringify({
          eventId: event.id,
          attendeeName,
          attendeeEmail,
          phoneNumber: phoneNumber.replace('+', '').replace(/^0/, '254')
        })
      });

      setPaymentStatus('SUCCESS');
      setTicketId(data.ticketId);
      setTicketIds([data.ticketId]);
    } catch (err: any) {
      setPaymentStatus('ERROR');
      setError(err.message || "Failed to register RSVP");
    }
  };

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setIsValidatingCoupon(true);
    setCouponError(null);
    try {
      const data = await fetchApi('/api/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: couponCode,
          eventId: event.id,
          ticketTypeId: selectedTicket.id,
          email: attendeeEmail
        })
      });
      setAppliedCoupon(data);
      setCouponError(null);
    } catch (err: any) {
      setCouponError(err.message || "Invalid coupon code");
      setAppliedCoupon(null);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTicket.sold + quantity > selectedTicket.quantity) {
      setError("Not enough tickets available.");
      return;
    }
    setPaymentStatus('PENDING');
    setError(null);

    try {
      const currentPrice = getTicketPrice(selectedTicket);
      const data = await fetchApi('/api/stkpush', {
        method: 'POST',
        body: JSON.stringify({
          phoneNumber: phoneNumber.replace('+', '').replace(/^0/, '254'),
          amount: (currentPrice * quantity) - (appliedCoupon ? Math.floor((currentPrice * quantity * appliedCoupon.discount_percentage) / 100) : 0),
          quantity: quantity,
          eventId: event.id,
          ticketTypeId: selectedTicket.id,
          attendeeName,
          attendeeEmail,
          couponId: appliedCoupon?.id
        })
      });

      if (data.CheckoutRequestID) {
        setCheckoutRequestId(data.CheckoutRequestID);
        // Start polling for status
        pollPaymentStatus(data.CheckoutRequestID);
      }
    } catch (err: any) {
      setPaymentStatus('ERROR');
      setError(err.message || "Failed to initiate payment");
    }
  };

  const pollPaymentStatus = async (requestId: string) => {
    const interval = setInterval(async () => {
      try {
        const data = await fetchApi(`/api/payment-status/${requestId}`);

        if (data.status === 'SUCCESS') {
          clearInterval(interval);
          setPaymentStatus('SUCCESS');
          setTicketIds(data.ticketIds || [data.ticketId]);
          setTicketId(data.ticketId);
        } else if (data.status === 'ERROR') {
          clearInterval(interval);
          setPaymentStatus('ERROR');
          setError(data.message || "Payment failed or was cancelled.");
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    }, 3000);

    // Stop polling after 2 minutes
    setTimeout(() => clearInterval(interval), 120000);
  };

  const downloadTicket = (tId: string) => {
    window.open(`/api/tickets/${tId}/download`, '_blank');
  };

  const printTicket = () => {
    window.print();
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-primary" size={48} />
    </div>
  );

  if (!event) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <XCircle className="text-red-500 mb-4" size={64} />
      <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
      <Link to="/" className="text-primary font-bold hover:underline">Back to Events</Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-primary pb-20">
      {/* Hero Section */}
      <div className="relative h-[40vh] md:h-[60vh] w-full overflow-hidden">
        <img 
          src={event.banner_url} 
          alt={event.name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
          loading="eager"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-primary via-primary/40 to-transparent" />
        
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="max-w-7xl mx-auto">
            <Link to="/" className="inline-flex items-center space-x-2 text-white/80 hover:text-white mb-6 transition-colors">
              <ArrowLeft size={20} />
              <span className="font-bold uppercase tracking-widest text-xs">Back to all events</span>
            </Link>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-7xl font-bold text-white mb-4 tracking-tight leading-none"
            >
              {event.name}
            </motion.h1>
            <div className="flex flex-wrap gap-4 md:gap-8 text-white/90">
              <div className="flex items-center space-x-2">
                <Calendar size={20} className="text-secondary" />
                <span className="font-medium">{new Date(event.date).toLocaleDateString('en-KE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin size={20} className="text-secondary" />
                <span className="font-medium">{event.venue}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock size={20} className="text-secondary" />
                <span className="font-medium">{event.time}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 -mt-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column: Description */}
          <div className="lg:col-span-2 space-y-12">
            <div className="bg-surface p-8 md:p-12 rounded-[40px] shadow-sm border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
                <span className="w-1.5 h-8 bg-secondary rounded-full" />
                <span>About the Event</span>
              </h2>
              <div className="prose prose-lg text-white/70 max-w-none">
                {event.description.split('\n').map((p: string, i: number) => (
                  <p key={i} className="mb-4 leading-relaxed">{p}</p>
                ))}
              </div>
            </div>

            <div className="bg-surface p-8 md:p-12 rounded-[40px] shadow-sm border border-white/10">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
                <span className="w-1.5 h-8 bg-secondary rounded-full" />
                <span>Organizer</span>
              </h2>
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-white font-bold text-2xl">
                  {event.organizer[0]}
                </div>
                <div>
                  <div className="font-bold text-xl text-white">{event.organizer}</div>
                  <div className="text-white/50">Official Event Organizer</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Checkout */}
          <div className="space-y-8">
            <div className="bg-surface p-8 rounded-[40px] shadow-xl border border-white/10 sticky top-24">
              <AnimatePresence mode="wait">
                {paymentStatus === 'IDLE' && (
                  <motion.div 
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-8"
                  >
                    {event.is_free ? (
                      <div>
                        <div className="bg-secondary/10 border-2 border-secondary p-6 rounded-3xl mb-6">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-xl font-bold text-secondary">Free Event</h3>
                            <CheckCircle2 className="text-secondary" size={24} />
                          </div>
                          <p className="text-white/70 text-sm">This event is free to attend. Please RSVP below to secure your spot.</p>
                        </div>
                        
                        <form onSubmit={handleRSVP} className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Full Name</label>
                            <input 
                              required 
                              type="text" 
                              placeholder="Attendee Name"
                              className="w-full p-4 bg-primary/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-secondary transition-all text-white placeholder:text-white/30"
                              value={attendeeName}
                              onChange={e => setAttendeeName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Email Address</label>
                            <input 
                              required 
                              type="email" 
                              placeholder="your@email.com"
                              className="w-full p-4 bg-primary/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-secondary transition-all text-white placeholder:text-white/30"
                              value={attendeeEmail}
                              onChange={e => setAttendeeEmail(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Phone Number (Optional)</label>
                            <input 
                              type="tel" 
                              placeholder="07XX XXX XXX"
                              className="w-full p-4 bg-primary/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-secondary transition-all text-white placeholder:text-white/30"
                              value={phoneNumber}
                              onChange={e => setPhoneNumber(e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="flex items-start space-x-3 cursor-pointer group">
                              <div className="relative flex items-center mt-1">
                                <input 
                                  type="checkbox" 
                                  className="peer sr-only"
                                  checked={agreedToTerms}
                                  onChange={e => {
                                    setAgreedToTerms(e.target.checked);
                                    setShowTermsError(false);
                                  }}
                                />
                                <div className={cn(
                                  "w-5 h-5 border-2 rounded-md transition-all",
                                  agreedToTerms ? "bg-secondary border-secondary" : "border-white/20 group-hover:border-white/40",
                                  showTermsError && !agreedToTerms && "border-red-500"
                                )}>
                                  {agreedToTerms && <CheckCircle2 size={16} className="text-primary" />}
                                </div>
                              </div>
                              <span className="text-xs text-white/50 leading-tight">
                                I agree to the <Link to="/privacy" className="text-secondary hover:underline">Privacy Policy</Link> and <Link to="/terms" className="text-secondary hover:underline">Terms & Conditions</Link>.
                              </span>
                            </label>
                            {showTermsError && !agreedToTerms && (
                              <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest ml-8">Please agree to continue</p>
                            )}
                          </div>
                          
                          <button 
                            type="submit"
                            onClick={(e) => {
                              if (!agreedToTerms) {
                                e.preventDefault();
                                setShowTermsError(true);
                              }
                            }}
                            className="w-full bg-secondary text-primary py-5 rounded-2xl font-bold text-xl flex items-center justify-center space-x-3 hover:bg-opacity-90 transition-all shadow-xl shadow-secondary/20"
                          >
                            <CheckCircle2 size={24} />
                            <span>RSVP Now</span>
                          </button>
                        </form>
                      </div>
                    ) : (
                      <>
                    <div>
                      <h3 className="text-xl font-bold text-white mb-4">Select Ticket</h3>
                      <div className="space-y-3">
                        {event.ticketTypes?.map((tt: any) => {
                          const isSoldOut = tt.sold >= tt.quantity;
                          const currentPrice = getTicketPrice(tt);
                          const isFlashSale = currentPrice < tt.price;
                          
                          return (
                            <button
                              key={tt.id}
                              disabled={isSoldOut}
                              onClick={() => {
                                setSelectedTicket(tt);
                                setQuantity(1);
                              }}
                              className={cn(
                                "w-full p-5 rounded-3xl border-2 text-left transition-all flex justify-between items-center group relative overflow-hidden",
                                selectedTicket?.id === tt.id 
                                  ? "border-secondary bg-secondary/10" 
                                  : "border-white/10 hover:border-secondary/30",
                                isSoldOut && "opacity-50 grayscale cursor-not-allowed border-red-500/30 bg-red-500/5"
                              )}
                            >
                              {isFlashSale && (
                                <div className="absolute top-0 right-0 bg-secondary text-primary text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-tighter animate-pulse">
                                  Flash Sale!
                                </div>
                              )}
                              <div>
                                <div className={cn(
                                  "font-bold text-lg",
                                  selectedTicket?.id === tt.id ? "text-secondary" : "text-white/70",
                                  isSoldOut && "text-red-500"
                                )}>
                                  {tt.name}
                                  {isSoldOut && <span className="ml-2 text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">SOLD OUT</span>}
                                </div>
                                <div className="text-xs text-white/30 uppercase font-bold tracking-widest">
                                  {isSoldOut ? "No slots available" : `${tt.quantity - tt.sold} available`}
                                </div>
                              </div>
                              <div className="text-right">
                                {isFlashSale && (
                                  <div className="text-xs text-white/40 line-through">KES {tt.price.toLocaleString()}</div>
                                )}
                                <div className="text-xl font-bold text-white">KES {currentPrice.toLocaleString()}</div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {timeLeft && (
                      <div className="bg-secondary/20 border border-secondary/30 p-4 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Clock size={16} className="text-secondary animate-pulse" />
                          <span className="text-xs font-bold text-secondary uppercase tracking-widest">Flash Sale Ends In:</span>
                        </div>
                        <span className="text-lg font-black text-secondary font-mono">{timeLeft}</span>
                      </div>
                    )}

                    {selectedTicket && selectedTicket.sold < selectedTicket.quantity && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between bg-primary/20 p-4 rounded-2xl border border-white/10">
                          <span className="text-sm font-bold text-white/70">Quantity</span>
                          <div className="flex items-center space-x-4">
                            <button 
                              type="button"
                              onClick={() => setQuantity(Math.max(1, quantity - 1))}
                              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
                            >
                              -
                            </button>
                            <span className="text-xl font-bold text-white w-8 text-center">{quantity}</span>
                            <button 
                              type="button"
                              onClick={() => setQuantity(Math.min(selectedTicket.quantity - selectedTicket.sold, quantity + 1))}
                              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <form onSubmit={handlePayment} className="space-y-4">
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Full Name</label>
                            <input 
                              required 
                              type="text" 
                              placeholder="Attendee Name"
                              className="w-full p-4 bg-primary/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-secondary transition-all text-white placeholder:text-white/30"
                              value={attendeeName}
                              onChange={e => setAttendeeName(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Email Address</label>
                            <input 
                              required 
                              type="email" 
                              placeholder="your@email.com"
                              className="w-full p-4 bg-primary/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-secondary transition-all text-white placeholder:text-white/30"
                              value={attendeeEmail}
                              onChange={e => setAttendeeEmail(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">M-Pesa Number</label>
                            <input 
                              required 
                              type="tel" 
                              placeholder="07XX XXX XXX"
                              className="w-full p-4 bg-primary/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-secondary transition-all text-white placeholder:text-white/30"
                              value={phoneNumber}
                              onChange={e => setPhoneNumber(e.target.value)}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <label className="text-xs font-bold text-white/50 uppercase tracking-widest ml-1">Coupon Code</label>
                            <div className="flex space-x-2">
                              <input 
                                type="text" 
                                placeholder="Enter code (e.g. SAVE20)"
                                className="flex-1 p-4 bg-primary/20 border border-white/10 rounded-2xl focus:ring-2 focus:ring-secondary transition-all text-white placeholder:text-white/30 uppercase"
                                value={couponCode}
                                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                              />
                              <button 
                                type="button"
                                onClick={handleApplyCoupon}
                                disabled={isValidatingCoupon || !couponCode}
                                className="px-6 bg-white/10 text-white rounded-2xl font-bold hover:bg-white/20 transition-all disabled:opacity-50"
                              >
                                {isValidatingCoupon ? <Loader2 className="animate-spin" size={20} /> : 'Apply'}
                              </button>
                            </div>
                            {couponError && <p className="text-xs text-red-500 ml-1">{couponError}</p>}
                            {appliedCoupon && (
                              <div className="flex items-center space-x-2 text-xs text-green-500 ml-1">
                                <CheckCircle2 size={14} />
                                <span>Coupon Applied: {appliedCoupon.discount_percentage}% OFF</span>
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    setAppliedCoupon(null);
                                    setCouponCode('');
                                  }}
                                  className="text-white/40 hover:text-white underline ml-2"
                                >
                                  Remove
                                </button>
                              </div>
                            )}
                          </div>

                          <div className="pt-4 border-t border-white/10 space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-white/60">Subtotal</span>
                              <span className="text-white">KES {(getTicketPrice(selectedTicket) * quantity).toLocaleString()}</span>
                            </div>
                            {appliedCoupon && (
                              <div className="flex justify-between text-sm">
                                <span className="text-green-500">Discount ({appliedCoupon.discount_percentage}%)</span>
                                <span className="text-green-500">- KES {Math.floor((getTicketPrice(selectedTicket) * quantity * appliedCoupon.discount_percentage) / 100).toLocaleString()}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-xl font-bold pt-2">
                              <span className="text-white">Total</span>
                              <span className="text-secondary">
                                KES {((getTicketPrice(selectedTicket) * quantity) - (appliedCoupon ? Math.floor((getTicketPrice(selectedTicket) * quantity * appliedCoupon.discount_percentage) / 100) : 0)).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <label className="flex items-start space-x-3 cursor-pointer group">
                              <div className="relative flex items-center mt-1">
                                <input 
                                  type="checkbox" 
                                  className="peer sr-only"
                                  checked={agreedToTerms}
                                  onChange={e => {
                                    setAgreedToTerms(e.target.checked);
                                    setShowTermsError(false);
                                  }}
                                />
                                <div className={cn(
                                  "w-5 h-5 border-2 rounded-md transition-all",
                                  agreedToTerms ? "bg-secondary border-secondary" : "border-white/20 group-hover:border-white/40",
                                  showTermsError && !agreedToTerms && "border-red-500"
                                )}>
                                  {agreedToTerms && <CheckCircle2 size={16} className="text-primary" />}
                                </div>
                              </div>
                              <span className="text-xs text-white/50 leading-tight">
                                I agree to the <Link to="/privacy" className="text-secondary hover:underline">Privacy Policy</Link> and <Link to="/terms" className="text-secondary hover:underline">Terms & Conditions</Link>.
                              </span>
                            </label>
                            {showTermsError && !agreedToTerms && (
                              <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest ml-8">Please agree to continue</p>
                            )}
                          </div>

                          <button 
                            type="submit"
                            onClick={(e) => {
                              if (!agreedToTerms) {
                                e.preventDefault();
                                setShowTermsError(true);
                              }
                            }}
                            className="w-full bg-secondary text-primary py-5 rounded-2xl font-bold text-xl flex items-center justify-center space-x-3 hover:bg-opacity-90 transition-all shadow-xl shadow-secondary/20"
                          >
                            <TicketIcon size={24} />
                            <span>Pay KES {((getTicketPrice(selectedTicket) * quantity) - (appliedCoupon ? Math.floor((getTicketPrice(selectedTicket) * quantity * appliedCoupon.discount_percentage) / 100) : 0)).toLocaleString()}</span>
                          </button>
                        </form>
                      </div>
                    )}
                    </>
                    )}
                    
                    <p className="text-center text-xs text-white/30">
                      {event.is_free ? "Free registration" : "Secure payment via M-Pesa STK Push"}
                    </p>
                  </motion.div>
                )}

                {paymentStatus === 'PENDING' && (
                  <motion.div 
                    key="pending"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="relative w-24 h-24 mx-auto mb-8">
                      <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                      <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-4">Waiting for Payment</h3>
                    <p className="text-white/70 mb-8 leading-relaxed">
                      Please check your phone for the M-Pesa STK Push prompt and enter your PIN to complete the purchase.
                    </p>
                    <div className="bg-white/10 p-4 rounded-2xl text-white font-bold text-sm animate-pulse">
                      Do not close this window...
                    </div>
                  </motion.div>
                )}

                {paymentStatus === 'SUCCESS' && (
                  <motion.div 
                    key="success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <CheckCircle2 size={48} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{event.is_free ? 'RSVP Confirmed!' : 'Ticket Confirmed!'}</h3>
                    <p className="text-white/70 mb-8">Your {ticketIds.length > 1 ? 'tickets have' : 'ticket has'} been sent to your email.</p>
                    
                    <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {ticketIds.map((tId, index) => (
                        <div key={tId} className="bg-surface border-2 border-dashed border-white/10 p-6 rounded-3xl space-y-4">
                          <div className="flex justify-between items-center">
                            <div className="text-xs text-white/30 uppercase font-bold tracking-widest">Ticket {index + 1} of {ticketIds.length}</div>
                            <div className="text-sm font-mono font-bold text-secondary">{tId}</div>
                          </div>
                          <div className="flex justify-center">
                            <div className="bg-white p-2 rounded-2xl shadow-lg">
                              <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${tId}&margin=10`} 
                                alt="Ticket QR Code"
                                className="w-40 h-40"
                              />
                            </div>
                          </div>
                          <button 
                            onClick={() => downloadTicket(tId)}
                            className="w-full flex items-center justify-center space-x-2 bg-secondary text-primary py-3 rounded-xl font-bold hover:bg-opacity-90 transition-all text-sm"
                          >
                            <Download size={18} />
                            <span>Download Ticket {index + 1}</span>
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 pt-8 border-t border-white/10">
                      <button 
                        onClick={printTicket}
                        className="w-full flex items-center justify-center space-x-2 bg-white/10 text-white py-4 rounded-2xl font-bold hover:bg-white/20 transition-all"
                      >
                        <Printer size={20} />
                        <span>Print All Tickets</span>
                      </button>
                      
                      <button 
                        onClick={() => setPaymentStatus('IDLE')}
                        className="mt-6 text-primary font-bold hover:underline"
                      >
                        {event.is_free ? 'Back to Event' : 'Buy Another Ticket'}
                      </button>
                    </div>
                  </motion.div>
                )}

                {paymentStatus === 'ERROR' && (
                  <motion.div 
                    key="error"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                      <XCircle size={48} />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">Payment Failed</h3>
                    <p className="text-white/70 mb-8">{error || "Something went wrong with the transaction."}</p>
                    <button 
                      onClick={() => setPaymentStatus('IDLE')}
                      className="w-full bg-secondary text-primary py-4 rounded-2xl font-bold hover:bg-opacity-90 transition-all"
                    >
                      Try Again
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="bg-primary p-8 rounded-[40px] text-white">
              <h4 className="font-bold text-xl mb-4 flex items-center space-x-2">
                <Share2 size={20} className="text-secondary" />
                <span>Share Event</span>
              </h4>
              <p className="text-white/60 text-sm mb-6">Invite your friends and family to join this experience.</p>
              <div className="flex space-x-4">
                {['WhatsApp', 'Twitter', 'Facebook'].map(platform => (
                  <button key={platform} className="flex-1 bg-white/10 py-3 rounded-xl text-xs font-bold hover:bg-white/20 transition-all">
                    {platform}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetailPage;

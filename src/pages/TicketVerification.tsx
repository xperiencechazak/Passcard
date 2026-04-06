import React, { useState, useEffect, useRef } from "react";
import { 
  QrCode, 
  ArrowLeft, 
  CheckCircle2, 
  XCircle, 
  Info, 
  User, 
  Calendar, 
  Ticket,
  Maximize2,
  Minimize2,
  History,
  Clock,
  Search,
  LogOut
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { fetchApi } from "../lib/api";
import { Link, useNavigate } from "react-router-dom";
import { Html5Qrcode } from "html5-qrcode";

interface TicketVerificationProps {
  onBack?: () => void;
  isDashboardView?: boolean;
  onSuccess?: () => void;
}

export default function TicketVerification({ onBack, isDashboardView = false, onSuccess }: TicketVerificationProps) {
  const navigate = useNavigate();
  const [scanResult, setScanResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [manualTicketId, setManualTicketId] = useState("");
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastScannedRef = useRef<{ code: string, time: number } | null>(null);

  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    const startScanner = async () => {
      try {
        // Small delay to ensure DOM is settled
        await new Promise(resolve => setTimeout(resolve, 300));
        
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            disableFlip: true
          },
          onScanSuccess,
          onScanFailure
        );
      } catch (err) {
        console.error("Failed to start scanner", err);
        setError("Could not access back camera. Please ensure permissions are granted.");
      }
    };

    startScanner();

    return () => {
      if (html5QrCode.isScanning) {
        html5QrCode.stop().then(() => {
          html5QrCode.clear();
        }).catch(err => console.error("Failed to stop scanner", err));
      }
    };
  }, []);

  const onScanSuccess = async (decodedText: string) => {
    if (loading || isPaused) return;
    
    const now = Date.now();
    // Prevent re-scanning the same code within 3 seconds
    if (lastScannedRef.current && 
        lastScannedRef.current.code === decodedText && 
        now - lastScannedRef.current.time < 3000) {
      return;
    }
    
    lastScannedRef.current = { code: decodedText, time: now };
    setIsPaused(true);
    handleVerify(decodedText.trim());
  };

  const onScanFailure = (error: any) => {
    // Silently handle scan failures
  };

  const handleVerify = async (ticketId: string) => {
    if (!ticketId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApi("/api/verify", {
        method: "POST",
        body: JSON.stringify({ ticketId: ticketId.trim() }),
      });
      
      setScanResult(data);
      
      // Add to history
      setScanHistory(prev => [{
        id: ticketId.trim(),
        status: data.status,
        attendee: data.attendee_name || "Unknown",
        event: data.event_name || "Unknown",
        time: new Date().toISOString()
      }, ...prev].slice(0, 20));

      // Trigger success callback if valid
      if (data.status === 'VALID') {
        if (onSuccess) onSuccess();
        // Auto-clear result after 3 seconds
        setTimeout(() => {
          setScanResult(null);
          setIsPaused(false);
        }, 3000);
      } else {
        // For non-valid results, auto-clear after 5 seconds so it doesn't stay stuck
        setTimeout(() => {
          setScanResult(null);
          setIsPaused(false);
        }, 5000);
      }
    } catch (err: any) {
      setError(err.message || "Failed to verify ticket. Please check your connection.");
      setIsPaused(false);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualTicketId.trim()) {
      handleVerify(manualTicketId.trim());
      setManualTicketId("");
    }
  };

  return (
    <div className={cn(
      !isDashboardView && "min-h-screen bg-[#0A0A0A]",
      "text-white font-sans",
      isFullScreen ? "fixed inset-0 z-[100] flex flex-col items-center justify-center p-0" : "p-4 md:p-8"
    )}>
      <div className={cn(
        "max-w-4xl mx-auto w-full",
        isFullScreen && "max-w-none h-full flex flex-col"
      )}>
        {/* Header */}
        <header className={cn(
          "flex items-center justify-between mb-8",
          isFullScreen && "absolute top-6 left-6 right-6 z-20 mb-0"
        )}>
          <div className="flex items-center gap-4">
            {isFullScreen ? (
              <button 
                onClick={() => setIsFullScreen(false)}
                className="p-3 bg-white/10 backdrop-blur-md rounded-2xl hover:bg-white/20 transition-all flex items-center gap-2 font-bold text-sm uppercase tracking-widest border border-white/10"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back</span>
              </button>
            ) : isDashboardView ? null : (
              <div className="flex items-center gap-3">
                <Link 
                  to="/admin"
                  className="p-3 bg-white/10 backdrop-blur-md rounded-2xl hover:bg-white/20 transition-all flex items-center gap-2 font-bold text-sm uppercase tracking-widest border border-white/10"
                >
                  <ArrowLeft className="w-5 h-5" />
                  <span>Back</span>
                </Link>
                <button 
                  onClick={() => {
                    localStorage.removeItem('admin_logged_in');
                    navigate('/admin');
                  }}
                  className="p-3 bg-red-500/10 text-red-400 rounded-2xl hover:bg-red-500/20 transition-all border border-red-500/10 flex items-center gap-2 font-bold text-sm uppercase tracking-widest"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              </div>
            )}
            {!isFullScreen && (
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">Ticket Scanner</h1>
                <p className="text-sm text-gray-500">Scan QR codes to verify entry</p>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-3 bg-white/10 backdrop-blur-md rounded-xl hover:bg-white/20 transition-all border border-white/10"
          >
            {isFullScreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </header>

        <div className={cn(
          "grid grid-cols-1 lg:grid-cols-2 gap-8",
          isFullScreen && "flex-1 flex flex-col items-center justify-center gap-0"
        )}>
          {/* Scanner Section */}
          <div className={cn(
            "space-y-6",
            isFullScreen && "w-full h-full space-y-0"
          )}>
            <div className={cn(
              "relative aspect-square bg-[#141414] rounded-3xl border-2 border-white/5 overflow-hidden shadow-2xl",
              isFullScreen ? "w-full h-full rounded-none border-0" : "w-full"
            )}>
              <div id="reader" className="w-full h-full"></div>
              
              {/* Scanning Overlay */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
                <div className={cn(
                  "border-2 border-[#F27D26]/30 rounded-2xl relative",
                  isFullScreen ? "w-72 h-72" : "w-64 h-64"
                )}>
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#F27D26] rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-[#F27D26] rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-[#F27D26] rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#F27D26] rounded-br-lg"></div>
                  
                  {/* Scanning Line */}
                  <motion.div 
                    animate={{ top: ["0%", "100%", "0%"] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    className="absolute left-0 right-0 h-0.5 bg-[#F27D26] shadow-[0_0_15px_rgba(242,125,38,0.8)]"
                  />
                </div>
              </div>

              {loading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-20">
                  <div className="w-12 h-12 border-4 border-[#F27D26] border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Manual Input - Hide in full screen if requested, but user said centered scanner */}
            {!isFullScreen && (
              <form onSubmit={handleManualSubmit} className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-[#F27D26] transition-colors" />
                <input 
                  type="text"
                  placeholder="Enter Ticket ID manually..."
                  value={manualTicketId}
                  onChange={(e) => setManualTicketId(e.target.value)}
                  className="w-full pl-12 pr-24 py-4 bg-[#141414] border border-white/10 rounded-2xl focus:outline-none focus:border-[#F27D26] transition-all font-mono text-white"
                />
                <button 
                  type="submit"
                  className="absolute right-2 top-2 bottom-2 px-4 bg-[#F27D26] hover:bg-[#d96d1f] rounded-xl font-bold text-sm transition-all text-primary"
                >
                  Verify
                </button>
              </form>
            )}

            {/* Scan History (Mobile) */}
            {!isFullScreen && (
              <div className="lg:hidden">
                <HistorySection history={scanHistory} />
              </div>
            )}
          </div>

          {/* Result & History Section */}
          <div className={cn(
            "space-y-8",
            isFullScreen && "absolute bottom-10 left-6 right-6 z-30 space-y-0"
          )}>
            <AnimatePresence mode="wait">
              {scanResult ? (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: -20 }}
                  className={cn(
                    "p-8 rounded-3xl border-2 shadow-2xl backdrop-blur-xl",
                    scanResult.status === 'VALID' ? "bg-emerald-500/20 border-emerald-500/30" : 
                    scanResult.status === 'USED' ? "bg-orange-500/20 border-orange-500/30" : 
                    "bg-red-500/20 border-red-500/30"
                  )}
                >
                  <div className="flex items-center gap-4 mb-8">
                    <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center",
                      scanResult.status === 'VALID' ? "bg-emerald-500 text-white" : 
                      scanResult.status === 'USED' ? "bg-orange-500 text-white" : 
                      "bg-red-500 text-white"
                    )}>
                      {scanResult.status === 'VALID' ? <CheckCircle2 className="w-10 h-10" /> : 
                       scanResult.status === 'USED' ? <Info className="w-10 h-10" /> : 
                       <XCircle className="w-10 h-10" />}
                    </div>
                    <div>
                      <h2 className={cn(
                        "text-2xl font-bold",
                        scanResult.status === 'VALID' ? "text-emerald-500" : 
                        scanResult.status === 'USED' ? "text-orange-500" : 
                        "text-red-500"
                      )}>
                        {scanResult.message}
                      </h2>
                      <p className="text-gray-400 font-mono text-sm">{scanResult.ticket_id || "ID Verified"}</p>
                    </div>
                  </div>

                  {scanResult.status === 'VALID' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-white/10 rounded-2xl">
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Attendee</p>
                          <p className="font-bold flex items-center gap-2 text-white">
                            <User className="w-4 h-4 text-[#F27D26]" />
                            {scanResult.attendee_name}
                          </p>
                        </div>
                        <div className="p-4 bg-white/10 rounded-2xl">
                          <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Ticket Type</p>
                          <p className="font-bold flex items-center gap-2 text-white">
                            <Ticket className="w-4 h-4 text-[#F27D26]" />
                            {scanResult.ticket_type}
                          </p>
                        </div>
                      </div>
                      <div className="p-4 bg-white/10 rounded-2xl">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Event</p>
                        <p className="font-bold flex items-center gap-2 text-white">
                          <Calendar className="w-4 h-4 text-[#F27D26]" />
                          {scanResult.event_name}
                        </p>
                      </div>
                    </div>
                  )}

                  {scanResult.status === 'USED' && (
                    <div className="p-6 bg-white/10 rounded-2xl border border-orange-500/20">
                      <p className="text-sm text-gray-300 mb-4">This ticket was already scanned at:</p>
                      <div className="flex items-center gap-3 text-[#F27D26] font-bold">
                        <Clock className="w-5 h-5" />
                        {new Date(scanResult.scan_time).toLocaleString()}
                      </div>
                      <p className="mt-4 text-xs text-gray-500 italic">Attendee: {scanResult.attendee_name}</p>
                    </div>
                  )}

                  <button 
                    onClick={() => {
                      setScanResult(null);
                      setIsPaused(false);
                    }}
                    className="w-full mt-8 py-4 bg-white/10 hover:bg-white/20 rounded-2xl font-bold transition-all text-white border border-white/10"
                  >
                    Next Scan
                  </button>
                </motion.div>
              ) : (
                !isFullScreen && (
                  <motion.div
                    key="placeholder"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-12 bg-[#141414] rounded-3xl border border-dashed border-white/10 flex flex-col items-center justify-center text-center"
                  >
                    <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
                      <QrCode className="w-10 h-10 text-gray-500" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-white">Waiting for Scan</h3>
                    <p className="text-gray-500 max-w-xs">Position the ticket QR code within the scanner frame to verify.</p>
                  </motion.div>
                )
              )}
            </AnimatePresence>

            {!isFullScreen && (
              <div className="hidden lg:block">
                <HistorySection history={scanHistory} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function HistorySection({ history }: { history: any[] }) {
  return (
    <div className="bg-[#141414] rounded-3xl border border-white/5 overflow-hidden">
      <div className="p-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
        <h3 className="font-bold text-sm flex items-center gap-2 text-white">
          <History className="w-4 h-4 text-[#F27D26]" />
          Recent Scans
        </h3>
        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{history.length} Total</span>
      </div>
      <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
        {history.length > 0 ? (
          history.map((item, idx) => (
            <div key={idx} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center",
                  item.status === 'VALID' ? "bg-emerald-500/10 text-emerald-500" : 
                  item.status === 'USED' ? "bg-orange-500/10 text-orange-500" : 
                  "bg-red-500/10 text-red-500"
                )}>
                  {item.status === 'VALID' ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                </div>
                <div>
                  <p className="text-sm font-bold truncate max-w-[150px] text-white">{item.attendee}</p>
                  <p className="text-[10px] text-gray-500 font-mono">{item.id}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400">{new Date(item.time).toLocaleTimeString()}</p>
                <span className={cn(
                  "text-[10px] font-bold",
                  item.status === 'VALID' ? "text-emerald-500" : 
                  item.status === 'USED' ? "text-orange-500" : 
                  "text-red-500"
                )}>
                  {item.status}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="p-8 text-center text-gray-500 text-sm italic">
            No scans yet.
          </div>
        )}
      </div>
    </div>
  );
}

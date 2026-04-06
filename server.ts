import express from "express";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import bodyParser from "body-parser";
import { v4 as uuidv4 } from 'uuid';
import db from "./src/server/db.ts";
import { initiateSTKPush } from "./src/server/mpesa.ts";
import { sendTicketEmail, sendInquiryEmail, generateTicketPDF, sendEventReportEmail, generateEventReportPDF } from "./src/server/email.ts";
import { generateContractPDF, sendContractEmail } from "./src/server/contractGenerator.ts";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function convertGoogleDriveUrl(url: string): string {
  if (!url) return url;
  if (url.includes('drive.google.com')) {
    let fileId = '';
    const matchId = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    const matchQuery = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    
    if (matchId) fileId = matchId[1];
    else if (matchQuery) fileId = matchQuery[1];
    
    if (fileId) {
      return `https://drive.google.com/uc?export=view&id=${fileId}`;
    }
  }
  return url;
}

function getYearAlphabet(year: number) {
  // 2026 -> A, 2027 -> B, ...
  return String.fromCharCode(65 + (year - 2026));
}

function generateEventCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function logAdminAction(adminEmail: string, action: string, details: string, eventId?: string) {
  try {
    await db.from('admin_logs').insert({
      admin_email: adminEmail,
      action: action,
      details: details,
      event_id: eventId || null
    });
  } catch (error) {
    console.error('Error logging admin action:', error);
  }
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const PRE_UPLOADED_IMAGES = [
  "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1514525253361-bee871870472?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=1000",
  "https://images.unsplash.com/photo-1459749411177-042180ce673c?auto=format&fit=crop&q=80&w=1000",
];

const app = express();
const PORT = 3000;

const allowedOrigins = [
  process.env.APP_URL,
  'http://localhost:3000',
  'http://localhost:5173'
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(bodyParser.json());
app.use('/uploads', express.static(uploadsDir));

// Admin Auth Middleware
const adminAuth = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (req.path === '/login') return next();
  
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' });
  }

  const token = authHeader.replace('Bearer ', '');
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      // Fallback for old token during transition if needed, 
      // but ideally we just use Supabase now.
      const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'admin-secret-token';
      if (token === ADMIN_TOKEN) {
        return next();
      }
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // You can add additional checks here, e.g., check if user is in an 'admins' table
    // For now, we'll assume any authenticated user with this token is an admin
    // if they are logging into the admin dashboard.
    (req as any).user = user;
    next();
  } catch (err) {
    res.status(500).json({ error: 'Authentication error' });
  }
};

app.use('/api/admin', adminAuth);

async function setupServer() {
  // --- API Routes ---

  // Get Pre-uploaded Images
  app.get("/api/assets/images", (req, res) => {
    res.json(PRE_UPLOADED_IMAGES);
  });

  // Public Event Submission
  app.post("/api/events/submit", async (req, res) => {
    const { name, organizer, organizer_email, venue, date, time, description } = req.body;
    const id = uuidv4();
    const eventCode = generateEventCode();

    try {
      const { error } = await db.from('events').insert({
        id,
        name,
        organizer,
        organizer_email,
        venue,
        date,
        time,
        description,
        status: 'PENDING',
        event_code: eventCode,
        is_hidden: true
      });

      if (error) throw error;

      res.json({ success: true, id });
    } catch (error: any) {
      console.error('Event submission error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get Pending Submissions
  app.get("/api/admin/submissions", async (req, res) => {
    try {
      const { data, error } = await db
        .from('events')
        .select('*')
        .eq('status', 'PENDING')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Finalize/Complete Event Setup
  app.put("/api/admin/events/:id/complete-setup", async (req, res) => {
    const { id } = req.params;
    const { banner_url, is_free, rsvp_limit, ticketTypes, adminEmail } = req.body;

    try {
      // Update event details
      const { error: eventError } = await db
        .from('events')
        .update({
          banner_url,
          is_free: is_free ? true : false,
          rsvp_limit: rsvp_limit || null,
          status: 'DRAFT'
        })
        .eq('id', id);

      if (eventError) throw eventError;

      // Add ticket types if not free
      if (!is_free && ticketTypes && ticketTypes.length > 0) {
        const ticketTypesToInsert = ticketTypes.map((type: any) => ({
          id: uuidv4(),
          event_id: id,
          name: type.name,
          price: type.price,
          quantity: type.quantity
        }));

        const { error: ticketError } = await db.from('ticket_types').insert(ticketTypesToInsert);
        if (ticketError) throw ticketError;
      }

      await logAdminAction(adminEmail || 'Admin', 'COMPLETE_EVENT_SETUP', `Completed setup for event ${id}`, id);
      res.json({ success: true });
    } catch (error: any) {
      console.error('Complete setup error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // File Upload Endpoint
  app.post("/api/upload", upload.single('image'), (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });

  // Event Inquiry
  app.post("/api/inquiry", async (req, res) => {
    try {
      await sendInquiryEmail(req.body);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // RSVP for Free Event
  app.post("/api/rsvp", async (req, res) => {
    const { eventId, attendeeName, attendeeEmail, phoneNumber } = req.body;
    
    try {
      const { data: event, error: eventError } = await db.from('events').select('*').eq('id', eventId).single();
      if (eventError || !event) return res.status(404).json({ error: "Event not found" });
      if (!event.is_free) return res.status(400).json({ error: "This is not a free event" });

      // Check RSVP limit
      if (event.rsvp_limit) {
        const { count, error: countError } = await db
          .from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', eventId);
        
        if (countError) throw countError;
        if (count !== null && count >= event.rsvp_limit) {
          return res.status(400).json({ error: "RSVP limit reached for this event" });
        }
      }

      const paymentId = uuidv4();
      const ticketTypeId = '00000000-0000-0000-0000-000000000000'; // Placeholder for RSVP

      const yearAlphabet = getYearAlphabet(new Date(event.date).getFullYear());
      const eventCode = event.event_code || String(event.event_number || 0).padStart(3, '0');
      
      const { data: lastTicket, error: lastTicketError } = await db
        .from('tickets')
        .select('ticket_sequence_number')
        .eq('event_id', eventId)
        .order('ticket_sequence_number', { ascending: false })
        .limit(1)
        .single();
      
      const nextSeq = (lastTicket?.ticket_sequence_number || 0) + 1;
      const seqStr = String(nextSeq).padStart(4, '0');
      const ticketId = `${yearAlphabet}-${eventCode}-RSVP-${seqStr}`;

      // Create a dummy payment record for tracking
      const { error: paymentError } = await db.from('payments').insert({
        id: paymentId,
        phone: phoneNumber || 'RSVP',
        amount: 0,
        quantity: 1,
        event_id: eventId,
        ticket_type_id: null, // RSVP doesn't have a real ticket type
        attendee_name: attendeeName,
        attendee_email: attendeeEmail,
        status: 'COMPLETED'
      });

      if (paymentError) throw paymentError;

      // Create ticket
      const { error: ticketError } = await db.from('tickets').insert({
        id: ticketId,
        payment_id: paymentId,
        event_id: eventId,
        ticket_type_id: null,
        attendee_name: attendeeName,
        attendee_email: attendeeEmail,
        ticket_sequence_number: nextSeq
      });

      if (ticketError) throw ticketError;

      const virtualTicketType = { name: 'Free / RSVP', price: 0 };
      await sendTicketEmail({ id: ticketId, attendee_name: attendeeName, attendee_email: attendeeEmail }, event, virtualTicketType as any);

      res.json({ success: true, ticketId });
    } catch (error: any) {
      console.error('RSVP Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all events
  app.get("/api/events", async (req, res) => {
    try {
      const { data: events, error } = await db
        .from('events')
        .select('*, ticket_types(*)')
        .eq('status', 'PUBLISHED')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      const processedEvents = events.map((event: any) => {
        let minPrice = Infinity;
        let currentMinPrice = Infinity;
        let isFlashSaleActive = false;
        const now = new Date().toISOString();

        if (event.ticket_types && event.ticket_types.length > 0) {
          event.ticket_types.forEach((tt: any) => {
            if (tt.price < minPrice) minPrice = tt.price;
            
            let price = tt.price;
            if (tt.flash_sale_price && now >= tt.flash_sale_start && now <= tt.flash_sale_end) {
              price = tt.flash_sale_price;
              isFlashSaleActive = true;
            }
            if (price < currentMinPrice) currentMinPrice = price;
          });
        }

        return {
          ...event,
          min_price: minPrice === Infinity ? 0 : minPrice,
          current_min_price: currentMinPrice === Infinity ? 0 : currentMinPrice,
          is_flash_sale_active: isFlashSaleActive ? 1 : 0
        };
      });

      res.json(processedEvents);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get event details
  app.get("/api/events/:id", async (req, res) => {
    try {
      const { data: event, error: eventError } = await db
        .from('events')
        .select('*')
        .eq('id', req.params.id)
        .single();
      
      if (eventError || !event) return res.status(404).json({ error: "Event not found" });
      
      const { data: ticketTypes, error: ttError } = await db
        .from('ticket_types')
        .select('*')
        .eq('event_id', req.params.id);
      
      if (ttError) throw ttError;

      const now = new Date().toISOString();
      const processedTicketTypes = ticketTypes.map((tt: any) => ({
        ...tt,
        is_flash_sale_active: (tt.flash_sale_price && now >= tt.flash_sale_start && now <= tt.flash_sale_end) ? 1 : 0
      }));

      res.json({ ...event, ticketTypes: processedTicketTypes });
    } catch (error: any) {
      console.error('Error fetching event details:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Initiate STK Push
  app.post("/api/stkpush", async (req, res) => {
    const { eventId, ticketTypeId, attendeeName, attendeeEmail, phoneNumber, amount, quantity, couponId } = req.body;
    const paymentId = uuidv4();

    try {
      // Verify amount with flash sale logic
      const { data: ticketType, error: ttError } = await db
        .from('ticket_types')
        .select('price, flash_sale_price, flash_sale_start, flash_sale_end')
        .eq('id', ticketTypeId)
        .single();

      if (ttError || !ticketType) throw new Error("Invalid ticket type");

      let expectedPrice = ticketType.price;
      const now = new Date().toISOString();
      if (ticketType.flash_sale_price && now >= ticketType.flash_sale_start && now <= ticketType.flash_sale_end) {
        expectedPrice = ticketType.flash_sale_price;
      }

      let discountAmount = 0;
      if (couponId) {
        const { data: coupon, error: couponError } = await db.from('coupons').select('*').eq('id', couponId).single();
        if (!couponError && coupon) {
          discountAmount = Math.floor((expectedPrice * (quantity || 1) * coupon.discount_percentage) / 100);
        }
      }

      const finalExpectedAmount = (expectedPrice * (quantity || 1)) - discountAmount;

      if (amount !== finalExpectedAmount) {
        console.warn(`Price mismatch: Expected ${finalExpectedAmount}, got ${amount}`);
      }

      const { error: insertError } = await db.from('payments').insert({
        id: paymentId,
        phone: phoneNumber,
        amount: amount,
        quantity: quantity || 1,
        event_id: eventId,
        ticket_type_id: ticketTypeId,
        attendee_name: attendeeName,
        attendee_email: attendeeEmail,
        coupon_id: couponId || null,
        discount_amount: discountAmount
      });

      if (insertError) throw insertError;

      const mpesaResponse = await initiateSTKPush(phoneNumber, amount, paymentId);
      res.json({ paymentId, ...mpesaResponse });
    } catch (error: any) {
      console.error('STK Push Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Check Payment Status
  app.get("/api/payment-status/:requestId", async (req, res) => {
    const requestId = req.params.requestId;
    const { data: payment, error } = await db
      .from('payments')
      .select('*')
      .or(`checkout_request_id.eq.${requestId},id.eq.${requestId}`)
      .single();
    
    if (error || !payment) return res.status(404).json({ error: "Payment not found" });
    
    let ticketIds = [];
    if (payment.status === 'COMPLETED') {
      const { data: tickets, error: ticketError } = await db.from('tickets').select('id').eq('payment_id', payment.id);
      if (!ticketError && tickets) {
        ticketIds = tickets.map(t => t.id);
      }
    }
    
    res.json({ 
      status: payment.status === 'COMPLETED' ? 'SUCCESS' : 
              payment.status === 'FAILED' ? 'ERROR' : 'PENDING', 
      ticketIds,
      ticketId: ticketIds[0] || null,
      message: payment.status === 'FAILED' ? 'Payment was cancelled or failed.' : null
    });
  });

  // M-Pesa Callback
  app.post("/api/mpesa/callback", async (req, res) => {
    const { Body } = req.body;
    const { stkCallback } = Body;
    const checkoutRequestId = stkCallback.CheckoutRequestID;
    const resultCode = stkCallback.ResultCode;

    console.log('M-Pesa Callback Received:', checkoutRequestId, resultCode);

    if (resultCode === 0) {
      // Success
      const { data: payment, error: paymentError } = await db
        .from('payments')
        .select('*')
        .eq('checkout_request_id', checkoutRequestId)
        .single();
      
      if (!paymentError && payment) {
        await db.from('payments').update({ status: 'COMPLETED' }).eq('id', payment.id);

        const quantity = payment.quantity || 1;
        const generatedTickets = [];

        const { data: event } = await db.from('events').select('*').eq('id', payment.event_id).single();
        const { data: ticketType } = await db.from('ticket_types').select('*').eq('id', payment.ticket_type_id).single();

        const yearAlphabet = getYearAlphabet(new Date(event.date).getFullYear());
        const eventCode = event.event_code || String(event.event_number || 0).padStart(3, '0');
        
        const { data: lastTicket } = await db
          .from('tickets')
          .select('ticket_sequence_number')
          .eq('ticket_type_id', payment.ticket_type_id)
          .order('ticket_sequence_number', { ascending: false })
          .limit(1)
          .single();
        
        let nextSeq = (lastTicket?.ticket_sequence_number || 0) + 1;

        for (let i = 0; i < quantity; i++) {
          const seqStr = String(nextSeq).padStart(4, '0');
          const ticketId = `${yearAlphabet}-${eventCode}-${ticketType.name.substring(0, 3).toUpperCase()}-${seqStr}`;
          
          const { data: ticket, error: ticketError } = await db.from('tickets').insert({
            id: ticketId,
            payment_id: payment.id,
            event_id: payment.event_id,
            ticket_type_id: payment.ticket_type_id,
            attendee_name: payment.attendee_name,
            attendee_email: payment.attendee_email,
            ticket_sequence_number: nextSeq
          }).select().single();
          
          if (!ticketError && ticket) {
            generatedTickets.push(ticket);
          }
          nextSeq++;
        }

        // Update sold count
        await db.rpc('increment_sold_count', { tt_id: payment.ticket_type_id, qty: quantity });

        // Update coupon usage if applicable
        if (payment.coupon_id) {
          await db.rpc('increment_coupon_usage', { c_id: payment.coupon_id });
        }

        // Send Emails for all tickets
        for (const ticket of generatedTickets) {
          await sendTicketEmail(ticket, event, ticketType);
        }
      }
    } else {
      // Failed
      await db.from('payments').update({ status: 'FAILED' }).eq('checkout_request_id', checkoutRequestId);
    }

    res.json({ ResultCode: 0, ResultDesc: "Success" });
  });

  // Verify Ticket
  app.post("/api/verify", async (req, res) => {
    const { ticketId } = req.body;
    const normalizedTicketId = ticketId?.trim()?.toUpperCase();
    
    if (!normalizedTicketId) {
      return res.status(400).json({ status: 'INVALID', message: 'Ticket ID is required' });
    }

    const { data: ticket, error } = await db
      .from('tickets')
      .select('*, events(name), ticket_types(name)')
      .ilike('id', normalizedTicketId)
      .single();

    if (error || !ticket) {
      return res.json({ status: 'INVALID', message: 'Invalid Ticket' });
    }

    const ticketTypeName = ticket.ticket_types?.name || 'Free / RSVP';

    if (ticket.deleted_at) {
      return res.json({ status: 'INVALID', message: 'Ticket has been cancelled/deleted' });
    }

    if (ticket.status === 'USED') {
      await db.from('scan_logs').insert({
        ticket_id: ticketId,
        status: 'ALREADY_USED',
        message: 'Attempted to use an already scanned ticket'
      });
      
      return res.json({ 
        status: 'USED', 
        message: 'Ticket Already Used',
        scan_time: ticket.scan_time,
        attendee_name: ticket.attendee_name
      });
    }

    // Mark as used
    const now = new Date().toISOString();
    await db.from('tickets').update({ status: 'USED', scan_time: now }).eq('id', ticketId);
    
    // Log successful scan
    await db.from('scan_logs').insert({
      ticket_id: ticketId,
      status: 'SUCCESS',
      message: 'Access Granted'
    });

    res.json({ 
      status: 'VALID', 
      message: 'Access Granted',
      attendee_name: ticket.attendee_name,
      event_name: ticket.events?.name,
      ticket_type: ticketTypeName
    });
  });

  // User: Get tickets by email
  app.get("/api/my-tickets", async (req, res) => {
    const email = req.query.email as string;
    if (!email) return res.status(400).json({ error: "Email is required" });
    
    try {
      const { data: tickets, error } = await db
        .from('tickets')
        .select('*, events(name, date, time, venue, banner_url), ticket_types(name, price)')
        .eq('attendee_email', email)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const processedTickets = tickets.map((t: any) => ({
        ...t,
        event_name: t.events?.name,
        event_date: t.events?.date,
        event_time: t.events?.time,
        event_venue: t.events?.venue,
        event_banner: t.events?.banner_url,
        ticket_type_name: t.ticket_types?.name,
        ticket_price: t.ticket_types?.price
      }));

      res.json(processedTickets);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get event-specific activities
  app.get("/api/admin/event-activities", async (req, res) => {
    const includeInactive = req.query.includeInactive === 'true';
    try {
      let query = db.from('events').select('id, name, date, is_hidden');
      if (!includeInactive) {
        query = query.eq('is_hidden', false);
      }
      const { data: events, error: eventsError } = await query.order('created_at', { ascending: false });

      if (eventsError) throw eventsError;

      const eventActivities = await Promise.all((events || []).map(async (event) => {
        // Get ticket creations (purchases/manual)
        const { data: tickets } = await db.from('tickets')
          .select('attendee_name, created_at')
          .eq('event_id', event.id)
          .order('created_at', { ascending: false })
          .limit(20);

        const ticketActivities = (tickets || []).map(t => ({
          type: 'TICKET_CREATED',
          attendee: t.attendee_name,
          timestamp: t.created_at,
          details: 'Ticket generated'
        }));

        // Get scans
        const { data: scans } = await db.from('scan_logs')
          .select('scanned_at, message, tickets(attendee_name)')
          .eq('tickets.event_id', event.id)
          .order('scanned_at', { ascending: false })
          .limit(20);

        const scanActivities = (scans || []).map((s: any) => ({
          type: 'TICKET_SCANNED',
          attendee: s.tickets?.attendee_name,
          timestamp: s.scanned_at,
          details: s.message
        }));

        // Get admin logs
        const { data: adminLogs } = await db.from('admin_logs')
          .select('admin_email, created_at, action, details')
          .eq('event_id', event.id)
          .order('created_at', { ascending: false })
          .limit(20);

        const adminActivities = (adminLogs || []).map(l => ({
          type: 'ADMIN_ACTION',
          attendee: l.admin_email,
          timestamp: l.created_at,
          details: `${l.action}: ${l.details}`
        }));

        // Combine and sort
        const allActivities = [...ticketActivities, ...scanActivities, ...adminActivities]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 50);

        // Get scan stats for this event
        const { count: totalScanned } = await db.from('tickets')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .eq('status', 'USED');

        return {
          ...event,
          activities: allActivities,
          total_scanned: totalScanned || 0
        };
      }));

      res.json(eventActivities);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get all tickets
  app.get("/api/admin/tickets", async (req, res) => {
    const includeDeleted = req.query.includeDeleted === 'true';
    try {
      let query = db.from('tickets')
        .select(`
          *,
          events(name),
          ticket_types(name),
          payments(mpesa_receipt_number, amount, discount_amount, quantity, coupons(code))
        `);
      
      if (!includeDeleted) {
        query = query.is('deleted_at', null);
      }

      const { data: tickets, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;

      const processedTickets = (tickets || []).map((t: any) => ({
        ...t,
        event_name: t.events?.name,
        ticket_type_name: t.ticket_types?.name,
        mpesa_receipt_number: t.payments?.mpesa_receipt_number,
        total_amount: t.payments?.amount,
        discount_amount: t.payments?.discount_amount,
        quantity: t.payments?.quantity,
        coupon_code: t.payments?.coupons?.code
      }));

      res.json(processedTickets);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Delete Ticket (Soft Delete)
  app.delete("/api/admin/tickets/:id", async (req, res) => {
    const ticketId = req.params.id;
    try {
      const { data: ticket, error: fetchError } = await db
        .from('tickets')
        .select('status, event_id, attendee_name')
        .eq('id', ticketId)
        .single();

      if (fetchError || !ticket) return res.status(404).json({ error: "Ticket not found" });

      if (ticket.status === 'USED') {
        return res.status(400).json({ error: "Cannot delete a ticket that has already been used." });
      }

      const { error: updateError } = await db
        .from('tickets')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', ticketId);

      if (updateError) throw updateError;

      await logAdminAction(req.body.adminEmail || 'Admin', 'DELETE_TICKET', `Deleted ticket ${ticketId} for ${ticket.attendee_name}`, ticket.event_id);
      res.json({ success: true, message: "Ticket deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Restore Ticket
  app.post("/api/admin/tickets/:id/restore", async (req, res) => {
    const ticketId = req.params.id;
    try {
      const { error } = await db
        .from('tickets')
        .update({ deleted_at: null })
        .eq('id', ticketId);

      if (error) throw error;
      res.json({ success: true, message: "Ticket restored successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get Scan Logs
  app.get("/api/admin/scan-logs", async (req, res) => {
    try {
      const { data: logs, error } = await db
        .from('scan_logs')
        .select(`
          *,
          tickets(attendee_name, events(name))
        `)
        .order('scanned_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const processedLogs = (logs || []).map((l: any) => ({
        ...l,
        attendee_name: l.tickets?.attendee_name,
        event_name: l.tickets?.events?.name
      }));

      res.json(processedLogs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Manually Add Ticket
  app.post("/api/admin/tickets", async (req, res) => {
    const { eventId, ticketTypeId, name, email, amount, manualTicketId, mpesaReceiptNumber } = req.body;
    
    try {
      const { data: event } = await db.from('events').select('*').eq('id', eventId).single();
      const { data: ticketType } = await db.from('ticket_types').select('*').eq('id', ticketTypeId).single();
      
      if (!event || !ticketType) return res.status(404).json({ error: "Event or Ticket Type not found" });

      const yearAlphabet = getYearAlphabet(new Date(event.date).getFullYear());
      const eventCode = event.event_code || String(event.event_number || 0).padStart(3, '0');
      
      const { data: lastTicket } = await db
        .from('tickets')
        .select('ticket_sequence_number')
        .eq('ticket_type_id', ticketTypeId)
        .order('ticket_sequence_number', { ascending: false })
        .limit(1)
        .single();

      const nextSeq = (lastTicket?.ticket_sequence_number || 0) + 1;
      const seqStr = String(nextSeq).padStart(4, '0');
      
      const ticketId = manualTicketId || `${yearAlphabet}-${eventCode}-${ticketType.name.substring(0, 3).toUpperCase()}-${seqStr}`;
      const paymentId = 'MANUAL-' + uuidv4().substring(0, 8).toUpperCase();

      // Check if ticketId already exists
      const { data: existing } = await db.from('tickets').select('id').eq('id', ticketId).single();
      if (existing) {
        return res.status(400).json({ error: "Ticket ID already exists. Please use a unique ID." });
      }

      // Create payment record
      const { error: paymentError } = await db.from('payments').insert({
        id: paymentId,
        phone: 'MANUAL',
        amount: amount,
        event_id: eventId,
        ticket_type_id: ticketTypeId,
        attendee_name: name,
        attendee_email: email,
        status: 'COMPLETED',
        mpesa_receipt_number: mpesaReceiptNumber || null
      });

      if (paymentError) throw paymentError;

      // Create ticket record
      const { error: ticketError } = await db.from('tickets').insert({
        id: ticketId,
        payment_id: paymentId,
        event_id: eventId,
        ticket_type_id: ticketTypeId,
        attendee_name: name,
        attendee_email: email,
        status: 'VALID',
        ticket_sequence_number: nextSeq
      });

      if (ticketError) throw ticketError;

      // Update sold count
      await db.rpc('increment_sold_count', { tt_id: ticketTypeId });

      // Send Email
      const { data: ticket } = await db.from('tickets').select('*').eq('id', ticketId).single();
      if (ticket) {
        sendTicketEmail(ticket, event, ticketType).catch(console.error);
      }

      res.json({ success: true, ticketId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Resend Ticket Email
  app.post("/api/admin/tickets/resend", async (req, res) => {
    const { ticketId } = req.body;
    try {
      const { data: ticket } = await db.from('tickets').select('*').eq('id', ticketId).single();
      if (!ticket) return res.status(404).json({ error: "Ticket not found" });

      const { data: event } = await db.from('events').select('*').eq('id', ticket.event_id).single();
      const { data: ticketType } = await db.from('ticket_types').select('*').eq('id', ticket.ticket_type_id).single();

      if (ticket && event && ticketType) {
        sendTicketEmail(ticket, event, ticketType).catch(console.error);
      }
      res.json({ success: true, message: "Email resend initiated" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Ticket: Download PDF
  app.get("/api/tickets/:id/download", async (req, res) => {
    const ticketId = req.params.id;
    try {
      const { data: ticket } = await db.from('tickets').select('*').eq('id', ticketId).single();
      if (!ticket) return res.status(404).json({ error: "Ticket not found" });

      const { data: event } = await db.from('events').select('*').eq('id', ticket.event_id).single();
      const { data: ticketType } = await db.from('ticket_types').select('*').eq('id', ticket.ticket_type_id).single();

      if (ticket && event && ticketType) {
        const pdfBuffer = await generateTicketPDF(ticket, event, ticketType);
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Ticket-${ticketId}.pdf`);
        res.send(pdfBuffer);
      } else {
        res.status(404).json({ error: "Related data not found" });
      }
    } catch (error: any) {
      console.error('Download Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Download Event Report PDF
  app.get("/api/admin/events/:id/report", async (req, res) => {
    const eventId = req.params.id;
    try {
      const { data: event, error } = await db.from('events').select('name').eq('id', eventId).single();
      if (error || !event) return res.status(404).json({ error: "Event not found" });

      const pdfBuffer = await generateEventReportPDF(eventId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Report-${event.name.replace(/\s+/g, '_')}.pdf`);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('Report Generation Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Email Event Report PDF
  app.post("/api/admin/events/:id/email-report", async (req, res) => {
    const eventId = req.params.id;
    const adminEmail = req.body.adminEmail || process.env.EMAIL_USER;
    try {
      if (!adminEmail) return res.status(400).json({ error: "Admin email not provided" });
      await sendEventReportEmail(eventId, adminEmail);
      res.json({ success: true, message: "Report email sent" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Complete Event
  app.post("/api/admin/events/:id/complete", async (req, res) => {
    const eventId = req.params.id;
    const adminEmail = req.body.adminEmail || 'Admin';
    try {
      const { data: event, error } = await db.from('events').select('*').eq('id', eventId).single();
      if (error || !event) return res.status(404).json({ error: "Event not found" });

      await db.from('events').update({ is_completed: true, is_hidden: true }).eq('id', eventId);
      await logAdminAction(adminEmail, 'COMPLETE_EVENT', `Marked event ${eventId} as completed`, eventId);
      
      // Automatically send report to admin
      if (process.env.EMAIL_USER) {
        sendEventReportEmail(eventId, process.env.EMAIL_USER).catch(console.error);
      }

      res.json({ success: true, message: "Event marked as completed. Report email initiated." });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get Stats
  app.get("/api/admin/stats", async (req, res) => {
    try {
      const { data: payments } = await db.from('payments').select('amount').eq('status', 'COMPLETED');
      const totalRevenue = payments?.reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      const { count: paidTicketsCount } = await db
        .from('tickets')
        .select('*, events!inner(is_free)', { count: 'exact', head: true })
        .eq('events.is_free', false);

      const { count: rsvpsCount } = await db
        .from('tickets')
        .select('*, events!inner(is_free)', { count: 'exact', head: true })
        .eq('events.is_free', true);

      const { data: recentTickets } = await db
        .from('tickets')
        .select('*, events(name)')
        .order('created_at', { ascending: false })
        .limit(10);

      res.json({
        revenue: totalRevenue,
        ticketsSold: paidTicketsCount || 0,
        totalRSVPs: rsvpsCount || 0,
        recentTickets: recentTickets?.map(t => ({ ...t, event_name: t.events?.name })) || []
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get all events with sales data
  app.get("/api/admin/events", async (req, res) => {
    try {
      const { data: events, error } = await db
        .from('events')
        .select('*, ticket_types(quantity, sold), tickets(status)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      const processedEvents = events.map((e: any) => {
        let totalCapacity = 0;
        let totalSold = 0;
        let totalRSVPs = 0;
        let totalCheckedIn = e.tickets?.filter((t: any) => t.status === 'USED').length || 0;

        if (e.is_free) {
          totalCapacity = e.rsvp_limit || 0;
          totalRSVPs = e.tickets?.length || 0;
        } else {
          e.ticket_types?.forEach((tt: any) => {
            totalCapacity += tt.quantity || 0;
            totalSold += tt.sold || 0;
          });
        }

        return {
          ...e,
          total_capacity: totalCapacity,
          total_sold: totalSold,
          total_rsvps: totalRSVPs,
          total_checked_in: totalCheckedIn
        };
      });

      res.json(processedEvents);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Delete Event
  app.delete("/api/admin/events/:id", async (req, res) => {
    try {
      // Supabase handles cascade deletes if configured in DB
      const { error } = await db.from('events').delete().eq('id', req.params.id);
      if (error) throw error;
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Hide Event (Soft Delete from public page)
  app.post("/api/admin/events/:id/hide", async (req, res) => {
    const eventId = req.params.id;
    const adminEmail = req.body.adminEmail || 'Admin';
    try {
      const { data: event, error } = await db.from('events').select('date').eq('id', eventId).single();
      if (error || !event) return res.status(404).json({ error: "Event not found" });

      const eventDate = new Date(event.date);
      const now = new Date();
      if (eventDate > now) {
        return res.status(400).json({ error: "Event can only be removed after it has ended." });
      }

      await db.from('events').update({ is_hidden: true }).eq('id', eventId);
      await logAdminAction(adminEmail, 'HIDE_EVENT', `Hid event ${eventId}`, eventId);
      res.json({ success: true, message: "Event removed from public page." });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Regenerate Event Code
  app.post("/api/admin/events/:id/regenerate-code", async (req, res) => {
    const eventId = req.params.id;
    const adminEmail = req.body.adminEmail || 'Admin';
    try {
      let eventCode = generateEventCode();
      let { data: existing } = await db.from('events').select('id').eq('event_code', eventCode).single();
      while (existing) {
        eventCode = generateEventCode();
        const { data: nextExisting } = await db.from('events').select('id').eq('event_code', eventCode).single();
        existing = nextExisting;
      }
      await db.from('events').update({ event_code: eventCode }).eq('id', eventId);
      await logAdminAction(adminEmail, 'REGENERATE_EVENT_CODE', `Regenerated code for event ${eventId} to ${eventCode}`, eventId);
      res.json({ success: true, eventCode });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Contract & Organizer APIs ---

  // Admin: Get all organizers
  app.get("/api/admin/organizers", async (req, res) => {
    try {
      const { data, error } = await db.from('organizers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      res.json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Create organizer
  app.post("/api/admin/organizers", async (req, res) => {
    const { name, email, company_name, phone, adminEmail } = req.body;
    const id = uuidv4();
    try {
      const { error } = await db.from('organizers').insert({
        id,
        name,
        email,
        company_name: company_name || null,
        phone: phone || null
      });
      if (error) throw error;
      await logAdminAction(adminEmail || 'Admin', 'CREATE_ORGANIZER', `Created organizer ${name} (${email})`);
      res.json({ success: true, id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get all contracts
  app.get("/api/admin/contracts", async (req, res) => {
    try {
      const { data, error } = await db
        .from('contracts')
        .select('*, organizers(name, email, company_name), events(name)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      const processedContracts = data.map((c: any) => ({
        ...c,
        organizer_name: c.organizers?.name,
        organizer_email: c.organizers?.email,
        company_name: c.organizers?.company_name,
        event_name: c.events?.name
      }));

      res.json(processedContracts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Create contract
  app.post("/api/admin/contracts", async (req, res) => {
    const { organizer_id, event_id, effective_date, pricing_details, payout_period, adminEmail } = req.body;
    const id = uuidv4();
    try {
      const { error } = await db.from('contracts').insert({
        id,
        organizer_id,
        event_id: event_id || null,
        effective_date,
        pricing_details: pricing_details || '6% per ticket + KES 30',
        payout_period: payout_period || '3 business days'
      });
      if (error) throw error;
      await logAdminAction(adminEmail || 'Admin', 'CREATE_CONTRACT', `Created contract ${id} for organizer ${organizer_id}`);
      res.json({ success: true, id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Update contract status
  app.put("/api/admin/contracts/:id/status", async (req, res) => {
    const { status, adminEmail } = req.body;
    try {
      const signedAt = status === 'SIGNED' ? new Date().toISOString() : null;
      const updateData: any = { status };
      if (signedAt) updateData.signed_at = signedAt;

      const { error } = await db.from('contracts').update(updateData).eq('id', req.params.id);
      if (error) throw error;

      await logAdminAction(adminEmail || 'Admin', 'UPDATE_CONTRACT_STATUS', `Updated contract ${req.params.id} status to ${status}`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Delete contract
  app.delete("/api/admin/contracts/:id", async (req, res) => {
    const { adminEmail } = req.body;
    try {
      const { error } = await db.from('contracts').delete().eq('id', req.params.id);
      if (error) throw error;
      await logAdminAction(adminEmail || 'Admin', 'DELETE_CONTRACT', `Deleted contract ${req.params.id}`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Download/View Contract PDF
  app.get("/api/admin/contracts/:id/pdf", async (req, res) => {
    try {
      const { data: contract, error } = await db
        .from('contracts')
        .select('*, organizers(name, email, company_name)')
        .eq('id', req.params.id)
        .single();

      if (error || !contract) return res.status(404).json({ error: 'Contract not found' });

      const processedContract = {
        ...contract,
        organizer_name: contract.organizers?.name,
        organizer_email: contract.organizers?.email,
        company_name: contract.organizers?.company_name
      };

      const pdfBuffer = await generateContractPDF(processedContract);
      res.setHeader('Content-Type', 'application/pdf');
      const dateStr = new Date().toISOString().split('T')[0];
      res.setHeader('Content-Disposition', `attachment; filename=Contract_${processedContract.organizer_name.replace(/\s+/g, '_')}_${dateStr}.pdf`);
      res.send(pdfBuffer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get all coupons
  app.get("/api/admin/coupons", async (req, res) => {
    try {
      const { data, error } = await db
        .from('coupons')
        .select('*, events(name), ticket_types(name)')
        .order('created_at', { ascending: false });
      
      if (error) throw error;

      const processedCoupons = data.map((c: any) => ({
        ...c,
        event_name: c.events?.name,
        ticket_type_name: c.ticket_types?.name
      }));

      res.json(processedCoupons);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Create coupon
  app.post("/api/admin/coupons", async (req, res) => {
    const { code, discount_percentage, event_id, ticket_type_id, expiry_date, usage_limit, per_user_limit, adminEmail } = req.body;
    const id = uuidv4();
    
    try {
      const { error } = await db.from('coupons').insert({
        id,
        code: code.toUpperCase(),
        discount_percentage,
        event_id: event_id || null,
        ticket_type_id: ticket_type_id || null,
        expiry_date: expiry_date || null,
        usage_limit: usage_limit || null,
        per_user_limit: per_user_limit || null
      });
      
      if (error) throw error;
      
      await logAdminAction(adminEmail || 'Admin', 'CREATE_COUPON', `Created coupon ${code} (${discount_percentage}%)`);
      res.json({ success: true, id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Update coupon (Toggle active status)
  app.put("/api/admin/coupons/:id", async (req, res) => {
    const { is_active, adminEmail } = req.body;
    try {
      const { error } = await db.from('coupons').update({ is_active }).eq('id', req.params.id);
      if (error) throw error;
      await logAdminAction(adminEmail || 'Admin', 'UPDATE_COUPON', `Updated coupon ${req.params.id} active status to ${is_active}`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Delete coupon
  app.delete("/api/admin/coupons/:id", async (req, res) => {
    const { adminEmail } = req.body;
    try {
      const { data: coupon } = await db.from('coupons').select('code').eq('id', req.params.id).single();
      const { error } = await db.from('coupons').delete().eq('id', req.params.id);
      if (error) throw error;
      await logAdminAction(adminEmail || 'Admin', 'DELETE_COUPON', `Deleted coupon ${coupon?.code || req.params.id}`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User: Validate coupon
  app.post("/api/coupons/validate", async (req, res) => {
    const { code, eventId, ticketTypeId, email } = req.body;
    
    try {
      const { data: coupon, error } = await db.from('coupons').select('*').eq('code', code.toUpperCase()).single();
      
      if (error || !coupon) {
        return res.status(404).json({ error: "Invalid coupon code" });
      }
      
      if (!coupon.is_active) {
        return res.status(400).json({ error: "Coupon is currently inactive" });
      }
      
      if (coupon.expiry_date && new Date(coupon.expiry_date) < new Date()) {
        return res.status(400).json({ error: "Coupon expired" });
      }
      
      if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
        return res.status(400).json({ error: "Usage limit reached" });
      }
      
      if (coupon.event_id && coupon.event_id !== eventId) {
        return res.status(400).json({ error: "Coupon not applicable to this event" });
      }
      
      if (coupon.ticket_type_id && coupon.ticket_type_id !== ticketTypeId) {
        return res.status(400).json({ error: "Coupon not applicable to this ticket type" });
      }
      
      if (coupon.per_user_limit && email) {
        const { count } = await db
          .from('payments')
          .select('*', { count: 'exact', head: true })
          .eq('attendee_email', email)
          .eq('coupon_id', coupon.id)
          .eq('status', 'COMPLETED');
        
        if (count !== null && count >= coupon.per_user_limit) {
          return res.status(400).json({ error: "You have reached the usage limit for this coupon" });
        }
      }
      
      res.json({
        id: coupon.id,
        code: coupon.code,
        discount_percentage: coupon.discount_percentage
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Create Event
  app.post("/api/events", async (req, res) => {
    const { name, organizer, venue, date, time, banner_url, description, category, ticketTypes, adminEmail, is_free, rsvp_limit } = req.body;
    const eventId = uuidv4();
    const finalBannerUrl = convertGoogleDriveUrl(banner_url);

    try {
      // Get next event number
      const { data: lastEvent } = await db.from('events').select('event_number').order('event_number', { ascending: false }).limit(1).single();
      const nextEventNum = (lastEvent?.event_number || 0) + 1;

      // Generate unique event code
      let eventCode = generateEventCode();
      let { data: existing } = await db.from('events').select('id').eq('event_code', eventCode).single();
      while (existing) {
        eventCode = generateEventCode();
        const { data: nextExisting } = await db.from('events').select('id').eq('event_code', eventCode).single();
        existing = nextExisting;
      }

      const { error: eventError } = await db.from('events').insert({
        id: eventId,
        name,
        organizer,
        venue,
        date,
        time,
        banner_url: finalBannerUrl,
        description,
        category: category || 'Concert',
        event_number: nextEventNum,
        event_code: eventCode,
        is_free: is_free ? true : false,
        rsvp_limit: rsvp_limit || null,
        status: 'DRAFT'
      });

      if (eventError) throw eventError;

      if (!is_free && ticketTypes) {
        const ticketTypesToInsert = ticketTypes.map((tt: any) => ({
          id: uuidv4(),
          event_id: eventId,
          name: tt.name,
          price: tt.price,
          quantity: tt.quantity,
          flash_sale_price: tt.flash_sale_price || null,
          flash_sale_start: tt.flash_sale_start && tt.flash_sale_start !== '' ? tt.flash_sale_start : null,
          flash_sale_end: tt.flash_sale_end && tt.flash_sale_end !== '' ? tt.flash_sale_end : null
        }));

        const { error: ttError } = await db.from('ticket_types').insert(ticketTypesToInsert);
        if (ttError) throw ttError;
      }

      await logAdminAction(adminEmail || 'Admin', 'CREATE_EVENT', `Created event ${eventId} (${name})`, eventId);
      res.json({ success: true, eventId });
    } catch (error: any) {
      console.error('Error creating event:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update Event Status (Publish/Unpublish/Complete)
  app.post("/api/admin/events/:id/status", async (req, res) => {
    const { id } = req.params;
    const { status, adminEmail } = req.body;
    
    try {
      const validStatuses = ['DRAFT', 'PUBLISHED', 'COMPLETED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const is_hidden = status === 'DRAFT' ? true : false;
      const is_completed = status === 'COMPLETED' ? true : false;

      const { error } = await db.from('events').update({ status, is_hidden, is_completed }).eq('id', id);
      if (error) throw error;
      
      await logAdminAction(adminEmail || 'Admin', 'UPDATE_EVENT_STATUS', `Updated event ${id} status to ${status}`, id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update Event Details
  app.put("/api/admin/events/:id", async (req, res) => {
    const { id } = req.params;
    const { name, organizer, venue, date, time, banner_url, description, category, is_free, rsvp_limit, adminEmail } = req.body;
    const finalBannerUrl = convertGoogleDriveUrl(banner_url);

    try {
      const { error } = await db.from('events').update({
        name,
        organizer,
        venue,
        date,
        time,
        banner_url: finalBannerUrl,
        description,
        category,
        is_free: is_free ? true : false,
        rsvp_limit: rsvp_limit || null
      }).eq('id', id);

      if (error) throw error;

      await logAdminAction(adminEmail || 'Admin', 'UPDATE_EVENT', `Updated event ${id} (${name})`, id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reset Data
  app.post("/api/admin/reset-data", async (req, res) => {
    try {
      // Order matters for FK constraints
      await db.from('scan_logs').delete().neq('id', 0);
      await db.from('tickets').delete().neq('id', '0');
      await db.from('payments').delete().neq('id', '0');
      await db.from('coupons').delete().neq('id', '0');
      await db.from('ticket_types').delete().neq('id', '0');
      await db.from('contracts').delete().neq('id', '0');
      await db.from('events').delete().neq('id', '0');
      
      await logAdminAction('Admin', 'RESET_DATA', 'Cleared all event and ticket data');
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Export CSV (Simple implementation)
  app.get("/api/admin/export", async (req, res) => {
    try {
      const { data: tickets, error } = await db
        .from('tickets')
        .select('id, attendee_name, attendee_email, status, created_at, events(name), ticket_types(name)');
      
      if (error) throw error;

      const headers = ["Ticket ID", "Attendee Name", "Email", "Event", "Type", "Status", "Purchase Date"];
      const rows = tickets.map((t: any) => [
        t.id, t.attendee_name, t.attendee_email, t.events?.name, t.ticket_types?.name || 'Free / RSVP', t.status, t.created_at
      ]);

      const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=tickets_export.csv');
      res.send(csvContent);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Vite Middleware ---

  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // SPA fallback: serve index.html for all non-API routes
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
    });
  }
}

setupServer();

export default app;

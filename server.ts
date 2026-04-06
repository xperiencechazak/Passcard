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

function logAdminAction(adminEmail: string, action: string, details: string, eventId?: string) {
  try {
    db.prepare("INSERT INTO admin_logs (admin_email, action, details, event_id) VALUES (?, ?, ?, ?)").run(adminEmail, action, details, eventId || null);
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
  // --- Migrations ---
  // Ensure all events have an event_code
  try {
    const eventsWithoutCode = db.prepare('SELECT id FROM events WHERE event_code IS NULL').all() as any[];
    for (const event of eventsWithoutCode) {
      let eventCode = generateEventCode();
      let codeExists = db.prepare('SELECT id FROM events WHERE event_code = ?').get(eventCode);
      while (codeExists) {
        eventCode = generateEventCode();
        codeExists = db.prepare('SELECT id FROM events WHERE event_code = ?').get(eventCode);
      }
      db.prepare('UPDATE events SET event_code = ? WHERE id = ?').run(eventCode, event.id);
    }
  } catch (e) {
    console.error('Migration error (event_code):', e);
  }

  // --- API Routes ---

  // Get Pre-uploaded Images
  app.get("/api/assets/images", (req, res) => {
    res.json(PRE_UPLOADED_IMAGES);
  });

  // Public Event Submission
  app.post("/api/events/submit", (req, res) => {
    const { name, organizer, organizer_email, venue, date, time, description } = req.body;
    const id = uuidv4();
    const eventCode = generateEventCode();

    try {
      db.prepare(`
        INSERT INTO events (id, name, organizer, organizer_email, venue, date, time, description, status, event_code, is_hidden)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', ?, 1)
      `).run(id, name, organizer, organizer_email, venue, date, time, description, eventCode);

      res.json({ success: true, id });
    } catch (error: any) {
      console.error('Event submission error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get Pending Submissions
  app.get("/api/admin/submissions", (req, res) => {
    try {
      const submissions = db.prepare("SELECT * FROM events WHERE status = 'PENDING' ORDER BY created_at DESC").all();
      res.json(submissions);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Finalize/Complete Event Setup
  app.put("/api/admin/events/:id/complete-setup", (req, res) => {
    const { id } = req.params;
    const { banner_url, is_free, rsvp_limit, ticketTypes, adminEmail } = req.body;

    try {
      const transaction = db.transaction(() => {
        // Update event details
        db.prepare(`
          UPDATE events 
          SET banner_url = ?, is_free = ?, rsvp_limit = ?, status = 'DRAFT'
          WHERE id = ?
        `).run(banner_url, is_free ? 1 : 0, rsvp_limit || null, id);

        // Add ticket types if not free
        if (!is_free && ticketTypes && ticketTypes.length > 0) {
          const insertTicketType = db.prepare(`
            INSERT INTO ticket_types (id, event_id, name, price, quantity)
            VALUES (?, ?, ?, ?, ?)
          `);
          for (const type of ticketTypes) {
            insertTicketType.run(uuidv4(), id, type.name, type.price, type.quantity);
          }
        }
      });

      transaction();
      logAdminAction(adminEmail || 'Admin', 'COMPLETE_EVENT_SETUP', `Completed setup for event ${id}`, id);
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
      const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId) as any;
      if (!event) return res.status(404).json({ error: "Event not found" });
      if (!event.is_free) return res.status(400).json({ error: "This is not a free event" });

      // Check RSVP limit
      if (event.rsvp_limit) {
        const currentRSVPs = db.prepare('SELECT COUNT(*) as count FROM tickets WHERE event_id = ?').get(eventId) as any;
        if (currentRSVPs.count >= event.rsvp_limit) {
          return res.status(400).json({ error: "RSVP limit reached for this event" });
        }
      }

      const paymentId = 'RSVP-' + uuidv4().substring(0, 8).toUpperCase();
      const ticketTypeId = 'RSVP-' + eventId; // Virtual ticket type for RSVP

      const yearAlphabet = getYearAlphabet(new Date(event.date).getFullYear());
      const eventCode = event.event_code || String(event.event_number || 0).padStart(3, '0');
      
      const lastTicket = db.prepare('SELECT MAX(ticket_sequence_number) as max_seq FROM tickets WHERE event_id = ?').get(eventId) as any;
      const nextSeq = (lastTicket?.max_seq || 0) + 1;
      const seqStr = String(nextSeq).padStart(4, '0');
      const ticketId = `${yearAlphabet}-${eventCode}-RSVP-${seqStr}`;

      const transaction = db.transaction(() => {
        // Create a dummy payment record for tracking
        db.prepare(`
          INSERT INTO payments (id, phone, amount, quantity, event_id, ticket_type_id, attendee_name, attendee_email, status)
          VALUES (?, ?, 0, 1, ?, ?, ?, ?, 'COMPLETED')
        `).run(paymentId, phoneNumber || 'RSVP', eventId, ticketTypeId, attendeeName, attendeeEmail);

        // Create ticket
        db.prepare(`
          INSERT INTO tickets (id, payment_id, event_id, ticket_type_id, attendee_name, attendee_email, ticket_sequence_number)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(ticketId, paymentId, eventId, ticketTypeId, attendeeName, attendeeEmail, nextSeq);
      });

      transaction();

      const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId) as any;
      const virtualTicketType = { name: 'Free / RSVP', price: 0 };
      
      await sendTicketEmail(ticket, event, virtualTicketType as any);

      res.json({ success: true, ticketId });
    } catch (error: any) {
      console.error('RSVP Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get all events
  app.get("/api/events", (req, res) => {
    try {
      const events = db.prepare(`
        SELECT e.*, MIN(tt.price) as min_price,
               MIN(CASE 
                 WHEN tt.flash_sale_price IS NOT NULL 
                 AND datetime('now') BETWEEN tt.flash_sale_start AND tt.flash_sale_end 
                 THEN tt.flash_sale_price 
                 ELSE tt.price 
               END) as current_min_price,
               MAX(CASE 
                 WHEN tt.flash_sale_price IS NOT NULL 
                 AND datetime('now') BETWEEN tt.flash_sale_start AND tt.flash_sale_end 
                 THEN 1 
                 ELSE 0 
               END) as is_flash_sale_active
        FROM events e
        LEFT JOIN ticket_types tt ON e.id = tt.event_id
        WHERE e.status = 'PUBLISHED'
        GROUP BY e.id
        ORDER BY e.created_at DESC
      `).all();
      res.json(events);
    } catch (error: any) {
      console.error('Error fetching events:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Get event details
  app.get("/api/events/:id", (req, res) => {
    try {
      const event = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id) as any;
      if (!event) return res.status(404).json({ error: "Event not found" });
      
      const ticketTypes = db.prepare(`
        SELECT *, 
               CASE 
                 WHEN flash_sale_price IS NOT NULL 
                 AND datetime('now') BETWEEN flash_sale_start AND flash_sale_end 
                 THEN 1 
                 ELSE 0 
               END as is_flash_sale_active
        FROM ticket_types 
        WHERE event_id = ?
      `).all(req.params.id);
      res.json({ ...event, ticketTypes });
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
      const ticketType = db.prepare(`
        SELECT price, flash_sale_price, flash_sale_start, flash_sale_end 
        FROM ticket_types WHERE id = ?
      `).get(ticketTypeId) as any;

      if (!ticketType) throw new Error("Invalid ticket type");

      let expectedPrice = ticketType.price;
      const now = new Date().toISOString();
      if (ticketType.flash_sale_price && now >= ticketType.flash_sale_start && now <= ticketType.flash_sale_end) {
        expectedPrice = ticketType.flash_sale_price;
      }

      let discountAmount = 0;
      if (couponId) {
        const coupon = db.prepare("SELECT * FROM coupons WHERE id = ?").get(couponId) as any;
        if (coupon) {
          discountAmount = Math.floor((expectedPrice * (quantity || 1) * coupon.discount_percentage) / 100);
        }
      }

      const finalExpectedAmount = (expectedPrice * (quantity || 1)) - discountAmount;

      if (amount !== finalExpectedAmount) {
        console.warn(`Price mismatch: Expected ${finalExpectedAmount}, got ${amount}`);
      }

      db.prepare(`
        INSERT INTO payments (id, phone, amount, quantity, event_id, ticket_type_id, attendee_name, attendee_email, coupon_id, discount_amount)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(paymentId, phoneNumber, amount, quantity || 1, eventId, ticketTypeId, attendeeName, attendeeEmail, couponId || null, discountAmount);

      const mpesaResponse = await initiateSTKPush(phoneNumber, amount, paymentId);
      res.json({ paymentId, ...mpesaResponse });
    } catch (error: any) {
      console.error('STK Push Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Check Payment Status
  app.get("/api/payment-status/:requestId", (req, res) => {
    const requestId = req.params.requestId;
    const payment = db.prepare('SELECT * FROM payments WHERE checkout_request_id = ? OR id = ?').get(requestId, requestId) as any;
    
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    
    let ticketIds = [];
    if (payment.status === 'COMPLETED') {
      const tickets = db.prepare('SELECT id FROM tickets WHERE payment_id = ?').all(payment.id) as any[];
      ticketIds = tickets.map(t => t.id);
    }
    
    res.json({ 
      status: payment.status === 'COMPLETED' ? 'SUCCESS' : 
              payment.status === 'FAILED' ? 'ERROR' : 'PENDING', 
      ticketIds,
      ticketId: ticketIds[0] || null, // For backward compatibility
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
      const payment = db.prepare('SELECT * FROM payments WHERE checkout_request_id = ?').get(checkoutRequestId) as any;
      if (payment) {
        db.prepare("UPDATE payments SET status = 'COMPLETED' WHERE id = ?").run(payment.id);

        const quantity = payment.quantity || 1;
        const generatedTickets = [];

        const event = db.prepare('SELECT * FROM events WHERE id = ?').get(payment.event_id) as any;
        const ticketType = db.prepare('SELECT * FROM ticket_types WHERE id = ?').get(payment.ticket_type_id) as any;

        const yearAlphabet = getYearAlphabet(new Date(event.date).getFullYear());
        const eventCode = event.event_code || String(event.event_number || 0).padStart(3, '0');
        
        // Get current max sequence for this ticket type
        const lastTicket = db.prepare('SELECT MAX(ticket_sequence_number) as max_seq FROM tickets WHERE ticket_type_id = ?').get(payment.ticket_type_id) as any;
        let nextSeq = (lastTicket?.max_seq || 0) + 1;

        for (let i = 0; i < quantity; i++) {
          const seqStr = String(nextSeq).padStart(4, '0');
          const ticketId = `${yearAlphabet}-${eventCode}-${ticketType.name.substring(0, 3).toUpperCase()}-${seqStr}`;
          
          db.prepare(`
            INSERT INTO tickets (id, payment_id, event_id, ticket_type_id, attendee_name, attendee_email, ticket_sequence_number)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `).run(ticketId, payment.id, payment.event_id, payment.ticket_type_id, payment.attendee_name, payment.attendee_email, nextSeq);
          
          const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
          generatedTickets.push(ticket);
          nextSeq++;
        }

        // Update sold count
        db.prepare('UPDATE ticket_types SET sold = sold + ? WHERE id = ?').run(quantity, payment.ticket_type_id);

        // Update coupon usage if applicable
        if (payment.coupon_id) {
          db.prepare('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?').run(payment.coupon_id);
        }

        // Send Emails for all tickets
        for (const ticket of generatedTickets) {
          await sendTicketEmail(ticket, event, ticketType);
        }
      }
    } else {
      // Failed
      db.prepare("UPDATE payments SET status = 'FAILED' WHERE checkout_request_id = ?").run(checkoutRequestId);
    }

    res.json({ ResultCode: 0, ResultDesc: "Success" });
  });

  // Verify Ticket
  app.post("/api/verify", (req, res) => {
    const { ticketId } = req.body;
    const normalizedTicketId = ticketId?.trim()?.toUpperCase();
    
    if (!normalizedTicketId) {
      return res.status(400).json({ status: 'INVALID', message: 'Ticket ID is required' });
    }

    const ticket = db.prepare(`
      SELECT t.*, e.name as event_name, tt.name as ticket_type_name 
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      LEFT JOIN ticket_types tt ON t.ticket_type_id = tt.id
      WHERE UPPER(t.id) = ?
    `).get(normalizedTicketId) as any;

    if (!ticket) {
      return res.json({ status: 'INVALID', message: 'Invalid Ticket' });
    }

    const ticketTypeName = ticket.ticket_type_name || 'Free / RSVP';

    if (ticket.deleted_at) {
      return res.json({ status: 'INVALID', message: 'Ticket has been cancelled/deleted' });
    }

    if (ticket.status === 'USED') {
      // Log failed attempt
      db.prepare("INSERT INTO scan_logs (ticket_id, status, message) VALUES (?, ?, ?)").run(ticketId, 'ALREADY_USED', 'Attempted to use an already scanned ticket');
      
      return res.json({ 
        status: 'USED', 
        message: 'Ticket Already Used',
        scan_time: ticket.scan_time,
        attendee_name: ticket.attendee_name
      });
    }

    // Mark as used
    const now = new Date().toISOString();
    db.prepare("UPDATE tickets SET status = 'USED', scan_time = ? WHERE id = ?").run(now, ticketId);
    
    // Log successful scan
    db.prepare("INSERT INTO scan_logs (ticket_id, status, message) VALUES (?, ?, ?)").run(ticketId, 'SUCCESS', 'Access Granted');

    res.json({ 
      status: 'VALID', 
      message: 'Access Granted',
      attendee_name: ticket.attendee_name,
      event_name: ticket.event_name,
      ticket_type: ticketTypeName
    });
  });

  // User: Get tickets by email
  app.get("/api/my-tickets", (req, res) => {
    const email = req.query.email as string;
    if (!email) return res.status(400).json({ error: "Email is required" });
    
    try {
      const tickets = db.prepare(`
        SELECT t.*, e.name as event_name, e.date as event_date, e.time as event_time, e.venue as event_venue, e.banner_url as event_banner, tt.name as ticket_type_name, tt.price as ticket_price
        FROM tickets t
        JOIN events e ON t.event_id = e.id
        LEFT JOIN ticket_types tt ON t.ticket_type_id = tt.id
        WHERE t.attendee_email = ?
        ORDER BY t.created_at DESC
      `).all(email);
      res.json(tickets);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get event-specific activities
  app.get("/api/admin/event-activities", (req, res) => {
    const includeInactive = req.query.includeInactive === 'true';
    try {
      const events = db.prepare(`
        SELECT id, name, date, is_hidden 
        FROM events 
        ${includeInactive ? '' : 'WHERE is_hidden = 0'}
        ORDER BY created_at DESC
      `).all() as any[];

      const eventActivities = events.map(event => {
        // Get ticket creations (purchases/manual)
        const tickets = db.prepare(`
          SELECT 'TICKET_CREATED' as type, attendee_name as attendee, created_at as timestamp, 'Ticket generated' as details
          FROM tickets 
          WHERE event_id = ?
          ORDER BY created_at DESC LIMIT 20
        `).all(event.id) as any[];

        // Get scans
        const scans = db.prepare(`
          SELECT 'TICKET_SCANNED' as type, t.attendee_name as attendee, sl.scanned_at as timestamp, sl.message as details
          FROM scan_logs sl
          JOIN tickets t ON sl.ticket_id = t.id
          WHERE t.event_id = ?
          ORDER BY sl.scanned_at DESC LIMIT 20
        `).all(event.id) as any[];

        // Get admin logs
        const adminLogs = db.prepare(`
          SELECT 'ADMIN_ACTION' as type, admin_email as attendee, created_at as timestamp, action || ': ' || details as details
          FROM admin_logs
          WHERE event_id = ?
          ORDER BY created_at DESC LIMIT 20
        `).all(event.id) as any[];

        // Combine and sort
        const allActivities = [...tickets, ...scans, ...adminLogs]
          .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
          .slice(0, 50);

        // Get scan stats for this event
        const scanStats = db.prepare(`
          SELECT COUNT(*) as total_scanned
          FROM tickets
          WHERE event_id = ? AND status = 'USED'
        `).get(event.id) as any;

        return {
          ...event,
          activities: allActivities,
          total_scanned: scanStats.total_scanned || 0
        };
      });

      res.json(eventActivities);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get all tickets
  app.get("/api/admin/tickets", (req, res) => {
    const includeDeleted = req.query.includeDeleted === 'true';
    const query = `
      SELECT t.*, e.name as event_name, tt.name as ticket_type_name, p.mpesa_receipt_number, p.amount as total_amount, p.discount_amount, p.quantity, c.code as coupon_code
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      LEFT JOIN ticket_types tt ON t.ticket_type_id = tt.id
      JOIN payments p ON t.payment_id = p.id
      LEFT JOIN coupons c ON p.coupon_id = c.id
      ${includeDeleted ? '' : 'WHERE t.deleted_at IS NULL'}
      ORDER BY t.created_at DESC
    `;
    const tickets = db.prepare(query).all();
    res.json(tickets);
  });

  // Admin: Delete Ticket (Soft Delete)
  app.delete("/api/admin/tickets/:id", (req, res) => {
    const ticketId = req.params.id;
    try {
      const ticket = db.prepare('SELECT status, event_id, attendee_name FROM tickets WHERE id = ?').get(ticketId) as any;
      if (!ticket) return res.status(404).json({ error: "Ticket not found" });

      // Optional: Prevent deletion of used tickets
      if (ticket.status === 'USED') {
        return res.status(400).json({ error: "Cannot delete a ticket that has already been used." });
      }

      db.prepare("UPDATE tickets SET deleted_at = ? WHERE id = ?").run(new Date().toISOString(), ticketId);
      logAdminAction(req.body.adminEmail || 'Admin', 'DELETE_TICKET', `Deleted ticket ${ticketId} for ${ticket.attendee_name}`, ticket.event_id);
      res.json({ success: true, message: "Ticket deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Restore Ticket
  app.post("/api/admin/tickets/:id/restore", (req, res) => {
    const ticketId = req.params.id;
    try {
      db.prepare("UPDATE tickets SET deleted_at = NULL WHERE id = ?").run(ticketId);
      res.json({ success: true, message: "Ticket restored successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get Scan Logs
  app.get("/api/admin/scan-logs", (req, res) => {
    try {
      const logs = db.prepare(`
        SELECT sl.*, t.attendee_name, e.name as event_name
        FROM scan_logs sl
        JOIN tickets t ON sl.ticket_id = t.id
        JOIN events e ON t.event_id = e.id
        ORDER BY sl.scanned_at DESC
        LIMIT 100
      `).all();
      res.json(logs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Manually Add Ticket
  app.post("/api/admin/tickets", (req, res) => {
    const { eventId, ticketTypeId, name, email, amount, manualTicketId, mpesaReceiptNumber } = req.body;
    
    try {
      const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId) as any;
      const ticketType = db.prepare('SELECT * FROM ticket_types WHERE id = ?').get(ticketTypeId) as any;
      
      if (!event || !ticketType) return res.status(404).json({ error: "Event or Ticket Type not found" });

      const yearAlphabet = getYearAlphabet(new Date(event.date).getFullYear());
      const eventCode = event.event_code || String(event.event_number || 0).padStart(3, '0');
      
      const lastTicket = db.prepare('SELECT MAX(ticket_sequence_number) as max_seq FROM tickets WHERE ticket_type_id = ?').get(ticketTypeId) as any;
      const nextSeq = (lastTicket?.max_seq || 0) + 1;
      const seqStr = String(nextSeq).padStart(4, '0');
      
      const ticketId = manualTicketId || `${yearAlphabet}-${eventCode}-${ticketType.name.substring(0, 3).toUpperCase()}-${seqStr}`;
      const paymentId = 'MANUAL-' + uuidv4().substring(0, 8).toUpperCase();

      // Check if ticketId already exists
      const existing = db.prepare("SELECT id FROM tickets WHERE id = ?").get(ticketId);
      if (existing) {
        return res.status(400).json({ error: "Ticket ID already exists. Please use a unique ID." });
      }

      const transaction = db.transaction(() => {
        // Create payment record
        db.prepare(`
          INSERT INTO payments (id, phone, amount, event_id, ticket_type_id, attendee_name, attendee_email, status, mpesa_receipt_number)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?)
        `).run(paymentId, 'MANUAL', amount, eventId, ticketTypeId, name, email, mpesaReceiptNumber || null);

        // Create ticket record
        db.prepare(`
          INSERT INTO tickets (id, payment_id, event_id, ticket_type_id, attendee_name, attendee_email, status, ticket_sequence_number)
          VALUES (?, ?, ?, ?, ?, ?, 'VALID', ?)
        `).run(ticketId, paymentId, eventId, ticketTypeId, name, email, nextSeq);

        // Update sold count
        db.prepare('UPDATE ticket_types SET sold = sold + 1 WHERE id = ?').run(ticketTypeId);
      });

      transaction();

      // Send Email
      const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId);
      sendTicketEmail(ticket, event, ticketType).catch(console.error);

      res.json({ success: true, ticketId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Resend Ticket Email
  app.post("/api/admin/tickets/resend", (req, res) => {
    const { ticketId } = req.body;
    try {
      const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId) as any;
      if (!ticket) return res.status(404).json({ error: "Ticket not found" });

      const event = db.prepare('SELECT * FROM events WHERE id = ?').get(ticket.event_id);
      const ticketType = db.prepare('SELECT * FROM ticket_types WHERE id = ?').get(ticket.ticket_type_id);

      sendTicketEmail(ticket, event, ticketType).catch(console.error);
      res.json({ success: true, message: "Email resend initiated" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Ticket: Download PDF
  app.get("/api/tickets/:id/download", async (req, res) => {
    const ticketId = req.params.id;
    try {
      const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(ticketId) as any;
      if (!ticket) return res.status(404).json({ error: "Ticket not found" });

      const event = db.prepare('SELECT * FROM events WHERE id = ?').get(ticket.event_id);
      const ticketType = db.prepare('SELECT * FROM ticket_types WHERE id = ?').get(ticket.ticket_type_id);

      const pdfBuffer = await generateTicketPDF(ticket, event, ticketType);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=Ticket-${ticketId}.pdf`);
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error('Download Error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Download Event Report PDF
  app.get("/api/admin/events/:id/report", async (req, res) => {
    const eventId = req.params.id;
    try {
      const event = db.prepare('SELECT name FROM events WHERE id = ?').get(eventId) as any;
      if (!event) return res.status(404).json({ error: "Event not found" });

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
      const event = db.prepare('SELECT * FROM events WHERE id = ?').get(eventId) as any;
      if (!event) return res.status(404).json({ error: "Event not found" });

      db.prepare("UPDATE events SET is_completed = 1, is_hidden = 1 WHERE id = ?").run(eventId);
      logAdminAction(adminEmail, 'COMPLETE_EVENT', `Marked event ${eventId} as completed`, eventId);
      
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
  app.get("/api/admin/stats", (req, res) => {
    const totalSales = db.prepare("SELECT SUM(amount) as total FROM payments WHERE status = 'COMPLETED'").get() as any;
    const paidTickets = db.prepare(`
      SELECT COUNT(*) as count 
      FROM tickets t 
      JOIN events e ON t.event_id = e.id 
      WHERE e.is_free = 0
    `).get() as any;
    const totalRSVPs = db.prepare(`
      SELECT COUNT(*) as count 
      FROM tickets t 
      JOIN events e ON t.event_id = e.id 
      WHERE e.is_free = 1
    `).get() as any;
    const recentTickets = db.prepare(`
      SELECT t.*, e.name as event_name 
      FROM tickets t 
      JOIN events e ON t.event_id = e.id 
      ORDER BY t.created_at DESC LIMIT 10
    `).all();

    res.json({
      revenue: totalSales.total || 0,
      ticketsSold: paidTickets.count,
      totalRSVPs: totalRSVPs.count,
      recentTickets
    });
  });

  // Admin: Get all events with sales data
  app.get("/api/admin/events", (req, res) => {
    const events = db.prepare(`
      SELECT e.*, 
             CASE 
               WHEN e.is_free = 1 THEN e.rsvp_limit 
               ELSE (SELECT COALESCE(SUM(quantity), 0) FROM ticket_types WHERE event_id = e.id) 
             END as total_capacity,
             CASE 
               WHEN e.is_free = 1 THEN 0
               ELSE (SELECT COALESCE(SUM(sold), 0) FROM ticket_types WHERE event_id = e.id) 
             END as total_sold,
             CASE 
               WHEN e.is_free = 1 THEN (SELECT COUNT(*) FROM tickets WHERE event_id = e.id)
               ELSE 0
             END as total_rsvps,
             (SELECT COUNT(*) FROM tickets WHERE event_id = e.id AND status = 'USED') as total_checked_in
      FROM events e
      ORDER BY e.created_at DESC
    `).all();
    res.json(events);
  });

  // Admin: Delete Event
  app.delete("/api/admin/events/:id", (req, res) => {
    try {
      const transaction = db.transaction(() => {
        db.prepare('DELETE FROM ticket_types WHERE event_id = ?').run(req.params.id);
        db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
      });
      transaction();
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Hide Event (Soft Delete from public page)
  app.post("/api/admin/events/:id/hide", (req, res) => {
    const eventId = req.params.id;
    const adminEmail = req.body.adminEmail || 'Admin';
    try {
      const event = db.prepare('SELECT date FROM events WHERE id = ?').get(eventId) as any;
      if (!event) return res.status(404).json({ error: "Event not found" });

      const eventDate = new Date(event.date);
      const now = new Date();
      if (eventDate > now) {
        return res.status(400).json({ error: "Event can only be removed after it has ended." });
      }

      db.prepare("UPDATE events SET is_hidden = 1 WHERE id = ?").run(eventId);
      logAdminAction(adminEmail, 'HIDE_EVENT', `Hid event ${eventId}`, eventId);
      res.json({ success: true, message: "Event removed from public page." });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Regenerate Event Code
  app.post("/api/admin/events/:id/regenerate-code", (req, res) => {
    const eventId = req.params.id;
    const adminEmail = req.body.adminEmail || 'Admin';
    try {
      let eventCode = generateEventCode();
      let codeExists = db.prepare('SELECT id FROM events WHERE event_code = ?').get(eventCode);
      while (codeExists) {
        eventCode = generateEventCode();
        codeExists = db.prepare('SELECT id FROM events WHERE event_code = ?').get(eventCode);
      }
      db.prepare("UPDATE events SET event_code = ? WHERE id = ?").run(eventCode, eventId);
      logAdminAction(adminEmail, 'REGENERATE_EVENT_CODE', `Regenerated code for event ${eventId} to ${eventCode}`, eventId);
      res.json({ success: true, eventCode });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Contract & Organizer APIs ---

  // Admin: Get all organizers
  app.get("/api/admin/organizers", (req, res) => {
    try {
      const organizers = db.prepare("SELECT * FROM organizers ORDER BY created_at DESC").all();
      res.json(organizers);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Create organizer
  app.post("/api/admin/organizers", (req, res) => {
    const { name, email, company_name, phone, adminEmail } = req.body;
    const id = 'org_' + uuidv4().substring(0, 8);
    try {
      db.prepare(`
        INSERT INTO organizers (id, name, email, company_name, phone)
        VALUES (?, ?, ?, ?, ?)
      `).run(id, name, email, company_name || null, phone || null);
      logAdminAction(adminEmail || 'Admin', 'CREATE_ORGANIZER', `Created organizer ${name} (${email})`);
      res.json({ success: true, id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Get all contracts
  app.get("/api/admin/contracts", (req, res) => {
    try {
      const contracts = db.prepare(`
        SELECT c.*, o.name as organizer_name, o.email as organizer_email, o.company_name, e.name as event_name
        FROM contracts c
        JOIN organizers o ON c.organizer_id = o.id
        LEFT JOIN events e ON c.event_id = e.id
        ORDER BY c.created_at DESC
      `).all();
      res.json(contracts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Create contract
  app.post("/api/admin/contracts", (req, res) => {
    const { organizer_id, event_id, effective_date, pricing_details, payout_period, adminEmail } = req.body;
    const id = 'cnt_' + uuidv4().substring(0, 8);
    try {
      db.prepare(`
        INSERT INTO contracts (id, organizer_id, event_id, effective_date, pricing_details, payout_period)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, organizer_id, event_id || null, effective_date, pricing_details || '6% per ticket + KES 30', payout_period || '3 business days');
      logAdminAction(adminEmail || 'Admin', 'CREATE_CONTRACT', `Created contract ${id} for organizer ${organizer_id}`);
      res.json({ success: true, id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Send contract email
  app.post("/api/admin/contracts/:id/send", async (req, res) => {
    const { adminEmail } = req.body;
    try {
      await sendContractEmail(req.params.id);
      logAdminAction(adminEmail || 'Admin', 'SEND_CONTRACT', `Sent contract ${req.params.id} via email`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Update contract status
  app.put("/api/admin/contracts/:id/status", (req, res) => {
    const { status, adminEmail } = req.body;
    try {
      const signedAt = status === 'SIGNED' ? new Date().toISOString() : null;
      if (signedAt) {
        db.prepare("UPDATE contracts SET status = ?, signed_at = ? WHERE id = ?").run(status, signedAt, req.params.id);
      } else {
        db.prepare("UPDATE contracts SET status = ? WHERE id = ?").run(status, req.params.id);
      }
      logAdminAction(adminEmail || 'Admin', 'UPDATE_CONTRACT_STATUS', `Updated contract ${req.params.id} status to ${status}`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Delete contract
  app.delete("/api/admin/contracts/:id", (req, res) => {
    const { adminEmail } = req.body;
    try {
      db.prepare("DELETE FROM contracts WHERE id = ?").run(req.params.id);
      logAdminAction(adminEmail || 'Admin', 'DELETE_CONTRACT', `Deleted contract ${req.params.id}`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Download/View Contract PDF
  app.get("/api/admin/contracts/:id/pdf", async (req, res) => {
    try {
      const contract = db.prepare(`
        SELECT c.*, o.name as organizer_name, o.email as organizer_email, o.company_name 
        FROM contracts c
        JOIN organizers o ON c.organizer_id = o.id
        WHERE c.id = ?
      `).get(req.params.id) as any;

      if (!contract) return res.status(404).json({ error: 'Contract not found' });

      const pdfBuffer = await generateContractPDF(contract);
      res.setHeader('Content-Type', 'application/pdf');
      const dateStr = new Date().toISOString().split('T')[0];
      res.setHeader('Content-Disposition', `attachment; filename=Contract_${contract.organizer_name.replace(/\s+/g, '_')}_${dateStr}.pdf`);
      res.send(pdfBuffer);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // --- Coupon APIs ---

  // Admin: Get all coupons
  app.get("/api/admin/coupons", (req, res) => {
    try {
      const coupons = db.prepare(`
        SELECT c.*, e.name as event_name, tt.name as ticket_type_name
        FROM coupons c
        LEFT JOIN events e ON c.event_id = e.id
        LEFT JOIN ticket_types tt ON c.ticket_type_id = tt.id
        ORDER BY c.created_at DESC
      `).all();
      res.json(coupons);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Create coupon
  app.post("/api/admin/coupons", (req, res) => {
    const { code, discount_percentage, event_id, ticket_type_id, expiry_date, usage_limit, per_user_limit, adminEmail } = req.body;
    const id = 'cpn_' + uuidv4().substring(0, 8);
    
    try {
      db.prepare(`
        INSERT INTO coupons (id, code, discount_percentage, event_id, ticket_type_id, expiry_date, usage_limit, per_user_limit)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(id, code.toUpperCase(), discount_percentage, event_id || null, ticket_type_id || null, expiry_date || null, usage_limit || null, per_user_limit || null);
      
      logAdminAction(adminEmail || 'Admin', 'CREATE_COUPON', `Created coupon ${code} (${discount_percentage}%)`);
      res.json({ success: true, id });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Update coupon (Toggle active status)
  app.put("/api/admin/coupons/:id", (req, res) => {
    const { is_active, adminEmail } = req.body;
    try {
      db.prepare("UPDATE coupons SET is_active = ? WHERE id = ?").run(is_active ? 1 : 0, req.params.id);
      logAdminAction(adminEmail || 'Admin', 'UPDATE_COUPON', `Updated coupon ${req.params.id} active status to ${is_active}`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Admin: Delete coupon
  app.delete("/api/admin/coupons/:id", (req, res) => {
    const { adminEmail } = req.body;
    try {
      const coupon = db.prepare("SELECT code FROM coupons WHERE id = ?").get(req.params.id) as any;
      db.prepare("DELETE FROM coupons WHERE id = ?").run(req.params.id);
      logAdminAction(adminEmail || 'Admin', 'DELETE_COUPON', `Deleted coupon ${coupon?.code || req.params.id}`);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // User: Validate coupon
  app.post("/api/coupons/validate", (req, res) => {
    const { code, eventId, ticketTypeId, email } = req.body;
    
    try {
      const coupon = db.prepare("SELECT * FROM coupons WHERE code = ?").get(code.toUpperCase()) as any;
      
      if (!coupon) {
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
        const usageCount = db.prepare("SELECT COUNT(*) as count FROM payments WHERE attendee_email = ? AND coupon_id = ? AND status = 'COMPLETED'").get(email, coupon.id) as any;
        if (usageCount.count >= coupon.per_user_limit) {
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
  app.post("/api/events", (req, res) => {
    const { name, organizer, venue, date, time, banner_url, description, category, ticketTypes, adminEmail, is_free, rsvp_limit } = req.body;
    const eventId = 'evt_' + uuidv4().substring(0, 8);
    const finalBannerUrl = convertGoogleDriveUrl(banner_url);

    try {
      // Get next event number
      const lastEvent = db.prepare('SELECT MAX(event_number) as max_num FROM events').get() as any;
      const nextEventNum = (lastEvent?.max_num || 0) + 1;

      // Generate unique event code
      let eventCode = generateEventCode();
      let codeExists = db.prepare('SELECT id FROM events WHERE event_code = ?').get(eventCode);
      while (codeExists) {
        eventCode = generateEventCode();
        codeExists = db.prepare('SELECT id FROM events WHERE event_code = ?').get(eventCode);
      }

      const insertEvent = db.prepare(`
        INSERT INTO events (id, name, organizer, venue, date, time, banner_url, description, category, event_number, event_code, is_free, rsvp_limit, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      const insertTicketType = db.prepare(`
        INSERT INTO ticket_types (id, event_id, name, price, quantity, flash_sale_price, flash_sale_start, flash_sale_end)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const transaction = db.transaction(() => {
        insertEvent.run(eventId, name, organizer, venue, date, time, finalBannerUrl, description, category || 'Concert', nextEventNum, eventCode, is_free ? 1 : 0, rsvp_limit || null, 'DRAFT');
        if (!is_free && ticketTypes) {
          for (const tt of ticketTypes) {
            insertTicketType.run(
              uuidv4(), 
              eventId, 
              tt.name, 
              tt.price, 
              tt.quantity, 
              tt.flash_sale_price || null, 
              tt.flash_sale_start && tt.flash_sale_start !== '' ? tt.flash_sale_start : null, 
              tt.flash_sale_end && tt.flash_sale_end !== '' ? tt.flash_sale_end : null
            );
          }
        }
      });

      transaction();
      logAdminAction(adminEmail || 'Admin', 'CREATE_EVENT', `Created event ${eventId} (${name})`, eventId);
      res.json({ success: true, eventId });
    } catch (error: any) {
      console.error('Error creating event:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Update Event Status (Publish/Unpublish/Complete)
  app.post("/api/admin/events/:id/status", (req, res) => {
    const { id } = req.params;
    const { status, adminEmail } = req.body;
    
    try {
      const validStatuses = ['DRAFT', 'PUBLISHED', 'COMPLETED'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }

      const is_hidden = status === 'DRAFT' ? 1 : 0;
      const is_completed = status === 'COMPLETED' ? 1 : 0;

      db.prepare("UPDATE events SET status = ?, is_hidden = ?, is_completed = ? WHERE id = ?").run(status, is_hidden, is_completed, id);
      
      logAdminAction(adminEmail || 'Admin', 'UPDATE_EVENT_STATUS', `Updated event ${id} status to ${status}`, id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Update Event Details
  app.put("/api/admin/events/:id", (req, res) => {
    const { id } = req.params;
    const { name, organizer, venue, date, time, banner_url, description, category, is_free, rsvp_limit, adminEmail } = req.body;
    const finalBannerUrl = convertGoogleDriveUrl(banner_url);

    try {
      db.prepare(`
        UPDATE events 
        SET name = ?, organizer = ?, venue = ?, date = ?, time = ?, banner_url = ?, description = ?, category = ?, is_free = ?, rsvp_limit = ?
        WHERE id = ?
      `).run(name, organizer, venue, date, time, finalBannerUrl, description, category, is_free ? 1 : 0, rsvp_limit || null, id);

      logAdminAction(adminEmail || 'Admin', 'UPDATE_EVENT', `Updated event ${id} (${name})`, id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Reset Data
  app.post("/api/admin/reset-data", (req, res) => {
    try {
      const transaction = db.transaction(() => {
        db.prepare("DELETE FROM tickets").run();
        db.prepare("DELETE FROM payments").run();
        db.prepare("DELETE FROM scan_logs").run();
        db.prepare("DELETE FROM coupons").run();
        db.prepare("DELETE FROM ticket_types").run();
        db.prepare("DELETE FROM events").run();
        db.prepare("DELETE FROM contracts").run();
      });
      transaction();
      logAdminAction('Admin', 'RESET_DATA', 'Cleared all event and ticket data');
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Export CSV (Simple implementation)
  app.get("/api/admin/export", (req, res) => {
    const tickets = db.prepare(`
      SELECT t.id, t.attendee_name, t.attendee_email, e.name as event_name, tt.name as ticket_type, t.status, t.created_at
      FROM tickets t
      JOIN events e ON t.event_id = e.id
      JOIN ticket_types tt ON t.ticket_type_id = tt.id
    `).all() as any[];

    const headers = ["Ticket ID", "Attendee Name", "Email", "Event", "Type", "Status", "Purchase Date"];
    const rows = tickets.map(t => [
      t.id, t.attendee_name, t.attendee_email, t.event_name, t.ticket_type, t.status, t.created_at
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=tickets.csv');
    res.send(csvContent);
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

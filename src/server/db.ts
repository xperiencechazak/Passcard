import Database from 'better-sqlite3';
import path from 'path';

const db = new Database('faithpass.db');

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    organizer TEXT NOT NULL,
    venue TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    banner_url TEXT,
    description TEXT,
    category TEXT DEFAULT 'Concert',
    is_hidden INTEGER DEFAULT 0,
    event_number INTEGER,
    event_code TEXT UNIQUE,
    is_free INTEGER DEFAULT 0,
    rsvp_limit INTEGER,
    is_completed INTEGER DEFAULT 0,
    status TEXT DEFAULT 'DRAFT',
    organizer_email TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS organizers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company_name TEXT,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS contracts (
    id TEXT PRIMARY KEY,
    organizer_id TEXT NOT NULL,
    event_id TEXT,
    effective_date TEXT NOT NULL,
    pricing_details TEXT,
    payout_period TEXT,
    status TEXT DEFAULT 'PENDING',
    pdf_path TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    sent_at DATETIME,
    signed_at DATETIME,
    FOREIGN KEY (organizer_id) REFERENCES organizers (id),
    FOREIGN KEY (event_id) REFERENCES events (id)
  );

  CREATE TABLE IF NOT EXISTS ticket_types (
    id TEXT PRIMARY KEY,
    event_id TEXT NOT NULL,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    sold INTEGER DEFAULT 0,
    flash_sale_price INTEGER,
    flash_sale_start DATETIME,
    flash_sale_end DATETIME,
    FOREIGN KEY (event_id) REFERENCES events (id)
  );

  CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    checkout_request_id TEXT UNIQUE,
    merchant_request_id TEXT,
    mpesa_receipt_number TEXT,
    phone TEXT NOT NULL,
    amount INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    status TEXT DEFAULT 'PENDING',
    event_id TEXT NOT NULL,
    ticket_type_id TEXT NOT NULL,
    attendee_name TEXT NOT NULL,
    attendee_email TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY,
    payment_id TEXT NOT NULL,
    event_id TEXT NOT NULL,
    ticket_type_id TEXT NOT NULL,
    attendee_name TEXT NOT NULL,
    attendee_email TEXT NOT NULL,
    status TEXT DEFAULT 'VALID',
    scan_time DATETIME,
    email_status TEXT DEFAULT 'PENDING',
    email_sent_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    deleted_at DATETIME,
    ticket_sequence_number INTEGER,
    FOREIGN KEY (payment_id) REFERENCES payments (id),
    FOREIGN KEY (event_id) REFERENCES events (id)
  );

  CREATE TABLE IF NOT EXISTS scan_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticket_id TEXT NOT NULL,
    status TEXT NOT NULL,
    message TEXT,
    scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ticket_id) REFERENCES tickets (id)
  );

  CREATE TABLE IF NOT EXISTS admin_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_email TEXT,
    action TEXT,
    details TEXT,
    event_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS coupons (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    discount_percentage INTEGER NOT NULL,
    event_id TEXT,
    ticket_type_id TEXT,
    expiry_date DATETIME,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    per_user_limit INTEGER,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (event_id) REFERENCES events (id),
    FOREIGN KEY (ticket_type_id) REFERENCES ticket_types (id)
  );
`);

// Migration: Ensure email tracking columns exist
try {
  db.prepare("ALTER TABLE tickets ADD COLUMN email_status TEXT DEFAULT 'PENDING'").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE tickets ADD COLUMN email_sent_at DATETIME").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE tickets ADD COLUMN deleted_at DATETIME").run();
} catch (e) {}

// Migration: Add event_id to admin_logs
try {
  db.prepare("ALTER TABLE admin_logs ADD COLUMN event_id TEXT").run();
} catch (e) {}

// Migration: Ensure mpesa_receipt_number exists
try {
  db.prepare("ALTER TABLE payments ADD COLUMN mpesa_receipt_number TEXT").run();
} catch (e) {
  // Column already exists or table doesn't exist yet (handled by CREATE TABLE)
}

try {
  db.prepare("ALTER TABLE payments ADD COLUMN merchant_request_id TEXT").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE payments ADD COLUMN checkout_request_id TEXT").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE payments ADD COLUMN quantity INTEGER DEFAULT 1").run();
} catch (e) {}

// Migration: New columns for event hiding and sequential numbering
try {
  db.prepare("ALTER TABLE events ADD COLUMN is_hidden INTEGER DEFAULT 0").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE events ADD COLUMN event_number INTEGER").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE ticket_types ADD COLUMN flash_sale_price INTEGER").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE ticket_types ADD COLUMN flash_sale_start DATETIME").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE ticket_types ADD COLUMN flash_sale_end DATETIME").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE events ADD COLUMN event_code TEXT UNIQUE").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE tickets ADD COLUMN ticket_sequence_number INTEGER").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE events ADD COLUMN is_free INTEGER DEFAULT 0").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE events ADD COLUMN rsvp_limit INTEGER").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE events ADD COLUMN is_completed INTEGER DEFAULT 0").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE events ADD COLUMN status TEXT DEFAULT 'DRAFT'").run();
} catch (e) {}

try {
  db.prepare("ALTER TABLE events ADD COLUMN organizer_email TEXT").run();
} catch (e) {}

// Migration: Coupon support for payments
try {
  db.prepare("ALTER TABLE payments ADD COLUMN coupon_id TEXT").run();
} catch (e) {}
try {
  db.prepare("ALTER TABLE payments ADD COLUMN discount_amount INTEGER DEFAULT 0").run();
} catch (e) {}

export default db;

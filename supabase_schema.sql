-- SQL Schema for Supabase PostgreSQL
-- Run this in the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Events Table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    organizer TEXT NOT NULL,
    venue TEXT NOT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    banner_url TEXT,
    description TEXT,
    category TEXT DEFAULT 'Concert',
    is_hidden BOOLEAN DEFAULT FALSE,
    event_number INTEGER,
    event_code TEXT UNIQUE,
    is_free BOOLEAN DEFAULT FALSE,
    rsvp_limit INTEGER,
    is_completed BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'DRAFT',
    organizer_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Organizers Table
CREATE TABLE IF NOT EXISTS organizers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    company_name TEXT,
    phone TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Ticket Types Table
CREATE TABLE IF NOT EXISTS ticket_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    sold INTEGER DEFAULT 0,
    flash_sale_price INTEGER,
    flash_sale_start TIMESTAMPTZ,
    flash_sale_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Coupons Table
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    discount_percentage INTEGER NOT NULL,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    ticket_type_id UUID REFERENCES ticket_types(id) ON DELETE SET NULL,
    expiry_date TIMESTAMPTZ,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    per_user_limit INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Payments Table
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checkout_request_id TEXT UNIQUE,
    merchant_request_id TEXT,
    mpesa_receipt_number TEXT,
    phone TEXT NOT NULL,
    amount INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    status TEXT DEFAULT 'PENDING',
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    ticket_type_id UUID NOT NULL REFERENCES ticket_types(id) ON DELETE CASCADE,
    attendee_name TEXT NOT NULL,
    attendee_email TEXT NOT NULL,
    coupon_id UUID REFERENCES coupons(id) ON DELETE SET NULL,
    discount_amount INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tickets Table
CREATE TABLE IF NOT EXISTS tickets (
    id TEXT PRIMARY KEY, -- Using custom ID format like A-123-REG-0001
    payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    ticket_type_id UUID NOT NULL REFERENCES ticket_types(id) ON DELETE CASCADE,
    attendee_name TEXT NOT NULL,
    attendee_email TEXT NOT NULL,
    status TEXT DEFAULT 'VALID',
    scan_time TIMESTAMPTZ,
    email_status TEXT DEFAULT 'PENDING',
    email_sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    ticket_sequence_number INTEGER
);

-- 7. Scan Logs Table
CREATE TABLE IF NOT EXISTS scan_logs (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    ticket_id TEXT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    status TEXT NOT NULL,
    message TEXT,
    scanned_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Admin Logs Table
CREATE TABLE IF NOT EXISTS admin_logs (
    id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    admin_email TEXT,
    action TEXT,
    details TEXT,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Contracts Table
CREATE TABLE IF NOT EXISTS contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES organizers(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE SET NULL,
    effective_date DATE NOT NULL,
    pricing_details TEXT,
    payout_period TEXT,
    status TEXT DEFAULT 'PENDING',
    pdf_path TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ,
    signed_at TIMESTAMPTZ
);

-- RPC Functions for atomic increments
CREATE OR REPLACE FUNCTION increment_sold_count(tt_id UUID, qty INTEGER)
RETURNS void AS $$
BEGIN
  UPDATE ticket_types
  SET sold = sold + qty
  WHERE id = tt_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION increment_coupon_usage(c_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE coupons
  SET used_count = used_count + 1
  WHERE id = c_id;
END;
$$ LANGUAGE plpgsql;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_events_is_hidden ON events(is_hidden);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at);
CREATE INDEX IF NOT EXISTS idx_ticket_types_event_id ON ticket_types(event_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_payments_event_id ON payments(event_id);
CREATE INDEX IF NOT EXISTS idx_payments_checkout_request_id ON payments(checkout_request_id);
CREATE INDEX IF NOT EXISTS idx_tickets_event_id ON tickets(event_id);
CREATE INDEX IF NOT EXISTS idx_tickets_payment_id ON tickets(payment_id);
CREATE INDEX IF NOT EXISTS idx_tickets_deleted_at ON tickets(deleted_at);
CREATE INDEX IF NOT EXISTS idx_scan_logs_ticket_id ON scan_logs(ticket_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_event_id ON admin_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_contracts_organizer_id ON contracts(organizer_id);

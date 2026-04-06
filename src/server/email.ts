import nodemailer from 'nodemailer';
import QRCode from 'qrcode';
import PDFDocument from 'pdfkit-table';
import axios from 'axios';
import * as ics from 'ics';
import db from './db';

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

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function generateEventReportPDF(eventId: string): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const { data: event, error: eventError } = await db.from('events').select('*').eq('id', eventId).single();
      if (eventError || !event) throw new Error('Event not found');

      const { data: ticketTypes } = await db.from('ticket_types').select('*').eq('event_id', eventId);
      const { data: tickets } = await db
        .from('tickets')
        .select('*, payments(amount, quantity)')
        .eq('event_id', eventId)
        .is('deleted_at', null);
      
      const { data: scanLogs } = await db
        .from('scan_logs')
        .select('*, tickets(attendee_name, ticket_type_id)')
        .eq('status', 'SUCCESS');
      
      // Filter scan logs manually since Supabase join filtering is tricky for deep relations
      const filteredScanLogs = (scanLogs || []).filter((sl: any) => sl.tickets?.event_id === eventId);

      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: any[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Header
      doc.fillColor('#F27D26').fontSize(24).font('Helvetica-Bold').text('EVENT REPORT', { align: 'center' });
      doc.moveDown();
      doc.fillColor('#333333').fontSize(18).text(event.name, { align: 'center' });
      doc.fontSize(10).fillColor('#666666').text(`Generated on ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown(2);

      // Event Details Section
      doc.fillColor('#F27D26').fontSize(14).font('Helvetica-Bold').text('EVENT DETAILS');
      doc.rect(50, doc.y, 495, 1).fill('#EEEEEE');
      doc.moveDown();
      doc.fillColor('#333333').fontSize(10).font('Helvetica');
      doc.text(`Organizer: ${event.organizer}`);
      doc.text(`Venue: ${event.venue}`);
      doc.text(`Date: ${new Date(event.date).toLocaleDateString()} at ${event.time}`);
      doc.text(`Event ID: ${event.id}`);
      doc.moveDown(2);

      // Summary Section
      const totalSold = (tickets || []).length;
      const totalScanned = (tickets || []).filter((t: any) => t.status === 'USED').length;
      const totalUnused = totalSold - totalScanned;
      
      let totalRevenue = 0;
      const typeStats = (ticketTypes || []).map(type => {
        const ticketsForType = (tickets || []).filter((t: any) => t.ticket_type_id === type.id);
        const soldForType = ticketsForType.length;
        // Calculate revenue based on actual amount paid per ticket
        const revenueForType = ticketsForType.reduce((sum, t: any) => {
          const pricePaid = (t.payments?.amount && t.payments?.quantity) ? (t.payments.amount / t.payments.quantity) : 0;
          return sum + pricePaid;
        }, 0);
        totalRevenue += revenueForType;
        return {
          name: type.name,
          sold: soldForType,
          revenue: revenueForType
        };
      });

      // Handle RSVPs if it's a free event or has RSVPs
      const rsvpTickets = (tickets || []).filter((t: any) => t.ticket_type_id && t.ticket_type_id.startsWith('RSVP-'));
      if (rsvpTickets.length > 0) {
        const rsvpSold = rsvpTickets.length;
        typeStats.push({
          name: 'RSVP (Free)',
          sold: rsvpSold,
          revenue: 0
        });
      }

      doc.fillColor('#F27D26').fontSize(14).font('Helvetica-Bold').text('SUMMARY');
      doc.rect(50, doc.y, 495, 1).fill('#EEEEEE');
      doc.moveDown();
      
      const summaryTable = {
        headers: ['Metric', 'Value'],
        rows: [
          ['Total Tickets Sold', totalSold.toString()],
          ['Total Attendance (Scanned)', totalScanned.toString()],
          ['Total Unused Tickets', totalUnused.toString()],
          ['Total Revenue', `KES ${totalRevenue.toLocaleString()}`]
        ]
      };
      await doc.table(summaryTable, { width: 300 });
      doc.moveDown(2);

      // Breakdown by Ticket Type
      doc.fillColor('#F27D26').fontSize(14).font('Helvetica-Bold').text('BREAKDOWN BY TICKET TYPE');
      doc.rect(50, doc.y, 495, 1).fill('#EEEEEE');
      doc.moveDown();
      
      const typeTable = {
        headers: ['Ticket Type', 'Sold', 'Revenue'],
        rows: typeStats.map(s => [s.name, s.sold.toString(), `KES ${s.revenue.toLocaleString()}`])
      };
      await doc.table(typeTable);
      doc.moveDown(2);

      // Ticket Purchases
      doc.addPage();
      doc.fillColor('#F27D26').fontSize(14).font('Helvetica-Bold').text('TICKET PURCHASES');
      doc.rect(50, doc.y, 495, 1).fill('#EEEEEE');
      doc.moveDown();
      
      const purchaseTable = {
        headers: ['Ticket ID', 'Buyer Name', 'Type', 'Date'],
        rows: (tickets || []).map((t: any) => {
          const type = (ticketTypes || []).find(tt => tt.id === t.ticket_type_id);
          return [t.id, t.attendee_name, type?.name || 'Unknown', new Date(t.created_at).toLocaleDateString()];
        })
      };
      await doc.table(purchaseTable);
      doc.moveDown(2);

      // Attendance (Scans)
      doc.addPage();
      doc.fillColor('#F27D26').fontSize(14).font('Helvetica-Bold').text('ATTENDANCE (SCANS)');
      doc.rect(50, doc.y, 495, 1).fill('#EEEEEE');
      doc.moveDown();
      
      const attendanceTable = {
        headers: ['Ticket ID', 'Name', 'Type', 'Scan Time'],
        rows: filteredScanLogs.map((l: any) => {
          const type = (ticketTypes || []).find(tt => tt.id === l.tickets?.ticket_type_id);
          return [l.ticket_id, l.tickets?.attendee_name, type?.name || 'Unknown', new Date(l.scanned_at).toLocaleTimeString()];
        })
      };
      await doc.table(attendanceTable);

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export async function sendEventReportEmail(eventId: string, adminEmail: string) {
  if (!process.env.EMAIL_USER) {
    console.log('Email not configured, skipping report send.');
    return;
  }

  try {
    const { data: event } = await db.from('events').select('name').eq('id', eventId).single();
    if (!event) throw new Error('Event not found');
    const pdfBuffer = await generateEventReportPDF(eventId);

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: adminEmail,
      subject: `Event Report: ${event.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
          <h2 style="color: #F27D26;">Event Report: ${event.name}</h2>
          <p>Hello Admin,</p>
          <p>Please find the attached comprehensive report for the event <strong>${event.name}</strong>.</p>
          <p>The report includes details on ticket purchases, attendance, and revenue insights.</p>
          <p style="font-size: 12px; color: #666; margin-top: 30px;">
            PassCard KE Reporting System
          </p>
        </div>
      `,
      attachments: [
        {
          filename: `Report-${event.name.replace(/\s+/g, '_')}.pdf`,
          content: pdfBuffer,
        }
      ],
    };

    await transporter.sendMail(mailOptions);
    console.log(`Event report email sent to ${adminEmail}`);
  } catch (error) {
    console.error('Event Report Email Send Error:', error);
  }
}

export async function generateTicketPDF(ticket: any, event: any, ticketType: any): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 0 });
      const chunks: any[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Background Color
      doc.rect(0, 0, 595.28, 841.89).fill('#0A0A0A');

      // Header
      doc.fillColor('#FFFFFF').fontSize(32).font('Helvetica-Bold').text('PASSCARD KE', 50, 50);
      doc.fontSize(10).fillColor('#666666').text('OFFICIAL EVENT TICKET', 50, 90, { characterSpacing: 2 });

      // Ticket ID
      doc.fontSize(10).fillColor('#666666').text('TICKET ID', 400, 50, { align: 'right' });
      doc.fontSize(16).fillColor('#F27D26').font('Courier-Bold').text(ticket.id, 400, 65, { align: 'right' });

      // Event Banner
      try {
        const bannerUrl = convertGoogleDriveUrl(event.banner_url);
        const response = await axios.get(bannerUrl, { responseType: 'arraybuffer' });
        const bannerBuffer = Buffer.from(response.data, 'binary');
        doc.image(bannerBuffer, 50, 130, { width: 495, height: 250, cover: [495, 250] });
      } catch (e) {
        // Fallback if image fails
        doc.rect(50, 130, 495, 250).fill('#1A1A1A');
      }

      // Event Details
      doc.fillColor('#FFFFFF').fontSize(24).font('Helvetica-Bold').text(event.name, 50, 400, { width: 495, align: 'center' });
      
      doc.fontSize(14).fillColor('#F27D26').font('Helvetica-Bold').text(ticketType.name.toUpperCase(), 50, 435, { width: 495, align: 'center' });
      
      doc.fontSize(10).fillColor('#666666').font('Helvetica').text('DATE & TIME', 50, 470, { width: 240, align: 'center' });
      doc.fontSize(12).fillColor('#FFFFFF').font('Helvetica-Bold').text(`${new Date(event.date).toLocaleDateString()} at ${event.time}`, 50, 485, { width: 240, align: 'center' });

      doc.fontSize(10).fillColor('#666666').font('Helvetica').text('VENUE', 300, 470, { width: 240, align: 'center' });
      doc.fontSize(12).fillColor('#FFFFFF').font('Helvetica-Bold').text(event.venue, 300, 485, { width: 240, align: 'center' });

      doc.fontSize(10).fillColor('#666666').font('Helvetica').text('ATTENDEE', 50, 520, { width: 495, align: 'center' });
      doc.fontSize(14).fillColor('#FFFFFF').font('Helvetica-Bold').text(ticket.attendee_name, 50, 535, { width: 495, align: 'center' });
      doc.fontSize(10).fillColor('#666666').font('Helvetica').text(ticket.attendee_email, 50, 550, { width: 495, align: 'center' });

      // QR Code - Centered and Larger
      const qrCodeDataUrl = await QRCode.toDataURL(ticket.id, { 
        margin: 1, 
        width: 600, 
        color: { dark: '#000000', light: '#FFFFFF' },
        errorCorrectionLevel: 'H'
      });
      const qrBuffer = Buffer.from(qrCodeDataUrl.split('base64,')[1], 'base64');
      
      const qrSize = 260;
      const qrX = (595.28 - qrSize) / 2;
      const qrY = 570;

      doc.rect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20).fill('#FFFFFF');
      doc.image(qrBuffer, qrX, qrY, { width: qrSize });
      
      doc.fontSize(12).fillColor('#F27D26').font('Courier-Bold').text(ticket.id, 50, qrY + qrSize + 20, { width: 495, align: 'center' });
      doc.fontSize(10).fillColor('#666666').font('Helvetica').text('Scan at entrance', 50, qrY + qrSize + 40, { width: 495, align: 'center' });

      // Footer
      doc.fontSize(8).fillColor('#333333').text('This ticket is valid for one entry only. Powered by PassCard KE.', 50, 800, { width: 495, align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export async function sendInquiryEmail(inquiry: any) {
  if (!process.env.EMAIL_USER) {
    console.log('Email not configured, skipping inquiry send.');
    console.log('Inquiry:', inquiry);
    return;
  }

  const mailOptions = {
    from: process.env.EMAIL_FROM,
    to: process.env.EMAIL_USER,
    subject: `New Event Inquiry from ${inquiry.name}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 20px; border-radius: 10px;">
        <h2 style="color: #0A2A66;">New Event Inquiry</h2>
        <p><strong>Name:</strong> ${inquiry.name}</p>
        <p><strong>Email:</strong> ${inquiry.email}</p>
        <p><strong>Phone:</strong> ${inquiry.phone}</p>
        <p><strong>Event Details:</strong></p>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px;">
          ${inquiry.eventDetails}
        </div>
        <p style="font-size: 12px; color: #666; margin-top: 30px;">
          PassCard KE Inquiry System
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Inquiry email sent to ${process.env.EMAIL_USER}`);
  } catch (error) {
    console.error('Inquiry Email Send Error:', error);
  }
}

export async function sendTicketEmail(ticket: any, event: any, ticketType: any) {
  if (!process.env.EMAIL_USER) {
    console.log('Email not configured, skipping send.');
    console.log('Ticket ID:', ticket.id);
    return;
  }

  try {
    const qrCodeDataUrl = await QRCode.toDataURL(ticket.id);
    const pdfBuffer = await generateTicketPDF(ticket, event, ticketType);

    // Generate Calendar Event
    const eventDate = new Date(event.date);
    const [hours, minutes] = event.time.split(':').map(Number);
    const calendarEvent: any = {
      start: [eventDate.getFullYear(), eventDate.getMonth() + 1, eventDate.getDate(), hours, minutes],
      duration: { hours: 3 },
      title: event.name,
      description: `Ticket ID: ${ticket.id}\nType: ${ticketType.name}\n\n${event.description}`,
      location: event.venue,
      url: process.env.APP_URL,
      status: 'CONFIRMED',
      busyStatus: 'BUSY',
      organizer: { name: event.organizer, email: process.env.EMAIL_USER },
    };

    const { value: icsContent } = ics.createEvent(calendarEvent);

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: ticket.attendee_email,
      bcc: process.env.EMAIL_USER,
      subject: `Your Ticket for ${event.name}`,
      html: `
        <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 20px; overflow: hidden; background-color: #ffffff;">
          <div style="background-color: #0A0A0A; padding: 40px 20px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px; letter-spacing: -1px;">PASSCARD KE</h1>
            <p style="color: #666666; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; margin-top: 10px;">Official Event Ticket</p>
          </div>
          
          <div style="padding: 0;">
            <img src="${convertGoogleDriveUrl(event.banner_url)}" alt="${event.name}" style="width: 100%; display: block;" />
          </div>

          <div style="padding: 40px;">
            <p style="font-size: 16px; color: #333333; margin-bottom: 20px;">Hi <strong>${ticket.attendee_name}</strong>,</p>
            <p style="font-size: 16px; color: #666666; line-height: 1.6; margin-bottom: 30px;">
              Your ticket for <strong>${event.name}</strong> has been confirmed! We've attached a digital PDF copy of your ticket to this email.
            </p>

            <div style="background-color: #f8f8f8; border-radius: 15px; padding: 25px; margin-bottom: 30px; border: 1px solid #eeeeee;">
              <h3 style="margin-top: 0; font-size: 14px; text-transform: uppercase; color: #999999; letter-spacing: 1px; margin-bottom: 15px;">Event Details</h3>
              <div style="margin-bottom: 15px;">
                <p style="margin: 0; font-size: 12px; color: #999999;">VENUE</p>
                <p style="margin: 0; font-size: 16px; font-weight: bold; color: #333333;">${event.venue}</p>
              </div>
              <div style="margin-bottom: 15px;">
                <p style="margin: 0; font-size: 12px; color: #999999;">DATE & TIME</p>
                <p style="margin: 0; font-size: 16px; font-weight: bold; color: #333333;">${new Date(event.date).toLocaleDateString('en-KE', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} at ${event.time}</p>
              </div>
              <div>
                <p style="margin: 0; font-size: 12px; color: #999999;">TICKET TYPE</p>
                <p style="margin: 0; font-size: 16px; font-weight: bold; color: #F27D26;">${ticketType.name}</p>
              </div>
            </div>

            <div style="text-align: center; padding: 30px; border: 2px dashed #eeeeee; border-radius: 15px;">
              <p style="margin: 0 0 15px 0; font-size: 12px; color: #999999; text-transform: uppercase; letter-spacing: 1px;">Scan for Entry</p>
              <img src="cid:qrcode" alt="QR Code" style="width: 180px; border-radius: 10px;" />
              <p style="margin: 15px 0 0 0; font-family: monospace; font-size: 14px; color: #F27D26; font-weight: bold;">${ticket.id}</p>
            </div>

            <div style="margin-top: 40px; text-align: center;">
              <p style="font-size: 14px; color: #999999; margin-bottom: 20px;">Present this QR code at the entrance for scanning. Each ticket can only be used once.</p>
              <p style="font-size: 12px; color: #cccccc;">Need help? Reply to this email or contact support at ${process.env.EMAIL_USER}</p>
            </div>
          </div>

          <div style="background-color: #f8f8f8; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
            <p style="margin: 0; font-size: 11px; color: #999999; text-transform: uppercase; letter-spacing: 1px;">Powered by PassCard KE</p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: 'qrcode.png',
          content: qrCodeDataUrl.split('base64,')[1],
          encoding: 'base64',
          cid: 'qrcode',
        },
        {
          filename: `Ticket-${ticket.id}.pdf`,
          content: pdfBuffer,
        },
        {
          filename: 'event.ics',
          content: icsContent,
        }
      ],
    };

    await transporter.sendMail(mailOptions);
    
    // Update status in DB
    await db.from('tickets').update({ 
      email_status: 'SENT', 
      email_sent_at: new Date().toISOString() 
    }).eq('id', ticket.id);
    
    console.log(`Ticket email with PDF sent to ${ticket.attendee_email}`);
  } catch (error) {
    console.error('Email Send Error:', error);
    // Update status in DB
    await db.from('tickets').update({ email_status: 'FAILED' }).eq('id', ticket.id);
  }
}

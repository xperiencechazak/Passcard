import axios from 'axios';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import db from './db.ts';
import { sendTicketEmail } from './email.ts';

const CONSUMER_KEY = process.env.MPESA_CONSUMER_KEY;
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET;
const PASSKEY = process.env.MPESA_PASSKEY;
const SHORTCODE = process.env.MPESA_SHORTCODE;
const CALLBACK_URL = process.env.MPESA_CALLBACK_URL || `${process.env.APP_URL}/api/mpesa/callback`;

async function getAccessToken() {
  const auth = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  try {
    const response = await axios.get(
      'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
      {
        headers: { Authorization: `Basic ${auth}` },
      }
    );
    return response.data.access_token;
  } catch (error) {
    console.error('M-Pesa Token Error:', error);
    throw error;
  }
}

export async function initiateSTKPush(phone: string, amount: number, paymentId: string) {
  // Simulation mode if keys are missing
  if (!CONSUMER_KEY || !CONSUMER_SECRET || !SHORTCODE || !PASSKEY) {
    console.warn('M-Pesa keys missing, running in simulation mode');
    
    // Simulate STK Push response
    const CheckoutRequestID = 'ws_CO_' + uuidv4().substring(0, 10);
    await db.from('payments').update({ 
      checkout_request_id: CheckoutRequestID, 
      merchant_request_id: 'SIM-' + uuidv4().substring(0, 8) 
    }).eq('id', paymentId);

    // Simulate callback after 8 seconds
    setTimeout(async () => {
      const { data: payment } = await db.from('payments').select('*').eq('id', paymentId).single();
      if (payment && payment.status === 'PENDING') {
        await db.from('payments').update({ status: 'COMPLETED' }).eq('id', paymentId);
        
        // Generate Ticket
        const ticketId = 'TKT-' + uuidv4().substring(0, 8).toUpperCase();
        await db.from('tickets').insert({
          id: ticketId,
          payment_id: paymentId,
          event_id: payment.event_id,
          ticket_type_id: payment.ticket_type_id,
          attendee_name: payment.attendee_name,
          attendee_email: payment.attendee_email
        });

        // Update sold count using RPC
        await db.rpc('increment_sold_count', { tt_id: payment.ticket_type_id });
        
        // Send Email
        const { data: event } = await db.from('events').select('*').eq('id', payment.event_id).single();
        const { data: ticketType } = await db.from('ticket_types').select('*').eq('id', payment.ticket_type_id).single();
        const { data: ticket } = await db.from('tickets').select('*').eq('id', ticketId).single();
        
        if (ticket && event && ticketType) {
          sendTicketEmail(ticket, event, ticketType).catch(console.error);
        }
        
        console.log('Simulated M-Pesa payment completed for:', paymentId);
      }
    }, 8000);

    return { 
      ResponseCode: "0", 
      ResponseDescription: "Success. Request accepted for processing", 
      CustomerMessage: "Success. Request accepted for processing",
      CheckoutRequestID
    };
  }

  const accessToken = await getAccessToken();
  const timestamp = format(new Date(), 'yyyyMMddHHmmss');
  const password = Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');

  // Format phone to 254...
  let formattedPhone = phone.replace('+', '');
  if (formattedPhone.startsWith('0')) {
    formattedPhone = '254' + formattedPhone.substring(1);
  } else if (formattedPhone.startsWith('7') || formattedPhone.startsWith('1')) {
    formattedPhone = '254' + formattedPhone;
  }

  try {
    const response = await axios.post(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        BusinessShortCode: SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: amount,
        PartyA: formattedPhone,
        PartyB: SHORTCODE,
        PhoneNumber: formattedPhone,
        CallBackURL: CALLBACK_URL,
        AccountReference: 'PassCard KE',
        TransactionDesc: 'Ticket Purchase',
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    // Update payment with request IDs
    await db.from('payments').update({
      checkout_request_id: response.data.CheckoutRequestID,
      merchant_request_id: response.data.MerchantRequestID
    }).eq('id', paymentId);

    return response.data;
  } catch (error: any) {
    console.error('STK Push Error:', error.response?.data || error.message);
    throw error;
  }
}

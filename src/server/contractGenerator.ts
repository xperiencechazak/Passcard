import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit-table';
import db from './db.ts';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_PORT === '465',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function generateContractPDF(contract: any): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      const chunks: any[] = [];
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Header
      doc.fillColor('#0A2A66').fontSize(24).font('Helvetica-Bold').text('SERVICE AGREEMENT', { align: 'center' });
      doc.moveDown();
      doc.fillColor('#333333').fontSize(12).font('Helvetica').text(`Contract ID: ${contract.id}`, { align: 'right' });
      doc.text(`Date: ${new Date().toLocaleDateString()}`, { align: 'right' });
      doc.moveDown(2);

      // Parties
      doc.fillColor('#F27D26').fontSize(14).font('Helvetica-Bold').text('1. THE PARTIES');
      doc.moveDown(0.5);
      doc.fillColor('#333333').fontSize(11).font('Helvetica');
      doc.text('This Agreement is made between:');
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').text('PassCard KE (The Provider)');
      doc.font('Helvetica').text('Email: ' + (process.env.EMAIL_USER || 'support@passcard.co.ke'));
      doc.moveDown(0.5);
      doc.text('AND');
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').text(`${contract.organizer_name} (The Organizer)`);
      if (contract.company_name) doc.text(`Company: ${contract.company_name}`);
      doc.text(`Email: ${contract.organizer_email}`);
      doc.moveDown(2);

      // Services
      doc.fillColor('#F27D26').fontSize(14).font('Helvetica-Bold').text('2. SERVICES');
      doc.moveDown(0.5);
      doc.fillColor('#333333').fontSize(11).font('Helvetica');
      doc.text('PassCard KE shall provide online ticketing services for the Organizer\'s events, including but not limited to:');
      doc.list([
        'Online ticket sales and payment processing',
        'Digital ticket generation and delivery via email',
        'Real-time sales reporting and attendee management',
        'Entry verification via QR code scanning'
      ]);
      doc.moveDown(2);

      // Pricing
      doc.fillColor('#F27D26').fontSize(14).font('Helvetica-Bold').text('3. PRICING & COMMISSIONS');
      doc.moveDown(0.5);
      doc.fillColor('#333333').fontSize(11).font('Helvetica');
      doc.text('The Organizer agrees to the following commission structure:');
      doc.moveDown(0.5);
      doc.font('Helvetica-Bold').text(contract.pricing_details || '6% per ticket + KES 30 service fee');
      doc.font('Helvetica').text('Service fees are typically passed to the customer unless otherwise agreed.');
      doc.moveDown(2);

      // Payouts
      doc.fillColor('#F27D26').fontSize(14).font('Helvetica-Bold').text('4. PAYOUT TERMS');
      doc.moveDown(0.5);
      doc.fillColor('#333333').fontSize(11).font('Helvetica');
      doc.text(`Funds collected will be remitted to the Organizer within ${contract.payout_period || '3 business days'} after the successful completion of the event, or as per the agreed schedule.`);
      doc.moveDown(2);

      // Signatures
      doc.fillColor('#F27D26').fontSize(14).font('Helvetica-Bold').text('5. ACCEPTANCE');
      doc.moveDown(0.5);
      doc.fillColor('#333333').fontSize(11).font('Helvetica');
      doc.text('By signing this document or accepting it electronically, both parties agree to the terms and conditions set forth above.');
      doc.moveDown(3);

      const startY = doc.y;
      doc.text('__________________________', 50, startY);
      doc.text('For PassCard KE', 50, startY + 15);
      
      doc.text('__________________________', 350, startY);
      doc.text(`For ${contract.organizer_name}`, 350, startY + 15);

      if (contract.status === 'SIGNED') {
        doc.fillColor('green').fontSize(12).font('Helvetica-Bold').text('ELECTRONICALLY SIGNED', 350, startY - 20);
        doc.fontSize(8).font('Helvetica').text(`Date: ${new Date(contract.signed_at).toLocaleString()}`, 350, startY - 8);
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export async function sendContractEmail(contractId: string) {
  try {
    const { data: contract, error: contractError } = await db
      .from('contracts')
      .select('*, organizers(name, email, company_name)')
      .eq('id', contractId)
      .single();

    if (contractError || !contract) throw new Error('Contract not found');

    const processedContract = {
      ...contract,
      organizer_name: contract.organizers?.name,
      organizer_email: contract.organizers?.email,
      company_name: contract.organizers?.company_name
    };

    const pdfBuffer = await generateContractPDF(processedContract);

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: processedContract.organizer_email,
      bcc: process.env.EMAIL_USER,
      subject: `Service Agreement - PassCard KE & ${processedContract.organizer_name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; border: 1px solid #eee; padding: 30px; border-radius: 15px;">
          <h2 style="color: #0A2A66;">Service Agreement</h2>
          <p>Hi <strong>${processedContract.organizer_name}</strong>,</p>
          <p>Please find attached the service agreement for our ticketing partnership with PassCard KE.</p>
          <div style="background: #f9f9f9; padding: 20px; border-radius: 10px; margin: 20px 0;">
            <p style="margin: 5px 0;"><strong>Contract ID:</strong> ${processedContract.id}</p>
            <p style="margin: 5px 0;"><strong>Effective Date:</strong> ${processedContract.effective_date}</p>
            <p style="margin: 5px 0;"><strong>Pricing:</strong> ${processedContract.pricing_details}</p>
          </div>
          <p>Please review the attached PDF document. If you have any questions, feel free to reply to this email.</p>
          <p style="margin-top: 30px;">Best regards,<br>The PassCard KE Team</p>
        </div>
      `,
      attachments: [
        {
          filename: `Agreement_${processedContract.organizer_name.replace(/\s+/g, '_')}.pdf`,
          content: pdfBuffer,
        }
      ],
    };

    await transporter.sendMail(mailOptions);
    
    // Update sent_at in DB
    await db.from('contracts').update({ sent_at: new Date().toISOString() }).eq('id', contractId);
    
    console.log(`Contract email sent to ${processedContract.organizer_email}`);
  } catch (error) {
    console.error('Contract Email Send Error:', error);
    throw error;
  }
}

import React from 'react';
import { motion } from 'motion/react';
import { FileText, CheckCircle, AlertCircle, HelpCircle, ShieldAlert } from 'lucide-react';

const TermsConditionsPage: React.FC = () => {
  const lastUpdated = "March 26, 2026";

  return (
    <div className="min-h-screen bg-background pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Terms & Conditions</h1>
          <p className="text-white/60">Last updated: {lastUpdated}</p>
        </motion.div>

        <div className="space-y-12 text-white/80 leading-relaxed">
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <FileText size={20} />
              </div>
              <h2 className="text-2xl font-bold text-white">Agreement to Terms</h2>
            </div>
            <p>
              By accessing or using PassCard KE, you agree to be bound by these Terms and Conditions. If you disagree with any part of the terms, then you may not access the service. These terms apply to all visitors, users, and others who access or use the service.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <CheckCircle size={20} />
              </div>
              <h2 className="text-2xl font-bold text-white">Ticket Purchases & Payments</h2>
            </div>
            <p className="mb-4">When you purchase a ticket through our platform:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>All sales are final. Refunds are only issued if the event is cancelled or significantly rescheduled.</li>
              <li>Payments are processed securely via M-Pesa. You must ensure you have sufficient funds and follow the STK push instructions.</li>
              <li>Tickets are delivered electronically to the email address provided during checkout.</li>
              <li>You are responsible for providing correct contact information.</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <AlertCircle size={20} />
              </div>
              <h2 className="text-2xl font-bold text-white">Event Entry & Conduct</h2>
            </div>
            <p className="mb-4">By purchasing a ticket, you agree to the following:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>A valid ticket (digital or printed) must be presented for entry.</li>
              <li>The event organizer reserves the right to refuse entry or remove any person for misconduct.</li>
              <li>PassCard KE is a ticketing platform and is not responsible for the actual conduct or management of the events.</li>
              <li>Attendees must comply with all venue rules and local laws.</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <ShieldAlert size={20} />
              </div>
              <h2 className="text-2xl font-bold text-white">Limitation of Liability</h2>
            </div>
            <p>
              PassCard KE shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the service.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <HelpCircle size={20} />
              </div>
              <h2 className="text-2xl font-bold text-white">Changes to Terms</h2>
            </div>
            <p>
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
          </section>

          <section className="bg-white/5 p-8 rounded-[32px] border border-white/10">
            <h2 className="text-2xl font-bold text-white mb-4">Contact Information</h2>
            <p className="mb-4">
              For any questions regarding these Terms and Conditions, please contact us at:
            </p>
            <div className="text-accent font-bold">
              Email: inspiresolutions254@gmail.com
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsConditionsPage;

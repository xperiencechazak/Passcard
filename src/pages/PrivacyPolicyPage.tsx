import React from 'react';
import { motion } from 'motion/react';
import { Shield, Lock, Eye, FileText, UserCheck, Mail } from 'lucide-react';

const PrivacyPolicyPage: React.FC = () => {
  const lastUpdated = "March 26, 2026";

  return (
    <div className="min-h-screen bg-background pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Privacy Policy</h1>
          <p className="text-white/60">Last updated: {lastUpdated}</p>
        </motion.div>

        <div className="space-y-12 text-white/80 leading-relaxed">
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <Shield size={20} />
              </div>
              <h2 className="text-2xl font-bold text-white">Introduction</h2>
            </div>
            <p>
              At PassCard KE, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our ticketing services. Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the site.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <Eye size={20} />
              </div>
              <h2 className="text-2xl font-bold text-white">Data Collection Practices</h2>
            </div>
            <p className="mb-4">We collect information that you provide directly to us when you purchase tickets, create an account, or contact us. This may include:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Personal Identification: Name, email address, and phone number.</li>
              <li>Ticket Information: Event details, ticket types, and purchase history.</li>
              <li>Payment Information: Transaction details (processed securely via M-Pesa). We do not store your full payment credentials.</li>
              <li>Communication Data: Records of your correspondence with us.</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <FileText size={20} />
              </div>
              <h2 className="text-2xl font-bold text-white">How We Use Your Data</h2>
            </div>
            <p className="mb-4">We use the information we collect for various purposes, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Processing and delivering your event tickets.</li>
              <li>Communicating with you about your purchases and event updates.</li>
              <li>Providing customer support and responding to inquiries.</li>
              <li>Analyzing usage patterns to improve our website and services.</li>
              <li>Preventing fraudulent transactions and ensuring platform security.</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <Lock size={20} />
              </div>
              <h2 className="text-2xl font-bold text-white">Data Protection & Security</h2>
            </div>
            <p>
              We implement a variety of security measures to maintain the safety of your personal information. Your data is stored on secure servers, and sensitive information (like payment tokens) is encrypted. However, please remember that no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <UserCheck size={20} />
              </div>
              <h2 className="text-2xl font-bold text-white">Third-Party Services</h2>
            </div>
            <p className="mb-4">We may share your information with third-party service providers that perform services for us or on our behalf, such as:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Payment Processors: Safaricom M-Pesa for secure transaction handling.</li>
              <li>Email Services: For sending ticket confirmations and notifications.</li>
              <li>Analytics Providers: To help us understand how users interact with our platform.</li>
            </ul>
          </section>

          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <Shield size={20} />
              </div>
              <h2 className="text-2xl font-bold text-white">User Rights</h2>
            </div>
            <p className="mb-4">You have certain rights regarding your personal data:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access: You can request a copy of the personal data we hold about you.</li>
              <li>Correction: You can request that we update or correct inaccurate information.</li>
              <li>Deletion: You can request that we delete your personal data, subject to legal requirements.</li>
            </ul>
          </section>

          <section className="bg-white/5 p-8 rounded-[32px] border border-white/10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
                <Mail size={20} />
              </div>
              <h2 className="text-2xl font-bold text-white">Contact Us</h2>
            </div>
            <p className="mb-4">
              If you have any questions or concerns about this Privacy Policy or our data practices, please contact us at:
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

export default PrivacyPolicyPage;

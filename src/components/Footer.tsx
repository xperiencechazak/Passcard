import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="bg-primary text-white py-12 mt-20">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        <div>
          <div className="flex items-center mb-6 text-white">
            <div className="h-10 flex items-center justify-center transition-all">
              <img src="/images/passcardlogo.png" alt="Logo" className="h-8 w-auto object-contain" />
            </div>
          </div>
          <p className="text-white/60">
            Access the Xtraordinary. The ultimate ticketing platform for seamless event experiences.
          </p>
        </div>
        <div>
          <h4 className="text-lg font-bold mb-6 text-white">Quick Links</h4>
          <ul className="space-y-3 text-white/60">
            <li><Link to="/" className="hover:text-secondary transition-colors">Home</Link></li>
            <li><a href="/#events" className="hover:text-secondary transition-colors">Events</a></li>
            <li><Link to="/host" className="hover:text-secondary transition-colors">Host Your Event</Link></li>
            <li><Link to="/privacy" className="hover:text-secondary transition-colors">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-secondary transition-colors">Terms & Conditions</Link></li>
            <li><Link to="/admin" className="hover:text-secondary transition-colors">Login</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-lg font-bold mb-6 text-white">Contact Us</h4>
          <p className="text-white/60">Nairobi, Kenya</p>
          <p className="text-white/60">
            <a href="mailto:inspiresolutions254@gmail.com" className="hover:text-accent transition-colors">inspiresolutions254@gmail.com</a>
          </p>
          <p className="text-white/60">
            <a href="tel:0791624455" className="hover:text-accent transition-colors">0791624455</a>
          </p>
        </div>
      </div>
      <div className="border-t border-white/10 mt-12 pt-8 text-center text-white/40 text-sm">
        &copy; {new Date().getFullYear()} PassCard KE. All rights reserved.
      </div>
    </div>
  </footer>
);

export default Footer;

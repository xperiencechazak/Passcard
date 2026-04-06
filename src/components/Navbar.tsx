import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LayoutDashboard } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (path.startsWith('/#') || path === '/') {
      if (location.pathname === '/') {
        e.preventDefault();
        const targetId = path.startsWith('/#') ? path.substring(2) : 'top';
        const element = targetId === 'top' ? document.body : document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
        setIsOpen(false);
      }
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Events', path: '/#events' },
    { name: 'Host Your Event', path: '/host' },
    { name: 'Privacy Policy', path: '/privacy' },
    { name: 'Terms & Conditions', path: '/terms' },
    { name: 'Login', path: '/admin', icon: <LayoutDashboard size={18} /> },
  ];

  return (
    <nav id="top" className="bg-primary/80 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <Link to="/" onClick={(e) => handleNavClick(e, '/')} className="flex items-center group">
            <div className="h-12 flex items-center justify-center transition-all">
              <img 
                src="/images/passcardlogo.png" 
                alt="PassCard KE" 
                className="h-full w-auto object-contain" 
                onLoad={(e) => {
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'none';
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                  if (fallback) fallback.style.display = 'flex';
                }}
              />
              <div className="flex items-center space-x-3">
                <img src="/images/passcardlogo.png" alt="Logo" className="h-8 w-auto object-contain" />
              </div>
            </div>
          </Link>
          
          <div className="hidden md:flex items-center space-x-10">
            {navLinks.map((link) => (
              <Link 
                key={link.name}
                to={link.path} 
                onClick={(e) => handleNavClick(e, link.path)}
                className="text-white/60 hover:text-secondary font-bold text-sm uppercase tracking-widest transition-all flex items-center space-x-2"
              >
                {link.icon}
                <span>{link.name}</span>
              </Link>
            ))}
          </div>

          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="md:hidden touch-target p-3 bg-white/5 rounded-xl text-white/70 border border-white/10 transition-all hover:bg-white/10"
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-surface border-t border-white/10 px-6 py-8 space-y-2 shadow-2xl overflow-y-auto max-h-[calc(100vh-80px)]"
          >
            {navLinks.map((link) => (
              <Link 
                key={link.name}
                to={link.path} 
                onClick={(e) => {
                  handleNavClick(e, link.path);
                  setIsOpen(false);
                }}
                className="flex items-center space-x-4 text-white/70 hover:text-secondary font-bold text-lg uppercase tracking-widest transition-all py-4 px-2 rounded-lg hover:bg-white/5"
              >
                <div className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-lg overflow-hidden p-2">
                  {link.icon || <img src="/images/passcardlogo.png" alt="Logo" className="w-full h-full object-contain" />}
                </div>
                <span>{link.name}</span>
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;

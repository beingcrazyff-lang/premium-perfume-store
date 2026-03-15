import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  const [settings, setSettings] = useState<Record<string, string>>({
    facebook_link: 'https://facebook.com/yourpage',
    instagram_link: 'https://instagram.com/yourprofile',
    contact_address: 'Mirpur, Dhaka 1216, Bangladesh',
    contact_phone: '+880 1913745672',
    contact_email: 'auraperfumes@gmail.com'
  });

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch(`/api/settings?t=${Date.now()}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        if (res.ok) {
          const data = await res.json();
          setSettings(prev => ({ ...prev, ...data }));
        }
      } catch (error) {
        console.error('Failed to fetch footer settings:', error);
      }
    };
    fetchSettings();
  }, []);

  return (
    <footer className="bg-charcoal-950 border-t border-white/5 pt-16 pb-8 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gold-500 rounded-full flex items-center justify-center">
                <span className="text-charcoal-950 font-serif font-bold text-xl">A</span>
              </div>
              <span className="font-serif text-xl font-semibold tracking-tight text-white">Aura Perfumes</span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              Discover the essence of luxury. We craft signature fragrances that leave a lasting impression, blending rare ingredients with masterful artistry.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <a 
                href={settings.instagram_link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-gold-500 hover:text-charcoal-950 transition-all"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a 
                href={settings.facebook_link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-gold-500 hover:text-charcoal-950 transition-all"
              >
                <Facebook className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-medium mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li><Link to="/" className="text-gray-400 hover:text-gold-400 text-sm transition-colors">Shop Collection</Link></li>
              <li><Link to="/about" className="text-gray-400 hover:text-gold-400 text-sm transition-colors">About Us</Link></li>
              <li><Link to="/about" className="text-gray-400 hover:text-gold-400 text-sm transition-colors">Our Story</Link></li>
              <li><Link to="/faq" className="text-gray-400 hover:text-gold-400 text-sm transition-colors">Journal</Link></li>
            </ul>
          </div>

          {/* Customer Care */}
          <div>
            <h3 className="text-white font-medium mb-4">Customer Care</h3>
            <ul className="space-y-3">
              <li><Link to="/shipping" className="text-gray-400 hover:text-gold-400 text-sm transition-colors">Shipping & Delivery</Link></li>
              <li><Link to="/returns" className="text-gray-400 hover:text-gold-400 text-sm transition-colors">Returns & Exchanges</Link></li>
              <li><Link to="/faq" className="text-gray-400 hover:text-gold-400 text-sm transition-colors">FAQ</Link></li>
              <li><Link to="/shipping" className="text-gray-400 hover:text-gold-400 text-sm transition-colors">Track Order</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-medium mb-4">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm text-gray-400">
                <MapPin className="w-5 h-5 text-gold-400 shrink-0" />
                <span>{settings.contact_address}</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <Phone className="w-5 h-5 text-gold-400 shrink-0" />
                <span>{settings.contact_phone}</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <Mail className="w-5 h-5 text-gold-400 shrink-0" />
                <span>{settings.contact_email}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} Aura Perfumes. All rights reserved.
          </p>
          <div className="flex gap-4 text-sm text-gray-500">
            <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

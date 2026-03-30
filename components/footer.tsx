'use client'

import Link from 'next/link'
import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin } from 'lucide-react'

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-secondary border-t border-border animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Branding */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold">R</span>
              </div>
              <span className="font-bold text-lg text-foreground">RTAS</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Streamline your research supervision process from allocation to approval
            </p>
          </div>

          {/* Quick Links */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-foreground">Quick Links</h3>
            <Link href="/" className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm">About</Link>
            <Link href="/" className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm">Contact</Link>
            <Link href="/" className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm">Privacy Policy</Link>
            <Link href="/" className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm">Terms of Service</Link>
          </div>

          {/* Support */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-foreground">Support</h3>
            <Link href="/" className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm">Help Center</Link>
            <Link href="/" className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm">Documentation</Link>
            <Link href="/" className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm">FAQ</Link>
            <Link href="/" className="text-muted-foreground hover:text-primary transition-colors duration-200 text-sm">Contact Support</Link>
          </div>

          {/* Contact Info */}
          <div className="flex flex-col gap-3">
            <h3 className="font-semibold text-foreground">Contact</h3>
            <a href="mailto:info@rtas.com" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors duration-200 text-sm">
              <Mail size={16} />
              <span>info@rtas.com</span>
            </a>
            <a href="tel:+1234567890" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors duration-200 text-sm">
              <Phone size={16} />
              <span>+1 (234) 567-890</span>
            </a>
            <div className="flex items-start gap-2 text-muted-foreground text-sm">
              <MapPin size={16} className="mt-0.5" />
              <span>University Campus, Education Building</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border my-8" />

        {/* Bottom Section */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground text-sm text-center md:text-left">
            © {currentYear} RTAS. All rights reserved.
          </p>
          
          {/* Social Icons */}
          <div className="flex items-center gap-4">
            <a 
              href="#" 
              className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-80 transition-all duration-200"
            >
              <Facebook size={16} />
            </a>
            <a 
              href="#" 
              className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-80 transition-all duration-200"
            >
              <Twitter size={16} />
            </a>
            <a 
              href="#" 
              className="w-8 h-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center hover:opacity-80 transition-all duration-200"
            >
              <Linkedin size={16} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

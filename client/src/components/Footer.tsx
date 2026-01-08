import { Link } from "wouter";
import { Mail, Phone, MapPin, DollarSign, Heart, CreditCard } from "lucide-react";
import { SiFacebook, SiInstagram, SiX, SiWhatsapp } from "react-icons/si";

const quickLinks = [
  { href: "/shop", label: "Shop All" },
  { href: "/categories", label: "Categories" },
  { href: "/about", label: "About Us" },
  { href: "/contact", label: "Contact" },
];

const categories = [
  { href: "/categories", label: "All" },
  { href: "/shop?category=rings", label: "Rings" },
  { href: "/shop?category=necklaces", label: "Necklaces" },
  { href: "/shop?category=earrings", label: "Earrings" },
  { href: "/shop?category=bracelets", label: "Bracelets" },
  { href: "/shop?category=watches", label: "Watches" },
];

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 md:px-6 py-12 md:py-16">
        {/* Desktop Layout: Brand & Social (Left), Quick Links (Middle), Categories (Right) */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-12 mb-12">
          {/* Left: Brand & Social */}
          <div className="space-y-6">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-amber-500 transition-all duration-300">
                <img 
                  src="/logo.png" 
                  alt="Jewel Haven Logo" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23FBBF24'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' font-size='24' fill='white'%3EJH%3C/text%3E%3C/svg%3E";
                  }}
                />
                <div className="absolute inset-0 border-2 border-transparent group-hover:border-amber-400/50 rounded-full transition-all duration-300" />
              </div>
              <h3 className="font-serif text-2xl font-bold text-primary group-hover:text-amber-500 transition-colors duration-300">
                JEWEL HAVEN
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Discover exquisite jewelry pieces crafted with love and precision. 
              From timeless classics to contemporary designs, find your perfect accessory.
            </p>
            <div className="flex items-center gap-3 pt-2">
              {[
                { 
                  href: "https://facebook.com/giftedtechnexus", 
                  icon: SiFacebook, 
                  label: "Facebook",
                  color: "text-blue-600 hover:text-amber-500 hover:bg-amber-50"
                },
                { 
                  href: "https://instagram.com/@giftedtechnexus", 
                  icon: SiInstagram, 
                  label: "Instagram",
                  color: "text-pink-600 hover:text-amber-500 hover:bg-amber-50"
                },
                { 
                  href: "https://twitter.com/GiftedMauriceKe", 
                  icon: SiX, 
                  label: "Twitter",
                  color: "text-gray-900 hover:text-amber-500 hover:bg-amber-50"
                },
                { 
                  href: "https://wa.me/message/OCSOK3IUFPWWA1", 
                  icon: SiWhatsapp, 
                  label: "WhatsApp",
                  color: "text-green-600 hover:text-amber-500 hover:bg-amber-50"
                },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-3 rounded-full bg-muted transition-all duration-300 hover:scale-110 hover:shadow-lg ${social.color}`}
                  data-testid={`link-${social.label.toLowerCase()}`}
                  aria-label={social.label}
                >
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Middle: Quick Links */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 text-lg">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-amber-500 transition-colors duration-300 flex items-center group"
                    data-testid={`link-footer-${link.label.toLowerCase().replace(/\s/g, '-')}`}
                  >
                    <span className="inline-block w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-1 group-hover:translate-x-0">
                      <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="4" />
                      </svg>
                    </span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Right: Categories */}
          <div>
            <h4 className="font-semibold text-foreground mb-4 text-lg">Categories</h4>
            <ul className="space-y-3">
              {categories.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-amber-500 transition-colors duration-300 flex items-center group"
                    data-testid={`link-footer-${link.label.toLowerCase()}`}
                  >
                    <span className="inline-block w-3 h-3 mr-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform -translate-x-1 group-hover:translate-x-0">
                      <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="4" />
                      </svg>
                    </span>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Mobile Layout: Quick Links and Categories on same line */}
        <div className="lg:hidden mb-10">
          {/* Section Title for Mobile */}
          <div className="mb-6">
            <Link href="/" className="inline-flex items-center gap-3 group mb-4">
              <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-amber-500 transition-all duration-300">
                <img 
                  src="/logo.png" 
                  alt="Jewel Haven Logo" 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => {
                    e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='50' r='45' fill='%23FBBF24'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' font-size='24' fill='white'%3EJH%3C/text%3E%3C/svg%3E";
                  }}
                />
              </div>
              <h3 className="font-serif text-xl font-bold text-primary group-hover:text-amber-500 transition-colors duration-300">
                JEWEL HAVEN
              </h3>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">
              Discover exquisite jewelry pieces crafted with love and precision.
            </p>
            <div className="flex items-center gap-3 pt-2 mb-6">
              {[
                { 
                  href: "https://facebook.com/giftedtechnexus", 
                  icon: SiFacebook, 
                  label: "Facebook",
                  color: "text-blue-600 hover:text-amber-500 hover:bg-amber-50"
                },
                { 
                  href: "https://instagram.com/@giftedtechnexus", 
                  icon: SiInstagram, 
                  label: "Instagram",
                  color: "text-pink-600 hover:text-amber-500 hover:bg-amber-50"
                },
                { 
                  href: "https://twitter.com/GiftedMauriceKe", 
                  icon: SiX, 
                  label: "Twitter",
                  color: "text-gray-900 hover:text-amber-500 hover:bg-amber-50"
                },
                { 
                  href: "https://wa.me/message/OCSOK3IUFPWWA1", 
                  icon: SiWhatsapp, 
                  label: "WhatsApp",
                  color: "text-green-600 hover:text-amber-500 hover:bg-amber-50"
                },
              ].map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2.5 rounded-full bg-muted transition-all duration-300 hover:scale-110 hover:shadow-lg ${social.color}`}
                  data-testid={`link-${social.label.toLowerCase()}`}
                  aria-label={social.label}
                >
                  <social.icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links and Categories side by side on mobile */}
          <div className="grid grid-cols-2 gap-6">
            {/* Quick Links - Left */}
            <div>
              <h4 className="font-semibold text-foreground mb-3 text-base">Quick Links</h4>
              <ul className="space-y-2">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-amber-500 transition-colors duration-300"
                      data-testid={`link-footer-mobile-${link.label.toLowerCase().replace(/\s/g, '-')}`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Categories - Right */}
            <div>
              <h4 className="font-semibold text-foreground mb-3 text-base">Categories</h4>
              <ul className="space-y-2">
                {categories.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-amber-500 transition-colors duration-300"
                      data-testid={`link-footer-mobile-${link.label.toLowerCase()}`}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Contact & Payment Section */}
        <div className="border-t pt-8 mt-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h4 className="font-semibold text-foreground mb-4 text-lg">Contact Us</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 group">
                  <div className="p-1.5 rounded-full bg-primary/10 group-hover:bg-amber-500/20 transition-colors duration-300">
                    <MapPin className="h-4 w-4 text-primary group-hover:text-amber-500 transition-colors duration-300 flex-shrink-0" />
                  </div>
                  <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                    Rupas Mall, Eldoret, Kenya
                  </span>
                </li>
                <li className="flex items-center gap-3 group">
                  <div className="p-1.5 rounded-full bg-primary/10 group-hover:bg-amber-500/20 transition-colors duration-300">
                    <Phone className="h-4 w-4 text-primary group-hover:text-amber-500 transition-colors duration-300 flex-shrink-0" />
                  </div>
                  <a
                    href="tel:+254799916673"
                    className="text-sm text-muted-foreground hover:text-amber-500 transition-colors duration-300"
                    data-testid="link-phone"
                  >
                    +254 799 916 673
                  </a>
                </li>
                <li className="flex items-center gap-3 group">
                  <div className="p-1.5 rounded-full bg-primary/10 group-hover:bg-amber-500/20 transition-colors duration-300">
                    <Mail className="h-4 w-4 text-primary group-hover:text-amber-500 transition-colors duration-300 flex-shrink-0" />
                  </div>
                  <a
                    href="mailto:jewell@giftedtech.co.ke"
                    className="text-sm text-muted-foreground hover:text-amber-500 transition-colors duration-300"
                    data-testid="link-email"
                  >
                    jewell@giftedtech.co.ke
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h5 className="text-lg font-semibold text-foreground mb-4">
                We Accept
              </h5>
              <div className="flex items-center gap-3 flex-wrap">
                <div className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-full flex items-center gap-2 group hover:bg-green-700 transition-colors duration-300">
                  <img 
                    src="/mpesa.webp" 
                    alt="M-PESA" 
                    className="h-6 w-6 object-contain"
                    onError={(e) => {
                      e.currentTarget.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' rx='20' fill='%2300B300'/%3E%3Ctext x='50' y='60' text-anchor='middle' font-size='30' fill='white' font-weight='bold'%3EMP%3C/text%3E%3C/svg%3E";
                    }}
                  />
                  <span>M-PESA</span>
                </div>
                <div className="px-4 py-2 bg-muted text-muted-foreground text-sm font-medium rounded-full flex items-center gap-2 group hover:bg-amber-500 hover:text-white transition-colors duration-300">
                  <DollarSign className="h-4 w-4" />
                  <span>Cash on Delivery</span>
                </div>
                <div className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-full flex items-center gap-2 group hover:bg-blue-700 transition-colors duration-300">
                  <CreditCard className="h-5 w-5" />
                  <span>Credit/Debit Cards</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t mt-10 pt-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-muted-foreground text-center sm:text-left">
              <p>
                &copy; 2025-{currentYear} JEWEL HAVEN. All rights reserved.
                <span className="ml-2">
                  Crafted by{" "}
                  <a
                    href="https://me.giftedtech.co.ke"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium bg-gradient-to-r from-amber-500 to-yellow-500 bg-clip-text text-transparent hover:from-amber-600 hover:to-yellow-600 transition-all duration-300 inline-flex items-center group"
                  >
                    <span className="relative inline-flex items-center">
                      <Heart className="w-4 h-4 ml-1 mr-1 fill-current text-amber-500 animate-pulse" />
                      <span className="text-amber-600">Gifted Tech</span>
                      <svg 
                        className="w-4 h-4 ml-1 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-x-1" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </span>
                  </a>
                </span>
              </p>
            </div>
            <div className="flex items-center gap-6">
              <Link
                href="/privacy"
                className="text-xs text-muted-foreground hover:text-amber-500 transition-colors duration-300"
                data-testid="link-footer-privacy-policy"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
                className="text-xs text-muted-foreground hover:text-amber-500 transition-colors duration-300"
                data-testid="link-footer-terms-conditions"
              >
                Terms & Conditions
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
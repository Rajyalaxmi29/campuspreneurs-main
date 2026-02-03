import { Link } from "react-router-dom";
import { Mail, MapPin } from "lucide-react";

const quickLinks = [
  { name: "Problem Statements", path: "/problems" },
  { name: "Event Structure", path: "/event-structure" },
  { name: "Resources", path: "/resources" },
  { name: "Registration", path: "/registration" },
  { name: "Contact", path: "/contact" },
];

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
          {/* Logo & Description */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <span className="text-secondary-foreground font-poppins font-bold text-lg">C</span>
              </div>
              <span className="font-poppins font-semibold text-xl">Campuspreneurs</span>
            </div>
            <p className="text-primary-foreground/80 text-sm leading-relaxed">
              Turning campus challenges into countable change through innovation and entrepreneurship.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-poppins font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-primary-foreground/80 hover:text-secondary transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-poppins font-semibold text-lg mb-4">Contact Us</h4>
            <div className="space-y-3">
              <a
                href="mailto:hello.geenovate@gcet.edu.in"
                className="flex items-center gap-2 text-primary-foreground/80 hover:text-secondary transition-colors text-sm"
              >
                <Mail className="w-4 h-4" />
                hello.geenovate@gcet.edu.in
              </a>
              <div className="flex items-start gap-2 text-primary-foreground/80 text-sm">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>GCET Campus, Greater Noida, India</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-8 border-t border-primary-foreground/20">
          <p className="text-center text-primary-foreground/60 text-sm">
            © {new Date().getFullYear()} Campuspreneurs – Chapter 1. Organized by Geenovate Foundation. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

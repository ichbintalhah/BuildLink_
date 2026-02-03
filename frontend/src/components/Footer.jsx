import {
  Hammer,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-base-300 text-base-content mt-auto font-sans border-t border-base-content/5">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Hammer size={28} className="text-primary fill-current" />
              </div>
              <span className="text-2xl font-bold tracking-tight">
                BuildLink
              </span>
            </div>
            <p className="opacity-70 text-sm leading-relaxed">
              Pakistan's #1 Marketplace for verified construction professionals.
              Renovate, Construct, and Repair with confidence.
            </p>
            <div className="flex gap-2 pt-2">
              <a className="btn btn-circle btn-sm btn-ghost hover:bg-primary hover:text-white transition-all">
                <Facebook size={18} />
              </a>
              <a className="btn btn-circle btn-sm btn-ghost hover:bg-primary hover:text-white transition-all">
                <Twitter size={18} />
              </a>
              <a className="btn btn-circle btn-sm btn-ghost hover:bg-primary hover:text-white transition-all">
                <Instagram size={18} />
              </a>
              <a className="btn btn-circle btn-sm btn-ghost hover:bg-primary hover:text-white transition-all">
                <Linkedin size={18} />
              </a>
            </div>
          </div>

          {/* Services Column */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-primary">Services</h3>
            <ul className="space-y-2 text-sm opacity-80">
              <li>
                <Link
                  to="/services/renovation"
                  className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200"
                >
                  Renovation
                </Link>
              </li>
              <li>
                <Link
                  to="/services/construction"
                  className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200"
                >
                  Construction
                </Link>
              </li>
              <li>
                <Link
                  to="/services/modification"
                  className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200"
                >
                  Modification
                </Link>
              </li>
              <li>
                <Link
                  to="/find-pro"
                  className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200"
                >
                  AI Recommendation
                </Link>
              </li>
              <li>
                <Link
                  to="/ai-estimator"
                  className="hover:text-primary transition-colors hover:translate-x-1 inline-block duration-200"
                >
                  Cost Estimator
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column - CAREERS REMOVED */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-primary">Company</h3>
            <ul className="space-y-2 text-sm opacity-80">
              <li>
                <Link
                  to="/about"
                  className="hover:text-primary transition-colors cursor-pointer hover:translate-x-1 inline-block duration-200"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/privacy"
                  className="hover:text-primary transition-colors cursor-pointer hover:translate-x-1 inline-block duration-200"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  to="/terms"
                  className="hover:text-primary transition-colors cursor-pointer hover:translate-x-1 inline-block duration-200"
                >
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Column */}
          <div>
            <h3 className="font-bold text-lg mb-4 text-primary">Contact Us</h3>
            <ul className="space-y-4 text-sm opacity-80">
              <li className="flex items-start gap-3">
                <MapPin size={18} className="mt-0.5 text-primary shrink-0" />
                <span>123 Construction Ave, DHA Phase 6, Lahore, Pakistan</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={18} className="text-primary shrink-0" />
                <span>+92 300 1234567</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={18} className="text-primary shrink-0" />
                <span>support@buildlink.pk</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-base-content/10 bg-base-content/5">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col md:flex-row justify-between items-center text-sm opacity-60">
          <p>© {new Date().getFullYear()} BuildLink. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0 font-medium">
            <Link
              to="/privacy"
              className="hover:text-primary cursor-pointer transition-colors"
            >
              Privacy
            </Link>
            <Link
              to="/terms"
              className="hover:text-primary cursor-pointer transition-colors"
            >
              Terms
            </Link>
            <Link
              to="/"
              className="hover:text-primary cursor-pointer transition-colors"
            >
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

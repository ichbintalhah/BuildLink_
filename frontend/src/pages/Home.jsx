import { useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  ShieldCheck,
  Users,
  ArrowRight,
  CheckCircle,
  Star,
  Briefcase,
  TrendingUp,
  LayoutDashboard,
  Settings,
} from "lucide-react";

const Home = () => {
  const { user } = useContext(AuthContext);

  // --- CONTRACTOR / ADMIN HOMEPAGE VIEW ---
  if (user?.role === "contractor" || user?.role === "admin") {
    return (
      <div className="min-h-screen bg-base-100 font-sans">
        {/* Professional Hero */}
        <div className="bg-neutral text-neutral-content py-20 px-6 relative overflow-hidden">
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-10">
              <div className="space-y-6">
                <div className="badge badge-primary badge-lg font-bold">
                  {user.role === "admin" ? "Admin Panel" : "Pro Workspace"}
                </div>
                <h1 className="text-5xl font-bold leading-tight">
                  Welcome back, <br />
                  <span className="text-primary">{user.fullName}</span>
                </h1>
                <p className="text-lg opacity-80 max-w-xl">
                  {user.role === "admin"
                    ? "Manage users, monitor disputes, and oversee platform activity."
                    : "Track your active jobs, manage earnings, and update your availability for new clients."}
                </p>
                <div className="flex gap-4">
                  <Link
                    to="/dashboard"
                    className="btn btn-primary btn-lg shadow-lg gap-2"
                  >
                    <LayoutDashboard size={20} /> Go to Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    className="btn btn-outline btn-lg text-white gap-2"
                  >
                    <Settings size={20} /> Settings
                  </Link>
                </div>
              </div>
              {/* Decorative Icon */}
              <div className="hidden md:block opacity-10">
                <Briefcase size={250} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats / Features Section */}
        <div className="max-w-6xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold mb-10 text-center">
            Your Business at a Glance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card bg-base-100 shadow-xl border border-base-200 hover:border-primary transition-colors">
              <div className="card-body">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Briefcase size={24} />
                </div>
                <h3 className="card-title">Manage Jobs</h3>
                <p className="opacity-70">
                  View new requests and track active projects in real-time.
                </p>
                <div className="card-actions justify-end mt-4">
                  <Link
                    to="/dashboard"
                    className="text-primary font-bold flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    View Jobs <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl border border-base-200 hover:border-primary transition-colors">
              <div className="card-body">
                <div className="w-12 h-12 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary mb-4">
                  <TrendingUp size={24} />
                </div>
                <h3 className="card-title">Check Earnings</h3>
                <p className="opacity-70">
                  See your financial summary and withdrawal history.
                </p>
                <div className="card-actions justify-end mt-4">
                  <Link
                    to="/dashboard"
                    className="text-secondary font-bold flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    View Wallet <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-xl border border-base-200 hover:border-primary transition-colors">
              <div className="card-body">
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center text-accent mb-4">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="card-title">Advisory & Safety</h3>
                <p className="opacity-70">
                  Review safety guidelines and advisory visit protocols.
                </p>
                <div className="card-actions justify-end mt-4">
                  <Link
                    to="/advisory"
                    className="text-accent font-bold flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    Read Guidelines <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- STANDARD HOMEOWNER VIEW (Keep your existing code) ---
  return (
    <div className="min-h-screen bg-base-100 font-sans">
      {/* --- HERO SECTION --- */}
      <div
        className="hero min-h-[600px] relative"
        style={{
          backgroundImage:
            "url(https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=2031&auto=format&fit=crop)",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40"></div>

        <div className="hero-content text-center text-neutral-content relative z-10">
          <div className="max-w-2xl">
            <div className="badge badge-primary badge-outline mb-4 font-bold">
              🚀 #1 Construction Marketplace in Pakistan
            </div>
            <h1 className="mb-6 text-5xl md:text-6xl font-extrabold leading-tight">
              Build Your Dream <br />
              <span className="text-primary">With Confidence</span>
            </h1>
            <p className="mb-8 text-lg opacity-90">
              Hire verified plumbers, electricians, and builders with 100%
              payment safety. We hold the money until you are satisfied.
            </p>
            <div className="flex flex-col md:flex-row gap-4 justify-center">
              <Link
                to="/contractors"
                className="btn btn-primary btn-lg shadow-lg hover:shadow-primary/50 border-none"
              >
                Find a Pro
              </Link>
              <Link
                to="/ai-estimator"
                className="btn btn-outline btn-lg text-white hover:bg-white hover:text-black"
              >
                Get Cost Estimate
              </Link>
            </div>

            <div className="mt-10 flex items-center justify-center gap-6 text-sm font-medium opacity-80">
              <span className="flex items-center gap-1">
                <ShieldCheck size={18} className="text-success" /> Verified Pros
              </span>
              <span className="flex items-center gap-1">
                <CheckCircle size={18} className="text-success" /> Secure Pay
              </span>
              <span className="flex items-center gap-1">
                <Star size={18} className="text-warning" /> 4.8/5 Ratings
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* --- STATS SECTION --- */}
      <div className="bg-base-200 py-10 border-b border-base-300">
        <div className="max-w-6xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-3xl font-bold text-primary">500+</div>
            <div className="text-sm opacity-60">Verified Contractors</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-secondary">1.2k</div>
            <div className="text-sm opacity-60">Projects Completed</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-accent">98%</div>
            <div className="text-sm opacity-60">Satisfaction Rate</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-info">24/7</div>
            <div className="text-sm opacity-60">Support Available</div>
          </div>
        </div>
      </div>

      {/* --- EXPLORE SERVICES --- */}
      <div className="py-16 px-4 max-w-7xl mx-auto bg-base-200/50 rounded-3xl my-10">
        <h2 className="text-3xl font-bold text-center mb-10">
          Explore Services
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card bg-base-100 shadow-xl hover:-translate-y-2 transition-transform duration-300 overflow-hidden group">
            <figure className="h-48 relative">
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"></div>
              <img
                src="https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=500"
                alt="Renovation"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </figure>
            <div className="card-body">
              <h2 className="card-title">Renovation</h2>
              <p className="text-sm opacity-70">
                Bathroom upgrades, kitchen remodeling, and flooring.
              </p>
              <div className="card-actions justify-end mt-4">
                <Link
                  to="/services/renovation"
                  className="btn btn-sm btn-primary gap-2"
                >
                  Explore <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
          <div className="card bg-base-100 shadow-xl hover:-translate-y-2 transition-transform duration-300 overflow-hidden group">
            <figure className="h-48 relative">
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"></div>
              <img
                src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&q=80&w=500"
                alt="Construction"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </figure>
            <div className="card-body">
              <h2 className="card-title">Construction</h2>
              <p className="text-sm opacity-70">
                Ground-up construction for homes, plazas, and boundaries.
              </p>
              <div className="card-actions justify-end mt-4">
                <Link
                  to="/services/construction"
                  className="btn btn-sm btn-primary gap-2"
                >
                  Explore <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
          <div className="card bg-base-100 shadow-xl hover:-translate-y-2 transition-transform duration-300 overflow-hidden group">
            <figure className="h-48 relative">
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"></div>
              <img
                src="https://images.unsplash.com/photo-1574362848149-11496d93a7c7?auto=format&fit=crop&q=80&w=500"
                alt="Modification"
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
              />
            </figure>
            <div className="card-body">
              <h2 className="card-title">Modification</h2>
              <p className="text-sm opacity-70">
                Structural changes, room extensions, and layout alterations.
              </p>
              <div className="card-actions justify-end mt-4">
                <Link
                  to="/services/modification"
                  className="btn btn-sm btn-primary gap-2"
                >
                  Explore <ArrowRight size={16} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- HOW IT WORKS --- */}
      <div className="py-20 px-4 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">How BuildLink Works</h2>
          <p className="opacity-60 max-w-xl mx-auto">
            Simple, secure, and transparent. We've simplified construction into
            3 easy steps.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-10">
          <div className="card bg-base-100 shadow-xl border border-base-200 hover:border-primary/50 transition-all duration-300">
            <div className="card-body items-center text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
                <Users size={32} />
              </div>
              <h3 className="card-title">1. Choose a Pro</h3>
              <p className="opacity-70 text-sm">
                Browse portfolios, reviews, and ratings to find the perfect
                match for your job.
              </p>
            </div>
          </div>
          <div className="card bg-base-100 shadow-xl border border-base-200 hover:border-primary/50 transition-all duration-300">
            <div className="card-body items-center text-center">
              <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mb-4 text-secondary">
                <ShieldCheck size={32} />
              </div>
              <h3 className="card-title">2. Secure Booking</h3>
              <p className="opacity-70 text-sm">
                Pay securely. We hold the funds and only release them when the
                job is done.
              </p>
            </div>
          </div>
          <div className="card bg-base-100 shadow-xl border border-base-200 hover:border-primary/50 transition-all duration-300">
            <div className="card-body items-center text-center">
              <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4 text-accent">
                <CheckCircle size={32} />
              </div>
              <h3 className="card-title">3. Job Done</h3>
              <p className="opacity-70 text-sm">
                Review the work, approve completion, and rate your professional.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;

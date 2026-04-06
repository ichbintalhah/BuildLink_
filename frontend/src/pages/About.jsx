import { ShieldCheck, Users, Target } from "lucide-react";

const About = () => {
  return (
    <div className="min-h-screen bg-base-100 font-sans">
      {/* Hero */}
      <div className="bg-primary text-primary-content py-20 text-center">
        <h1 className="text-5xl font-bold mb-4">About BuildLink</h1>
        <p className="text-xl opacity-90 max-w-2xl mx-auto">
          Revolutionizing the construction industry in Pakistan by connecting
          homeowners with trusted professionals.
        </p>
      </div>

      {/* Mission & Vision */}
      <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="card bg-base-100 shadow-xl border border-base-200">
          <div className="card-body text-center items-center">
            <Target size={48} className="text-primary mb-4" />
            <h3 className="card-title text-2xl">Our Mission</h3>
            <p className="opacity-70">
              To bring transparency, safety, and reliability to the fragmented
              construction market of Pakistan.
            </p>
          </div>
        </div>
        <div className="card bg-base-100 shadow-xl border border-base-200">
          <div className="card-body text-center items-center">
            <ShieldCheck size={48} className="text-secondary mb-4" />
            <h3 className="card-title text-2xl">Safety First</h3>
            <p className="opacity-70">
              We ensure every contractor is verified via CNIC and skill tests so
              you can build with peace of mind.
            </p>
          </div>
        </div>
        <div className="card bg-base-100 shadow-xl border border-base-200">
          <div className="card-body text-center items-center">
            <Users size={48} className="text-accent mb-4" />
            <h3 className="card-title text-2xl">Community</h3>
            <p className="opacity-70">
              Empowering skilled laborers by providing them with a dignified
              platform to find consistent work.
            </p>
          </div>
        </div>
      </div>

      {/* Story Section */}
      <div className="bg-base-200 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-6">Our Story</h2>
          <p className="text-lg opacity-80 leading-relaxed mb-6">
            BuildLink was founded to solve a simple but painful problem: finding
            a good plumber or electrician in Pakistan is hard. You rely on
            referrals, get overcharged, or face poor quality work.
          </p>
          <p className="text-lg opacity-80 leading-relaxed">
            We built a platform that holds payments in escrow until the job is
            done, ensuring fairness for both the homeowner and the worker.
            Today, we are Pakistan's fastest-growing construction marketplace.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;

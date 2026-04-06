import { Mail, Phone, MapPin, MessageCircle } from "lucide-react";

const Contact = () => {
  return (
    <div className="min-h-screen bg-base-100 font-sans">
      {/* Hero */}
      <div className="bg-primary text-primary-content py-20 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1521791136064-7986c2920216?w=1400&q=80')",
          }}
        ></div>
        <div className="relative z-10 px-6">
          <h1 className="text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Get in touch with BuildLink. We're here to help with any questions
            or concerns.
          </p>
        </div>
      </div>

      {/* Contact Information Cards */}
      <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="card bg-base-100 shadow-xl border border-base-200 hover:shadow-2xl transition-shadow">
          <div className="card-body text-center items-center">
            <Phone size={48} className="text-primary mb-4" />
            <h3 className="card-title text-2xl">Phone</h3>
            <p className="opacity-70 text-lg">+92 314 4324007</p>
            <p className="text-sm opacity-60 mt-2">
              Available Mon-Sat, 9 AM - 6 PM
            </p>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl border border-base-200 hover:shadow-2xl transition-shadow">
          <div className="card-body text-center items-center">
            <Mail size={48} className="text-secondary mb-4" />
            <h3 className="card-title text-2xl">Email</h3>
            <p className="opacity-70 text-lg">buildlink.pk@gmail.com</p>
            <p className="text-sm opacity-60 mt-2">
              We'll respond within 24 hours
            </p>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl border border-base-200 hover:shadow-2xl transition-shadow">
          <div className="card-body text-center items-center">
            <MapPin size={48} className="text-accent mb-4" />
            <h3 className="card-title text-2xl">Address</h3>
            <p className="opacity-70 text-lg text-center">
              123 Construction Ave,
              <br />
              DHA Phase 6,
              <br />
              Lahore, Pakistan
            </p>
          </div>
        </div>
      </div>

      {/* WhatsApp Contact Section */}
      <div className="bg-base-200 py-16">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <MessageCircle size={64} className="text-success mx-auto mb-6" />
          <h2 className="text-3xl font-bold mb-6">Need Immediate Help?</h2>
          <p className="text-lg opacity-80 leading-relaxed mb-6">
            For urgent inquiries or same-day assistance, reach out to us via
            WhatsApp. Our team is ready to help you with booking issues,
            disputes, or general questions.
          </p>
          <a
            href="https://wa.me/923144324007"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-success btn-lg gap-2 text-white"
          >
            <MessageCircle size={20} />
            Chat on WhatsApp
          </a>
        </div>
      </div>

      {/* Additional Information */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="card bg-base-100 shadow-xl border border-base-200">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">How Can We Help?</h2>
            <div className="space-y-4 opacity-80">
              <div>
                <h3 className="font-bold text-lg mb-2">For Users:</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Booking assistance and service inquiries</li>
                  <li>Payment and wallet-related questions</li>
                  <li>Dispute resolution support</li>
                  <li>General platform guidance</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">For Contractors:</h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Profile verification and approval status</li>
                  <li>Withdrawal and earnings inquiries</li>
                  <li>Job management support</li>
                  <li>Platform technical assistance</li>
                </ul>
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">
                  For General Inquiries:
                </h3>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Partnership and business opportunities</li>
                  <li>Media and press inquiries</li>
                  <li>Feedback and suggestions</li>
                  <li>Technical support</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;

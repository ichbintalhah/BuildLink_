import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  ClipboardCheck,
  ShieldCheck,
  HardHat,
  MessageCircle,
} from "lucide-react";

const Advisory = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    phone: user?.phone || "",
    address: user?.address || "",
    visitDate: "",
    problemDescription: "",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/advisory", formData);
      toast.success("Advisory Visit Booked! We will call you shortly.");
      setFormData({ ...formData, visitDate: "", problemDescription: "" });
    } catch (error) {
      toast.error("Booking failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Centered Content Section */}
        <div className="flex flex-col justify-center items-center text-center">
          <h1 className="text-5xl font-bold mb-6 text-primary">
            Expert Advisory Visit
          </h1>
          <p className="text-xl mb-12 opacity-80 max-w-2xl">
            Not sure what work is needed? Hire a certified civil engineer to
            inspect your site, estimate costs, and guide you before you start.
          </p>

          {/* Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full">
            <div className="flex flex-col gap-4 items-center p-6 bg-base-100 rounded-xl shadow-sm">
              <ClipboardCheck size={40} className="text-secondary" />
              <div>
                <h3 className="font-bold text-lg">Accurate Cost Estimation</h3>
                <p className="text-sm opacity-70">
                  Get a detailed breakdown of material and labor costs.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-4 items-center p-6 bg-base-100 rounded-xl shadow-sm">
              <ShieldCheck size={40} className="text-secondary" />
              <div>
                <h3 className="font-bold text-lg">Avoid Overcharging</h3>
                <p className="text-sm opacity-70">
                  We protect you from contractors quoting too high.
                </p>
              </div>
            </div>
            <div className="flex flex-col gap-4 items-center p-6 bg-base-100 rounded-xl shadow-sm">
              <HardHat size={40} className="text-secondary" />
              <div>
                <h3 className="font-bold text-lg">Quality Check</h3>
                <p className="text-sm opacity-70">
                  We verify structural integrity and material quality.
                </p>
              </div>
            </div>
          </div>

          {/* About Advisory Visit Section */}
          <div className="bg-base-100 rounded-xl shadow-lg p-8 mb-10 w-full text-left">
            <h2 className="text-3xl font-bold mb-6 text-center text-primary">
              Why Choose Our Advisory Visit?
            </h2>

            <div className="space-y-4 mb-8">
              <p className="opacity-90">
                <strong>Expert Assessment:</strong> Our certified civil
                engineers provide professional site inspections to identify
                structural issues, material requirements, and safety concerns.
              </p>
              <p className="opacity-90">
                <strong>Detailed Cost Breakdown:</strong> Get comprehensive
                estimates for materials, labor, and timeline based on your
                specific project requirements.
              </p>
              <p className="opacity-90">
                <strong>Protection from Overcharging:</strong> We ensure
                contractors provide fair quotes and follow industry standards
                for your construction project.
              </p>
              <p className="opacity-90">
                <strong>Quality Assurance:</strong> Our engineers verify
                structural integrity, material quality, and compliance with
                building codes and regulations.
              </p>
              <p className="opacity-90">
                <strong>One-Time Fee:</strong> Book an advisory visit for just{" "}
                <span className="font-bold text-primary">Rs. 500</span>, which
                includes a complete site inspection and detailed report.
              </p>
            </div>

            <div className="divider"></div>

            {/* Admin Contact Section */}
            <div className="text-center mt-8">
              <p className="mb-6 text-lg opacity-90">
                Have questions about advisory visits or need immediate support?
              </p>
              <a
                href="https://wa.me/923144324007?text=Hello%20BuildLink%20Admin%2C%20I%20need%20help%20with%20an%20advisory%20visit."
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-lg gap-2"
              >
                <MessageCircle size={24} />
                Chat with Admin on WhatsApp
              </a>
              <p className="text-sm opacity-70 mt-4">
                Available Monday - Friday, 9 AM - 6 PM
              </p>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="bg-primary/10 border-2 border-primary rounded-xl p-8 w-full mb-10">
            <h2 className="text-2xl font-bold mb-6 text-center text-primary">
              How the Process Works
            </h2>
            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="badge badge-primary text-lg">1</div>
                <div>
                  <p className="font-bold">Contact Our Team</p>
                  <p className="text-sm opacity-80">
                    Reach out via WhatsApp or call to schedule your visit
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="badge badge-primary text-lg">2</div>
                <div>
                  <p className="font-bold">On-Site Inspection</p>
                  <p className="text-sm opacity-80">
                    Our engineer visits your property for detailed assessment
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="badge badge-primary text-lg">3</div>
                <div>
                  <p className="font-bold">Detailed Report</p>
                  <p className="text-sm opacity-80">
                    Receive comprehensive cost estimation and recommendations
                  </p>
                </div>
              </div>
              <div className="flex gap-4 items-start">
                <div className="badge badge-primary text-lg">4</div>
                <div>
                  <p className="font-bold">Hire Contractors</p>
                  <p className="text-sm opacity-80">
                    Use BuildLink to hire contractors with confidence
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="bg-base-100 rounded-xl shadow-lg p-8 w-full">
            <h2 className="text-2xl font-bold mb-6 text-center text-primary">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              <div className="collapse collapse-arrow bg-base-200">
                <input type="radio" name="faq" defaultChecked />
                <div className="collapse-title font-bold">
                  How long does the advisory visit take?
                </div>
                <div className="collapse-content">
                  <p>
                    Typically, an advisory visit takes 1-2 hours depending on
                    the size and complexity of your property.
                  </p>
                </div>
              </div>
              <div className="collapse collapse-arrow bg-base-200">
                <input type="radio" name="faq" />
                <div className="collapse-title font-bold">
                  When will the engineer visit my property?
                </div>
                <div className="collapse-content">
                  <p>
                    Our engineers are available within 24-48 hours of booking.
                    You can choose your preferred date and time.
                  </p>
                </div>
              </div>
              <div className="collapse collapse-arrow bg-base-200">
                <input type="radio" name="faq" />
                <div className="collapse-title font-bold">
                  What if I need the visit urgently?
                </div>
                <div className="collapse-content">
                  <p>
                    Contact our admin team via WhatsApp for same-day or urgent
                    advisory visits. Additional charges may apply for emergency
                    visits.
                  </p>
                </div>
              </div>
              <div className="collapse collapse-arrow bg-base-200">
                <input type="radio" name="faq" />
                <div className="collapse-title font-bold">
                  Is the Rs. 500 fee refundable?
                </div>
                <div className="collapse-content">
                  <p>
                    The advisory visit fee is non-refundable but you can use it
                    as credit if you hire a contractor through BuildLink for the
                    work.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Final CTA */}
          <div className="text-center mt-12">
            <p className="mb-6 text-lg font-semibold">
              Ready to get your project inspected by experts?
            </p>
            <a
              href="https://wa.me/923144324007?text=Hello%20BuildLink%20Admin%2C%20I%20want%20to%20book%20an%20advisory%20visit%20for%20my%20project."
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary btn-lg gap-2"
            >
              <MessageCircle size={24} />
              Book Advisory Visit Now
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Advisory;

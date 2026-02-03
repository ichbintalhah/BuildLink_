import { useParams, useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const JobSelection = () => {
  const { subCategory } = useParams(); // e.g., "welder"
  const navigate = useNavigate();

  // Data: Specific jobs for ALL trades
  const jobList = {
    plumber: [
      { title: "Install Sink", price: 1000 },
      { title: "Fix Water Leak", price: 800 },
      { title: "Motor Installation", price: 1500 },
      { title: "Full Bathroom Fitting", price: 5000 },
    ],
    electrician: [
      { title: "Install Ceiling Fan", price: 500 },
      { title: "Fix Switchboard", price: 300 },
      { title: "UPS Wiring", price: 2000 },
      { title: "Full House Wiring", price: 15000 },
    ],
    carpenter: [
      { title: "Repair Table", price: 1200 },
      { title: "Fix Door Lock", price: 500 },
      { title: "Make New Chair", price: 3000 },
      { title: "Kitchen Cabinets", price: 8000 },
    ],
    mason: [
      { title: "Wall Plaster (Per ft)", price: 50 },
      { title: "Floor Tiling (Per ft)", price: 80 },
      { title: "Roof Repair", price: 2500 },
      { title: "Build Wall", price: 5000 },
    ],
    painter: [
      { title: "Paint Room (12x12)", price: 3000 },
      { title: "Exterior Wall", price: 5000 },
      { title: "Door Polish", price: 1500 },
    ],
    welder: [
      { title: "Fix Main Gate", price: 2000 },
      { title: "Window Grill Repair", price: 1000 },
      { title: "Stair Railing Welding", price: 1500 },
    ],
    "glass worker": [
      { title: "Window Glass Replacement", price: 1200 },
      { title: "Install Mirror", price: 800 },
      { title: "Aluminum Window Fix", price: 1500 },
    ],
    helper: [
      { title: "Daily Wage Labor", price: 1200 },
      { title: "Debris Removal", price: 1000 },
      { title: "Material Shifting", price: 1500 },
    ],
    hvac: [
      { title: "AC Service", price: 1500 },
      { title: "Gas Refill", price: 3000 },
      { title: "AC Installation", price: 2500 },
    ],
    // Default fallback
    default: [
      { title: "General Service", price: 1000 },
      { title: "Consultation", price: 500 },
    ],
  };

  // Handle spaces in URLs (e.g., "glass%20worker")
  const decodedCategory = decodeURIComponent(subCategory).toLowerCase();
  const jobs = jobList[decodedCategory] || jobList["default"];

  const handleSelectJob = (job) => {
    navigate(
      `/contractors/${subCategory}?job=${encodeURIComponent(job.title)}&price=${
        job.price
      }`
    );
  };

  return (
    <div className="min-h-screen bg-base-200 py-10 px-4">
      <h1 className="text-4xl font-bold text-center mb-2 capitalize">
        Select {decodedCategory} Task
      </h1>
      <p className="text-center text-gray-500 mb-10">
        Choose the specific work you need done
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
        {jobs.map((job, index) => (
          <div
            key={index}
            onClick={() => handleSelectJob(job)}
            className="flex justify-between items-center p-6 bg-base-100 rounded-xl shadow-md hover:bg-primary hover:text-white cursor-pointer transition-colors group"
          >
            <div>
              <h3 className="text-xl font-bold">{job.title}</h3>
              <p className="text-sm opacity-70 group-hover:text-white">
                Est. Price: Rs. {job.price}
              </p>
            </div>
            <ArrowRight />
          </div>
        ))}
      </div>
    </div>
  );
};

export default JobSelection;

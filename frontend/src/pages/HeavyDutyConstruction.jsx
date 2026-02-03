import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

const HeavyDutyConstruction = () => {
  const navigate = useNavigate();

  const heavyDutyJobs = [
    { title: "Excavation & Earthmoving", price: 25000 },
    { title: "Piling & Foundation Work", price: 40000 },
    { title: "Steel Structure Erection", price: 55000 },
    { title: "Concrete Pouring (Per 1000 sq ft)", price: 60000 },
    { title: "Road & Pavement Construction", price: 80000 },
    { title: "Industrial Shed Construction", price: 120000 },
    { title: "Demolition & Debris Removal", price: 30000 },
    { title: "Cranes & Heavy Machinery Ops", price: 75000 },
  ];

  const handleSelectJob = (job) => {
    navigate(
      `/contractors/construction?job=${encodeURIComponent(
        job.title,
      )}&price=${job.price}`,
    );
  };

  return (
    <div className="min-h-screen bg-base-200 py-10 px-4">
      <h1 className="text-4xl font-bold text-center mb-2">
        Heavy Duty Construction
      </h1>
      <p className="text-center text-gray-500 mb-10">
        Choose a heavy-duty construction task to get matched with experts
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
        {heavyDutyJobs.map((job, index) => (
          <div
            key={index}
            onClick={() => handleSelectJob(job)}
            className="flex justify-between items-center p-6 bg-base-100 rounded-xl shadow-md hover:bg-primary hover:text-white cursor-pointer transition-colors group"
          >
            <div>
              <h3 className="text-xl font-bold">{job.title}</h3>
              <p className="text-sm opacity-70 group-hover:text-white">
                Est. Price: Rs. {job.price.toLocaleString()}
              </p>
            </div>
            <ArrowRight />
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeavyDutyConstruction;

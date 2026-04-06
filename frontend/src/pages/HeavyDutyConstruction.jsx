import { useNavigate } from "react-router-dom";
import { ArrowRight, HelpCircle } from "lucide-react";

const HeavyDutyConstruction = () => {
  const navigate = useNavigate();

  const heavyDutyJobs = [
    "Excavation & Earthmoving",
    "Piling & Foundation Work",
    "Steel Structure Erection",
    "Concrete Pouring & Slab Work",
    "Road & Pavement Construction",
    "Industrial Shed Construction",
    "Demolition & Debris Removal",
    "Cranes & Heavy Machinery Operations",
    "Building Foundation & Basement",
    "Boundary Wall Construction",
    "Water Tank & Overhead Tank Construction",
    "Bridge & Flyover Construction",
    "Tunnel Construction",
    "Dam & Water Reservoir Work",
    "Canal & Drainage System",
    "Sewerage & Underground Piping",
    "High-Rise Building Structure",
    "Factory & Warehouse Construction",
    "Cold Storage Construction",
    "Tower & Chimney Construction",
    "Retaining Wall Construction",
    "Land Leveling & Grading",
    "Soil Testing & Compaction",
    "RCC Work (Reinforced Concrete)",
    "Pre-Cast Construction",
    "Steel Fixing & Bar Bending",
    "Scaffolding & Formwork",
    "Bore Piling & Sheet Piling",
    "Dewatering Works",
    "Site Development & Land Clearing",
    "Railway Track Construction",
    "Airport Runway Construction",
    "Power Plant Construction",
    "Shopping Mall Structure",
    "Hospital Building Construction",
    "Educational Building Construction",
  ];

  const handleSelectJob = (job) => {
    navigate(`/contractors/construction?job=${encodeURIComponent(job)}`);
  };

  const handleOtherService = () => {
    navigate(
      `/contractors/construction?job=${encodeURIComponent("Other (Custom Project")}`,
    );
  };

  return (
    <div className="min-h-screen bg-base-200">
      {/* Hero Section */}
      <div className="bg-neutral text-neutral-content pt-16 pb-20 px-6 text-center relative overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=1200&q=80')",
          }}
        ></div>
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Heavy Duty Construction
          </h1>
          <p className="text-lg opacity-90">
            Choose a heavy-duty construction task to get matched with experts
          </p>
        </div>
      </div>

      <div className="py-10 px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
          {heavyDutyJobs.map((job, index) => (
            <div
              key={index}
              onClick={() => handleSelectJob(job)}
              className="flex justify-between items-center p-6 bg-base-100 rounded-xl shadow-md hover:bg-primary hover:text-white cursor-pointer transition-colors group"
            >
              <div>
                <h3 className="text-xl font-bold">{job}</h3>
              </div>
              <ArrowRight />
            </div>
          ))}

          {/* Other Service Option */}
          <div
            onClick={handleOtherService}
            className="flex justify-between items-center p-6 bg-gradient-to-br from-secondary/20 to-accent/20 border-2 border-dashed border-secondary rounded-xl shadow-md hover:bg-secondary hover:text-white cursor-pointer transition-all group"
          >
            <div>
              <h3 className="text-xl font-bold flex items-center gap-2">
                <HelpCircle size={24} className="group-hover:animate-pulse" />
                Other Service
              </h3>
              <p className="text-sm opacity-70 group-hover:text-white mt-1">
                Can't find your task? Describe your custom project
              </p>
            </div>
            <ArrowRight />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeavyDutyConstruction;

import { useParams, Link } from "react-router-dom";
import {
  Hammer,
  Zap,
  Droplet,
  PaintBucket,
  Component,
  HardHat,
  Flame,
  Glasses,
} from "lucide-react";

const SubCategories = () => {
  const { category } = useParams(); // e.g., "renovation", "modification", "construction"

  // Unified List: All trades are available in all categories
  const allTrades = [
    { name: "Mason", icon: <Component size={40} className="text-gray-600" /> },
    {
      name: "Electrician",
      icon: <Zap size={40} className="text-yellow-500" />,
    },
    { name: "Plumber", icon: <Droplet size={40} className="text-blue-500" /> },
    {
      name: "Carpenter",
      icon: <Hammer size={40} className="text-amber-700" />,
    },
    {
      name: "Painter",
      icon: <PaintBucket size={40} className="text-pink-500" />,
    },
    { name: "Welder", icon: <Flame size={40} className="text-orange-600" /> },
    {
      name: "Glass Worker",
      icon: <Glasses size={40} className="text-cyan-500" />,
    },
    {
      name: "HVAC",
      icon: <div className="text-blue-300 font-bold text-2xl">AC</div>,
    },
    { name: "Helper", icon: <HardHat size={40} className="text-yellow-600" /> },
  ];

  return (
    <div className="min-h-screen bg-base-200 py-10 px-4">
      <h1 className="text-4xl font-bold text-center mb-2 capitalize">
        {category} Services
      </h1>
      <p className="text-center text-gray-500 mb-10">
        Select a specialist for your project
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
        {allTrades.map((sub, index) => (
          <Link
            key={index}
            to={`/jobs/${sub.name.toLowerCase()}?type=${category}`}
            className="card bg-base-100 shadow-xl hover:scale-105 transition-all cursor-pointer border border-base-300"
          >
            <div className="card-body items-center text-center">
              {sub.icon}
              <h2 className="card-title mt-2">{sub.name}</h2>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default SubCategories;

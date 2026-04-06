import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, HelpCircle } from "lucide-react";

const JobSelection = () => {
  const { subCategory } = useParams(); // e.g., "welder"
  const [searchParams] = useSearchParams();
  const serviceType = searchParams.get("type"); // "modification", "renovation", or "construction"
  const navigate = useNavigate();

  // Data: Specific jobs for ALL trades, tagged with service types
  // M = Modification (repairs, fixes, small changes)
  // R = Renovation (upgrading, redoing existing)
  // C = Construction (building new from scratch)
  const jobList = {
    plumber: [
      // --- Modification (repairs, fixes, small changes) ---
      { title: "Fix Water Leak", price: 800, types: ["modification"] },
      { title: "Drainage Cleaning", price: 900, types: ["modification"] },
      { title: "Kitchen Pipe Fixing", price: 700, types: ["modification"] },
      { title: "Toilet Flush Repair", price: 500, types: ["modification"] },
      { title: "Dripping Tap Repair", price: 350, types: ["modification"] },
      { title: "Clogged Drain Repair", price: 600, types: ["modification"] },
      { title: "Water Pressure Fix", price: 750, types: ["modification"] },
      { title: "Pipe Joint Sealing", price: 450, types: ["modification"] },
      { title: "Valve Replacement", price: 550, types: ["modification"] },
      { title: "Toilet Seat Replacement", price: 400, types: ["modification"] },
      { title: "Water Pump Repair", price: 1200, types: ["modification"] },
      { title: "Geyser Repair", price: 1000, types: ["modification"] },
      {
        title: "Faucet Cartridge Replacement",
        price: 350,
        types: ["modification"],
      },
      { title: "Overflow Tank Repair", price: 650, types: ["modification"] },
      { title: "Bidet Spray Replacement", price: 300, types: ["modification"] },
      // --- Modification + Renovation ---
      {
        title: "Pipe Replacement",
        price: 600,
        types: ["modification", "renovation"],
      },
      {
        title: "Tap/Faucet Installation",
        price: 400,
        types: ["modification", "renovation"],
      },
      {
        title: "Washbasin Replacement",
        price: 1200,
        types: ["modification", "renovation"],
      },
      {
        title: "Kitchen Mixer Tap Installation",
        price: 800,
        types: ["modification", "renovation"],
      },
      {
        title: "Water Filter Installation",
        price: 900,
        types: ["modification", "renovation"],
      },
      // --- Modification + Construction ---
      {
        title: "Motor Installation",
        price: 1500,
        types: ["modification", "construction"],
      },
      {
        title: "Submersible Pump Installation",
        price: 3500,
        types: ["modification", "construction"],
      },
      // --- Renovation only ---
      { title: "Bathroom Fixture Upgrade", price: 2500, types: ["renovation"] },
      {
        title: "Kitchen Plumbing Overhaul",
        price: 4500,
        types: ["renovation"],
      },
      {
        title: "Replace Old Piping System",
        price: 5000,
        types: ["renovation"],
      },
      { title: "Bathtub Replacement", price: 3500, types: ["renovation"] },
      { title: "Shower Mixer Upgrade", price: 1800, types: ["renovation"] },
      {
        title: "Water Softener Installation",
        price: 3000,
        types: ["renovation"],
      },
      // --- Renovation + Construction ---
      {
        title: "Install Sink",
        price: 1000,
        types: ["renovation", "construction"],
      },
      {
        title: "Toilet Installation",
        price: 1200,
        types: ["renovation", "construction"],
      },
      {
        title: "Shower Installation",
        price: 1500,
        types: ["renovation", "construction"],
      },
      {
        title: "Water Heater Installation",
        price: 2500,
        types: ["renovation", "construction"],
      },
      {
        title: "Water Tank Installation",
        price: 2000,
        types: ["renovation", "construction"],
      },
      {
        title: "Full Bathroom Fitting",
        price: 5000,
        types: ["renovation", "construction"],
      },
      {
        title: "Underground Water Line",
        price: 4000,
        types: ["renovation", "construction"],
      },
      {
        title: "Sewage Line Installation",
        price: 6000,
        types: ["renovation", "construction"],
      },
      {
        title: "Rainwater Harvesting Setup",
        price: 8000,
        types: ["renovation", "construction"],
      },
      {
        title: "Solar Water Heater Installation",
        price: 12000,
        types: ["renovation", "construction"],
      },
      // --- Construction only ---
      {
        title: "Complete House Plumbing",
        price: 25000,
        types: ["construction"],
      },
      { title: "Main Water Supply Line", price: 8000, types: ["construction"] },
      { title: "Septic Tank Plumbing", price: 10000, types: ["construction"] },
      {
        title: "Multi-Story Water Distribution",
        price: 15000,
        types: ["construction"],
      },
      {
        title: "Fire Hydrant Line Installation",
        price: 12000,
        types: ["construction"],
      },
      {
        title: "Commercial Plumbing Setup",
        price: 30000,
        types: ["construction"],
      },
    ],
    electrician: [
      // --- Modification (repairs, fixes, small changes) ---
      { title: "Fix Switchboard", price: 300, types: ["modification"] },
      { title: "MCB/Circuit Breaker Fix", price: 600, types: ["modification"] },
      {
        title: "Voltage Stabilizer Setup",
        price: 1500,
        types: ["modification"],
      },
      { title: "Short Circuit Repair", price: 500, types: ["modification"] },
      { title: "Doorbell Repair", price: 250, types: ["modification"] },
      {
        title: "Light Switch Replacement",
        price: 200,
        types: ["modification"],
      },
      {
        title: "Electrical Outlet Repair",
        price: 300,
        types: ["modification"],
      },
      { title: "Ceiling Fan Repair", price: 400, types: ["modification"] },
      { title: "Exhaust Fan Repair", price: 350, types: ["modification"] },
      { title: "Extension Board Repair", price: 250, types: ["modification"] },
      { title: "Fuse Box Repair", price: 500, types: ["modification"] },
      { title: "Wire Insulation Fix", price: 400, types: ["modification"] },
      { title: "Dimmer Switch Repair", price: 350, types: ["modification"] },
      { title: "Inverter Repair", price: 1200, types: ["modification"] },
      { title: "Earth Grounding Fix", price: 800, types: ["modification"] },
      // --- Modification + Renovation ---
      {
        title: "LED Light Installation",
        price: 400,
        types: ["modification", "renovation"],
      },
      {
        title: "Thermostat Installation",
        price: 800,
        types: ["modification", "renovation"],
      },
      {
        title: "Smart Switch Installation",
        price: 600,
        types: ["modification", "renovation"],
      },
      {
        title: "Motion Sensor Light Setup",
        price: 700,
        types: ["modification", "renovation"],
      },
      {
        title: "USB Socket Installation",
        price: 350,
        types: ["modification", "renovation"],
      },
      // --- Modification + Construction ---
      {
        title: "Socket Installation",
        price: 250,
        types: ["modification", "construction"],
      },
      {
        title: "Electrical Panel Upgrade",
        price: 2500,
        types: ["modification", "construction"],
      },
      // --- Renovation only ---
      { title: "Chandelier Installation", price: 800, types: ["renovation"] },
      {
        title: "Recessed Lighting Upgrade",
        price: 1500,
        types: ["renovation"],
      },
      { title: "Under-Cabinet Lighting", price: 1200, types: ["renovation"] },
      { title: "Bathroom Light Upgrade", price: 600, types: ["renovation"] },
      {
        title: "Track Lighting Installation",
        price: 1800,
        types: ["renovation"],
      },
      { title: "Strip LED Lighting Setup", price: 1000, types: ["renovation"] },
      // --- Renovation + Construction ---
      {
        title: "Install Ceiling Fan",
        price: 500,
        types: ["renovation", "construction"],
      },
      {
        title: "Outdoor Lighting Setup",
        price: 2500,
        types: ["renovation", "construction"],
      },
      {
        title: "Electric Meter Installation",
        price: 1200,
        types: ["renovation", "construction"],
      },
      {
        title: "UPS Wiring",
        price: 2000,
        types: ["renovation", "construction"],
      },
      {
        title: "Generator Wiring",
        price: 3000,
        types: ["renovation", "construction"],
      },
      {
        title: "Security Camera Wiring",
        price: 2500,
        types: ["renovation", "construction"],
      },
      {
        title: "Intercom System Wiring",
        price: 3000,
        types: ["renovation", "construction"],
      },
      {
        title: "Solar Panel Wiring",
        price: 5000,
        types: ["renovation", "construction"],
      },
      {
        title: "EV Charger Installation",
        price: 4000,
        types: ["renovation", "construction"],
      },
      {
        title: "Garden Lighting Setup",
        price: 3500,
        types: ["renovation", "construction"],
      },
      // --- Construction only ---
      { title: "Full House Wiring", price: 15000, types: ["construction"] },
      { title: "3-Phase Power Setup", price: 8000, types: ["construction"] },
      {
        title: "Commercial Electrical Wiring",
        price: 25000,
        types: ["construction"],
      },
      {
        title: "Industrial Panel Board Setup",
        price: 12000,
        types: ["construction"],
      },
      {
        title: "Underground Cable Installation",
        price: 6000,
        types: ["construction"],
      },
      {
        title: "Main Distribution Board Setup",
        price: 5000,
        types: ["construction"],
      },
    ],
    carpenter: [
      // --- Modification (repairs, fixes, small changes) ---
      { title: "Repair Table", price: 1200, types: ["modification"] },
      { title: "Fix Door Lock", price: 500, types: ["modification"] },
      { title: "Window Frame Repair", price: 1500, types: ["modification"] },
      { title: "Door Frame Repair", price: 1800, types: ["modification"] },
      { title: "Drawer Sliding Fix", price: 400, types: ["modification"] },
      {
        title: "Cabinet Hinge Replacement",
        price: 300,
        types: ["modification"],
      },
      { title: "Door Handle Replacement", price: 350, types: ["modification"] },
      {
        title: "Furniture Polish/Refinish",
        price: 1500,
        types: ["modification"],
      },
      {
        title: "Loose Chair/Stool Repair",
        price: 600,
        types: ["modification"],
      },
      { title: "Wardrobe Lock Repair", price: 400, types: ["modification"] },
      {
        title: "Wooden Floor Scratch Repair",
        price: 800,
        types: ["modification"],
      },
      { title: "Broken Shelf Repair", price: 500, types: ["modification"] },
      { title: "Window Shutters Repair", price: 1000, types: ["modification"] },
      { title: "Wooden Gate Repair", price: 1200, types: ["modification"] },
      {
        title: "Termite Damaged Wood Repair",
        price: 2000,
        types: ["modification"],
      },
      // --- Modification + Renovation ---
      {
        title: "Shelving Installation",
        price: 2000,
        types: ["modification", "renovation"],
      },
      {
        title: "Door Replacement",
        price: 3000,
        types: ["modification", "renovation"],
      },
      {
        title: "Window Replacement",
        price: 2500,
        types: ["modification", "renovation"],
      },
      {
        title: "Cabinet Door Replacement",
        price: 1800,
        types: ["modification", "renovation"],
      },
      {
        title: "Countertop Installation",
        price: 4000,
        types: ["modification", "renovation"],
      },
      // --- Renovation only ---
      { title: "Kitchen Cabinet Refacing", price: 6000, types: ["renovation"] },
      {
        title: "Staircase Railing Upgrade",
        price: 5000,
        types: ["renovation"],
      },
      { title: "Room Paneling Work", price: 8000, types: ["renovation"] },
      {
        title: "Bathroom Vanity Installation",
        price: 4500,
        types: ["renovation"],
      },
      { title: "Closet System Renovation", price: 7000, types: ["renovation"] },
      { title: "Deck/Patio Restoration", price: 10000, types: ["renovation"] },
      // --- Renovation + Construction ---
      {
        title: "Make New Chair",
        price: 3000,
        types: ["renovation", "construction"],
      },
      {
        title: "Kitchen Cabinets",
        price: 8000,
        types: ["renovation", "construction"],
      },
      {
        title: "Wardrobe Installation",
        price: 12000,
        types: ["renovation", "construction"],
      },
      {
        title: "Bed Frame Making",
        price: 5000,
        types: ["renovation", "construction"],
      },
      {
        title: "TV Cabinet Making",
        price: 4000,
        types: ["renovation", "construction"],
      },
      {
        title: "False Ceiling Work",
        price: 6000,
        types: ["renovation", "construction"],
      },
      {
        title: "Wooden Flooring",
        price: 10000,
        types: ["renovation", "construction"],
      },
      {
        title: "Dining Table Making",
        price: 8000,
        types: ["renovation", "construction"],
      },
      {
        title: "Bookshelf Construction",
        price: 4500,
        types: ["renovation", "construction"],
      },
      {
        title: "Wooden Partition Wall",
        price: 6000,
        types: ["renovation", "construction"],
      },
      {
        title: "Study Desk Making",
        price: 3500,
        types: ["renovation", "construction"],
      },
      // --- Construction only ---
      { title: "Full House Woodwork", price: 50000, types: ["construction"] },
      {
        title: "Main Entrance Door Making",
        price: 8000,
        types: ["construction"],
      },
      {
        title: "Wooden Staircase Construction",
        price: 20000,
        types: ["construction"],
      },
      {
        title: "Roof Truss Construction",
        price: 15000,
        types: ["construction"],
      },
      {
        title: "Custom Built-in Furniture",
        price: 25000,
        types: ["construction"],
      },
      {
        title: "Wooden Window Frames (Full House)",
        price: 18000,
        types: ["construction"],
      },
    ],
    mason: [
      // --- Modification (repairs, fixes, small changes) ---
      { title: "Wall Crack Repair", price: 800, types: ["modification"] },
      { title: "Roof Repair", price: 2500, types: ["modification"] },
      { title: "Ceiling Repair", price: 2000, types: ["modification"] },
      { title: "Broken Tile Replacement", price: 600, types: ["modification"] },
      { title: "Step/Stair Repair", price: 1200, types: ["modification"] },
      { title: "Damp Wall Treatment", price: 1500, types: ["modification"] },
      { title: "Slab Leakage Repair", price: 2000, types: ["modification"] },
      { title: "Water Seepage Fix", price: 1800, types: ["modification"] },
      { title: "Drain Cover Repair", price: 500, types: ["modification"] },
      { title: "Pillar Repair", price: 2500, types: ["modification"] },
      { title: "Concrete Patch Work", price: 800, types: ["modification"] },
      { title: "Plinth Repair", price: 1200, types: ["modification"] },
      { title: "Parapet Wall Repair", price: 1500, types: ["modification"] },
      { title: "Lintel Repair", price: 2000, types: ["modification"] },
      { title: "Manhole Cover Repair", price: 700, types: ["modification"] },
      // --- Modification + Renovation ---
      {
        title: "Wall Plaster (Per ft)",
        price: 200,
        types: ["modification", "renovation"],
      },
      {
        title: "Floor Leveling",
        price: 1500,
        types: ["modification", "renovation"],
      },
      {
        title: "Wall Waterproofing",
        price: 2500,
        types: ["modification", "renovation"],
      },
      {
        title: "Driveway Repair",
        price: 3000,
        types: ["modification", "renovation"],
      },
      {
        title: "Terrace Waterproofing",
        price: 4000,
        types: ["modification", "renovation"],
      },
      // --- Renovation only ---
      {
        title: "Bathroom Demolition & Rebuild",
        price: 8000,
        types: ["renovation"],
      },
      {
        title: "Kitchen Counter Rebuilding",
        price: 6000,
        types: ["renovation"],
      },
      {
        title: "Old Floor Removal & Re-tiling",
        price: 5000,
        types: ["renovation"],
      },
      { title: "Room Expansion Cutting", price: 4000, types: ["renovation"] },
      { title: "Staircase Renovation", price: 7000, types: ["renovation"] },
      {
        title: "Porch/Veranda Renovation",
        price: 10000,
        types: ["renovation"],
      },
      // --- Renovation + Construction ---
      {
        title: "Floor Tiling (Per ft)",
        price: 200,
        types: ["renovation", "construction"],
      },
      {
        title: "Bathroom Tiling",
        price: 4000,
        types: ["renovation", "construction"],
      },
      {
        title: "Kitchen Tiling",
        price: 3500,
        types: ["renovation", "construction"],
      },
      {
        title: "Marble/Granite Installation",
        price: 8000,
        types: ["renovation", "construction"],
      },
      {
        title: "Concrete Flooring",
        price: 6000,
        types: ["renovation", "construction"],
      },
      {
        title: "Driveway Paving",
        price: 10000,
        types: ["renovation", "construction"],
      },
      {
        title: "Retaining Wall Construction",
        price: 12000,
        types: ["renovation", "construction"],
      },
      {
        title: "RCC Slab Casting",
        price: 15000,
        types: ["renovation", "construction"],
      },
      {
        title: "Plastering Full Room",
        price: 4000,
        types: ["renovation", "construction"],
      },
      {
        title: "Stone Cladding Work",
        price: 6000,
        types: ["renovation", "construction"],
      },
      // --- Construction only ---
      { title: "Build Wall", price: 5000, types: ["construction"] },
      {
        title: "Boundary Wall Construction",
        price: 15000,
        types: ["construction"],
      },
      { title: "Room Extension", price: 25000, types: ["construction"] },
      { title: "Brick Laying (Per ft)", price: 200, types: ["construction"] },
      { title: "Foundation Laying", price: 20000, types: ["construction"] },
      {
        title: "Column & Beam Construction",
        price: 18000,
        types: ["construction"],
      },
      {
        title: "Full Roof Slab Construction",
        price: 30000,
        types: ["construction"],
      },
      {
        title: "Overhead Water Tank Platform",
        price: 8000,
        types: ["construction"],
      },
      {
        title: "Septic Tank Construction",
        price: 12000,
        types: ["construction"],
      },
      {
        title: "Commercial Building Masonry",
        price: 50000,
        types: ["construction"],
      },
    ],
    painter: [
      // --- Modification (repairs, fixes, small changes) ---
      { title: "Door Polish", price: 1500, types: ["modification"] },
      { title: "Kitchen Cabinet Polish", price: 2000, types: ["modification"] },
      {
        title: "Wooden Furniture Polish",
        price: 1800,
        types: ["modification"],
      },
      { title: "Touch-Up Paint Work", price: 500, types: ["modification"] },
      { title: "Scratch & Stain Removal", price: 400, types: ["modification"] },
      { title: "Paint Peeling Repair", price: 600, types: ["modification"] },
      { title: "Rust Removal & Repaint", price: 800, types: ["modification"] },
      { title: "Window Frame Repaint", price: 700, types: ["modification"] },
      {
        title: "Staircase Railing Repaint",
        price: 900,
        types: ["modification"],
      },
      {
        title: "Kitchen Wall Spot Painting",
        price: 500,
        types: ["modification"],
      },
      { title: "Ceiling Patch Repaint", price: 600, types: ["modification"] },
      { title: "Balcony Railing Repaint", price: 800, types: ["modification"] },
      { title: "Iron Gate Repaint", price: 1000, types: ["modification"] },
      {
        title: "Bathroom Ceiling Repaint",
        price: 700,
        types: ["modification"],
      },
      { title: "Garage Door Repaint", price: 1200, types: ["modification"] },
      // --- Modification + Renovation ---
      {
        title: "Gate/Main Door Painting",
        price: 1200,
        types: ["modification", "renovation"],
      },
      {
        title: "Accent Wall Painting",
        price: 1500,
        types: ["modification", "renovation"],
      },
      {
        title: "Anti-Fungal Paint Application",
        price: 1800,
        types: ["modification", "renovation"],
      },
      {
        title: "Metal Surface Repainting",
        price: 1000,
        types: ["modification", "renovation"],
      },
      {
        title: "Wooden Deck Staining",
        price: 2000,
        types: ["modification", "renovation"],
      },
      // --- Renovation only ---
      {
        title: "Complete Room Color Change",
        price: 4000,
        types: ["renovation"],
      },
      {
        title: "Kitchen Makeover Painting",
        price: 3500,
        types: ["renovation"],
      },
      {
        title: "Bedroom Redesign Painting",
        price: 3000,
        types: ["renovation"],
      },
      { title: "Living Room Feature Wall", price: 2500, types: ["renovation"] },
      { title: "Epoxy Floor Coating", price: 5000, types: ["renovation"] },
      {
        title: "Wallpaper Removal & Repaint",
        price: 3000,
        types: ["renovation"],
      },
      // --- Renovation + Construction ---
      {
        title: "Paint Room (12x12)",
        price: 3000,
        types: ["renovation", "construction"],
      },
      {
        title: "Ceiling Painting",
        price: 2500,
        types: ["renovation", "construction"],
      },
      {
        title: "Texture Painting",
        price: 4000,
        types: ["renovation", "construction"],
      },
      {
        title: "Wall Putty Work",
        price: 2200,
        types: ["renovation", "construction"],
      },
      {
        title: "Waterproofing Paint",
        price: 3500,
        types: ["renovation", "construction"],
      },
      {
        title: "Full House Painting",
        price: 20000,
        types: ["renovation", "construction"],
      },
      {
        title: "Exterior Wall Painting",
        price: 5000,
        types: ["renovation", "construction"],
      },
      {
        title: "Primer & Base Coat Application",
        price: 3000,
        types: ["renovation", "construction"],
      },
      {
        title: "Distemper Application",
        price: 2000,
        types: ["renovation", "construction"],
      },
      {
        title: "Emulsion Paint Application",
        price: 3500,
        types: ["renovation", "construction"],
      },
      // --- Construction only ---
      { title: "Boundary Wall Painting", price: 6000, types: ["construction"] },
      {
        title: "New Building Exterior Paint",
        price: 15000,
        types: ["construction"],
      },
      {
        title: "Multi-Story Building Paint",
        price: 40000,
        types: ["construction"],
      },
      {
        title: "Commercial Space Painting",
        price: 25000,
        types: ["construction"],
      },
      {
        title: "Warehouse/Factory Painting",
        price: 30000,
        types: ["construction"],
      },
      {
        title: "New Construction Primer Coat",
        price: 8000,
        types: ["construction"],
      },
    ],
    welder: [
      // --- Modification (repairs, fixes, small changes) ---
      { title: "Fix Main Gate", price: 2000, types: ["modification"] },
      { title: "Window Grill Repair", price: 1000, types: ["modification"] },
      { title: "Stair Railing Welding", price: 1500, types: ["modification"] },
      {
        title: "Exhaust Fan Bracket Welding",
        price: 600,
        types: ["modification"],
      },
      { title: "Broken Hinge Welding", price: 400, types: ["modification"] },
      { title: "Gate Lock Plate Welding", price: 500, types: ["modification"] },
      { title: "Iron Fence Repair", price: 1200, types: ["modification"] },
      { title: "Metal Chair Repair", price: 600, types: ["modification"] },
      { title: "Water Tank Stand Repair", price: 800, types: ["modification"] },
      { title: "Overhead Rack Repair", price: 700, types: ["modification"] },
      { title: "Car Porch Frame Repair", price: 1500, types: ["modification"] },
      { title: "Metal Pipe Welding", price: 500, types: ["modification"] },
      { title: "Garage Shutter Repair", price: 1800, types: ["modification"] },
      {
        title: "AC Outdoor Unit Stand Repair",
        price: 600,
        types: ["modification"],
      },
      { title: "Roof Bracket Repair", price: 1000, types: ["modification"] },
      // --- Modification + Renovation ---
      {
        title: "Iron Bed Frame Welding",
        price: 2000,
        types: ["modification", "renovation"],
      },
      {
        title: "Grill Modification/Resize",
        price: 1500,
        types: ["modification", "renovation"],
      },
      {
        title: "Gate Extension Welding",
        price: 2500,
        types: ["modification", "renovation"],
      },
      {
        title: "Railing Height Extension",
        price: 1800,
        types: ["modification", "renovation"],
      },
      {
        title: "Metal Door Frame Reinforcement",
        price: 2000,
        types: ["modification", "renovation"],
      },
      // --- Renovation only ---
      { title: "Window Grill Replacement", price: 2500, types: ["renovation"] },
      {
        title: "Staircase Railing Upgrade",
        price: 4000,
        types: ["renovation"],
      },
      { title: "Decorative Iron Gate", price: 6000, types: ["renovation"] },
      { title: "Car Porch Roof Upgrade", price: 8000, types: ["renovation"] },
      {
        title: "Ornamental Railing Design",
        price: 5000,
        types: ["renovation"],
      },
      {
        title: "Metal Pergola Installation",
        price: 7000,
        types: ["renovation"],
      },
      // --- Renovation + Construction ---
      {
        title: "Metal Shelf Making",
        price: 1800,
        types: ["renovation", "construction"],
      },
      {
        title: "New Gate Fabrication",
        price: 8000,
        types: ["renovation", "construction"],
      },
      {
        title: "Balcony Railing Installation",
        price: 3500,
        types: ["renovation", "construction"],
      },
      {
        title: "Steel Gate Welding",
        price: 2500,
        types: ["renovation", "construction"],
      },
      {
        title: "Security Grill Installation",
        price: 4000,
        types: ["renovation", "construction"],
      },
      {
        title: "Metal Door Frame Making",
        price: 3000,
        types: ["renovation", "construction"],
      },
      {
        title: "Iron Staircase Fabrication",
        price: 10000,
        types: ["renovation", "construction"],
      },
      {
        title: "Water Tank Stand Making",
        price: 2500,
        types: ["renovation", "construction"],
      },
      {
        title: "Boundary Fence Installation",
        price: 6000,
        types: ["renovation", "construction"],
      },
      {
        title: "Car Parking Shade Structure",
        price: 8000,
        types: ["renovation", "construction"],
      },
      // --- Construction only ---
      { title: "Roof Frame Welding", price: 5000, types: ["construction"] },
      {
        title: "Steel Structure Fabrication",
        price: 20000,
        types: ["construction"],
      },
      {
        title: "Industrial Racking System",
        price: 12000,
        types: ["construction"],
      },
      {
        title: "Metal Roof Truss Welding",
        price: 15000,
        types: ["construction"],
      },
      {
        title: "Commercial Shutter Fabrication",
        price: 10000,
        types: ["construction"],
      },
      {
        title: "Warehouse Frame Welding",
        price: 25000,
        types: ["construction"],
      },
    ],
    "glass worker": [
      // --- Modification (repairs, fixes, small changes) ---
      {
        title: "Window Glass Replacement",
        price: 1200,
        types: ["modification"],
      },
      { title: "Install Mirror", price: 800, types: ["modification"] },
      { title: "Aluminum Window Fix", price: 1500, types: ["modification"] },
      {
        title: "Cracked Glass Replacement",
        price: 600,
        types: ["modification"],
      },
      { title: "Glass Door Handle Fix", price: 400, types: ["modification"] },
      {
        title: "Frosted Film Application",
        price: 500,
        types: ["modification"],
      },
      { title: "Window Seal Repair", price: 350, types: ["modification"] },
      { title: "Glass Shelf Bracket Fix", price: 300, types: ["modification"] },
      { title: "Aquarium Glass Repair", price: 700, types: ["modification"] },
      {
        title: "Glass Cabinet Door Repair",
        price: 600,
        types: ["modification"],
      },
      {
        title: "Bathroom Mirror Replacement",
        price: 500,
        types: ["modification"],
      },
      {
        title: "Window Tinting (Per Window)",
        price: 800,
        types: ["modification"],
      },
      {
        title: "Photo Frame Glass Replacement",
        price: 250,
        types: ["modification"],
      },
      { title: "Glass Table Top Repair", price: 900, types: ["modification"] },
      {
        title: "Aluminum Sliding Track Repair",
        price: 600,
        types: ["modification"],
      },
      // --- Modification + Renovation ---
      {
        title: "Table Top Glass Fitting",
        price: 2000,
        types: ["modification", "renovation"],
      },
      {
        title: "Kitchen Cabinet Glass",
        price: 1500,
        types: ["modification", "renovation"],
      },
      {
        title: "Wardrobe Mirror Installation",
        price: 1200,
        types: ["modification", "renovation"],
      },
      {
        title: "Privacy Glass Upgrade",
        price: 2000,
        types: ["modification", "renovation"],
      },
      {
        title: "Decorative Glass Panel",
        price: 2500,
        types: ["modification", "renovation"],
      },
      // --- Renovation only ---
      { title: "Mirror Wall Decoration", price: 3000, types: ["renovation"] },
      { title: "Bathroom Glass Upgrade", price: 3500, types: ["renovation"] },
      { title: "Kitchen Backsplash Glass", price: 4000, types: ["renovation"] },
      {
        title: "Living Room Glass Feature",
        price: 5000,
        types: ["renovation"],
      },
      {
        title: "Stained Glass Window Installation",
        price: 6000,
        types: ["renovation"],
      },
      { title: "Glass Railing Upgrade", price: 7000, types: ["renovation"] },
      // --- Renovation + Construction ---
      {
        title: "Shower Glass Enclosure",
        price: 4000,
        types: ["renovation", "construction"],
      },
      {
        title: "Glass Door Installation",
        price: 5000,
        types: ["renovation", "construction"],
      },
      {
        title: "Sliding Window Installation",
        price: 3500,
        types: ["renovation", "construction"],
      },
      {
        title: "Balcony Glass Railing",
        price: 8000,
        types: ["renovation", "construction"],
      },
      {
        title: "Partition Glass Work",
        price: 6000,
        types: ["renovation", "construction"],
      },
      {
        title: "Glass Office Cabin",
        price: 10000,
        types: ["renovation", "construction"],
      },
      {
        title: "Double Glazed Window Installation",
        price: 5000,
        types: ["renovation", "construction"],
      },
      {
        title: "Glass Canopy Installation",
        price: 7000,
        types: ["renovation", "construction"],
      },
      {
        title: "Glass Staircase Railing",
        price: 9000,
        types: ["renovation", "construction"],
      },
      {
        title: "Aluminum Window Installation (Full Room)",
        price: 6000,
        types: ["renovation", "construction"],
      },
      // --- Construction only ---
      { title: "Skylight Installation", price: 7000, types: ["construction"] },
      {
        title: "Full Building Glass Facade",
        price: 50000,
        types: ["construction"],
      },
      {
        title: "Glass Curtain Wall System",
        price: 40000,
        types: ["construction"],
      },
      {
        title: "Commercial Storefront Glass",
        price: 15000,
        types: ["construction"],
      },
      {
        title: "Full House Window Glazing",
        price: 20000,
        types: ["construction"],
      },
      {
        title: "Glass Atrium Construction",
        price: 30000,
        types: ["construction"],
      },
    ],
    helper: [
      // --- Modification ---
      {
        title: "Furniture Moving (Within House)",
        price: 800,
        types: ["modification"],
      },
      { title: "Wall Cleaning", price: 500, types: ["modification"] },
      { title: "Gutter Cleaning", price: 600, types: ["modification"] },
      { title: "Roof Cleaning", price: 900, types: ["modification"] },
      { title: "Paint Scraping", price: 700, types: ["modification"] },
      { title: "Old Fixture Removal", price: 500, types: ["modification"] },
      { title: "Tile Grouting Cleanup", price: 400, types: ["modification"] },
      {
        title: "Floor Scrubbing & Cleaning",
        price: 600,
        types: ["modification"],
      },
      // --- All types ---
      {
        title: "Daily Wage Labor",
        price: 1200,
        types: ["modification", "renovation", "construction"],
      },
      {
        title: "Debris Removal",
        price: 1000,
        types: ["modification", "renovation", "construction"],
      },
      {
        title: "Material Shifting",
        price: 1500,
        types: ["modification", "renovation", "construction"],
      },
      {
        title: "Loading/Unloading",
        price: 800,
        types: ["modification", "renovation", "construction"],
      },
      {
        title: "Paint Mixing & Supply",
        price: 600,
        types: ["modification", "renovation", "construction"],
      },
      {
        title: "Material Carrying",
        price: 700,
        types: ["modification", "renovation", "construction"],
      },
      {
        title: "Tool & Equipment Setup",
        price: 500,
        types: ["modification", "renovation", "construction"],
      },
      {
        title: "Water Supply for Site",
        price: 400,
        types: ["modification", "renovation", "construction"],
      },
      // --- Modification + Renovation ---
      {
        title: "Garden Cleanup",
        price: 1500,
        types: ["modification", "renovation"],
      },
      {
        title: "Old Wallpaper Removal",
        price: 800,
        types: ["modification", "renovation"],
      },
      {
        title: "Furniture Disassembly",
        price: 1000,
        types: ["modification", "renovation"],
      },
      {
        title: "Post-Work Site Cleanup",
        price: 1200,
        types: ["modification", "renovation"],
      },
      // --- Renovation + Construction ---
      {
        title: "Construction Site Cleanup",
        price: 2000,
        types: ["renovation", "construction"],
      },
      {
        title: "Cement Mixing",
        price: 900,
        types: ["renovation", "construction"],
      },
      {
        title: "Demolition Work",
        price: 2200,
        types: ["renovation", "construction"],
      },
      {
        title: "Sand Sieving",
        price: 600,
        types: ["renovation", "construction"],
      },
      {
        title: "Brick Breaking",
        price: 1000,
        types: ["renovation", "construction"],
      },
      {
        title: "Rubble Clearing",
        price: 1500,
        types: ["renovation", "construction"],
      },
      {
        title: "Material Sorting",
        price: 700,
        types: ["renovation", "construction"],
      },
      {
        title: "Concrete Vibration Work",
        price: 1200,
        types: ["renovation", "construction"],
      },
      // --- Construction only ---
      { title: "Scaffolding Assembly", price: 3000, types: ["construction"] },
      { title: "Digging Foundation", price: 2500, types: ["construction"] },
      { title: "Trench Digging", price: 2000, types: ["construction"] },
      {
        title: "Steel Bar Cutting & Bending",
        price: 1800,
        types: ["construction"],
      },
      { title: "Formwork Assembly", price: 2500, types: ["construction"] },
      { title: "Site Leveling", price: 3000, types: ["construction"] },
      {
        title: "Earth Filling & Compaction",
        price: 2500,
        types: ["construction"],
      },
      { title: "Heavy Material Hauling", price: 2000, types: ["construction"] },
    ],
    hvac: [
      // --- Modification (repairs, fixes, small changes) ---
      { title: "AC Service", price: 1500, types: ["modification"] },
      { title: "Gas Refill", price: 3000, types: ["modification"] },
      { title: "AC Repair", price: 1800, types: ["modification"] },
      { title: "AC Filter Replacement", price: 800, types: ["modification"] },
      { title: "AC Compressor Repair", price: 4000, types: ["modification"] },
      { title: "Capacitor Replacement", price: 600, types: ["modification"] },
      { title: "AC Remote Programming", price: 300, types: ["modification"] },
      {
        title: "Condenser Coil Cleaning",
        price: 1200,
        types: ["modification"],
      },
      { title: "Evaporator Coil Repair", price: 2000, types: ["modification"] },
      { title: "Fan Motor Replacement", price: 1500, types: ["modification"] },
      { title: "Refrigerant Leak Fix", price: 2500, types: ["modification"] },
      { title: "PCB Board Repair", price: 1800, types: ["modification"] },
      { title: "Drain Line Cleaning", price: 500, types: ["modification"] },
      { title: "AC Vibration/Noise Fix", price: 800, types: ["modification"] },
      { title: "Thermostat Wire Repair", price: 600, types: ["modification"] },
      // --- Modification + Renovation ---
      {
        title: "Thermostat Installation",
        price: 1200,
        types: ["modification", "renovation"],
      },
      {
        title: "Smart AC Controller Setup",
        price: 1500,
        types: ["modification", "renovation"],
      },
      {
        title: "AC Unit Relocation",
        price: 2000,
        types: ["modification", "renovation"],
      },
      {
        title: "AC Bracket Replacement",
        price: 800,
        types: ["modification", "renovation"],
      },
      {
        title: "Copper Pipe Replacement",
        price: 1500,
        types: ["modification", "renovation"],
      },
      // --- Renovation only ---
      { title: "Duct Cleaning", price: 2000, types: ["renovation"] },
      { title: "AC System Upgrade", price: 5000, types: ["renovation"] },
      {
        title: "Old AC Removal & Disposal",
        price: 1500,
        types: ["renovation"],
      },
      { title: "Ductwork Renovation", price: 8000, types: ["renovation"] },
      {
        title: "Ceiling Cassette AC Upgrade",
        price: 6000,
        types: ["renovation"],
      },
      { title: "Exhaust System Overhaul", price: 4000, types: ["renovation"] },
      // --- Renovation + Construction ---
      {
        title: "AC Installation",
        price: 2500,
        types: ["renovation", "construction"],
      },
      {
        title: "Split AC Installation",
        price: 3500,
        types: ["renovation", "construction"],
      },
      {
        title: "Window AC Installation",
        price: 1500,
        types: ["renovation", "construction"],
      },
      {
        title: "Ventilation System Setup",
        price: 5000,
        types: ["renovation", "construction"],
      },
      {
        title: "Central AC Maintenance",
        price: 6000,
        types: ["renovation", "construction"],
      },
      {
        title: "Exhaust Fan Installation",
        price: 800,
        types: ["renovation", "construction"],
      },
      {
        title: "Kitchen Chimney Installation",
        price: 3000,
        types: ["renovation", "construction"],
      },
      {
        title: "Ceiling Cassette AC Installation",
        price: 8000,
        types: ["renovation", "construction"],
      },
      {
        title: "Floor Standing AC Installation",
        price: 4000,
        types: ["renovation", "construction"],
      },
      {
        title: "Fresh Air Ventilation System",
        price: 6000,
        types: ["renovation", "construction"],
      },
      // --- Construction only ---
      {
        title: "Central AC Ductwork Installation",
        price: 25000,
        types: ["construction"],
      },
      {
        title: "VRF/VRV System Installation",
        price: 40000,
        types: ["construction"],
      },
      { title: "Chiller Plant Setup", price: 50000, types: ["construction"] },
      {
        title: "Commercial HVAC System",
        price: 60000,
        types: ["construction"],
      },
      {
        title: "Industrial Ventilation Setup",
        price: 30000,
        types: ["construction"],
      },
      {
        title: "Full Building AC Installation",
        price: 80000,
        types: ["construction"],
      },
    ],
    // Default fallback
    default: [
      {
        title: "General Service",
        price: 1000,
        types: ["modification", "renovation", "construction"],
      },
      {
        title: "Consultation",
        price: 500,
        types: ["modification", "renovation", "construction"],
      },
    ],
  };

  // Handle spaces in URLs (e.g., "glass%20worker")
  const decodedCategory = decodeURIComponent(subCategory).toLowerCase();
  const allJobs = jobList[decodedCategory] || jobList["default"];

  // Filter jobs based on service type
  const jobs = serviceType
    ? allJobs.filter((job) => job.types.includes(serviceType))
    : allJobs;

  const handleSelectJob = (job) => {
    navigate(
      `/contractors/${subCategory}?job=${encodeURIComponent(job.title)}&price=${
        job.price
      }`,
    );
  };

  // Label for display
  const serviceLabel = serviceType
    ? serviceType.charAt(0).toUpperCase() + serviceType.slice(1)
    : "";

  return (
    <div className="min-h-screen bg-base-200 py-10 px-4">
      <h1 className="text-4xl font-bold text-center mb-2 capitalize">
        {serviceLabel ? `${serviceLabel} — ` : ""}Select {decodedCategory} Task
      </h1>
      <p className="text-center text-gray-500 mb-10">
        {serviceLabel
          ? `Showing ${serviceLabel.toLowerCase()}-related ${decodedCategory} services`
          : "Choose the specific work you need done"}
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

        {/* Others Card */}
        <div
          onClick={() =>
            navigate(`/contractors/${subCategory}?job=custom&isCustom=true`)
          }
          className="flex justify-between items-center p-6 bg-gradient-to-br from-secondary/20 to-accent/20 border-2 border-dashed border-secondary rounded-xl shadow-md hover:bg-secondary hover:text-white cursor-pointer transition-all group"
        >
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <HelpCircle size={24} className="group-hover:animate-pulse" />
              Others
            </h3>
            <p className="text-sm opacity-70 group-hover:text-white mt-1">
              Can't find your job? Describe it yourself
            </p>
          </div>
          <ArrowRight />
        </div>
      </div>
    </div>
  );
};

export default JobSelection;

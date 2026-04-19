const { GoogleGenerativeAI } = require("@google/generative-ai");
const User = require("../models/User");
const Contractor = require("../models/Contractor");

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// @desc    Analyze user issue and recommend contractors
// @route   POST /api/ai/recommend
const getAIRecommendations = async (req, res) => {
  const { query } = req.body;

  try {
    // 1. Fetch all contractors (Skills & Names)
    const contractors = await Contractor.find().select("fullName skill _id");

    // Create a mini-database string for AI to read
    const contractorList = contractors
      .map((c) => `${c.fullName} (Skill: ${c.skill}, ID: ${c._id})`)
      .join(", ");

    // 2. Ask Gemini (Updated Model: gemini-1.5-flash)
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Act as a construction expert. 
      User Problem: "${query}"
      
      Available Contractors: [${contractorList}]
      
      Task: 
      1. Identify the trade needed (e.g., Plumber, Electrician).
      2. Recommend up to 3 specific contractors from the list above who match that trade.
      3. Reply in strict JSON format:
      {
        "analysis": "Brief explanation of the problem",
        "recommendedSkill": "Plumber",
        "contractorIds": ["id1", "id2"] 
      }
      Do not include Markdown formatting like \`\`\`json. Just the raw JSON string.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response
      .text()
      .replace(/```json|```/g, "")
      .trim(); // Clean up formatting

    const aiData = JSON.parse(text);

    // 3. Fetch full details of the recommended contractors
    const recommendedProfiles = await Contractor.find({
      _id: { $in: aiData.contractorIds },
    }).select("-password");

    res.json({
      analysis: aiData.analysis,
      skill: aiData.recommendedSkill,
      contractors: recommendedProfiles,
    });
  } catch (error) {
    console.error("AI Error:", error);
    // If JSON parsing fails or AI fails, send a readable error
    res
      .status(500)
      .json({ message: "AI Service Unavailable", error: error.message });
  }
};

// @desc    Estimate construction costs, materials, and time
// @route   POST /api/ai/estimate
const estimateConstructionCost = async (req, res) => {
  const { query, marlaSize, materialPrices, projectContext } = req.body;

  try {
    if (!query || !marlaSize) {
      return res
        .status(400)
        .json({ message: "Query and marlaSize are required" });
    }

    // Validate construction-only
    const nonConstructionKeywords = ["general", "chat", "how are you", "hello"];
    const queryLower = query.toLowerCase();
    const isGeneralChat = nonConstructionKeywords.some((keyword) =>
      queryLower.includes(keyword),
    );

    if (isGeneralChat && !queryLower.includes("construction")) {
      return res.status(400).json({
        message:
          "I can only help with construction-related queries. Please ask about building, renovation, or construction projects.",
      });
    }

    // Initialize Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    // Pakistani market material prices
    const defaultPrices = {
      brick: 20,
      cementBag: 950,
      sand: 2500,
      steel: 350,
      paint: 3000,
      tile: 150,
      labor: 1000,
      marble: 500,
      gravel: 2000,
      rebar: 180,
      glass: 200,
      wood: 300,
      pvcpipe: 100,
    };

    const prices = materialPrices || defaultPrices;

    const prompt = `
### ROLE
You are an expert construction estimator specializing in the Pakistani construction industry. Your estimates must be realistic, accurate, and localized.

### PROJECT CONTEXT
- Marla Size (Units): ${marlaSize}
- User Query: "${query}"
${projectContext ? `- Previous Context: "${projectContext}"` : ""}

### SECTION 1: DEFAULT MATERIAL PRICES (PKR)
Use these unit rates for all bulk material calculations:
- Brick: Rs. ${prices.brick} per piece
- Cement (50kg bag): Rs. ${prices.cementBag}
- Sand: Rs. ${prices.sand} per ton
- Steel/Rebar: Rs. ${prices.steel} (Steel) / Rs. ${prices.rebar} (Rebar) per kg
- Paint: Rs. ${prices.paint} per liter
- Tile/Marble: Rs. ${prices.tile} (Tile) / Rs. ${prices.marble} (Marble) per sq ft
- General Labor: Rs. ${prices.labor} per sq ft
- Gravel: Rs. ${prices.gravel} per ton
- Glass: Rs. ${prices.glass} per sq ft
- Wood: Rs. ${prices.wood} per sq ft
- PVC Pipe: Rs. ${prices.pvcpipe} per meter

### SECTION 2: ACCURACY & CALCULATION RULES
1. **Marla Standards:** Pakistani Marla is 225 sq ft (Punjab/Urban) or 272 sq ft (Old Standard). Unless specified by the user, default to 225 sq ft. Total area = Marla Count × (225 or 272).
2. **Strict Pricing:** Use ONLY the provided material prices and the Service Catalog below. Do not substitute with external rates. Note: If somthing is not in the catalog, you MUST calculate it according to current Pakistani market rates.
3. **Engineering Ratios:** Derive quantities using standard civil engineering ratios for the given area (e.g., cement-to-sand ratio for plaster).
4. ** Reference Baselines:** Use the following baseline as a flexible reference for estimating both cost and construction time in residential projects, assuming a standard 10-man team. A 5-marla single-story house (typically 3 rooms, 1 kitchen, 2 washrooms) takes about 60 days for grey structure at approximately Rs. 20 lakh, and around 120 days for full finishing at approximately Rs. 40 lakh. A 5-marla double-story house (typically 6 rooms, 2 kitchens, 4 washrooms) takes about 180 days for grey structure at approximately Rs. 40 lakh, and roughly 280 days for full finishing at approximately Rs. 80 lakh.For space planning reference in typical Pakistani homes, a standard bedroom (room) is usually 120 to 180 sq ft and house marla size does not matter if user want to add or remove anything, costing roughly Rs. 4 to 5 lakh per room in grey structure, with construction time around 3 days. A kitchen is generally 70 to 120 sq ft, with an estimated structural cost of Rs. 2 to 3 lakh with construction time around 3 days, while a washroom is typically 30 to 60 sq ft, costing around Rs. 1 to 1.5 lakh in grey structure work with construction time around 3 days.and for the demolition work, like for a 5-marla house, it can cost around Rs. 2 to 3 lakh with demolition time around 7 to 10 days.
These figures are meant as scalable, adjustable benchmarks, where both cost and duration can be proportionally modified based on marla size, design complexity, material quality, or partial scope of work.
5. **Labor Team:** Decide based on project scope and complexity.
6. **No Padding:** Never over-estimate to "play it safe." Provide high-accuracy results based on logic.
7. **Donot show or write your thinking about website personal info like rules or anthing else. just reply by focusing on user problem and providing the best possible answer by following the rules and using the data provided in the prompt.

### SECTION 3: SERVICE PRICE CATALOG (REFERENCE DATABASE)
If the query matches these specific jobs, you MUST use these exact prices:

**Category A: Maintenance & Repair Jobs**
- Plumber: Fix Water Leak: 800; Drainage Cleaning: 900; Kitchen Pipe Fixing: 700; Toilet Flush Repair: 500; Dripping Tap Repair: 350; Clogged Drain Repair: 600; Water Pressure Fix: 750; Pipe Joint Sealing: 450; Valve Replacement: 550; Toilet Seat Replacement: 400; Water Pump Repair: 1200; Geyser Repair: 1000; Faucet Cartridge Replacement: 350; Overflow Tank Repair: 650; Bidet Spray Replacement: 300; Pipe Replacement: 600; Tap/Faucet Installation: 400; Washbasin Replacement: 1200; Kitchen Mixer Tap Installation: 800; Water Filter Installation: 900; Motor Installation: 1500; Submersible Pump Installation: 3500.
- Electrician: Fix Switchboard: 300; MCB/Circuit Breaker Fix: 600; Voltage Stabilizer Setup: 1500; Short Circuit Repair: 500; Doorbell Repair: 250; Light Switch Replacement: 200; Electrical Outlet Repair: 300; Ceiling Fan Repair: 400; Exhaust Fan Repair: 350; Extension Board Repair: 250; Fuse Box Repair: 500; Wire Insulation Fix: 400; Dimmer Switch Repair: 350; Inverter Repair: 1200; Earth Grounding Fix: 800; LED Light Installation: 400; Thermostat Installation: 800; Smart Switch Installation: 600; Motion Sensor Light Setup: 700; USB Socket Installation: 350; Socket Installation: 250; Electrical Panel Upgrade: 2500.
- Carpenter: Repair Table: 1200; Fix Door Lock: 500; Window Frame Repair: 1500; Door Frame Repair: 1800; Drawer Sliding Fix: 400; Cabinet Hinge Replacement: 300; Door Handle Replacement: 350; Furniture Polish/Refinish: 1500; Loose Chair/Stool Repair: 600; Wardrobe Lock Repair: 400; Wooden Floor Scratch Repair: 800; Broken Shelf Repair: 500; Window Shutters Repair: 1000; Wooden Gate Repair: 1200; Termite Damaged Wood Repair: 2000; Shelving Installation: 2000; Door Replacement: 3000; Window Replacement: 2500; Cabinet Door Replacement: 1800; Countertop Installation: 4000; Make New Chair: 3000; Kitchen Cabinets: 8000; Wardrobe Installation: 12000; Bed Frame Making: 5000; TV Cabinet Making: 4000; False Ceiling Work: 6000; Wooden Flooring: 10000; Dining Table Making: 8000; Bookshelf Construction: 4500; Wooden Partition Wall: 6000; Study Desk Making: 3500.
- Mason: Wall Crack Repair: 800; Roof Repair: 2500; Ceiling Repair: 2000; Broken Tile Replacement: 600; Step/Stair Repair: 1200; Damp Wall Treatment: 1500; Slab Leakage Repair: 2000; Water Seepage Fix: 1800; Drain Cover Repair: 500; Pillar Repair: 2500; Concrete Patch Work: 800; Plinth Repair: 1200; Parapet Wall Repair: 1500; Lintel Repair: 2000; Manhole Cover Repair: 700; Wall Plaster (Per ft): 200; Floor Leveling: 1500; Wall Waterproofing: 2500; Driveway Repair: 3000; Terrace Waterproofing: 4000.
- Painter: Door Polish: 1500; Kitchen Cabinet Polish: 2000; Wooden Furniture Polish: 1800; Touch-Up Paint Work: 500; Scratch & Stain Removal: 400; Paint Peeling Repair: 600; Rust Removal & Repaint: 800; Window Frame Repaint: 700; Staircase Railing Repaint: 900; Kitchen Wall Spot Painting: 500; Ceiling Patch Repaint: 600; Balcony Railing Repaint: 800; Iron Gate Repaint: 1000; Bathroom Ceiling Repaint: 700; Garage Door Repaint: 1200; Gate/Main Door Painting: 1200; Accent Wall Painting: 1500; Anti-Fungal Paint Application: 1800; Metal Surface Repainting: 1000; Wooden Deck Staining: 2000.
- Welder: Fix Main Gate: 2000; Window Grill Repair: 1000; Stair Railing Welding: 1500; Exhaust Fan Bracket Welding: 600; Broken Hinge Welding: 400; Gate Lock Plate Welding: 500; Iron Fence Repair: 1200; Metal Chair Repair: 600; Water Tank Stand Repair: 800; Overhead Rack Repair: 700; Car Porch Frame Repair: 1500; Metal Pipe Welding: 500; Garage Shutter Repair: 1800; AC Outdoor Unit Stand Repair: 600; Roof Bracket Repair: 1000; Iron Bed Frame Welding: 2000; Grill Modification/Resize: 1500; Gate Extension Welding: 2500; Railing Height Extension: 1800; Metal Door Frame Reinforcement: 2000.
- Glass Worker: Window Glass Replacement: 1200; Install Mirror: 800; Aluminum Window Fix: 1500; Cracked Glass Replacement: 600; Glass Door Handle Fix: 400; Frosted Film Application: 500; Window Seal Repair: 350; Glass Shelf Bracket Fix: 300; Aquarium Glass Repair: 700; Glass Cabinet Door Repair: 600; Bathroom Mirror Replacement: 500; Window Tinting (Per Window): 800; Photo Frame Glass Replacement: 250; Glass Table Top Repair: 900; Aluminum Sliding Track Repair: 600; Table Top Glass Fitting: 2000; Kitchen Cabinet Glass: 1500; Wardrobe Mirror Installation: 1200; Privacy Glass Upgrade: 2000; Decorative Glass Panel: 2500.
- HVAC: AC Service: 1500; Gas Refill: 3000; AC Repair: 1800; AC Filter Replacement: 800; AC Compressor Repair: 4000; Capacitor Replacement: 600; AC Remote Programming: 300; Condenser Coil Cleaning: 1200; Evaporator Coil Repair: 2000; Fan Motor Replacement: 1500; Refrigerant Leak Fix: 2500; PCB Board Repair: 1800; Drain Line Cleaning: 500; AC Vibration/Noise Fix: 800; Thermostat Wire Repair: 600; Thermostat Installation: 1200; Smart AC Controller Setup: 1500; AC Unit Relocation: 2000; AC Bracket Replacement: 800; Copper Pipe Replacement: 1500.
- Helper: Furniture Moving: 800; Wall Cleaning: 500; Gutter Cleaning: 600; Roof Cleaning: 900; Paint Scraping: 700; Old Fixture Removal: 500; Tile Grouting Cleanup: 400; Floor Scrubbing & Cleaning: 600; Daily Wage Labor: 1200; Debris Removal: 1000; Material Shifting: 1500; Loading/Unloading: 800; Paint Mixing & Supply: 600; Material Carrying: 700; Tool & Equipment Setup: 500; Water Supply for Site: 400; Garden Cleanup: 1500; Old Wallpaper Removal: 800; Furniture Disassembly: 1000; Post-Work Site Cleanup: 1200.

**Category B: Modification Related Jobs**
- Plumber: Bathroom Fixture Upgrade: 2500; Kitchen Plumbing Overhaul: 4500; Replace Old Piping System: 5000; Bathtub Replacement: 3500; Shower Mixer Upgrade: 1800; Water Softener Installation: 3000; Pipe Replacement: 600; Tap/Faucet Installation: 400; Washbasin Replacement: 1200; Kitchen Mixer Tap Installation: 800; Water Filter Installation: 900; Install Sink: 1000; Toilet Installation: 1200; Shower Installation: 1500; Water Heater Installation: 2500; Water Tank Installation: 2000; Full Bathroom Fitting: 5000; Underground Water Line: 4000; Sewage Line Installation: 6000; Rainwater Harvesting Setup: 8000; Solar Water Heater Installation: 12000.
- Electrician: LED Light Installation: 400; Thermostat Installation: 800; Smart Switch Installation: 600; Motion Sensor Light Setup: 700; USB Socket Installation: 350; Chandelier Installation: 800; Recessed Lighting Upgrade: 1500; Under-Cabinet Lighting: 1200; Bathroom Light Upgrade: 600; Track Lighting Installation: 1800; Strip LED Lighting Setup: 1000; Install Ceiling Fan: 500; Outdoor Lighting Setup: 2500; Electric Meter Installation: 1200; UPS Wiring: 2000; Generator Wiring: 3000; Security Camera Wiring: 2500; Intercom System Wiring: 3000; Solar Panel Wiring: 5000; EV Charger Installation: 4000.
- Carpenter: Shelving Installation: 2000; Door Replacement: 3000; Window Replacement: 2500; Cabinet Door Replacement: 1800; Countertop Installation: 4000; Kitchen Cabinet Refacing: 6000; Staircase Railing Upgrade: 5000; Room Paneling Work: 8000; Bathroom Vanity Installation: 4500; Closet System Renovation: 7000; Deck/Patio Restoration: 10000; Make New Chair: 3000; Kitchen Cabinets: 8000; Wardrobe Installation: 12000; Bed Frame Making: 5000; TV Cabinet Making: 4000; False Ceiling Work: 6000; Wooden Flooring: 10000; Dining Table Making: 8000; Bookshelf Construction: 4500; Wooden Partition Wall: 6000; Study Desk Making: 3500.
- Mason: Wall Plaster (Per ft): 200; Floor Leveling: 1500; Wall Waterproofing: 2500; Driveway Repair: 3000; Terrace Waterproofing: 4000; Bathroom Demolition & Rebuild: 8000; Kitchen Counter Rebuilding: 6000; Old Floor Removal & Re-tiling: 5000; Room Expansion Cutting: 4000; Staircase Renovation: 7000; Porch/Veranda Renovation: 10000; Floor Tiling (Per ft): 200; Bathroom Tiling: 4000; Kitchen Tiling: 3500; Marble/Granite Installation: 8000; Concrete Flooring: 6000; Driveway Paving: 10000; Retaining Wall Construction: 12000; RCC Slab Casting: 15000; Plastering Full Room: 4000; Stone Cladding Work: 6000.
- Painter: Gate/Main Door Painting: 1200; Accent Wall Painting: 1500; Anti-Fungal Paint Application: 1800; Metal Surface Repainting: 1000; Wooden Deck Staining: 2000; Complete Room Color Change: 4000; Kitchen Makeover Painting: 3500; Bedroom Redesign Painting: 3000; Living Room Feature Wall: 2500; Epoxy Floor Coating: 5000; Wallpaper Removal & Repaint: 3000; Paint Room (12x12): 3000; Ceiling Painting: 2500; Texture Painting: 4000; Wall Putty Work: 2200; Waterproofing Paint: 3500; Full House Painting: 20000; Exterior Wall Painting: 5000; Primer & Base Coat Application: 3000; Distemper Application: 2000; Emulsion Paint Application: 3500.
- Welder: Iron Bed Frame Welding: 2000; Grill Modification/Resize: 1500; Gate Extension Welding: 2500; Railing Height Extension: 1800; Metal Door Frame Reinforcement: 2000; Window Grill Replacement: 2500; Staircase Railing Upgrade: 4000; Decorative Iron Gate: 6000; Car Porch Roof Upgrade: 8000; Ornamental Railing Design: 5000; Metal Pergola Installation: 7000; Metal Shelf Making: 1800; New Gate Fabrication: 8000; Balcony Railing Installation: 3500; Steel Gate Welding: 2500; Security Grill Installation: 4000; Metal Door Frame Making: 3000; Iron Staircase Fabrication: 10000; Water Tank Stand Making: 2500; Boundary Fence Installation: 6000; Car Parking Shade Structure: 8000.
- Glass Worker: Table Top Glass Fitting: 2000; Kitchen Cabinet Glass: 1500; Wardrobe Mirror Installation: 1200; Privacy Glass Upgrade: 2000; Decorative Glass Panel: 2500; Mirror Wall Decoration: 3000; Bathroom Glass Upgrade: 3500; Kitchen Backsplash Glass: 4000; Living Room Glass Feature: 5000; Stained Glass Window Installation: 6000; Glass Railing Upgrade: 7000; Shower Glass Enclosure: 4000; Glass Door Installation: 5000; Sliding Window Installation: 3500; Balcony Glass Railing: 8000; Partition Glass Work: 6000; Glass Office Cabin: 10000; Double Glazed Window Installation: 5000; Glass Canopy Installation: 7000; Glass Staircase Railing: 9000; Aluminum Window Installation (Full Room): 6000.
- Helper: Daily Wage Labor: 1200; Debris Removal: 1000; Material Shifting: 1500; Loading/Unloading: 800; Paint Mixing & Supply: 600; Material Carrying: 700; Tool & Equipment Setup: 500; Water Supply for Site: 400; Garden Cleanup: 1500; Old Wallpaper Removal: 800; Furniture Disassembly: 1000; Post-Work Site Cleanup: 1200; Construction Site Cleanup: 2000; Cement Mixing: 900; Demolition Work: 2200; Sand Sieving: 600; Brick Breaking: 1000; Rubble Clearing: 1500; Material Sorting: 700; Concrete Vibration Work: 1200.
- HVAC: Thermostat Installation: 1200; Smart AC Controller Setup: 1500; AC Unit Relocation: 2000; AC Bracket Replacement: 800; Copper Pipe Replacement: 1500; Duct Cleaning: 2000; AC System Upgrade: 5000; Old AC Removal & Disposal: 1500; Ductwork Renovation: 8000; Ceiling Cassette AC Upgrade: 6000; Exhaust System Overhaul: 4000; AC Installation: 2500; Split AC Installation: 3500; Window AC Installation: 1500; Ventilation System Setup: 5000; Central AC Maintenance: 6000; Exhaust Fan Installation: 800; Kitchen Chimney Installation: 3000; Ceiling Cassette AC Installation: 8000; Floor Standing AC Installation: 4000; Fresh Air Ventilation System: 6000.

**Category C: General Construction Related Jobs**
- Plumber: Motor Installation: 1500; Submersible Pump Installation: 3500; Install Sink: 1000; Toilet Installation: 1200; Shower Installation: 1500; Water Heater Installation: 2500; Water Tank Installation: 2000; Full Bathroom Fitting: 5000; Underground Water Line: 4000; Sewage Line Installation: 6000; Rainwater Harvesting Setup: 8000; Solar Water Heater Installation: 12000; Complete House Plumbing: 25000; Main Water Supply Line: 8000; Septic Tank Plumbing: 10000; Multi-Story Water Distribution: 15000; Fire Hydrant Line Installation: 12000; Commercial Plumbing Setup: 30000.
- Electrician: Socket Installation: 250; Electrical Panel Upgrade: 2500; Install Ceiling Fan: 500; Outdoor Lighting Setup: 2500; Electric Meter Installation: 1200; UPS Wiring: 2000; Generator Wiring: 3000; Security Camera Wiring: 2500; Intercom System Wiring: 3000; Solar Panel Wiring: 5000; EV Charger Installation: 4000; Full House Wiring: 15000; 3-Phase Power Setup: 8000; Commercial Electrical Wiring: 25000; Industrial Panel Board Setup: 12000; Underground Cable Installation: 6000; Main Distribution Board Setup: 5000.
- Carpenter: Shelving Installation: 2000; Door Replacement: 3000; Window Replacement: 2500; Cabinet Door Replacement: 1800; Countertop Installation: 4000; Make New Chair: 3000; Kitchen Cabinets: 8000; Wardrobe Installation: 12000; Bed Frame Making: 5000; TV Cabinet Making: 4000; False Ceiling Work: 6000; Wooden Flooring: 10000; Dining Table Making: 8000; Bookshelf Construction: 4500; Wooden Partition Wall: 6000; Study Desk Making: 3500; Full House Woodwork: 50000; Main Entrance Door Making: 8000; Wooden Staircase Construction: 20000; Roof Truss Construction: 15000; Custom Built-in Furniture: 25000; Wooden Window Frames (Full House): 18000.
- Mason: Wall Plaster (Per ft): 200; Floor Leveling: 1500; Wall Waterproofing: 2500; Driveway Repair: 3000; Terrace Waterproofing: 4000; Floor Tiling (Per ft): 200; Bathroom Tiling: 4000; Kitchen Tiling: 3500; Marble/Granite Installation: 8000; Concrete Flooring: 6000; Driveway Paving: 10000; Retaining Wall Construction: 12000; RCC Slab Casting: 15000; Plastering Full Room: 4000; Stone Cladding Work: 6000; Build Wall: 5000; Boundary Wall Construction: 15000; Room Extension: 25000; Brick Laying (Per ft): 200; Foundation Laying: 20000; Column & Beam Construction: 18000; Full Roof Slab Construction: 30000; Overhead Water Tank Platform: 8000; Septic Tank Construction: 12000; Commercial Building Masonry: 50000.
- Painter: Gate/Main Door Painting: 1200; Accent Wall Painting: 1500; Anti-Fungal Paint Application: 1800; Metal Surface Repainting: 1000; Wooden Deck Staining: 2000; Paint Room (12x12): 3000; Ceiling Painting: 2500; Texture Painting: 4000; Wall Putty Work: 2200; Waterproofing Paint: 3500; Full House Painting: 20000; Exterior Wall Painting: 5000; Primer & Base Coat Application: 3000; Distemper Application: 2000; Emulsion Paint Application: 3500; Boundary Wall Painting: 6000; New Building Exterior Paint: 15000; Multi-Story Building Paint: 40000; Commercial Space Painting: 25000; Warehouse/Factory Painting: 30000; New Construction Primer Coat: 8000.
- Welder: Iron Bed Frame Welding: 2000; Grill Modification/Resize: 1500; Gate Extension Welding: 2500; Railing Height Extension: 1800; Metal Door Frame Reinforcement: 2000; Metal Shelf Making: 1800; New Gate Fabrication: 8000; Balcony Railing Installation: 3500; Steel Gate Welding: 2500; Security Grill Installation: 4000; Metal Door Frame Making: 3000; Iron Staircase Fabrication: 10000; Water Tank Stand Making: 2500; Boundary Fence Installation: 6000; Car Parking Shade Structure: 8000; Roof Frame Welding: 5000; Steel Structure Fabrication: 20000; Industrial Racking System: 12000; Metal Roof Truss Welding: 15000; Commercial Shutter Fabrication: 10000; Warehouse Frame Welding: 25000.
- Glass Worker: Table Top Glass Fitting: 2000; Kitchen Cabinet Glass: 1500; Wardrobe Mirror Installation: 1200; Privacy Glass Upgrade: 2000; Decorative Glass Panel: 2500; Shower Glass Enclosure: 4000; Glass Door Installation: 5000; Sliding Window Installation: 3500; Balcony Glass Railing: 8000; Partition Glass Work: 6000; Glass Office Cabin: 10000; Double Glazed Window Installation: 5000; Glass Canopy Installation: 7000; Glass Staircase Railing: 9000; Aluminum Window Installation (Full Room): 6000; Skylight Installation: 7000; Full Building Glass Facade: 50000; Glass Curtain Wall System: 40000; Commercial Storefront Glass: 15000; Full House Window Glazing: 20000; Glass Atrium Construction: 30000.
- Helper: Daily Wage Labor: 1200; Debris Removal: 1000; Material Shifting: 1500; Loading/Unloading: 800; Paint Mixing & Supply: 600; Material Carrying: 700; Tool & Equipment Setup: 500; Water Supply for Site: 400; Construction Site Cleanup: 2000; Cement Mixing: 900; Demolition Work: 2200; Sand Sieving: 600; Brick Breaking: 1000; Rubble Clearing: 1500; Material Sorting: 700; Concrete Vibration Work: 1200; Scaffolding Assembly: 3000; Digging Foundation: 2500; Trench Digging: 2000; Steel Bar Cutting & Bending: 1800; Formwork Assembly: 2500; Site Leveling: 3000; Earth Filling & Compaction: 2500; Heavy Material Hauling: 2000.
- HVAC: Thermostat Installation: 1200; Smart AC Controller Setup: 1500; AC Unit Relocation: 2000; AC Bracket Replacement: 800; Copper Pipe Replacement: 1500; Duct Cleaning: 2000; AC System Upgrade: 5000; Old AC Removal & Disposal: 1500; Ductwork Renovation: 8000; Ceiling Cassette AC Upgrade: 6000; Exhaust System Overhaul: 4000; AC Installation: 2500; Split AC Installation: 3500; Window AC Installation: 1500; Ventilation System Setup: 5000; Central AC Maintenance: 6000; Exhaust Fan Installation: 800; Kitchen Chimney Installation: 3000; Ceiling Cassette AC Installation: 8000; Floor Standing AC Installation: 4000; Fresh Air Ventilation System: 6000; Central AC Ductwork Installation: 25000; VRF/VRV System Installation: 40000; Chiller Plant Setup: 50000; Commercial HVAC System: 60000; Industrial Ventilation Setup: 30000; Full Building AC Installation: 80000.

### OUTPUT FORMAT
Provide the response strictly in JSON format. Do not include markdown formatting or backticks.

{
  "analysis": "Detailed explanation using all Rules and data (tell size of team according to project scope.) and referencing catalog items.",
  "estimatedCost": < according to the above prompt rules. Note: if user request is not defined in  prompt rules then think according to the user project scope and pakistani market rates>,
  "estimatedDays": < according to the above prompt rules and project scope. Note: if user request is not defined in  prompt rules then think according to the user project scope and standard construction timelines in Pakistan>,
  "materials": {
    "materialName": "quantity and unit"
  },
  "costBreakdown": {
    "materials": <number>,
    "labor": <number>,
    "contingency": <number>
  }
};
      Respond with ONLY the JSON, no markdown formatting.
    `;

    const result = await model.generateContent(prompt);
    const responseText = await result.response.text();

    // Clean up markdown formatting
    let cleanText = responseText
      .replace(/```json|```/g, "")
      .replace(/[\n\r]/g, " ")
      .trim();

    // Find JSON in the response
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }

    const aiEstimation = JSON.parse(jsonMatch[0]);

    res.json({
      success: true,
      analysis: aiEstimation.analysis,
      estimation: {
        estimatedCost: aiEstimation.estimatedCost,
        estimatedDays: aiEstimation.estimatedDays,
        materials: aiEstimation.materials,
        costBreakdown: aiEstimation.costBreakdown,
      },
    });
  } catch (error) {
    console.error("AI Estimation Error:", error);
    res.status(500).json({
      message: "Failed to generate estimate. Please try a more specific query.",
      error: error.message,
    });
  }
};

// @desc    Summarize and analyze disputes for admin
// @route   POST /api/ai/summarize
const summarizeDispute = async (req, res) => {
  const { prompt: userQuery } = req.body;

  try {
    if (!userQuery)
      return res.status(400).json({ message: "Prompt is required" });

    // 1. Define the Hard-Lock Schema
    // This physically prevents the AI from adding any "As a mediator" text.
    const schema = {
      description: "Dispute Verdict",
      type: "object",
      properties: {
        PROBLEM: {
          type: "string",
          description: "The root cause in 10 words or less.",
        },
        RESPONSIBILITY: {
          type: "string",
          description: "Who is at fault and why (12 words max).",
        },
        RECOMMENDATION: {
          type: "string",
          description: "Actionable admin instruction (12 words max).",
        },
        FINAL_STEP: {
          type: "string",
          description: "One specific action to close the case (8 words max).",
        },
      },
      required: ["PROBLEM", "RESPONSIBILITY", "RECOMMENDATION", "FINAL_STEP"],
    };

    // 2. Initialize model with the Schema and JSON mode
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema, // This is the 'Secret Sauce'
      },
    });

    // 3. Ultra-Stripped Prompt
    // Notice I removed all 'Mediator' words. We want a machine, not a therapist.
    const systemPrompt = `
      Input Conflict Data: ${userQuery}

      Logic: 
      - Professional aggression/profanity from Contractor = Contractor 100% at fault.
      - Claim of "not done" vs "done" with zero proof = Shared Fault/Refund.
      
      Constraint: 
      - Output plain text values only. 
      - No symbols (#, *, _). 
      - Max 5 lines total.
    `;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const summaryObj = JSON.parse(response.text());

    res.json({
      success: true,
      analysis: summaryObj, // This will now be a clean, 4-line object every single time.
    });
  } catch (error) {
    console.error("AI Dispute Analysis Error:", error);
    res.status(500).json({ message: "Failed to generate dispute analysis" });
  }
};

module.exports = {
  getAIRecommendations,
  estimateConstructionCost,
  summarizeDispute,
};
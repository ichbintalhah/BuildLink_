import { useState, useEffect, useRef, useContext } from "react";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import {
  Send,
  Loader,
  Bot,
  Home,
  Copy,
  RefreshCw,
  Settings,
  AlertCircle,
} from "lucide-react";
import toast from "react-hot-toast";

const AIEstimator = () => {
  const { user } = useContext(AuthContext);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Assalam-u-Alaikum! 👋 I'm BuildLink's AI Construction Assistant. I help estimate costs, materials, and time for your construction projects in Pakistan.",
      sender: "bot",
      timestamp: new Date(),
    },
    {
      id: 2,
      text: "To get started, please describe your construction project. For example: 'I want to build a 1 marla house' or 'Renovation of bathroom'",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [marlaSize, setMarlaSize] = useState(null); // 225 or 272
  const [projectContext, setProjectContext] = useState("");
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef(null);

  // Material prices in PKR (Pakistani market rates)
  const [materialPrices, setMaterialPrices] = useState({
    brick: 15, // per piece
    cementBag: 750, // 50kg bag
    sand: 2500, // per ton
    steel: 350, // per kg
    paint: 800, // per liter
    tile: 150, // per sq ft
    labor: 500, // per sq ft (for construction)
    marble: 500, // per sq ft
    gravel: 2000, // per ton
    rebar: 180, // per kg
  });

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Add initial marla prompt if not asked yet
  useEffect(() => {
    if (marlaSize === null && messages.length > 2) {
      const hasMarlaQuestion = messages.some((m) =>
        m.text.includes("225 sq ft or 272 sq ft Marla?")
      );
      if (!hasMarlaQuestion) {
        const marlaMsg = {
          id: messages.length + 1,
          text: "📐 Important: 225 sq ft or 272 sq ft Marla? This helps me calculate accurate estimates for Pakistani properties.",
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, marlaMsg]);
      }
    }
  }, [marlaSize, messages]);

  const handleMarlaSelection = (size) => {
    setMarlaSize(size);
    const userMsg = {
      id: messages.length + 1,
      text: `${size} sq ft Marla`,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    const response = {
      id: messages.length + 2,
      text: `✅ Got it! I'll use ${size} sq ft for calculations. Now tell me about your project - what type of construction or renovation are you planning?`,
      sender: "bot",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, response]);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    if (!marlaSize) {
      toast.error("Please select Marla size first (225 or 272 sq ft)");
      return;
    }

    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: input,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Call backend AI endpoint
      const { data } = await api.post("/ai/estimate", {
        query: input,
        marlaSize,
        materialPrices,
        projectContext: projectContext || null,
      });

      const botMessage = {
        id: messages.length + 2,
        text: data.analysis,
        sender: "bot",
        timestamp: new Date(),
        estimation: data.estimation, // Cost, material, time data
      };
      setMessages((prev) => [...prev, botMessage]);
      setProjectContext(input); // Store context for next query
    } catch (error) {
      console.error("AI Error:", error);
      const errorMsg = {
        id: messages.length + 2,
        text: "❌ Sorry, I encountered an error. Please try again. Make sure your query is construction-related and specific.",
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      toast.error("AI Service Error");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const resetChat = () => {
    setMessages([
      {
        id: 1,
        text: "Assalam-u-Alaikum! 👋 I'm BuildLink's AI Construction Assistant. I help estimate costs, materials, and time for your construction projects in Pakistan.",
        sender: "bot",
        timestamp: new Date(),
      },
      {
        id: 2,
        text: "To get started, please describe your construction project. For example: 'I want to build a 1 marla house' or 'Renovation of bathroom'",
        sender: "bot",
        timestamp: new Date(),
      },
    ]);
    setMarlaSize(null);
    setProjectContext("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-base-100 to-secondary/5">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-primary to-primary/80 text-primary-content shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 backdrop-blur-sm rounded-lg">
              <Bot size={28} className="fill-current" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI Construction Estimator</h1>
              <p className="text-sm opacity-90">
                Powered by Google Gemini 2.5 Flash
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="btn btn-ghost btn-circle hover:bg-white/10"
            >
              <Settings size={24} />
            </button>
            <button
              onClick={resetChat}
              className="btn btn-ghost btn-circle hover:bg-white/10"
            >
              <RefreshCw size={24} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-4 gap-6 p-4 mb-10">
        {/* Main Chat Area - 3 columns */}
        <div className="lg:col-span-3">
          <div className="card bg-base-100 shadow-xl border border-base-200 h-[600px] flex flex-col">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.sender === "user" ? "justify-end" : "justify-start"
                  } animate-fade-in`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md xl:max-w-lg rounded-2xl p-4 shadow-sm ${
                      msg.sender === "user"
                        ? "bg-primary text-primary-content rounded-br-none"
                        : "bg-base-200 text-base-content rounded-bl-none"
                    }`}
                  >
                    <p className="text-sm md:text-base whitespace-pre-wrap break-words">
                      {msg.text}
                    </p>

                    {/* Estimation Card */}
                    {msg.estimation && (
                      <div className="mt-3 bg-white/10 rounded-lg p-3 border border-white/20">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <p className="opacity-70">💰 Estimated Cost</p>
                            <p className="font-bold text-base">
                              Rs.{" "}
                              {msg.estimation.estimatedCost?.toLocaleString()}
                            </p>
                          </div>
                          <div>
                            <p className="opacity-70">⏱️ Duration</p>
                            <p className="font-bold text-base">
                              {msg.estimation.estimatedDays} days
                            </p>
                          </div>
                        </div>
                        {msg.estimation.materials && (
                          <div className="mt-2 pt-2 border-t border-white/20 text-xs">
                            <p className="opacity-70 mb-1">📦 Key Materials:</p>
                            <ul className="list-disc list-inside space-y-0.5">
                              {Object.entries(msg.estimation.materials)
                                .slice(0, 3)
                                .map(([key, value]) => (
                                  <li key={key}>
                                    {key}: {value}
                                  </li>
                                ))}
                            </ul>
                          </div>
                        )}
                        <button
                          onClick={() =>
                            copyToClipboard(
                              `Cost: Rs. ${
                                msg.estimation.estimatedCost
                              }\nDays: ${
                                msg.estimation.estimatedDays
                              }\nMaterials: ${JSON.stringify(
                                msg.estimation.materials
                              )}`
                            )
                          }
                          className="mt-2 btn btn-xs btn-ghost gap-1"
                        >
                          <Copy size={12} /> Copy
                        </button>
                      </div>
                    )}

                    <p className="text-xs opacity-50 mt-2">
                      {msg.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-base-200 text-base-content rounded-2xl rounded-bl-none p-4">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-100"></div>
                      <div className="w-2 h-2 bg-primary rounded-full animate-bounce delay-200"></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Marla Selection - Only show if not selected */}
            {marlaSize === null && messages.length > 1 && (
              <div className="border-t border-base-300 p-4 bg-info/10">
                <div className="flex items-start gap-3 mb-3">
                  <AlertCircle
                    size={20}
                    className="text-info flex-shrink-0 mt-0.5"
                  />
                  <div>
                    <p className="font-bold text-sm">
                      Select your Marla size first:
                    </p>
                    <p className="text-xs opacity-70">
                      This affects material and cost calculations
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleMarlaSelection("225 sq ft")}
                    className="btn btn-sm btn-outline btn-primary flex-1"
                  >
                    225 sq ft Marla
                  </button>
                  <button
                    onClick={() => handleMarlaSelection("272 sq ft")}
                    className="btn btn-sm btn-outline btn-primary flex-1"
                  >
                    272 sq ft Marla
                  </button>
                </div>
              </div>
            )}

            {/* Input Area */}
            <form
              onSubmit={sendMessage}
              className="border-t border-base-300 p-4 bg-base-50"
            >
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder={
                    marlaSize
                      ? "Describe your construction project..."
                      : "Select Marla size first..."
                  }
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={!marlaSize || loading}
                  className="input input-bordered input-sm flex-1"
                />
                <button
                  type="submit"
                  disabled={!marlaSize || loading || !input.trim()}
                  className="btn btn-primary btn-sm gap-2"
                >
                  {loading ? (
                    <Loader className="animate-spin" size={16} />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar - Rules & Features */}
        <div className="lg:col-span-1 space-y-4">
          {/* Rules Card */}
          <div className="card bg-gradient-to-br from-warning/10 to-error/10 shadow-lg border border-warning/20">
            <div className="card-body p-4">
              <h3 className="card-title text-lg mb-3 flex items-center gap-2">
                <AlertCircle size={20} className="text-warning" />
                AI Rules
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="text-warning">✓</span>
                  <span>Construction only</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-warning">✓</span>
                  <span>No general chat</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-warning">✓</span>
                  <span>Pakistani standards enforced</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Features Card */}
          <div className="card bg-gradient-to-br from-primary/10 to-secondary/10 shadow-lg border border-primary/20">
            <div className="card-body p-4">
              <h3 className="card-title text-lg mb-3 flex items-center gap-2">
                <Bot size={20} className="text-primary" />
                Features
              </h3>
              <ul className="space-y-2 text-sm">
                <li className="flex gap-2">
                  <span className="text-primary">✓</span>
                  <span>Context-aware chat</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">✓</span>
                  <span>Smart material estimator</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">✓</span>
                  <span>Cost breakdown in PKR</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-primary">✓</span>
                  <span>Timeline estimation</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Material Prices (Collapsible) */}
          {showSettings && (
            <div className="card bg-base-100 shadow-lg border border-base-300">
              <div className="card-body p-4">
                <h3 className="card-title text-sm mb-3">
                  Material Prices (PKR)
                </h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Brick (piece)</span>
                    <span className="font-bold">
                      Rs. {materialPrices.brick}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cement (50kg bag)</span>
                    <span className="font-bold">
                      Rs. {materialPrices.cementBag}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Sand (ton)</span>
                    <span className="font-bold">Rs. {materialPrices.sand}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Steel (kg)</span>
                    <span className="font-bold">
                      Rs. {materialPrices.steel}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Labor (sq ft)</span>
                    <span className="font-bold">
                      Rs. {materialPrices.labor}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="btn btn-xs btn-ghost mt-3 w-full"
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Info Card */}
          <div className="card bg-gradient-to-br from-success/10 to-info/10 shadow-lg border border-success/20">
            <div className="card-body p-4">
              <h3 className="card-title text-sm">💡 Tips</h3>
              <ul className="text-xs space-y-1 opacity-70">
                <li>• Be specific about project size</li>
                <li>• Mention all requirements</li>
                <li>• Ask follow-up questions</li>
                <li>• Estimates are based on market rates</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIEstimator;

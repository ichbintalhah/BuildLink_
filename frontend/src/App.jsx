import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useContext } from "react";
import { AuthContext } from "./context/AuthContext";

// Components
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ScrollToTop from "./components/ScrollToTop";

// Pages
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import FindPro from "./pages/FindPro";
import FindContractors from "./pages/FindContractors";
import SubCategories from "./pages/SubCategories";
import JobSelection from "./pages/JobSelection";
import ServiceList from "./pages/ServiceList";
import Advisory from "./pages/Advisory";
import AIEstimator from "./pages/AIEstimator";
import HeavyDutyConstruction from "./pages/HeavyDutyConstruction";

// New Pages
import About from "./pages/About";
import Contact from "./pages/Contact";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import Terms from "./pages/Terms";
import WithdrawalRequest from "./pages/WithdrawalRequest";

function App() {
  const { user, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  // ✅ LOGIC: Hide Navbar/Footer on Dashboard, Login, and Signup pages
  const hideLayout =
    location.pathname.startsWith("/dashboard") ||
    location.pathname === "/login" ||
    location.pathname === "/signup";

  return (
    <>
      <ScrollToTop />
      <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

      {/* ✅ Only show Main Navbar if NOT on special pages */}
      {!hideLayout && <Navbar />}

      <Routes>
        <Route path="/" element={<Home />} />

        {/* Public Pages */}
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/find-pro" element={<FindPro />} />
        <Route path="/contractors" element={<FindContractors />} />
        <Route path="/advisory" element={<Advisory />} />
        <Route path="/ai-estimator" element={<AIEstimator />} />

        {/* Service Flow */}
        <Route path="/services/:category" element={<SubCategories />} />
        <Route
          path="/services/heavy-duty-construction"
          element={<HeavyDutyConstruction />}
        />
        <Route path="/jobs/:subCategory" element={<JobSelection />} />
        <Route path="/contractors/:category" element={<ServiceList />} />

        {/* Auth Routes - Redirect to Home if already logged in */}
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/" />}
        />
        <Route
          path="/signup"
          element={!user ? <Signup /> : <Navigate to="/" />}
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard/*"
          element={user ? <Dashboard /> : <Navigate to="/login" />}
        />
        <Route
          path="/profile"
          element={user ? <Profile /> : <Navigate to="/login" />}
        />
        <Route
          path="/withdrawal-request"
          element={user ? <WithdrawalRequest /> : <Navigate to="/login" />}
        />

        {/* 404 Page */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex flex-col items-center justify-center">
              <h1 className="text-4xl font-bold mb-4">404</h1>
              <p className="mb-4">Page Not Found</p>
              <a href="/" className="btn btn-primary">
                Go Home
              </a>
            </div>
          }
        />
      </Routes>

      {!hideLayout && <Footer />}
    </>
  );
}

export default App;

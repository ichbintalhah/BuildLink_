import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import { Wallet, X } from "lucide-react";

const WithdrawalModal = ({ walletBalance, onSuccess }) => {
  const { user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  const handleWithdraw = async () => {
    if (amount < 500) return toast.error("Minimum withdrawal is Rs. 500");
    if (amount > walletBalance) return toast.error("Insufficient balance");

    try {
      setLoading(true);
      await api.post("/wallet/withdraw", {
        amount: parseInt(amount),
        method: user?.contractorDetails?.paymentMethod || "Bank Transfer",
        accountDetails:
          user?.contractorDetails?.paymentAccount || "Not Provided",
      });
      toast.success("Withdrawal Requested! Admin will review shortly.");
      setIsOpen(false);
      setAmount("");
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || "Request Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn btn-sm btn-white text-primary font-bold shadow-md gap-2"
        disabled={walletBalance < 500}
      >
        <Wallet size={16} /> Withdraw Funds
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="modal-box relative bg-base-100 shadow-2xl">
            <button
              onClick={() => setIsOpen(false)}
              className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold mb-1">Request Withdrawal</h3>
            <p className="text-sm opacity-60 mb-6">
              Transfer earnings to your registered account.
            </p>

            <div className="bg-base-200 p-4 rounded-lg mb-4 text-sm border border-base-300">
              <div className="flex justify-between mb-1">
                <span className="opacity-70">Method:</span>
                <span className="font-bold">
                  {user?.contractorDetails?.paymentMethod || "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="opacity-70">Account:</span>
                <span className="font-mono bg-base-100 px-2 rounded text-xs py-0.5 border border-base-300">
                  {user?.contractorDetails?.paymentAccount || "N/A"}
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-sm font-semibold opacity-70">
                Available Balance
              </span>
              <span className="text-success font-bold">
                Rs. {walletBalance.toLocaleString()}
              </span>
            </div>

            <div className="form-control mb-6">
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-base-content/50 font-bold">
                  Rs.
                </span>
                <input
                  type="number"
                  className="input input-bordered w-full pl-12 font-bold text-lg"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="500"
                  max={walletBalance}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                className="btn btn-ghost"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleWithdraw}
                disabled={
                  loading || !amount || amount < 500 || amount > walletBalance
                }
              >
                {loading ? "Processing..." : "Confirm Request"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default WithdrawalModal;

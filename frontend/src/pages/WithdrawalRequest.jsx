import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext";
import api from "../services/api";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Wallet,
  DollarSign,
  CreditCard,
  AlertCircle,
  Phone,
  Building2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const WithdrawalRequest = () => {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [fetchingDetails, setFetchingDetails] = useState(true);
  const [contractorData, setContractorData] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentDetail, setPaymentDetail] = useState("");
  const [pendingTotal, setPendingTotal] = useState(0);

  // Fetch latest account data + pending withdrawals on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch account data
        if (user?._id && user?.role === "contractor") {
          const { data } = await api.get(`/contractors/${user._id}`);
          setContractorData(data);
        }
        // Fetch pending withdrawal total
        const { data: history } = await api.get("/wallet/history");
        const pending = (history || []).filter((w) => w.status === "Pending");
        const total = pending.reduce((sum, w) => sum + (w.amount || 0), 0);
        setPendingTotal(total);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setFetchingDetails(false);
      }
    };

    fetchData();
  }, [user]);
  useEffect(() => {
    const data = contractorData || user;
    if (data) {
      // 1. Auto-set Method (e.g. EasyPaisa, JazzCash)
      const method =
        data.paymentMethod ||
        data.contractorDetails?.paymentMethod ||
        "Bank Transfer";
      setPaymentMethod(method);

      // 2. Auto-set Account Number
      // We check ALL possible names the database might use to save this info
      const detail =
        data.paymentAccount || // The new field we added to Schema
        data.paymentAccountValue || // The field sometimes used in User Schema
        data.contractorDetails?.paymentAccount ||
        data.phone || // Fallback: Use phone number if nothing else exists
        "";

      setPaymentDetail(detail);
    }
  }, [contractorData, user]);

  const isMobileWallet = [
    "EasyPaisa",
    "JazzCash",
    "Sadapay",
    "Nayapay",
  ].includes(paymentMethod);
  const isBankAccount = paymentMethod === "Bank Account";

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!amount || parseFloat(amount) <= 0) {
      return toast.error("Enter a valid amount");
    }

    const walletBal = contractorData?.walletBalance ?? user?.walletBalance ?? 0;
    const availableBal = walletBal - pendingTotal;

    if (parseFloat(amount) > availableBal) {
      if (pendingTotal > 0) {
        return toast.error(
          `Withdrawal already in process (Rs. ${pendingTotal.toLocaleString()} pending). Available: Rs. ${availableBal.toLocaleString()}`,
        );
      }
      return toast.error("Insufficient wallet balance");
    }

    if (paymentMethod === "Not Set" || paymentDetail === "Not Set") {
      return toast.error(
        "Please update your payment details in your profile first",
      );
    }

    setLoading(true);
    try {
      // Submit withdrawal request
      await api.post("/wallet/withdraw", {
        amount: parseFloat(amount),
        method: paymentMethod,
        accountDetails: paymentDetail,
      });

      // Update pending total in local state so UI reflects the reservation
      setPendingTotal((prev) => prev + parseFloat(amount));

      toast.success(
        "Withdrawal request submitted! Admin will process it soon.",
      );
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <button
          onClick={() => navigate("/dashboard")}
          className="btn btn-ghost gap-2 mb-6"
        >
          <ArrowLeft size={18} /> Back to Dashboard
        </button>

        <div className="card bg-base-100 shadow-2xl border border-base-200">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-primary to-primary-focus text-primary-content p-6 rounded-t-2xl">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Wallet size={32} /> Request Withdrawal
            </h1>
            <p className="opacity-90 mt-2">
              Withdraw your earnings to your bank account
            </p>
          </div>

          {/* Card Body */}
          <div className="p-8">
            {/* Wallet Balance Display */}
            {(() => {
              const walletBal =
                contractorData?.walletBalance ?? user?.walletBalance ?? 0;
              const availableBal = walletBal - pendingTotal;
              return (
                <div className="space-y-3 mb-8">
                  <div className="bg-success/10 border border-success/30 rounded-xl p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm opacity-60 font-bold">
                          WALLET BALANCE
                        </p>
                        <p className="text-3xl font-bold text-success">
                          Rs. {walletBal.toLocaleString()}
                        </p>
                      </div>
                      <DollarSign className="text-success h-16 w-16 opacity-20" />
                    </div>
                  </div>
                  {pendingTotal > 0 && (
                    <div className="bg-warning/10 border border-warning/30 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs opacity-60 font-bold">
                            PENDING WITHDRAWALS
                          </p>
                          <p className="text-lg font-bold text-warning">
                            Rs. {pendingTotal.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs opacity-60 font-bold text-right">
                            AVAILABLE TO WITHDRAW
                          </p>
                          <p className="text-lg font-bold text-primary text-right">
                            Rs. {availableBal.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Payment Details Display (Auto-fetched from Database) */}
              <div className="bg-base-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-lg">Payment Details</h3>
                  {fetchingDetails && (
                    <span className="loading loading-spinner loading-sm text-primary"></span>
                  )}
                </div>
                {fetchingDetails ? (
                  <div className="text-center py-6">
                    <span className="loading loading-spinner loading-md text-primary"></span>
                    <p className="text-sm opacity-60 mt-2">
                      Loading payment details...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Payment Method */}
                    <div className="bg-base-100 rounded-lg p-4 flex items-start gap-3">
                      <CreditCard
                        className="text-primary shrink-0 mt-1"
                        size={20}
                      />
                      <div className="flex-1">
                        <p className="text-xs opacity-60 font-bold">
                          PAYMENT METHOD
                        </p>
                        <p className="text-lg font-bold text-primary">
                          {paymentMethod}
                        </p>
                      </div>
                    </div>

                    {/* Payment Detail (Phone or IBAN) */}
                    {isMobileWallet && (
                      <div className="bg-info/10 border border-info/30 rounded-lg p-4 flex items-start gap-3">
                        <Phone className="text-info shrink-0 mt-1" size={20} />
                        <div className="flex-1">
                          <p className="text-xs opacity-60 font-bold">
                            PHONE NUMBER
                          </p>
                          <p className="text-lg font-bold font-mono text-info">
                            {paymentDetail}
                          </p>
                        </div>
                      </div>
                    )}

                    {isBankAccount && (
                      <div className="bg-success/10 border border-success/30 rounded-lg p-4 flex items-start gap-3">
                        <Building2
                          className="text-success shrink-0 mt-1"
                          size={20}
                        />
                        <div className="flex-1">
                          <p className="text-xs opacity-60 font-bold">
                            IBAN NUMBER
                          </p>
                          <p className="text-lg font-bold font-mono text-success">
                            {paymentDetail}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {(paymentMethod === "Not Set" ||
                  paymentDetail === "Not Set") && (
                  <div className="alert alert-warning flex items-start gap-3">
                    <AlertCircle size={20} className="shrink-0 mt-1" />
                    <span>
                      Please update your payment details in your profile before
                      submitting a withdrawal request.
                    </span>
                  </div>
                )}
              </div>

              {/* Amount */}
              <div className="form-control">
                <label className="label font-bold">
                  <span className="label-text">Withdrawal Amount (Rs.)</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g., 5000"
                  className="input input-bordered w-full text-lg"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  min="100"
                  max={
                    (contractorData?.walletBalance ?? user.walletBalance ?? 0) -
                    pendingTotal
                  }
                  disabled={
                    paymentMethod === "Not Set" ||
                    paymentDetail === "Not Set" ||
                    (contractorData?.walletBalance ?? user.walletBalance ?? 0) -
                      pendingTotal <=
                      0
                  }
                />
                <label className="label">
                  <span className="label-text-alt opacity-60">
                    Min: Rs. 100 | Max: Rs.{" "}
                    {(
                      (contractorData?.walletBalance ??
                        user.walletBalance ??
                        0) - pendingTotal
                    ).toLocaleString()}
                  </span>
                </label>
              </div>

              {/* Info Alert */}
              <div className="alert alert-info">
                <span>
                  ℹ️ Withdrawals are processed within 24-48 hours. Once
                  submitted, the amount will be deducted from your wallet.
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={
                  loading ||
                  paymentMethod === "Not Set" ||
                  paymentDetail === "Not Set" ||
                  (contractorData?.walletBalance ?? user?.walletBalance ?? 0) -
                    pendingTotal <=
                    0
                }
                className="btn btn-primary w-full btn-lg gap-2 text-lg"
              >
                {loading ? (
                  <>
                    <span className="loading loading-spinner"></span>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard size={20} />
                    Request Withdrawal
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalRequest;

import { AlertTriangle, CheckCircle, DollarSign } from "lucide-react";

const DisputeDecisionCard = ({ dispute }) => {
  if (!dispute || !dispute.status) {
    return null;
  }

  if (dispute.status === "Open") {
    return (
      <div className="border rounded-lg p-2 bg-warning/10 border-warning/30">
        <p className="text-sm font-medium text-warning">
          Notice: Please wait for admin decision. It may take up to 24 hours.
        </p>
      </div>
    );
  }

  if (dispute.status !== "Resolved") {
    return null;
  }

  // Map adminDecision to display label and color
  // Release = User at fault (contractor gets paid)
  // Refund = Contractor at fault (user gets refunded)
  // Split = Both at fault (split payment)
  const getDecisionConfig = (decision) => {
    switch (decision) {
      case "Release":
        return {
          label: "User Fault",
          color: "badge-warning",
          bgColor: "bg-warning/10",
          borderColor: "border-warning/30",
          icon: <AlertTriangle size={16} />,
          textColor: "text-warning",
        };
      case "Refund":
        return {
          label: "Contractor Fault",
          color: "badge-error",
          bgColor: "bg-error/10",
          borderColor: "border-error/30",
          icon: <CheckCircle size={16} />,
          textColor: "text-error",
        };
      case "Split":
        return {
          label: "Split Payment",
          color: "badge-info",
          bgColor: "bg-info/10",
          borderColor: "border-info/30",
          icon: <DollarSign size={16} />,
          textColor: "text-info",
        };
      default:
        return {
          label: decision,
          color: "badge-ghost",
          bgColor: "bg-base-200",
          borderColor: "border-base-300",
          icon: null,
          textColor: "text-base-content",
        };
    }
  };

  const config = getDecisionConfig(dispute.adminDecision);

  return (
    <div
      className={`border-2 rounded-lg p-4 space-y-3 ${config.bgColor} ${config.borderColor}`}
    >
      {/* Decision Tag */}
      <div className="flex items-center gap-2">
        <div className={`badge ${config.color} font-bold gap-2 px-3 py-2`}>
          {config.icon}
          {config.label}
        </div>
        <span className="text-xs font-semibold opacity-70">
          ⚖️ DISPUTE RESOLVED
        </span>
      </div>

      {/* Admin Comment */}
      {dispute.adminComment && (
        <div className="bg-base-100 rounded p-3 border border-base-300">
          <div className={`text-xs font-bold mb-1 ${config.textColor}`}>
            Admin's Comment:
          </div>
          <p className="text-sm opacity-80 leading-relaxed">
            {dispute.adminComment}
          </p>
        </div>
      )}
    </div>
  );
};

export default DisputeDecisionCard;

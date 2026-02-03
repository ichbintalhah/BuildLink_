/**
 * Payment Service Utility
 * Handles all payment calculations and distribution based on dispute verdicts
 */

const ADMIN_COMMISSION_RATE = 0.05; // 5% admin commission

/**
 * Calculate payment splits based on dispute verdict
 * @param {Number} totalAmount - Total booking amount
 * @param {String} verdict - 'Release' (user at fault), 'Refund' (contractor at fault), or 'Split' (both at fault)
 * @returns {Object} { adminAmount, userAmount, contractorAmount }
 *
 * VERDICT RULES (STRICT):
 * a) Release (User at fault):
 *    - 5% admin commission
 *    - 95% to contractor
 * b) Refund (Contractor at fault):
 *    - 0% admin commission
 *    - 100% refund to user
 * c) Split (Both at fault):
 *    - 5% admin commission
 *    - Remaining 95% split equally between user & contractor (47.5% each)
 */
const calculateDisputeSplit = (totalAmount, verdict) => {
  if (!totalAmount || totalAmount <= 0) {
    throw new Error("Invalid amount");
  }

  let result = {};

  switch (verdict) {
    // User is at fault: 5% admin + 95% to contractor
    case "Release":
      result.adminAmount = totalAmount * ADMIN_COMMISSION_RATE;
      result.contractorAmount = totalAmount - result.adminAmount;
      result.userAmount = 0;
      break;

    // Contractor is at fault: 0% admin + 100% refund to user (NO admin commission)
    case "Refund":
      result.adminAmount = 0; // No commission when contractor is at fault
      result.userAmount = totalAmount; // Full refund to user
      result.contractorAmount = 0;
      break;

    // Split decision: 5% admin + 95% split equally (47.5% each)
    case "Split":
      result.adminAmount = totalAmount * ADMIN_COMMISSION_RATE;
      const remaining = totalAmount - result.adminAmount; // 95% of total
      result.userAmount = remaining / 2; // 47.5% of total
      result.contractorAmount = remaining / 2; // 47.5% of total
      break;

    default:
      throw new Error(`Invalid verdict: ${verdict}`);
  }

  return {
    adminAmount: Math.round(result.adminAmount * 100) / 100, // Round to 2 decimals
    userAmount: Math.round(result.userAmount * 100) / 100,
    contractorAmount: Math.round(result.contractorAmount * 100) / 100,
  };
};

/**
 * Calculate normal payment (5% commission to admin, rest to contractor)
 * @param {Number} totalAmount
 * @returns {Object} { adminAmount, contractorAmount }
 */
const calculateNormalPayment = (totalAmount) => {
  const adminAmount = totalAmount * ADMIN_COMMISSION_RATE;
  const contractorAmount = totalAmount - adminAmount;

  return {
    adminAmount: Math.round(adminAmount * 100) / 100,
    contractorAmount: Math.round(contractorAmount * 100) / 100,
  };
};

/**
 * Validate payment amounts (safety check)
 * @param {Object} amounts
 * @param {Number} totalAmount
 * @returns {Boolean}
 */
const validatePaymentSplit = (amounts, totalAmount) => {
  const sum =
    (amounts.adminAmount || 0) +
    (amounts.userAmount || 0) +
    (amounts.contractorAmount || 0);

  // Allow for small rounding differences (max 0.01)
  return Math.abs(sum - totalAmount) < 0.01;
};

module.exports = {
  calculateDisputeSplit,
  calculateNormalPayment,
  validatePaymentSplit,
  ADMIN_COMMISSION_RATE,
};

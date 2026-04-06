/**
 * Finance Utility — Single Source of Truth (Frontend Mirror)
 *
 * Mirrors backend/utils/financeUtils.js identically.
 * Import these in any component that needs to compute or verify
 * financial splits on the client side.
 *
 * Key technique: the "remainder method".
 *   admin      = round(volume × rate)
 *   contractor = round(volume − admin)
 * Guarantees:  admin + contractor === volume  (no rounding gap).
 */

export const ADMIN_COMMISSION_RATE = 0.05;

/** Round a number to exactly 2 decimal places. */
export const round2 = (n) => Math.round(n * 100) / 100;

/**
 * Split a booking amount into admin commission + contractor payout.
 * Guarantees: admin + contractor === volume.
 *
 * @param {number} volume  Total booking amount
 * @param {number} [rate]  Commission rate (default 0.05)
 * @returns {{ admin: number, contractor: number }}
 */
export const splitNormal = (volume, rate = ADMIN_COMMISSION_RATE) => {
    const admin = round2(volume * rate);
    const contractor = round2(volume - admin);
    return { admin, contractor };
};

/**
 * Split a disputed amount by verdict.
 * Guarantees: admin + contractor + refund === volume.
 *
 * @param {number} volume    Disputed amount
 * @param {string} decision  "Refund" | "Release" | "Split"
 * @param {number} [rate]    Commission rate
 * @returns {{ admin: number, contractor: number, refund: number }}
 */
export const splitDispute = (volume, decision, rate = ADMIN_COMMISSION_RATE) => {
    switch (decision) {
        case "Refund":
            return { admin: 0, contractor: 0, refund: round2(volume) };

        case "Release": {
            const { admin, contractor } = splitNormal(volume, rate);
            return { admin, contractor, refund: 0 };
        }

        case "Split": {
            const admin = round2(volume * rate);
            const remaining = round2(volume - admin);
            const refund = round2(remaining / 2);
            const contractor = round2(remaining - refund);
            return { admin, contractor, refund };
        }

        default:
            return { admin: 0, contractor: 0, refund: 0 };
    }
};

/** Format a number as Pakistani Rupees. */
export const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return "Rs. 0";
    return `Rs. ${Number(amount).toLocaleString("en-PK", {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })}`;
};

/**
 * Finance Utility — Single Source of Truth
 *
 * Every financial split (admin commission, contractor payout, dispute
 * refund) MUST go through these functions so the equations always
 * balance in the UI.
 *
 * Key technique: the "remainder method".
 *   admin      = round(volume × rate)
 *   contractor = round(volume − admin)        ← NOT round(volume × (1−rate))
 *
 * This guarantees  admin + contractor === volume  with zero rounding gap.
 */

const { ADMIN_COMMISSION_RATE } = require("./paymentService");

// ── helpers ──────────────────────────────────────────────────────

/** Round a number to exactly 2 decimal places. */
const round2 = (n) => Math.round(n * 100) / 100;

// ── split functions ──────────────────────────────────────────────

/**
 * Split a booking amount into admin commission + contractor payout.
 *
 * Uses the remainder method so the equation
 *   admin + contractor === volume
 * holds exactly after rounding.
 *
 * @param {number} volume  Total booking amount
 * @param {number} [rate]  Commission rate (default ADMIN_COMMISSION_RATE)
 * @returns {{ admin: number, contractor: number }}
 */
const splitNormal = (volume, rate = ADMIN_COMMISSION_RATE) => {
    const admin = round2(volume * rate);
    const contractor = round2(volume - admin); // remainder — always balances
    return { admin, contractor };
};

/**
 * Split a disputed booking amount based on the admin's decision.
 *
 * Uses the remainder method at every step so:
 *   admin + contractor + refund === volume
 *
 * Verdict rules:
 *   Refund  → 0 % admin,   0 %   contractor, 100 %  user
 *   Release → 5 % admin,  95 %   contractor,   0 %  user
 *   Split   → 5 % admin, ~47.5 % contractor, ~47.5 % user
 *
 * @param {number} volume    Disputed amount
 * @param {string} decision  "Refund" | "Release" | "Split"
 * @param {number} [rate]    Commission rate
 * @returns {{ admin: number, contractor: number, refund: number }}
 */
const splitDispute = (volume, decision, rate = ADMIN_COMMISSION_RATE) => {
    switch (decision) {
        case "Refund":
            return { admin: 0, contractor: 0, refund: round2(volume) };

        case "Release": {
            const { admin, contractor } = splitNormal(volume, rate);
            return { admin, contractor, refund: 0 };
        }

        case "Split": {
            const admin = round2(volume * rate);
            const remaining = round2(volume - admin); // 95 %
            const refund = round2(remaining / 2); // ~47.5 %
            const contractor = round2(remaining - refund); // remainder
            return { admin, contractor, refund };
        }

        default:
            return { admin: 0, contractor: 0, refund: 0 };
    }
};

module.exports = {
    round2,
    splitNormal,
    splitDispute,
    ADMIN_COMMISSION_RATE,
};

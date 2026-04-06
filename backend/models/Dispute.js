const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  initiator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Direct references to involved parties (copied from booking for easy population)
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  contractor: { type: mongoose.Schema.Types.ObjectId, ref: 'Contractor' },

  // --- USER SIDE (The Accuser) ---
  reason: { type: String, required: true },
  userEvidence: [{ type: String }], // Array of Image URLs

  // --- CONTRACTOR SIDE (The Defendant) ---
  contractorDefense: { type: String },
  contractorEvidence: [{ type: String }], // Array of Image URLs
  contractorDefenseAt: { type: Date }, // When contractor submitted defense

  // --- ADMIN SIDE (The Judge) ---
  status: { type: String, enum: ['Open', 'Resolved', 'Dismissed'], default: 'Open' },
  adminDecision: { type: String, enum: ['Refund', 'Release', 'Split', 'Pending'], default: 'Pending' },
  adminComment: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Dispute', disputeSchema);
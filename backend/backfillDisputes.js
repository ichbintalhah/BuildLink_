/**
 * One-time migration: Backfill existing Dispute documents with user & contractor IDs from their booking.
 * 
 * Usage:  cd backend && node backfillDisputes.js
 */
const mongoose = require('mongoose');
require('dotenv').config({ quiet: true });
const db = require('./config/db');
const Dispute = require('./models/Dispute');
const Booking = require('./models/Booking');

(async () => {
    try {
        await db();
        console.log('Connected to DB. Starting backfill...');

        const disputes = await Dispute.find({ $or: [{ user: { $exists: false } }, { contractor: { $exists: false } }, { user: null }, { contractor: null }] });
        console.log(`Found ${disputes.length} dispute(s) missing user/contractor.`);

        let updated = 0;
        for (const dispute of disputes) {
            const booking = await Booking.findById(dispute.booking).select('user contractor');
            if (!booking) {
                console.warn(`  ⚠ Booking not found for dispute ${dispute._id}`);
                continue;
            }
            dispute.user = booking.user;
            dispute.contractor = booking.contractor;
            await dispute.save();
            updated++;
            console.log(`  ✅ Updated dispute ${dispute._id} → user=${booking.user}, contractor=${booking.contractor}`);
        }

        console.log(`\nDone. Updated ${updated}/${disputes.length} dispute(s).`);
        process.exit(0);
    } catch (err) {
        console.error('Backfill error:', err);
        process.exit(1);
    }
})();

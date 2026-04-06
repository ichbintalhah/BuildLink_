const Booking = require("../models/Booking");

// @desc    Fix milestone dates for heavy-duty bookings
// @route   PUT /api/bookings/:id/fix-milestone-dates
const fixMilestoneDates = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (!booking.paymentSchedule || booking.paymentSchedule.length === 0) {
      return res.status(400).json({ message: "No payment schedule to fix" });
    }

    const baseDate = booking.scheduledDate || booking.createdAt || new Date();

    const updatedSchedule = booking.paymentSchedule.map((milestone, index) => {
      const obj = milestone.toObject ? milestone.toObject() : { ...milestone };

      const defaultCurrentDays = (index + 1) * 2;
      const defaultPrevDays = index * 2;
      const currentDays = Number(obj.daysCompleted || defaultCurrentDays);
      const prevDays =
        index === 0
          ? 0
          : Number(
              booking.paymentSchedule[index - 1]?.daysCompleted ||
                defaultPrevDays,
            );

      const milestoneStartDate = new Date(baseDate);
      milestoneStartDate.setDate(baseDate.getDate() + prevDays);

      const milestoneDeadline = new Date(baseDate);
      milestoneDeadline.setDate(baseDate.getDate() + currentDays);

      return {
        ...obj,
        milestoneStartDate,
        milestoneDeadline,
      };
    });

    booking.paymentSchedule = updatedSchedule;
    booking.markModified("paymentSchedule");
    await booking.save();

    return res.json({
      message: "Milestone dates updated",
      booking,
    });
  } catch (error) {
    console.error("Fix milestone dates error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports = { fixMilestoneDates };

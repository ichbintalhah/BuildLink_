const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
    // 1. Create Transporter (Using Gmail for Uni Projects is easiest)
    // For production, use SendGrid or Mailgun
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER, // Add this to your .env
            pass: process.env.EMAIL_PASS, // Add this to your .env (App Password, not login password)
        },
    });

    // 2. Define Email Options
    const mailOptions = {
        from: '"BuildLink Support" <noreply@buildlink.pk>',
        to: options.email,
        subject: options.subject,
        html: options.message,
    };

    // 3. Send Email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail; 
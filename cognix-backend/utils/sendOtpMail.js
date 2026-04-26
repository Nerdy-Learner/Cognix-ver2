import nodemailer from "nodemailer";

export async function sendOtpMail(email, otp) {

    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    await transporter.sendMail({
        from: `"Cognix Security" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your Cognix OTP Code",
        html: `
            <h2>Cognix Login Verification</h2>
            <p>Your OTP is:</p>
            <h1>${otp}</h1>
            <p>This code expires in 5 minutes.</p>
        `
    });
}
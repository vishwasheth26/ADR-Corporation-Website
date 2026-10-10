const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendEmail({ to, subject, text, replyTo }) {

    const emailData = {
        from: "ADR Corporation <onboarding@resend.dev>",
        to: [to],
        subject: subject,
        text: text
    };

    if (replyTo) {
        emailData.replyTo = replyTo;
    }

    const { data, error } = await resend.emails.send(emailData);

    if (error) {
        console.error("RESEND ERROR:", error);
        throw new Error(error.message || "Resend email failed.");
    }

    console.log("Resend email sent:", data.id);

    return data;
}

module.exports = sendEmail;

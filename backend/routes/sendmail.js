const { Resend } = require('resend');

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

async function sendPaymentNotification({ fullName, email, plan, amount, courseName, date }) {
    if (!resend) {
        console.warn('RESEND_API_KEY is not configured. Skipping payment notification email.');
        return { success: false, skipped: true, reason: 'missing-api-key' };
    }

    const recipient = process.env.PAYMENT_NOTIFICATION_EMAIL;
    const fromAddress = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
    const subject = 'edua app';
    const message = `USER: ${fullName} has initiated payment to pay for a course "${courseName || 'course access'}" on ${date}. User email: ${email}. Amount: ${amount}. Subscription: ${plan}.`;

    try {
        const response = await resend.emails.send({
            from: fromAddress,
            to: [recipient],
            subject,
            text: message,
            html: `<p>${message}</p>`
        });

        console.log('Payment notification email sent:', response?.data?.id || response);
        return { success: true, id: response?.data?.id || null };
    } catch (error) {
        console.error('Failed to send payment notification email:', error);
        return { success: false, error: error.message };
    }
}

module.exports = { sendPaymentNotification };
const {
  sendJournalEmail,
  contactNotificationEmail,
  contactAutoReplyEmail,
} = require('../utils/journalEmail');

async function sendContactMessage({ name, email, subject, message }) {
  if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
    const error = new Error('Name, email, subject, and message are all required.');
    error.status = 400;
    throw error;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    const error = new Error('Please provide a valid email address.');
    error.status = 400;
    throw error;
  }

  if (message.trim().length < 20) {
    const error = new Error('Message must be at least 20 characters.');
    error.status = 400;
    throw error;
  }

  const journalInbox = process.env.EMAIL_FROM || process.env.SMTP_USER;
  if (!journalInbox) {
    console.warn('[contact] No EMAIL_FROM configured — notification email skipped.');
  }

  const notification = contactNotificationEmail({ name, email, subject, message });
  const autoReply = contactAutoReplyEmail({ name, subject, message });

  await Promise.all([
    journalInbox
      ? sendJournalEmail({ to: journalInbox, ...notification }).catch((err) =>
          console.error('[email error] contact notification:', err.message)
        )
      : Promise.resolve(),
    sendJournalEmail({ to: email, ...autoReply }).catch((err) =>
      console.error('[email error] contact auto-reply:', err.message)
    ),
  ]);

  return { success: true, message: 'Your message has been sent. We will get back to you within 2–3 business days.' };
}

module.exports = { sendContactMessage };

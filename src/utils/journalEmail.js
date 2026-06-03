const nodemailer = require('nodemailer');

function getTransporter() {
  if (process.env.SENDGRID_API_KEY) {
    return nodemailer.createTransport({
      host: 'smtp.sendgrid.net',
      port: 587,
      auth: {
        user: 'apikey',
        pass: process.env.SENDGRID_API_KEY,
      },
    });
  }

  if (process.env.SMTP_HOST) {
    console.log("USING SMTP HOST")
    console.log({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER,
      hasPass: !!process.env.SMTP_PASS,
      hasSendgridKey: !!process.env.SENDGRID_API_KEY,
    });
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
  }

  return null;
}

/**
 * Wraps arbitrary inner HTML in the JAMSD branded email shell.
 * @param {string} bodyHtml  - The inner content rows (use the helpers below)
 * @param {string} preheader - Short preview text shown in inbox
 */
function buildEmailTemplate(bodyHtml, preheader = '') {
  const year = new Date().getFullYear();
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>JAMSD</title>
  <!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#f4f6f9;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;">${preheader}&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌</div>` : ''}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f9;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background-color:#0f2044;padding:28px 32px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td>
                    <p style="margin:0;color:#d4a017;font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;">Journal of Applied Medical &amp; Surgical Disciplines</p>
                    <h1 style="margin:6px 0 0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.3px;">JAMSD</h1>
                  </td>
                  <td align="right" valign="middle">
                    <span style="display:inline-block;background:#d4a017;color:#0f2044;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:4px 10px;border-radius:3px;">Open Access</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:32px 32px 24px;">
              ${bodyHtml}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 32px;">
              <hr style="border:none;border-top:1px solid #e8ecf0;margin:0;" />
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:20px 32px 28px;">
              <p style="margin:0 0 4px;font-size:11px;color:#8a96a3;">This is an automated message from the JAMSD Editorial System. Please do not reply directly to this email.</p>
              <p style="margin:0;font-size:11px;color:#8a96a3;">
                &copy; ${year} Journal of Applied Medical &amp; Surgical Disciplines &mdash; All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/** Amber-highlighted info badge row */
function badgeRow(label, value) {
  if (!value) return '';
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
    <tr>
      <td style="background:#fdf6e3;border-left:3px solid #d4a017;border-radius:0 4px 4px 0;padding:10px 14px;">
        <p style="margin:0;font-size:11px;color:#8a96a3;text-transform:uppercase;letter-spacing:1px;font-weight:600;">${label}</p>
        <p style="margin:4px 0 0;font-size:14px;color:#0f2044;font-weight:600;">${value}</p>
      </td>
    </tr>
  </table>`;
}

/** Navy info block for editorial comments */
function commentBlock(comment) {
  if (!comment) return '';
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;">
    <tr>
      <td style="background:#f0f4f8;border-left:4px solid #0f2044;border-radius:0 6px 6px 0;padding:14px 18px;">
        <p style="margin:0 0 6px;font-size:11px;color:#8a96a3;text-transform:uppercase;letter-spacing:1px;font-weight:700;">Editorial Comment</p>
        <p style="margin:0;font-size:14px;color:#1a2e4a;line-height:1.6;">${comment.replace(/\n/g, '<br />')}</p>
      </td>
    </tr>
  </table>`;
}

/** Green / red / amber status pill */
function statusPill(status) {
  const map = {
    submitted:         { bg: '#dbeafe', color: '#1e40af', label: 'Submitted' },
    'under-review':    { bg: '#fef3c7', color: '#92400e', label: 'Under Review' },
    'revision-required': { bg: '#ffedd5', color: '#9a3412', label: 'Revision Required' },
    accepted:          { bg: '#dcfce7', color: '#166534', label: 'Accepted' },
    rejected:          { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
    withdrawn:         { bg: '#f3f4f6', color: '#374151', label: 'Withdrawn' },
    published:         { bg: '#f3e8ff', color: '#6b21a8', label: 'Published' },
  };
  const s = map[status] || { bg: '#f3f4f6', color: '#374151', label: status };
  return `<span style="display:inline-block;background:${s.bg};color:${s.color};font-size:12px;font-weight:700;padding:4px 12px;border-radius:20px;letter-spacing:0.5px;">${s.label}</span>`;
}

/** CTA button */
function ctaButton(label, url) {
  if (!url) return '';
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0 8px;">
    <tr>
      <td style="background:#d4a017;border-radius:5px;">
        <a href="${url}" target="_blank" style="display:inline-block;padding:12px 28px;font-size:14px;font-weight:700;color:#0f2044;text-decoration:none;letter-spacing:0.3px;">${label}</a>
      </td>
    </tr>
  </table>`;
}

/** Heading inside body */
function heading(text) {
  return `<h2 style="margin:0 0 18px;font-size:20px;color:#0f2044;font-weight:700;line-height:1.3;">${text}</h2>`;
}

/** Paragraph */
function para(text) {
  return `<p style="margin:0 0 14px;font-size:14px;color:#3d4f63;line-height:1.7;">${text}</p>`;
}

// ─── Pre-built email builders ───────────────────────────────────────────────

function submissionConfirmationEmail({ submissionId, title, authorName, articleType }) {
  const typeLabel = String(articleType || '').replace(/-/g, ' ');
  const body = `
    ${heading('Submission Received')}
    ${para(`Dear <strong>${authorName}</strong>,`)}
    ${para('Thank you for submitting your manuscript to <strong>JAMSD</strong>. We have successfully received your submission and it has been assigned the following reference number.')}
    ${badgeRow('Submission ID', submissionId)}
    ${badgeRow('Manuscript Title', title)}
    ${badgeRow('Article Type', typeLabel)}
    ${para('Our editorial team will review your submission and you will be notified of any updates. You can track the status of your submission through your author dashboard at any time.')}
    ${para('If you have any questions or need to make corrections, please contact us at <a href="mailto:${process.env.EMAIL_FROM}" style="color:#d4a017;">${process.env.EMAIL_FROM}</a> quoting your Submission ID.')}
  `;
  return {
    subject: `Submission Received — ${submissionId}: ${title}`,
    html: buildEmailTemplate(body, `Your manuscript has been received. Submission ID: ${submissionId}`),
    text: `Dear ${authorName},\n\nYour manuscript "${title}" has been received.\nSubmission ID: ${submissionId}\n\nWe will notify you of any editorial updates.`,
  };
}

function editorialDecisionEmail({ submissionId, title, authorName, status, decision, comment, dashboardUrl }) {
  const decisionMessages = {
    'under-review':      { headline: 'Your Manuscript is Under Review', intro: 'We are pleased to inform you that your manuscript has been sent for peer review. Our reviewers will evaluate your work and provide feedback.' },
    'revision-required': { headline: 'Revision Requested', intro: 'Thank you for your submission. After careful review, the editorial team has requested revisions to your manuscript before a final decision can be made. Please review the editorial comments below and resubmit.' },
    accepted:            { headline: 'Manuscript Accepted', intro: 'Congratulations! We are delighted to inform you that your manuscript has been <strong>accepted for publication</strong> in JAMSD following peer review.' },
    rejected:            { headline: 'Editorial Decision', intro: 'Thank you for submitting your work to JAMSD. After careful consideration by our editorial team and reviewers, we regret to inform you that we are unable to accept your manuscript for publication at this time.' },
    published:           { headline: 'Your Article Has Been Published', intro: 'Congratulations! Your accepted manuscript has been officially published in JAMSD and is now available online for readers.' },
  };

  const msg = decisionMessages[status] || { headline: 'Submission Update', intro: 'There has been an update to your submission.' };

  const body = `
    ${heading(msg.headline)}
    ${para(`Dear <strong>${authorName}</strong>,`)}
    ${para(msg.intro)}
    ${badgeRow('Submission ID', submissionId)}
    ${badgeRow('Manuscript Title', title)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
      <tr><td>Current Status: ${statusPill(status)}</td></tr>
    </table>
    ${comment ? commentBlock(comment) : ''}
    ${dashboardUrl ? ctaButton('View in Dashboard', dashboardUrl) : ''}
    ${para('If you have any questions regarding this decision, please contact our editorial office.')}
  `;

  return {
    subject: `JAMSD Decision — ${submissionId}: ${msg.headline}`,
    html: buildEmailTemplate(body, msg.headline),
    text: `Dear ${authorName},\n\n${msg.headline}\n\nSubmission: ${submissionId}\nTitle: ${title}\nStatus: ${status}\n\n${comment ? `Editorial Comment:\n${comment}\n\n` : ''}Log in to your dashboard for full details.`,
  };
}

function contactNotificationEmail({ name, email, subject, message }) {
  const subjectLabels = {
    'submission-inquiry': 'Submission Inquiry',
    'peer-review':        'Peer Review Query',
    'editorial-board':    'Editorial Board Inquiry',
    'technical-issue':    'Technical Issue',
    'permissions':        'Permissions & Licensing',
    'general':            'General Inquiry',
  };
  const subjectLabel = subjectLabels[subject] || subject;

  const body = `
    ${heading('New Contact Form Message')}
    ${para('A visitor has submitted a message via the JAMSD contact form.')}
    ${badgeRow('From', `${name} &lt;${email}&gt;`)}
    ${badgeRow('Subject', subjectLabel)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
      <tr>
        <td style="background:#f0f4f8;border-left:3px solid #d4a017;border-radius:0 4px 4px 0;padding:14px 18px;">
          <p style="margin:0 0 6px;font-size:11px;color:#8a96a3;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Message</p>
          <p style="margin:0;font-size:14px;color:#1a2e4a;line-height:1.7;white-space:pre-line;">${message}</p>
        </td>
      </tr>
    </table>
    ${para(`Reply directly to <a href="mailto:${email}" style="color:#d4a017;">${email}</a> to respond to this inquiry.`)}
  `;

  return {
    subject: `[JAMSD Contact] ${subjectLabel} — from ${name}`,
    html: buildEmailTemplate(body, `New contact message from ${name}`),
    text: `New contact message from ${name} <${email}>\nSubject: ${subjectLabel}\n\n${message}`,
  };
}

function contactAutoReplyEmail({ name, subject, message }) {
  const subjectLabels = {
    'submission-inquiry': 'Submission Inquiry',
    'peer-review':        'Peer Review Query',
    'editorial-board':    'Editorial Board Inquiry',
    'technical-issue':    'Technical Issue',
    'permissions':        'Permissions & Licensing',
    'general':            'General Inquiry',
  };
  const subjectLabel = subjectLabels[subject] || subject;

  const body = `
    ${heading('Thank You for Contacting JAMSD')}
    ${para(`Dear <strong>${name}</strong>,`)}
    ${para('We have received your message and a member of our editorial team will get back to you as soon as possible — typically within <strong>2–3 business days</strong>.')}
    ${badgeRow('Subject', subjectLabel)}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:12px;">
      <tr>
        <td style="background:#f0f4f8;border-left:3px solid #0f2044;border-radius:0 4px 4px 0;padding:14px 18px;">
          <p style="margin:0 0 6px;font-size:11px;color:#8a96a3;text-transform:uppercase;letter-spacing:1px;font-weight:600;">Your Message</p>
          <p style="margin:0;font-size:14px;color:#1a2e4a;line-height:1.7;white-space:pre-line;">${message}</p>
        </td>
      </tr>
    </table>
    ${para('If your inquiry is urgent, you may also reach us directly at <a href="mailto:editor@jamsd.org" style="color:#d4a017;">editor@jamsd.org</a>.')}
  `;

  return {
    subject: `We received your message — JAMSD`,
    html: buildEmailTemplate(body, 'Your message has been received by the JAMSD editorial team.'),
    text: `Dear ${name},\n\nThank you for contacting JAMSD. We have received your message regarding "${subjectLabel}" and will respond within 2–3 business days.\n\nYour message:\n${message}`,
  };
}

// ─── Core send function ──────────────────────────────────────────────────────

async function sendJournalEmail({ to, subject, html, text }) {
  const recipients = Array.isArray(to) ? to.filter(Boolean) : [to].filter(Boolean);
  if (!recipients.length) return { skipped: true };

  const transporter = getTransporter();
  if (!transporter) {
    console.log(`[email skipped — no transport configured] ${subject} -> ${recipients.join(', ')}`);
    return { skipped: true };
  }

  return transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER || process.env.EMAIL_USERNAME,
    to: recipients.join(', '),
    subject,
    html,
    text,
  });
}

module.exports = {
  sendJournalEmail,
  buildEmailTemplate,
  submissionConfirmationEmail,
  editorialDecisionEmail,
  contactNotificationEmail,
  contactAutoReplyEmail,
};

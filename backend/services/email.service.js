const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: process.env.EMAIL_PORT || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

const formatDate = (date) => new Date(date).toLocaleDateString('en-US', {
  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
});

const formatCurrency = (amount) => `$${amount.toLocaleString()}`;

// Base email wrapper
const baseTemplate = (title, content) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; background: #0a0a0a; color: #ffffff; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #111111; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #6c3483, #1a1a2e); padding: 40px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
    .header p { margin: 8px 0 0; opacity: 0.7; font-size: 14px; }
    .body { padding: 40px; }
    .body p { line-height: 1.7; color: #cccccc; }
    .detail-box { background: #1a1a1a; border: 1px solid #333; border-radius: 8px; padding: 20px; margin: 24px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #222; }
    .detail-row:last-child { border-bottom: none; }
    .detail-label { color: #888; font-size: 13px; }
    .detail-value { color: #fff; font-weight: 600; font-size: 13px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #6c3483, #2980b9); color: #fff;
           text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: 700; margin: 24px 0; }
    .status-badge { display: inline-block; padding: 6px 16px; border-radius: 20px; font-size: 12px;
                    font-weight: 700; text-transform: uppercase; letter-spacing: 1px; }
    .status-pending { background: #d4870015; color: #f39c12; border: 1px solid #f39c12; }
    .status-confirmed { background: #27ae6015; color: #27ae60; border: 1px solid #27ae60; }
    .status-cancelled { background: #e74c3c15; color: #e74c3c; border: 1px solid #e74c3c; }
    .footer { padding: 24px 40px; text-align: center; color: #555; font-size: 12px; border-top: 1px solid #222; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎧 DJ Booking System</h1>
      <p>${title}</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} DJ Booking System. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;

const bookingDetailsHtml = (booking) => `
  <div class="detail-box">
    <div class="detail-row">
      <span class="detail-label">Event Type</span>
      <span class="detail-value">${booking.eventType.charAt(0).toUpperCase() + booking.eventType.slice(1)}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Date</span>
      <span class="detail-value">${formatDate(booking.eventDate)}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Time</span>
      <span class="detail-value">${booking.startTime} – ${booking.endTime}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Venue</span>
      <span class="detail-value">${booking.venue.name}, ${booking.venue.city}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Package</span>
      <span class="detail-value">${booking.package?.name || 'N/A'}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Total Price</span>
      <span class="detail-value">${formatCurrency(booking.totalPrice)}</span>
    </div>
  </div>`;

const sendEmail = async (to, subject, html) => {
  if (!process.env.EMAIL_USER) {
    console.log(`📧 [EMAIL SKIPPED - no config] To: ${to} | Subject: ${subject}`);
    return;
  }
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `"DJ Booking" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject,
      html
    });
    console.log(`✅ Email sent to ${to}: ${subject}`);
  } catch (err) {
    console.error(`❌ Email failed to ${to}: ${err.message}`);
  }
};

// ── Email Templates ──────────────────────────────────────────────────────────

exports.sendBookingReceived = async (booking) => {
  const clientEmail = booking.client?.email;
  if (!clientEmail) return;

  const html = baseTemplate('Booking Request Received', `
    <p>Hi <strong>${booking.client.name}</strong>,</p>
    <p>We've received your booking request! 🎉 We'll review it and get back to you within 24 hours.</p>
    <p><span class="status-badge status-pending">Pending Review</span></p>
    ${bookingDetailsHtml(booking)}
    <p>We're excited about the possibility of making your event unforgettable!</p>
  `);

  await sendEmail(clientEmail, '🎧 Booking Request Received!', html);
};

exports.sendAdminNewBooking = async (booking) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return;

  const html = baseTemplate('New Booking Request', `
    <p>A new booking request has been submitted!</p>
    <p><strong>Client:</strong> ${booking.client?.name} (${booking.client?.email})</p>
    ${bookingDetailsHtml(booking)}
    <p>Please log in to your admin dashboard to review and confirm this booking.</p>
    <a class="btn" href="${process.env.CLIENT_URL}/admin/bookings">View Booking</a>
  `);

  await sendEmail(adminEmail, '🔔 New Booking Request!', html);
};

exports.sendBookingConfirmed = async (booking) => {
  const clientEmail = booking.client?.email;
  if (!clientEmail) return;

  const html = baseTemplate('Booking Confirmed!', `
    <p>Hi <strong>${booking.client.name}</strong>,</p>
    <p>Great news! Your booking has been <strong>confirmed</strong>. We can't wait to make your event amazing! 🎵</p>
    <p><span class="status-badge status-confirmed">Confirmed</span></p>
    ${bookingDetailsHtml(booking)}
    <p><strong>Deposit due:</strong> ${formatCurrency(booking.depositAmount)} (30% of total)</p>
    ${booking.adminNotes ? `<p><strong>Note from DJ:</strong> ${booking.adminNotes}</p>` : ''}
    <a class="btn" href="${process.env.CLIENT_URL}/dashboard">View My Booking</a>
  `);

  await sendEmail(clientEmail, '✅ Your Booking is Confirmed!', html);
};

exports.sendBookingCancelled = async (booking) => {
  const clientEmail = booking.client?.email;
  if (!clientEmail) return;

  const html = baseTemplate('Booking Update', `
    <p>Hi <strong>${booking.client.name}</strong>,</p>
    <p>We're sorry to inform you that we're unable to accommodate your booking request at this time.</p>
    <p><span class="status-badge status-cancelled">Cancelled</span></p>
    ${bookingDetailsHtml(booking)}
    ${booking.adminNotes ? `<p><strong>Reason:</strong> ${booking.adminNotes}</p>` : ''}
    <p>We apologize for any inconvenience and hope to work with you in the future.</p>
    <a class="btn" href="${process.env.CLIENT_URL}/booking">Book Another Date</a>
  `);

  await sendEmail(clientEmail, 'Booking Status Update', html);
};

exports.sendEventReminder = async (booking) => {
  const clientEmail = booking.client?.email;
  if (!clientEmail) return;

  const html = baseTemplate('Event Reminder — 48 Hours!', `
    <p>Hi <strong>${booking.client.name}</strong>,</p>
    <p>Just a friendly reminder — your event is in <strong>48 hours</strong>! 🎶</p>
    ${bookingDetailsHtml(booking)}
    <p>If you have any last-minute special requests, please get in touch as soon as possible.</p>
    <p>See you at the event! 🎧</p>
  `);

  await sendEmail(clientEmail, '⏰ Your Event is in 48 Hours!', html);
};

exports.sendReviewRequest = async (booking) => {
  const clientEmail = booking.client?.email;
  if (!clientEmail) return;

  const html = baseTemplate('Thank You! Share Your Experience', `
    <p>Hi <strong>${booking.client.name}</strong>,</p>
    <p>Thank you for choosing us for your event! We hope it was an incredible experience 🎉</p>
    <p>We'd love to hear your feedback. It only takes a minute and helps us improve!</p>
    <a class="btn" href="${process.env.CLIENT_URL}/dashboard/review/${booking._id}">Leave a Review ⭐</a>
    <p style="margin-top:24px; color: #666; font-size: 13px;">This link will expire in 30 days.</p>
  `);

  await sendEmail(clientEmail, '⭐ How was your event? Leave a review!', html);
};

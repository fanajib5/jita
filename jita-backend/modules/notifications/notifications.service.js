import nodemailer from 'nodemailer';
import crypto from 'crypto';
import axios from 'axios';
import { db } from '../../db.js';

let mailer = null;
function getMailer() {
  if (mailer !== null) return mailer;
  if (!process.env.SMTP_HOST) {
    mailer = null;
    return null;
  }
  mailer = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return mailer;
}

export async function notifyUser({ userId, templateKey, vars = {}, channel = 'in_app' }) {
  try {
    const [tRows] = await db.query('SELECT * FROM notification_templates WHERE template_key = ?', [
      templateKey,
    ]);
    const template = tRows[0];
    let subject = templateKey;
    let body = JSON.stringify(vars);

    if (template) {
      subject = template.subject_id;
      body = template.body_id.replace(/\{\{(\w+)\}\}/g, (_, k) =>
        vars[k] != null ? String(vars[k]) : ''
      );
    }

    const [uRows] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);
    const recipient = uRows[0];

    // Simpan selalu ke database (In-App Notification)
    await db.query(
      'INSERT INTO notifications (user_id, channel, template_key, subject, body) VALUES (?, ?, ?, ?, ?)',
      [userId, channel, templateKey, subject, body]
    );

    // Kirim Email jika channel email / all dan SMTP aktif
    if ((channel === 'email' || channel === 'all') && recipient?.email) {
      const transport = getMailer();
      if (transport) {
        await transport.sendMail({
          from: process.env.SMTP_FROM || 'JITA <noreply@jita.id>',
          to: recipient.email,
          subject: `[JITA] ${subject}`,
          text: body,
        });
      }
    }

    // Kirim Webhook jika dikonfigurasi
    if (process.env.NOTIFICATION_WEBHOOK_URL) {
      try {
        const payload = JSON.stringify({ userId, templateKey, subject, body });
        const secret = process.env.NOTIFICATION_WEBHOOK_SECRET || '';
        const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
        await axios.post(process.env.NOTIFICATION_WEBHOOK_URL, payload, {
          headers: {
            'Content-Type': 'application/json',
            'X-JITA-Signature': signature,
          },
          timeout: 5000,
        });
      } catch (webhookErr) {
        console.warn('Gagal memanggil webhook notifikasi:', webhookErr.message);
      }
    }
  } catch (err) {
    console.warn(`Gagal mengirim notifikasi (${templateKey}) ke user ${userId}:`, err.message);
  }
}

export const notificationsService = {
  notifyUser,

  async getMyNotifications(userId) {
    const [rows] = await db.query(
      'SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 30',
      [userId]
    );
    const unread = rows.filter((r) => !r.read_at).length;
    return { notifications: rows, unread };
  },

  async markAsRead(notificationId, userId) {
    await db.query(
      'UPDATE notifications SET read_at = NOW() WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );
    return true;
  },
};

export default {
  notifyUser,
  notificationsService,
};

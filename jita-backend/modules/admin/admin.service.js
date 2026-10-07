import { db } from '../../db.js';
import { notifyUser } from '../notifications/notifications.service.js';

export const adminService = {
  async getPendingDocuments() {
    const [rows] = await db.query(`
      SELECT d.*, u.name as user_name, u.email as user_email
      FROM documents d
      JOIN users u ON u.id = d.user_id
      WHERE d.verification_status = 'pending' AND d.deleted_at IS NULL
      ORDER BY d.created_at ASC
    `);
    return rows;
  },

  async decideDocument(documentId, adminUserId, action, notes) {
    await db.query(
      'UPDATE documents SET verification_status = ?, verification_notes = ?, verified_by = ?, verified_at = NOW() WHERE id = ?',
      [action, notes || null, adminUserId, documentId]
    );

    const [dRows] = await db.query('SELECT * FROM documents WHERE id = ?', [documentId]);
    if (dRows.length > 0) {
      const doc = dRows[0];
      const templateKey = action === 'approved' ? 'document_approved' : 'document_rejected';
      await notifyUser({
        userId: doc.user_id,
        templateKey,
        vars: { title: doc.title, type: doc.type, notes: notes || '-' },
        channel: 'email',
      });
    }

    return { message: `Dokumen ${action}` };
  },

  async batchDecideDocuments(documentIds, adminUserId, action) {
    for (const id of documentIds) {
      await db.query(
        'UPDATE documents SET verification_status = ?, verified_by = ?, verified_at = NOW() WHERE id = ?',
        [action, adminUserId, id]
      );
    }
    return { message: `Batch ${documentIds.length} dokumen ${action}` };
  },

  async getAdminStats() {
    const [uRows] = await db.query('SELECT COUNT(*) as total FROM users WHERE role = "student"');
    const [dRows] = await db.query(
      'SELECT COUNT(*) as pending FROM documents WHERE verification_status = "pending" AND deleted_at IS NULL'
    );
    const [apprRows] = await db.query(
      'SELECT COUNT(*) as approved FROM documents WHERE verification_status = "approved" AND deleted_at IS NULL'
    );
    const [jRows] = await db.query(
      'SELECT COUNT(*) as active FROM job_postings WHERE is_active = 1'
    );
    const [aRows] = await db.query('SELECT COUNT(*) as total FROM job_applications');

    return {
      totalStudents: uRows[0]?.total || 0,
      pendingDocs: dRows[0]?.pending || 0,
      approvedDocs: apprRows[0]?.approved || 0,
      activeJobs: jRows[0]?.active || 0,
      totalApplications: aRows[0]?.total || 0,
    };
  },
};

export default adminService;

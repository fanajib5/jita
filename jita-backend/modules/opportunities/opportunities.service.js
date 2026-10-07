import { db } from '../../db.js';
import { notifyUser } from '../notifications/notifications.service.js';
import {
  ValidationError,
  NotFoundError,
  AuthorizationError,
  ConflictError,
} from '../../errors/AppError.js';

const JLPT_RANKS = {
  N1: 5,
  N2: 4,
  N3: 3,
  N4: 2,
  N5: 1,
};

export function getJlptRank(level) {
  if (!level) return 0;
  const cleaned = String(level).trim().toUpperCase();
  return JLPT_RANKS[cleaned] || 0;
}

export function calculateJlptScore(candidateLevel, requiredLevel) {
  if (!requiredLevel) return 1.0;
  const candRank = getJlptRank(candidateLevel);
  const reqRank = getJlptRank(requiredLevel);
  if (candRank === 0) return 0.2;
  if (candRank >= reqRank) return 1.0;
  if (candRank === reqRank - 1) return 0.5;
  return 0.1;
}

export function extractKeywords(textOrArray) {
  if (!textOrArray) return [];
  if (Array.isArray(textOrArray)) {
    return textOrArray.map((s) => String(s).trim().toLowerCase()).filter(Boolean);
  }
  return String(textOrArray)
    .split(/[,/|\n]+/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function calculateJaccardSimilarity(candidateSkills, jobSkills) {
  const cTokens = extractKeywords(candidateSkills);
  const jTokens = extractKeywords(jobSkills);
  if (jTokens.length === 0) return 0.8;
  if (cTokens.length === 0) return 0.2;

  const cSet = new Set(cTokens);
  const jSet = new Set(jTokens);

  let intersection = 0;
  for (const item of cSet) {
    for (const jItem of jSet) {
      if (item === jItem || item.includes(jItem) || jItem.includes(item)) {
        intersection++;
        break;
      }
    }
  }

  const union = new Set([...cTokens, ...jTokens]).size;
  return union > 0 ? intersection / union : 0;
}

export function calculateMatchScore(candidate, job) {
  let score = 0;
  const breakdown = {};

  const jlptFactor = calculateJlptScore(candidate.jlpt_level, job.jlpt_requirement);
  const jlptPoints = Math.round(jlptFactor * 40);
  score += jlptPoints;
  breakdown.jlpt = {
    points: jlptPoints,
    max: 40,
    candidateLevel: candidate.jlpt_level || 'Belum ada',
    requiredLevel: job.jlpt_requirement || 'Tidak ada',
  };

  const cSkills = [
    ...(Array.isArray(candidate.specialization)
      ? candidate.specialization
      : extractKeywords(candidate.specialization)),
    ...(typeof candidate.skills_json === 'string'
      ? JSON.parse(candidate.skills_json || '[]')
      : candidate.skills_json || []),
  ];
  const jSkills = [
    ...(Array.isArray(job.tags) ? job.tags : extractKeywords(job.tags)),
    ...extractKeywords(job.description),
  ];

  const skillFactor = calculateJaccardSimilarity(cSkills, jSkills);
  const skillPoints = Math.round(skillFactor * 35);
  score += skillPoints;
  breakdown.skills = {
    points: skillPoints,
    max: 35,
    matchedKeywords: cSkills.filter((s) =>
      jSkills.some((j) => j.includes(s) || s.includes(j))
    ),
  };

  let expPoints = 10;
  const experiences =
    typeof candidate.experience_json === 'string'
      ? JSON.parse(candidate.experience_json || '[]')
      : candidate.experience_json || [];
  if (Array.isArray(experiences) && experiences.length > 0) {
    expPoints = Math.min(25, 10 + experiences.length * 5);
  }
  score += expPoints;
  breakdown.experience = {
    points: expPoints,
    max: 25,
    totalRecords: experiences.length,
  };

  return {
    score: Math.min(100, Math.max(0, score)),
    breakdown,
  };
}

export const opportunitiesService = {
  calculateMatchScore,

  async getJobs(query, user) {
    const { search, jlpt, location_type, sector, location, minJlpt, specialization, target_audience } = query;
    let sql = `
      SELECT j.*, c.name as company_name, c.name_jp as company_name_jp, c.industry as company_sector, c.industry as company_industry
      FROM job_postings j
      LEFT JOIN companies c ON c.id = j.company_id
      WHERE j.is_active = 1 AND j.deleted_at IS NULL
    `;
    const params = [];

    const searchKeyword = search || specialization;
    if (searchKeyword) {
      sql += ' AND (j.title LIKE ? OR j.description LIKE ? OR c.name LIKE ? OR j.specialization LIKE ?)';
      params.push(`%${searchKeyword}%`, `%${searchKeyword}%`, `%${searchKeyword}%`, `%${searchKeyword}%`);
    }
    const filterJlpt = jlpt || minJlpt;
    if (filterJlpt) {
      sql += ' AND (j.min_jlpt = ? OR j.min_jlpt IS NULL)';
      params.push(filterJlpt);
    }
    const filterLoc = location_type || location;
    if (filterLoc) {
      sql += ' AND (j.location LIKE ? OR j.location IS NULL)';
      params.push(`%${filterLoc}%`);
    }
    if (sector) {
      sql += ' AND c.industry = ?';
      params.push(sector);
    }
    if (target_audience) {
      sql += ' AND (j.target_audience = ? OR j.target_audience = "all")';
      params.push(target_audience);
    }

    sql += ' ORDER BY j.created_at DESC';
    const [jobs] = await db.query(sql, params);

    let candidate = null;
    if (user && (user.role === 'student' || user.role === 'alumni')) {
      const [cRows] = await db.query('SELECT * FROM users WHERE id = ?', [user.id]);
      if (cRows.length > 0) candidate = cRows[0];
    }

    const enrichedJobs = jobs.map((job) => {
      let match = null;
      if (candidate) {
        match = calculateMatchScore(candidate, job);
      }
      return {
        ...job,
        tags: typeof job.tags === 'string' ? JSON.parse(job.tags || '[]') : job.tags || [],
        match_score: match ? match.score : null,
        matchScore: match ? match.score : null,
        match_breakdown: match ? match.breakdown : null,
      };
    });

    return { jobs: enrichedJobs };
  },

  async getCompanies() {
    const [rows] = await db.query(
      'SELECT * FROM companies WHERE deleted_at IS NULL ORDER BY name ASC'
    );
    return rows;
  },

  async createCompany(data, userId) {
    const { name, name_jp, nameJp, industry, sector, website, description, contact_email } = data;
    if (!name) throw new ValidationError('Nama perusahaan wajib diisi');

    const [res] = await db.query(
      `INSERT INTO companies (name, name_jp, industry, website, description, contact_email, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        name_jp || nameJp || null,
        industry || sector || 'IT & Manufaktur',
        website || null,
        description || null,
        contact_email || null,
        userId,
      ]
    );
    return { id: res.insertId, name, message: 'Perusahaan berhasil didaftarkan' };
  },

  async createJob(data, userId) {
    const {
      company_id,
      companyId,
      title,
      title_jp,
      titleJp,
      description,
      requirements,
      specialization,
      min_jlpt,
      minJlpt,
      location,
      employment_type,
      employmentType,
      target_audience,
      targetAudience,
      salary_range,
      salaryRange,
    } = data;

    const targetCompanyId = company_id || companyId;
    if (!title || !targetCompanyId) {
      throw new ValidationError('Judul lowongan dan ID perusahaan wajib diisi');
    }

    const [res] = await db.query(
      `INSERT INTO job_postings
       (company_id, title, title_jp, description, requirements, specialization, min_jlpt, location, employment_type, target_audience, salary_range, is_active, posted_by, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        targetCompanyId,
        title,
        title_jp || titleJp || null,
        description || null,
        requirements || null,
        specialization || null,
        min_jlpt || minJlpt || null,
        location || null,
        employment_type || employmentType || 'fulltime',
        target_audience || targetAudience || 'all',
        salary_range || salaryRange || null,
        userId,
        userId,
      ]
    );

    return { id: res.insertId, message: 'Lowongan pekerjaan berhasil diterbitkan' };
  },

  async deleteJob(id, userId) {
    await db.query('UPDATE job_postings SET deleted_at = NOW(), deleted_by = ? WHERE id = ?', [
      userId,
      id,
    ]);
    return true;
  },

  async applyJob(jobId, notes, user) {
    if (user.role !== 'student' && user.role !== 'alumni') {
      throw new AuthorizationError('Hanya kandidat siswa atau alumni yang dapat melamar lowongan ini');
    }

    const [existing] = await db.query(
      'SELECT id FROM job_applications WHERE job_id = ? AND user_id = ? AND deleted_at IS NULL',
      [jobId, user.id]
    );
    if (existing.length > 0) {
      throw new ConflictError('Anda sudah melamar pada lowongan ini sebelumnya');
    }

    const [jRows] = await db.query(
      `SELECT j.*, c.name as company_name
       FROM job_postings j
       LEFT JOIN companies c ON c.id = j.company_id
       WHERE j.id = ? AND j.is_active = 1 AND j.deleted_at IS NULL`,
      [jobId]
    );
    if (jRows.length === 0) throw new NotFoundError('Lowongan tidak ditemukan atau sudah ditutup');
    const job = jRows[0];

    // Role check against target_audience
    if (user.role === 'student' && job.target_audience === 'graduated') {
      throw new AuthorizationError(
        'Lowongan ini khusus untuk kandidat yang telah lulus (graduated/alumni). Siswa aktif tidak dapat melamar.'
      );
    }
    if (user.role === 'alumni' && job.target_audience === 'student') {
      throw new AuthorizationError(
        'Lowongan ini dikhususkan untuk siswa aktif (magang/internship/persiapan kelulusan).'
      );
    }

    const [uRows] = await db.query('SELECT * FROM users WHERE id = ?', [user.id]);
    const candidate = uRows[0];
    const match = calculateMatchScore(candidate, job);

    const [res] = await db.query(
      `INSERT INTO job_applications
       (job_id, user_id, status, match_score, candidate_notes, created_by)
       VALUES (?, ?, 'applied', ?, ?, ?)`,
      [jobId, user.id, match.score, notes || null, user.id]
    );

    await notifyUser({
      userId: user.id,
      templateKey: 'application_submitted',
      vars: {
        jobTitle: job.title,
        company: job.company_name || 'Perusahaan',
        matchScore: `${match.score}%`,
      },
      channel: 'email',
    });

    return {
      applicationId: res.insertId,
      matchScore: match.score,
      message: 'Lamaran Anda berhasil dikirim ke mitra',
    };
  },

  async scoutCandidate(jobId, candidateId, notes, user) {
    if (user.role !== 'admin' && user.role !== 'corporate') {
      throw new AuthorizationError('Akses scouting hanya untuk admin atau mitra corporate');
    }

    const [jRows] = await db.query(
      `SELECT j.*, c.name as company_name
       FROM job_postings j
       LEFT JOIN companies c ON c.id = j.company_id
       WHERE j.id = ? AND j.deleted_at IS NULL`,
      [jobId]
    );
    if (jRows.length === 0) throw new NotFoundError('Lowongan tidak ditemukan');
    const job = jRows[0];

    const [uRows] = await db.query('SELECT * FROM users WHERE id = ? AND deleted_at IS NULL', [
      candidateId,
    ]);
    if (uRows.length === 0) throw new NotFoundError('Kandidat tidak ditemukan');
    const candidate = uRows[0];

    if (user.role === 'corporate' && !candidate.profile_verified) {
      throw new AuthorizationError('Kandidat belum diverifikasi admin JITA, tidak dapat di-scout saat ini');
    }

    const match = calculateMatchScore(candidate, job);

    const [existing] = await db.query(
      'SELECT id, status FROM job_applications WHERE job_id = ? AND user_id = ? AND deleted_at IS NULL',
      [jobId, candidateId]
    );

    let applicationId;
    if (existing.length > 0) {
      applicationId = existing[0].id;
      await db.query(
        'UPDATE job_applications SET status = "interview_offered", scout_notes = ?, match_score = ? WHERE id = ?',
        [notes || null, match.score, applicationId]
      );
    } else {
      const [res] = await db.query(
        `INSERT INTO job_applications
         (job_id, user_id, status, match_score, scout_notes, created_by)
         VALUES (?, ?, 'scouted', ?, ?, ?)`,
        [jobId, candidateId, match.score, notes || null, user.id]
      );
      applicationId = res.insertId;
    }

    await notifyUser({
      userId: candidate.id,
      templateKey: 'candidate_scouted',
      vars: {
        candidateName: candidate.name,
        company: job.company_name || 'Mitra Corporate JITA',
        jobTitle: job.title,
        notes: notes || 'Profil Anda cocok dengan lowongan ini',
      },
      channel: 'email',
    });

    return {
      applicationId,
      message: `Undangan scouting berhasil dikirim ke ${candidate.name}`,
    };
  },

  async getScoutCandidates(query, user) {
    if (user.role !== 'admin' && user.role !== 'corporate') {
      throw new AuthorizationError('Akses ditolak');
    }

    const { jlpt, status } = query;
    let sql = 'SELECT * FROM users WHERE role = "student" AND deleted_at IS NULL';
    const params = [];

    if (user.role === 'corporate') {
      sql += ' AND profile_verified = 1';
    }
    if (jlpt) {
      sql += ' AND jlpt_level = ?';
      params.push(jlpt);
    }
    if (status) {
      sql += ' AND candidate_status = ?';
      params.push(status);
    }

    sql += ' ORDER BY overall_score DESC, id DESC';
    const [candidates] = await db.query(sql, params);

    return {
      candidates: candidates.map((u) => ({
        id: u.id,
        name: u.name,
        nameJp: u.name_jp,
        email: u.email,
        phone: u.phone,
        originCity: u.origin_city,
        jlptLevel: u.jlpt_level,
        specialization: u.specialization
          ? u.specialization.split(',').map((s) => s.trim())
          : [],
        candidateStatus: u.candidate_status,
        overallScore: u.overall_score,
        profileVerified: Boolean(u.profile_verified),
        avatar: u.avatar,
      })),
    };
  },

  async getMyApplications(userId) {
    const [rows] = await db.query(
      `SELECT a.*, j.title as job_title, j.location as location_city, c.name as company_name, c.name_jp as company_name_jp
       FROM job_applications a
       JOIN job_postings j ON j.id = a.job_id
       LEFT JOIN companies c ON c.id = j.company_id
       WHERE a.user_id = ? AND a.deleted_at IS NULL
       ORDER BY a.created_at DESC`,
      [userId]
    );
    return { applications: rows };
  },

  async getJobApplications(jobId, user) {
    if (user.role !== 'admin' && user.role !== 'corporate') {
      throw new AuthorizationError('Akses ditolak');
    }

    const [rows] = await db.query(
      `SELECT a.*, u.name as candidate_name, u.email as candidate_email, u.phone as candidate_phone, u.jlpt_level, u.candidate_status, u.profile_verified
       FROM job_applications a
       JOIN users u ON u.id = a.user_id
       WHERE a.job_id = ? AND a.deleted_at IS NULL
       ORDER BY a.created_at ASC`,
      [jobId]
    );
    return { applications: rows };
  },

  async decideApplication(appId, { status, message }, user) {
    if (user.role !== 'admin' && user.role !== 'corporate') {
      throw new AuthorizationError('Akses ditolak');
    }

    const [rows] = await db.query(
      `SELECT a.*, u.name as candidate_name, u.email as candidate_email, j.title as job_title, c.name as company_name
       FROM job_applications a
       JOIN users u ON u.id = a.user_id
       JOIN job_postings j ON j.id = a.job_id
       LEFT JOIN companies c ON c.id = j.company_id
       WHERE a.id = ? AND a.deleted_at IS NULL`,
      [appId]
    );
    if (rows.length === 0) throw new NotFoundError('Lamaran tidak ditemukan');
    const app = rows[0];

    await db.query(
      'UPDATE job_applications SET status = ?, message = ?, updated_by = ?, decided_at = NOW() WHERE id = ?',
      [status, message || null, user.id, appId]
    );

    const statusLabels = {
      interview_offered: 'Wawancara Ditawarkan',
      accepted: 'Diterima (Accepted)',
      rejected: 'Tidak Lolos (Rejected)',
      withdrawn: 'Dibatalkan',
    };

    await notifyUser({
      userId: app.user_id,
      templateKey: 'application_decided',
      vars: {
        name: app.candidate_name,
        jobTitle: app.job_title,
        company: app.company_name || 'Perusahaan',
        status: statusLabels[status] || status,
        message: message || '-',
      },
      channel: 'email',
    });

    return true;
  },
};

export default opportunitiesService;

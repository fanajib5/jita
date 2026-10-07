import bcrypt from 'bcryptjs';
import mysql from 'mysql2/promise';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'oralunas_jitaadmin',
  password: process.env.DB_PASSWORD || 'kampus2026!',
  database: process.env.DB_NAME || 'oralunas_jitadb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

const pool = mysql.createPool(dbConfig);

const PROFILE_COLUMNS = [
  ['name_jp', 'VARCHAR(255) NULL'],
  ['birth_date', 'DATE NULL'],
  ['origin_city', 'VARCHAR(255) NULL'],
  ['phone', 'VARCHAR(50) NULL'],
  ['jlpt_level', 'VARCHAR(10) NULL'],
  ['specialization', 'VARCHAR(500) NULL'],
  ['education_json', 'JSON NULL'],
  ['experience_json', 'JSON NULL'],
  ['skills_json', 'JSON NULL'],
  ['bio_id', 'TEXT NULL'],
  ['bio_jp', 'TEXT NULL'],
  ['profile_verified', 'TINYINT(1) DEFAULT 0'],
  ['avatar', 'VARCHAR(500) NULL'],
  ['company_name', 'VARCHAR(255) NULL'],
  ['title', 'VARCHAR(255) NULL'],
  ['program_name', 'VARCHAR(255) NULL'],
  ['candidate_status', "ENUM('available','interviewing','placed') DEFAULT 'available'"],
  ['language_score', 'INT DEFAULT 0'],
  ['cultural_score', 'INT DEFAULT 0'],
  ['technical_score', 'INT DEFAULT 0'],
  ['overall_score', 'INT DEFAULT 0'],
  ['updated_at', 'TIMESTAMP NULL'],
  ['updated_by', 'INT NULL'],
  ['deleted_at', 'TIMESTAMP NULL'],
  ['deleted_by', 'INT NULL'],
];

const DOCUMENT_COLUMNS = [
  ['title_jp', 'VARCHAR(255) NULL'],
  ['program_name', 'VARCHAR(255) NULL'],
  ['credential_status', "ENUM('valid','pending','expired') DEFAULT 'pending'"],
  ['updated_at', 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'],
  ['updated_by', 'INT NULL'],
  ['deleted_at', 'TIMESTAMP NULL'],
  ['deleted_by', 'INT NULL'],
];

const NEW_TABLES = [
  `CREATE TABLE IF NOT EXISTS calendar_events (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    title_jp VARCHAR(255) NULL,
    description TEXT,
    start_at DATETIME NOT NULL,
    end_at DATETIME NOT NULL,
    type ENUM('class','partner_meeting','event','deadline') DEFAULT 'class',
    visibility ENUM('student','alumni','corporate','all') DEFAULT 'student',
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_start (start_at),
    INDEX idx_type (type)
  )`,
  `CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    title_jp VARCHAR(255) NULL,
    description TEXT,
    phase TINYINT DEFAULT 1,
    educator_id INT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS course_modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    title_jp VARCHAR(255) NULL,
    sort_order INT DEFAULT 0,
    duration_minutes INT DEFAULT 60,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_course (course_id, sort_order),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS course_enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    course_id INT NOT NULL,
    progress_pct TINYINT DEFAULT 0,
    status ENUM('enrolled','in_progress','completed','dropped') DEFAULT 'enrolled',
    started_at TIMESTAMP NULL,
    completed_at TIMESTAMP NULL,
    UNIQUE KEY uniq_user_course (user_id, course_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('ktp','certificate','portfolio','transcript','badge') NOT NULL,
    title VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_mime VARCHAR(100) NOT NULL,
    file_size_bytes INT NOT NULL,
    issued_by VARCHAR(255) NULL,
    issued_date DATE NULL,
    verification_status ENUM('pending','approved','rejected') DEFAULT 'pending',
    verification_notes TEXT NULL,
    verified_by INT NULL,
    verified_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_status (verification_status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS document_verifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    document_id INT NOT NULL,
    actor_id INT NOT NULL,
    action ENUM('submitted','approved','rejected','requested_changes') NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_doc (document_id),
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS companies (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_jp VARCHAR(255) NULL,
    industry VARCHAR(100) NULL,
    website VARCHAR(500) NULL,
    description TEXT,
    contact_email VARCHAR(255) NULL,
    created_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS job_postings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    title_jp VARCHAR(255) NULL,
    description TEXT,
    requirements TEXT,
    specialization VARCHAR(500) NULL,
    min_jlpt VARCHAR(10) NULL,
    location VARCHAR(255) NULL,
    employment_type ENUM('fulltime','contract','internship') DEFAULT 'fulltime',
    target_audience ENUM('all','student','graduated') DEFAULT 'all',
    salary_range VARCHAR(100) NULL,
    is_active TINYINT(1) DEFAULT 1,
    posted_by INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_active (is_active, created_at),
    INDEX idx_audience (target_audience),
    INDEX idx_company (company_id),
    FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS job_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    user_id INT NOT NULL,
    type ENUM('apply','scout') NOT NULL,
    status ENUM('submitted','shortlisted','rejected','accepted','withdrawn') DEFAULT 'submitted',
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    decided_at TIMESTAMP NULL,
    UNIQUE KEY uniq_job_user_type (job_id, user_id, type),
    INDEX idx_user (user_id),
    INDEX idx_job (job_id),
    FOREIGN KEY (job_id) REFERENCES job_postings(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS notification_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    template_key VARCHAR(100) UNIQUE NOT NULL,
    subject_id VARCHAR(255) NOT NULL,
    subject_jp VARCHAR(255) NULL,
    body_id TEXT NOT NULL,
    body_jp TEXT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    channel ENUM('email','webhook','in_app') NOT NULL,
    template_key VARCHAR(100) NOT NULL,
    payload_json JSON NULL,
    subject VARCHAR(255) NULL,
    status ENUM('queued','sent','failed','skipped') DEFAULT 'queued',
    error_message TEXT NULL,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user_unread (user_id, read_at),
    INDEX idx_status (status),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS course_module_progress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    module_id INT NOT NULL,
    progress_pct TINYINT DEFAULT 0,
    status ENUM('locked','in_progress','completed') DEFAULT 'locked',
    total_sessions INT DEFAULT 0,
    completed_sessions INT DEFAULT 0,
    notes TEXT NULL,
    last_activity_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uniq_user_module (user_id, module_id),
    INDEX idx_user (user_id),
    INDEX idx_module (module_id),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (module_id) REFERENCES course_modules(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS mentoring_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    title_jp VARCHAR(255) NULL,
    educator_id INT NOT NULL,
    student_id INT NOT NULL,
    session_date DATE NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    duration_minutes INT DEFAULT 60,
    type ENUM('bilingual','silver') NOT NULL,
    status ENUM('scheduled','completed','cancelled') DEFAULT 'scheduled',
    topic TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_educator (educator_id),
    INDEX idx_student (student_id),
    INDEX idx_date (session_date),
    FOREIGN KEY (educator_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS career_milestones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    milestone_date DATE NOT NULL,
    type ENUM('placement','promotion','contract_renewal','transfer','certification','notification') NOT NULL,
    title VARCHAR(255) NOT NULL,
    title_jp VARCHAR(255) NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    salary_change VARCHAR(50) NULL,
    is_proactive TINYINT(1) DEFAULT 0,
    proactive_message TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_user (user_id),
    INDEX idx_date (milestone_date),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    title_jp VARCHAR(255) NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    category ENUM('announcement', 'article', 'event') NOT NULL,
    source_name VARCHAR(100) NOT NULL,
    source_type ENUM('ice_center', 'corporate', 'partner_educator', 'official') NOT NULL,
    author_name VARCHAR(100) NULL,
    excerpt TEXT NULL,
    content LONGTEXT NOT NULL,
    cover_image VARCHAR(500) NULL,
    event_date DATETIME NULL,
    event_location VARCHAR(255) NULL,
    external_link VARCHAR(500) NULL,
    tags VARCHAR(255) NULL,
    is_pinned TINYINT(1) DEFAULT 0,
    is_published TINYINT(1) DEFAULT 1,
    views_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_cat_published (category, is_published),
    INDEX idx_pinned_created (is_pinned, created_at)
  )`,
];

async function initSchema() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) DEFAULT 'student',
      ice_uuid VARCHAR(255) UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  for (const [col, def] of PROFILE_COLUMNS) {
    try {
      await pool.query(`ALTER TABLE users ADD COLUMN ${col} ${def}`);
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') console.warn(`users.${col}:`, err.message);
    }
  }

  for (const sql of NEW_TABLES) {
    try {
      await pool.query(sql);
    } catch (err) {
      console.warn('CREATE TABLE err:', err.message);
    }
  }

  for (const [col, def] of DOCUMENT_COLUMNS) {
    try {
      await pool.query(`ALTER TABLE documents ADD COLUMN ${col} ${def}`);
    } catch (err) {
      if (err.code !== 'ER_DUP_FIELDNAME') console.warn(`documents.${col}:`, err.message);
    }
  }

  const AUDIT_TABLES = [
    'calendar_events',
    'courses',
    'course_modules',
    'course_enrollments',
    'companies',
    'job_postings',
    'job_applications',
    'notifications',
    'course_module_progress',
    'mentoring_sessions',
    'career_milestones',
    'posts',
  ];

  const COMMON_AUDIT_COLS = [
    ['created_by', 'INT NULL'],
    ['created_at', 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP'],
    ['updated_by', 'INT NULL'],
    ['updated_at', 'TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'],
    ['deleted_at', 'TIMESTAMP NULL'],
    ['deleted_by', 'INT NULL'],
  ];

  for (const tbl of AUDIT_TABLES) {
    for (const [col, def] of COMMON_AUDIT_COLS) {
      try {
        await pool.query(`ALTER TABLE ${tbl} ADD COLUMN ${col} ${def}`);
      } catch {
        // ER_DUP_FIELDNAME or other non-fatal errors
      }
    }
  }

  // Add content column to course_modules (WYSIWYG HTML body)
  try {
    await pool.query('ALTER TABLE course_modules ADD COLUMN content LONGTEXT NULL AFTER title_jp');
    console.log('✅ Kolom content ditambahkan ke course_modules.');
  } catch {
    // Already exists
  }

  // Add content column to courses for rich description
  try {
    await pool.query('ALTER TABLE courses ADD COLUMN content LONGTEXT NULL AFTER description');
    console.log('✅ Kolom content ditambahkan ke courses.');
  } catch {
    // Already exists
  }

  // Add target_audience column to job_postings
  try {
    await pool.query(
      "ALTER TABLE job_postings ADD COLUMN target_audience ENUM('all','student','graduated') DEFAULT 'all' AFTER employment_type"
    );
    console.log('✅ Kolom target_audience ditambahkan ke job_postings.');
  } catch {
    // Already exists
  }
}

async function runSeeder() {
  console.log('🚀 Memulai seeder database JITA...');
  await initSchema();

  const defaultPasswordHash = await bcrypt.hash('password123', 10);

  const usersToSeed = [
    {
      name: 'Budi Santoso',
      email: 'budi@student.jita.id',
      role: 'student',
      title: 'Kandidat Program Teknik Manufaktur',
      jlpt_level: 'N3',
      origin_city: 'Surabaya, Jawa Timur',
      program_name: 'Program Persiapan Industri Jepang 2025',
      language_score: 85,
      cultural_score: 88,
      technical_score: 90,
      overall_score: 88,
      candidate_status: 'available',
      profile_verified: 1,
    },
    {
      name: 'Tanaka Hiroshi',
      name_jp: '田中 浩',
      email: 'tanaka@recruit.co.jp',
      role: 'corporate',
      company_name: 'Tanaka Manufacturing Co., Ltd.',
      title: 'HR Manager',
      profile_verified: 1,
    },
    {
      name: 'Sari Indrawati',
      email: 'sari@educator.jita.id',
      role: 'educator_bilingual',
      title: 'Instruktur Bahasa Jepang N3',
      profile_verified: 1,
    },
    {
      name: 'Yamamoto Kenji',
      name_jp: '山本 健二',
      email: 'yamamoto@silver.jita.id',
      role: 'educator_silver',
      company_name: 'Retired — Toyota Motor Corporation',
      title: 'Senior Industry Mentor',
      profile_verified: 1,
    },
    {
      name: 'Rina Kusuma',
      email: 'rina@alumni.jita.id',
      role: 'alumni',
      company_name: 'Murata Manufacturing Co., Ltd.',
      title: 'Automation & Robotics Engineer (Kyoto)',
      profile_verified: 1,
    },
    {
      name: 'Admin JITA',
      email: 'admin@jita.id',
      role: 'admin',
      title: 'Lead Administrator',
      profile_verified: 1,
    },
    {
      name: 'Siti Rahmawati',
      email: 'siti.rahmawati@student.jita.id',
      role: 'student',
      origin_city: 'Yogyakarta',
      program_name: 'Teknologi Informasi & IoT',
      jlpt_level: 'N2',
      language_score: 92,
      cultural_score: 85,
      technical_score: 94,
      overall_score: 91,
      specialization: 'Cloud, Embedded System, TypeScript',
      candidate_status: 'interviewing',
      profile_verified: 1,
    },
    {
      name: 'Ahmad Fauzi',
      email: 'ahmad.fauzi@student.jita.id',
      role: 'student',
      origin_city: 'Bandung, Jawa Barat',
      program_name: 'Pertanian Modern & Agribisnis',
      jlpt_level: 'N4',
      language_score: 71,
      cultural_score: 80,
      technical_score: 90,
      overall_score: 80,
      specialization: 'Agribisnis, Pertanian Presisi',
      candidate_status: 'placed',
      profile_verified: 1,
    },
    {
      name: 'Maya Sari',
      email: 'maya.sari@student.jita.id',
      role: 'student',
      origin_city: 'Denpasar, Bali',
      program_name: 'Desain & Kreatif',
      jlpt_level: 'N3',
      language_score: 86,
      cultural_score: 93,
      technical_score: 88,
      overall_score: 89,
      specialization: 'Desain Grafis, Animasi, Media Kreatif',
      candidate_status: 'available',
      profile_verified: 1,
    },
  ];

  for (const u of usersToSeed) {
    await pool.query(
      `INSERT INTO users (
        name, name_jp, email, password_hash, role, title, company_name,
        origin_city, program_name, jlpt_level, language_score, cultural_score,
        technical_score, overall_score, specialization, candidate_status, profile_verified
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        name_jp = VALUES(name_jp),
        role = VALUES(role),
        title = VALUES(title),
        company_name = VALUES(company_name),
        origin_city = VALUES(origin_city),
        program_name = VALUES(program_name),
        jlpt_level = VALUES(jlpt_level),
        language_score = VALUES(language_score),
        cultural_score = VALUES(cultural_score),
        technical_score = VALUES(technical_score),
        overall_score = VALUES(overall_score),
        specialization = VALUES(specialization),
        candidate_status = VALUES(candidate_status),
        profile_verified = VALUES(profile_verified)`,
      [
        u.name,
        u.name_jp || null,
        u.email,
        defaultPasswordHash,
        u.role,
        u.title || null,
        u.company_name || null,
        u.origin_city || null,
        u.program_name || null,
        u.jlpt_level || null,
        u.language_score || 0,
        u.cultural_score || 0,
        u.technical_score || 0,
        u.overall_score || 0,
        u.specialization || null,
        u.candidate_status || 'available',
        u.profile_verified || 0,
      ]
    );
  }
  console.log(`✅ Seeded ${usersToSeed.length} users & candidate profiles.`);

  // 2. Seed Company & Job Postings
  const [corporateRows] = await pool.query(
    `SELECT id FROM users WHERE email = 'tanaka@recruit.co.jp' LIMIT 1`
  );
  const corporateUserId = corporateRows[0]?.id;

  if (corporateUserId) {
    await pool.query(
      `INSERT INTO companies (id, name, name_jp, industry, website, description, contact_email, created_by)
       VALUES (1, 'Tanaka Manufacturing Co., Ltd.', '田中製造株式会社', 'Manufaktur & Otomotif', 'https://tanaka-mfg.example.jp', 'Perusahaan manufaktur presisi komponen otomotif yang berpusat di Aichi, Jepang.', 'tanaka@recruit.co.jp', ?)
       ON DUPLICATE KEY UPDATE name = VALUES(name), industry = VALUES(industry), description = VALUES(description)`,
      [corporateUserId]
    );

    const defaultJobs = [
      {
        title: 'Junior Quality Control Engineer',
        title_jp: '品質管理ジュニアエンジニア',
        description:
          'Bertanggung jawab atas inspeksi kualitas komponen presisi otomotif, membaca cetak biru teknis, dan koordinasi dengan tim produksi lokal Jepang.',
        requirements:
          'Kemampuan Bahasa Jepang setara N3/N4, lulusan program manufaktur JITA, memiliki etos kerja disiplin 5S (Seiri, Seiton, Seiso, Seiketsu, Shitsuke).',
        specialization: 'Manufaktur, Otomotif, Quality Control',
        min_jlpt: 'N3',
        location: 'Toyota City, Aichi, Jepang',
        employment_type: 'fulltime',
        salary_range: '¥220,000 - ¥260,000 / bulan',
        is_active: 1,
      },
      {
        title: 'CNC Machine Operator & Programmer',
        title_jp: 'CNCマシニングオペレーター',
        description:
          'Mengoperasikan mesin bubut/milling CNC 3-axis dan 5-axis, setup tools, serta memverifikasi toleransi produk mikro.',
        requirements:
          'Pengalaman dasar mesin perkakas, sertifikasi JITA Manufaktur, bersedia ditempatkan di pabrik Osaka.',
        specialization: 'Manufaktur, Permesinan',
        min_jlpt: 'N4',
        location: 'Osaka, Jepang',
        employment_type: 'fulltime',
        salary_range: '¥210,000 - ¥250,000 / bulan',
        is_active: 1,
      },
    ];

    for (const job of defaultJobs) {
      await pool.query(
        `INSERT INTO job_postings (
          company_id, title, title_jp, description, requirements, specialization,
          min_jlpt, location, employment_type, salary_range, is_active, posted_by
        ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE title = VALUES(title), is_active = VALUES(is_active)`,
        [
          job.title,
          job.title_jp,
          job.description,
          job.requirements,
          job.specialization,
          job.min_jlpt,
          job.location,
          job.employment_type,
          job.salary_range,
          job.is_active,
          corporateUserId,
        ]
      );
    }
    console.log(`✅ Seeded company Tanaka Manufacturing & default job postings.`);
  }

  // 3. Seed Credentials & Documents for Student (Budi Santoso)
  const [budiRows] = await pool.query(
    `SELECT id FROM users WHERE email = 'budi@student.jita.id' LIMIT 1`
  );
  const budiUserId = budiRows[0]?.id;

  if (budiUserId) {
    const credentials = [
      {
        title: 'Sertifikat Fondasi Bahasa Jepang',
        title_jp: '日本語基礎修了証',
        type: 'certificate',
        file_path: 'mock/sertifikat-bahasa.pdf',
        file_mime: 'application/pdf',
        file_size_bytes: 524288,
        issued_by: 'JITA Core Authority',
        issued_date: '2025-03-15',
        verification_status: 'approved',
        program_name: 'Program Persiapan Industri Jepang 2025',
        credential_status: 'valid',
      },
      {
        title: 'Badge Kultural Level 1',
        title_jp: '文化バッジ Lv.1',
        type: 'badge',
        file_path: 'mock/badge-kultural.png',
        file_mime: 'image/png',
        file_size_bytes: 204800,
        issued_by: 'JITA Core Authority',
        issued_date: '2025-04-02',
        verification_status: 'approved',
        program_name: 'Program Persiapan Industri Jepang 2025',
        credential_status: 'valid',
      },
      {
        title: 'Transkrip Program (Draft)',
        type: 'transcript',
        file_path: 'mock/transkrip-draft.pdf',
        file_mime: 'application/pdf',
        file_size_bytes: 314572,
        issued_by: 'JITA Core Authority',
        verification_status: 'pending',
        program_name: 'Program Persiapan Industri Jepang 2025',
        credential_status: 'pending',
      },
    ];

    for (const cred of credentials) {
      await pool.query(
        `INSERT INTO documents (
          user_id, type, title, title_jp, file_path, file_mime, file_size_bytes,
          issued_by, issued_date, verification_status, program_name, credential_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE title = VALUES(title), verification_status = VALUES(verification_status)`,
        [
          budiUserId,
          cred.type,
          cred.title,
          cred.title_jp || null,
          cred.file_path,
          cred.file_mime,
          cred.file_size_bytes,
          cred.issued_by,
          cred.issued_date || null,
          cred.verification_status,
          cred.program_name,
          cred.credential_status,
        ]
      );
    }
    console.log(`✅ Seeded credentials & vault documents for Budi Santoso.`);
  }

  // 4. Seed Career Milestones for Alumni (Rina Kusuma)
  const [rinaRows] = await pool.query(
    `SELECT id FROM users WHERE email = 'rina@alumni.jita.id' LIMIT 1`
  );
  const rinaUserId = rinaRows[0]?.id;

  if (rinaUserId) {
    const milestones = [
      {
        date: '2025-04-01',
        type: 'placement',
        title: 'Penempatan Pertama',
        title_jp: '初就職',
        company: 'Nippon Steel Corporation',
        location: 'Osaka, Japan',
        description: 'Memulai karir sebagai Quality Engineer di lini produksi baja Osaka.',
      },
      {
        date: '2025-10-15',
        type: 'certification',
        title: 'Sertifikasi ISO 9001 Internal Auditor',
        company: 'Nippon Steel Corporation',
        location: 'Osaka, Japan',
        description: 'Berhasil mendapatkan sertifikasi internal auditor standar kualitas ISO 9001.',
      },
      {
        date: '2026-04-01',
        type: 'promotion',
        title: 'Kenaikan Jabatan: Senior QE',
        title_jp: '昇進: シニア品質エンジニア',
        company: 'Nippon Steel Corporation',
        location: 'Osaka, Japan',
        description:
          'Dipromosikan menjadi Senior Quality Engineer setelah 12 bulan kinerja unggul.',
        salary_change: '+18%',
      },
      {
        date: '2026-07-11',
        type: 'notification',
        title: '⚡ Rekomendasi JITA: Waktu Negosiasi Kontrak',
        company: 'Nippon Steel Corporation',
        location: 'Osaka, Japan',
        description:
          'Berdasarkan data platform, kontrak Anda akan berakhir dalam 90 hari. Ini adalah jendela optimal untuk memulai diskusi perpanjangan atau eksplorasi peluang baru.',
        is_proactive: 1,
        proactive_message:
          'Rata-rata alumni JITA yang bernegosiasi di bulan ke-15–18 berhasil mendapatkan kenaikan 12–22%. Anda saat ini berada di bulan ke-15.',
      },
    ];

    for (const m of milestones) {
      await pool.query(
        `INSERT INTO career_milestones (
          user_id, milestone_date, type, title, title_jp, company, location,
          description, salary_change, is_proactive, proactive_message
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          rinaUserId,
          m.date,
          m.type,
          m.title,
          m.title_jp || null,
          m.company,
          m.location,
          m.description,
          m.salary_change || null,
          m.is_proactive || 0,
          m.proactive_message || null,
        ]
      );
    }
    console.log(`✅ Seeded career milestones for Rina Kusuma.`);
  }

  // 5. Seed Courses & Calendar Events
  const [courseRows] = await pool.query('SELECT COUNT(*) as cnt FROM courses');
  if (courseRows[0]?.cnt === 0) {
    const defaultCourses = [
      {
        title: 'Fondasi Bahasa Jepang',
        title_jp: '日本語基礎',
        description: 'Hiragana, Katakana, kosakata dasar N5–N4 dengan pengantar Bahasa Indonesia.',
        phase: 1,
      },
      {
        title: 'Budaya & Etiket Kerja',
        title_jp: '職場文化・礼儀',
        description:
          'Memahami budaya perusahaan Jepang: honne/tatemae, nemawashi, dan hierarki organisasi.',
        phase: 2,
      },
      {
        title: 'Simulasi Keigo & Negosiasi',
        title_jp: '敬語・交渉シミュレーション',
        description:
          'Latihan langsung dengan Silver Jinzai: Keigo tingkat lanjut dan simulasi rapat bisnis nyata.',
        phase: 3,
      },
      {
        title: 'Sertifikasi & Persiapan Kerja',
        title_jp: '資格認定・就職準備',
        description: 'Ujian akhir JITA, penerbitan sertifikat kompetensi, dan pembuatan Rirekisho.',
        phase: 4,
      },
    ];

    for (const c of defaultCourses) {
      await pool.query(
        'INSERT INTO courses (title, title_jp, description, phase, is_active) VALUES (?, ?, ?, ?, 1)',
        [c.title, c.title_jp, c.description, c.phase]
      );
    }
    console.log('✅ Seeded default curriculum courses.');
  }

  // Seed course_modules — idempotent per course
  const DEFAULT_MODULES_BY_PHASE = {
    1: [
      {
        title: 'Hiragana & Katakana Vokal dan Konsonan',
        title_jp: '五十音・平仮名・片仮名',
        duration_minutes: 45,
      },
      {
        title: 'Percakapan Dasar & Salam Formal (Aisatsu)',
        title_jp: '日常挨拶と自己紹介',
        duration_minutes: 60,
      },
      {
        title: 'Pola Kalimat Dasar & Partikel (wa, ga, ni, de)',
        title_jp: '基本文型と助詞',
        duration_minutes: 90,
      },
      {
        title: 'Kosakata Vokasi Pabrik & Keselamatan Kerja',
        title_jp: '工場語彙と労働安全',
        duration_minutes: 75,
      },
    ],
    2: [
      {
        title: 'Prinsip 5S (Seiri, Seiton, Seiso, Seiketsu, Shitsuke)',
        title_jp: '5Sの徹底理解',
        duration_minutes: 60,
      },
      {
        title: 'Komunikasi Horenso (Hokoku, Renraku, Sodan)',
        title_jp: '報連相の実践',
        duration_minutes: 60,
      },
      {
        title: 'Hierarki Perusahaan & Konsep Honne / Tatemae',
        title_jp: '企業階層と本音・建前',
        duration_minutes: 75,
      },
      {
        title: 'Etiket Kartu Nama (Meishi) & Duduk Rapat',
        title_jp: '名刺交換・上座下座マナー',
        duration_minutes: 45,
      },
    ],
    3: [
      {
        title: 'Sonkeigo (Bahasa Penghormatan Atasan)',
        title_jp: '尊敬語の習得',
        duration_minutes: 60,
      },
      {
        title: 'Kenjougo (Bahasa Merendah Diri Sendiri)',
        title_jp: '謙譲語の運用',
        duration_minutes: 60,
      },
      {
        title: 'Simulasi Telepon & Email Formal Bisnis',
        title_jp: '電話・ビジネスメール対応',
        duration_minutes: 90,
      },
      {
        title: 'Simulasi Rapat & Negosiasi bersama Silver Jinzai',
        title_jp: 'シルバー人材合同ロールプレイング',
        duration_minutes: 120,
      },
    ],
    4: [
      {
        title: 'Penyusunan Rirekisho Standar JIS',
        title_jp: 'JIS規格履歴書の作成',
        duration_minutes: 90,
      },
      {
        title: 'Simulasi Wawancara Kerja Perusahaan Jepang (Mensetsu)',
        title_jp: '採用面接シミュレーション',
        duration_minutes: 90,
      },
      {
        title: 'Ujian Akhir Kompetensi Vokasi JITA',
        title_jp: 'JITA修了総合検定',
        duration_minutes: 120,
      },
    ],
  };

  const [allCourses] = await pool.query(
    'SELECT id, phase FROM courses WHERE deleted_at IS NULL ORDER BY phase ASC'
  );
  for (const course of allCourses) {
    const [existingModules] = await pool.query(
      'SELECT COUNT(*) as cnt FROM course_modules WHERE course_id = ? AND deleted_at IS NULL',
      [course.id]
    );
    if (existingModules[0]?.cnt > 0) continue; // already seeded

    const modules = DEFAULT_MODULES_BY_PHASE[course.phase] || [];
    for (let i = 0; i < modules.length; i++) {
      const m = modules[i];
      await pool.query(
        'INSERT INTO course_modules (course_id, title, title_jp, duration_minutes, sort_order) VALUES (?, ?, ?, ?, ?)',
        [course.id, m.title, m.title_jp, m.duration_minutes, i]
      );
    }
    if (modules.length > 0) {
      console.log(
        `✅ Seeded ${modules.length} modules for course phase ${course.phase} (id=${course.id}).`
      );
    }
  }

  const [calRows] = await pool.query('SELECT COUNT(*) as cnt FROM calendar_events');
  if (calRows[0]?.cnt === 0) {
    const defaultEvents = [
      {
        title: 'Keigo Dasar — Percakapan Kantor',
        title_jp: '敬語基礎 — オフィス会話',
        description: 'Percakapan formal di lingkungan kantor Jepang',
        start_at: '2026-09-10 09:00:00',
        end_at: '2026-09-10 10:00:00',
        type: 'class',
        visibility: 'student',
      },
      {
        title: 'Simulasi Rapat Bisnis bersama Silver Jinzai',
        title_jp: 'ビジネス会議シミュレーション',
        description: 'Negosiasi kontrak dan presentasi proyek dalam bahasa Jepang murni',
        start_at: '2026-09-12 14:00:00',
        end_at: '2026-09-12 15:30:00',
        type: 'partner_meeting',
        visibility: 'student',
      },
      {
        title: 'Workshop Budaya Kerja: Nemawashi & Ringi',
        title_jp: '職場文化ワークショップ',
        description: 'Proses pengambilan keputusan kolektif di perusahaan Jepang',
        start_at: '2026-09-15 10:00:00',
        end_at: '2026-09-15 11:30:00',
        type: 'event',
        visibility: 'all',
      },
    ];

    for (const e of defaultEvents) {
      await pool.query(
        'INSERT INTO calendar_events (title, title_jp, description, start_at, end_at, type, visibility) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [e.title, e.title_jp, e.description, e.start_at, e.end_at, e.type, e.visibility]
      );
    }
    console.log('✅ Seeded default calendar events.');
  }

  // 6. Seed Notification Templates (ensure all templates exist)
  const templates = [
    {
      key: 'document_approved',
      subject_id: 'Dokumen Disetujui',
      subject_jp: '書類が承認されました',
      body_id:
        'Halo {{name}}, dokumen "{{title}}" ({{type}}) telah DISETUJUI oleh admin. Anda sekarang dapat menggunakan dokumen ini untuk lamaran.',
      body_jp: '{{name}}さん、「{{title}}」（{{type}}）の書類が管理者に承認されました。',
    },
    {
      key: 'document_rejected',
      subject_id: 'Dokumen Ditolak',
      subject_jp: '書類が却下されました',
      body_id:
        'Halo {{name}}, dokumen "{{title}}" ({{type}}) DITOLAK. Catatan admin: {{notes}}. Silakan upload ulang.',
      body_jp: '{{name}}さん、「{{title}}」（{{type}}）の書類が却下されました。備考：{{notes}}',
    },
    {
      key: 'document_submitted',
      subject_id: 'Dokumen Baru Perlu Verifikasi',
      subject_jp: '新しい確認待ち書類',
      body_id:
        'Kandidat {{name}} telah mengunggah dokumen baru "{{title}}" ({{type}}). Mohon ditinjau.',
      body_jp: '候補者{{name}}さんが新しい書類「{{title}}」をアップロードしました。',
    },
    {
      key: 'application_submitted',
      subject_id: 'Lamaran Baru Diterima',
      subject_jp: '新しい応募',
      body_id: 'Kandidat {{name}} melamar ke lowongan "{{jobTitle}}". Pesan: {{message}}',
      body_jp: '候補者{{name}}さんが「{{jobTitle}}」に応募しました。',
    },
    {
      key: 'application_decided',
      subject_id: 'Status Lamaran Diperbarui',
      subject_jp: '応募ステータスの更新',
      body_id:
        'Halo {{name}}, lamaran Anda ke "{{jobTitle}}" di {{company}} berstatus: {{status}}.',
      body_jp: '{{name}}さん、{{company}}の「{{jobTitle}}」への応募ステータス：{{status}}',
    },
    {
      key: 'scout_received',
      subject_id: 'Anda Di-scout Perusahaan!',
      subject_jp: 'スカウトされました',
      body_id:
        'Halo {{name}}, perusahaan {{company}} tertarik dengan profil Anda untuk posisi "{{jobTitle}}". Pesan: {{message}}',
      body_jp:
        '{{name}}さん、{{company}}が「{{jobTitle}}」のポジションであなたをスカウトしました。',
    },
    {
      key: 'career_proactive',
      subject_id: '⚡ Rekomendasi Karir JITA',
      subject_jp: 'JITAキャリア推薦',
      body_id: '{{message}}',
      body_jp: '{{message}}',
    },
    {
      key: 'session_scheduled',
      subject_id: 'Jadwal Sesi Mentoring Baru',
      subject_jp: '新しいメンターセッション',
      body_id: 'Sesi mentoring "{{title}}" dijadwalkan pada {{date}}.',
      body_jp: 'メンターセッション「{{title}}」がスケジュールされました。',
    },
  ];

  for (const t of templates) {
    await pool.query(
      `INSERT INTO notification_templates (template_key, subject_id, subject_jp, body_id, body_jp)
       VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE subject_id = VALUES(subject_id), body_id = VALUES(body_id)`,
      [t.key, t.subject_id, t.subject_jp, t.body_id, t.body_jp]
    );
  }

  // 7. Seed Initial Notifications for All Roles (if empty)
  const [notifCount] = await pool.query('SELECT COUNT(*) as cnt FROM notifications');
  if (notifCount[0]?.cnt === 0) {
    const [allUsers] = await pool.query('SELECT id, email, role FROM users');
    const userMap = {};
    for (const u of allUsers) {
      userMap[u.email] = u.id;
    }

    const initialNotifs = [
      // Student (Budi)
      {
        email: 'budi@student.jita.id',
        channel: 'in_app',
        template_key: 'document_approved',
        subject: 'Dokumen Disetujui: Sertifikat Fondasi Bahasa Jepang',
        payload: {
          body: 'Dokumen "Sertifikat Fondasi Bahasa Jepang" telah diverifikasi & disetujui oleh tim administrasi JITA.',
        },
        read: 0,
      },
      {
        email: 'budi@student.jita.id',
        channel: 'in_app',
        template_key: 'scout_received',
        subject: 'Undangan Scout: Tanaka Manufacturing Co., Ltd.',
        payload: {
          body: 'Perusahaan Tanaka Manufacturing tertarik dengan keahlian manufaktur dan skor JLPT N3 Anda untuk posisi CNC Specialist.',
        },
        read: 0,
      },

      // Corporate (Tanaka)
      {
        email: 'tanaka@recruit.co.jp',
        channel: 'in_app',
        template_key: 'application_submitted',
        subject: 'Lamaran Masuk: CNC Machine Operator & Programmer',
        payload: {
          body: 'Kandidat Budi Santoso (JLPT N3, Manufaktur) telah melamar posisi lowongan pabrik Anda di Osaka.',
        },
        read: 0,
      },

      // Admin
      {
        email: 'admin@jita.id',
        channel: 'in_app',
        template_key: 'document_submitted',
        subject: 'Verifikasi Berkas Baru: Transkrip Mahasiswa',
        payload: {
          body: 'Mahasiswa Ahmad Fauzi mengunggah Transkrip Nilai baru yang membutuhkan validasi keaslian dokumen.',
        },
        read: 0,
      },
      {
        email: 'admin@jita.id',
        channel: 'in_app',
        template_key: 'document_submitted',
        subject: 'Verifikasi Berkas Baru: Sertifikat JLPT N3',
        payload: {
          body: 'Mahasiswa Maya Sari mengunggah sertifikat kelulusan JLPT N3 untuk pembaruan profil publik.',
        },
        read: 1,
      },

      // Educator Bilingual (Sari Indrawati)
      {
        email: 'sari@educator.jita.id',
        channel: 'in_app',
        template_key: 'session_scheduled',
        subject: 'Jadwal Mengajar: Keigo Dasar — Percakapan Kantor',
        payload: {
          body: 'Sesi kelas bilingual dijadwalkan pada Kamis, 10 September 2026 pukul 09:00 WIB bersama 12 siswa.',
        },
        read: 0,
      },

      // Educator Silver (Yamamoto Kenji)
      {
        email: 'yamamoto@silver.jita.id',
        channel: 'in_app',
        template_key: 'session_scheduled',
        subject: 'Simulasi Rapat Bisnis (ビジネス会議シミュレーション)',
        payload: {
          body: 'Sesi role-play negosiasi kontrak kerja dijadwalkan pada Sabtu, 12 September 2026 pukul 14:00 WIB.',
        },
        read: 0,
      },

      // Alumni (Rina Kusuma)
      {
        email: 'rina@alumni.jita.id',
        channel: 'in_app',
        template_key: 'career_proactive',
        subject: '⚡ Rekomendasi Karir JITA: Waktu Negosiasi Kontrak',
        payload: {
          body: 'Kontrak Anda di Nippon Steel Corporation mendekati bulan ke-15. Ini adalah jendela optimal untuk negosiasi kenaikan gaji tahunan.',
        },
        read: 0,
      },
    ];

    for (const n of initialNotifs) {
      const uid = userMap[n.email];
      if (uid) {
        await pool.query(
          `INSERT INTO notifications (user_id, channel, template_key, payload_json, subject, status, read_at)
           VALUES (?, ?, ?, ?, ?, 'sent', ?)`,
          [
            uid,
            n.channel,
            n.template_key,
            JSON.stringify(n.payload),
            n.subject,
            n.read ? new Date() : null,
          ]
        );
      }
    }
    console.log('✅ Seeded realistic notifications for all roles.');
  }

  // Seed sample information posts (Announcements, Articles, Events)
  const [existingPosts] = await pool.query('SELECT COUNT(*) as cnt FROM posts');
  if (existingPosts[0]?.cnt === 0) {
    const samplePosts = [
      {
        title: 'Pendaftaran Gelombang 2 Pelatihan Pra-Migrasi JITA x Pusat Es kampus Resmi Dibuka',
        title_jp: 'JITA × Pusat Es kampus 第2期事前移住研修 募集開始',
        slug: 'pendaftaran-gelombang-2-jita-ice-center-kampus-2026',
        category: 'announcement',
        source_name: 'Pusat Es Kampus',
        source_type: 'ice_center',
        author_name: 'Tim Akademik Pusat Es',
        excerpt: 'Program pembekalan intensif kompetensi teknis, bahasa Jepang, dan kesiapan kultural bagi mahasiswa kampus & fresh graduate untuk persiapan karir di industri Jepang.',
        content: `<h3>Pembukaan Seleksi Talenta JITA Gelombang 2</h3>\n<p>Pusat Es kampus bekerja sama dengan Japan Industry Training Academy (JITA) secara resmi membuka pendaftaran Gelombang 2 untuk program pembekalan karir industri Jepang batch 2026/2027.</p>\n<h4>Benefit Program:</h4>\n<ul>\n  <li>Pelatihan Bahasa Jepang intensif terarah (Standar JLPT N3/N2) dengan kurikulum praktis kerja.</li>\n  <li>Bimbingan etika bisnis Jepang (Hou-Ren-So, Business Manners, Keigo) bersama instruktur bilingual dan pensiunan industri (Silver Jinzai).</li>\n  <li>Akses langsung ke AI Smart Matching dengan 15+ mitra industri terverifikasi di Jepang.</li>\n  <li>Fasilitasi pembuatan CV bilingual format baku JIS dan persiapan wawancara dengan native speaker.</li>\n</ul>\n<p>Pendaftaran dibuka hingga <strong>30 Oktober 2026</strong>. Mahasiswa dan alumni yang telah memiliki akun SSO Pusat Es dapat langsung login dan melengkapi profil di dashboard.</p>`,
        event_date: null,
        event_location: null,
        external_link: 'https://pusates.kampusmu.id',
        tags: 'Pusat Es, Kampus, Pendaftaran, Beasiswa',
        is_pinned: 1,
        is_published: 1,
      },
      {
        title: 'Sosialisasi Beasiswa Monbukagakusho (MEXT) & Jalur Kerja Tokutei Ginou 2026/2027',
        title_jp: 'MEXT奨学金及び特定技能ビザ説明会',
        slug: 'sosialisasi-beasiswa-mext-tokutei-ginou-2026',
        category: 'announcement',
        source_name: 'Konsulat Jenderal Jepang',
        source_type: 'partner_educator',
        author_name: 'Divisi Pendidikan & Kebudayaan Konjen',
        excerpt: 'Informasi resmi skema beasiswa pemerintah Jepang dan update regulasi visa keahlian khusus (Tokutei Ginou) untuk bidang teknologi informasi dan manufaktur.',
        content: `<p>Konsulat Jenderal Jepang bekerja sama dengan JITA mengundang mahasiswa dan profesional muda untuk menghadiri sesi sosialisasi komprehensif mengenai jalur studi lanjutan dan karir profesional di Jepang.</p>\n<h4>Materi Pembahasan:</h4>\n<ol>\n  <li>Persyaratan dokumen dan timeline seleksi Beasiswa MEXT (Gakubu & Kenkyusei).</li>\n  <li>Kebijakan terbaru Kementerian Kehakiman Jepang terkait visa Specified Skilled Worker (SSW/Tokutei Ginou) bidang IT & Teknik.</li>\n  <li>Dukungan adaptasi hidup dan fasilitas jaminan sosial bagi tenaga kerja asing di wilayah Kanto dan Kansai.</li>\n</ol>`,
        event_date: null,
        event_location: null,
        external_link: 'https://www.surabaya.id.emb-japan.go.jp/',
        tags: 'MEXT, Konjen, Beasiswa, Visa',
        is_pinned: 0,
        is_published: 1,
      },
      {
        title: 'Standar & Kualifikasi Engineer Manufaktur yang Dibutuhkan Pabrik Otomotif Jepang',
        title_jp: '日本の自動車産業が求めるエンジニアの要件と基準',
        slug: 'standar-kualifikasi-engineer-manufaktur-jepang-yuki',
        category: 'article',
        source_name: 'Yuki Engineering',
        source_type: 'corporate',
        author_name: 'Yuki Engineering Recruiting Team',
        excerpt: 'Memahami ekspektasi industri Jepang terhadap engineer muda: kombinasi kemampuan gambar teknik (CAD/CAM), pemahaman kaizen, dan komunikasi dasar di lini produksi.',
        content: `<p>Banyak talenta teknis di Indonesia memiliki kemampuan coding atau mekanikal yang mumpuni, namun seringkali menemui hambatan pada cara kerja tim di industri manufaktur Jepang. Dalam artikel ini, Yuki Engineering merangkum 3 pilar utama kesiapan kerja:</p>\n<h4>1. Budaya Kaizen & 5S di Lini Produksi</h4>\n<p>Di Jepang, perbaikan berkelanjutan (Kaizen) bukan sekadar slogan, melainkan kebiasaan harian. Engineer diharapkan tidak hanya menerima masalah, tetapi proaktif menganalisis akar masalah menggunakan metode 5-Why.</p>\n<h4>2. Penguasaan Keigo Teknis</h4>\n<p>Komunikasi keselamatan kerja (Anzen Dai-ichi) membutuhkan kejelasan mutlak. Memahami istilah teknis pabrik dalam bahasa Jepang jauh lebih krusial daripada sekadar skor tes gramatikal umum.</p>\n<h4>3. Keandalan dan Ketepatan Waktu</h4>\n<p>Komitmen terhadap tenggat waktu dan transparansi status pekerjaan (Hou-Ren-So) adalah dasar utama pembentukan kepercayaan antara manajemen Jepang dan engineer asing.</p>`,
        event_date: null,
        event_location: null,
        external_link: null,
        tags: 'Manufaktur, Yuki Engineering, Kaizen, Karir',
        is_pinned: 0,
        is_published: 1,
      },
      {
        title: 'Strategi Efektif Lolos JLPT N3 Dalam 6 Bulan untuk Persiapan Kerja',
        title_jp: '就職準備のためのJLPT N3合格戦略',
        slug: 'strategi-efektif-lolos-jlpt-n3-dalam-6-bulan',
        category: 'article',
        source_name: 'Dreamguide Academy & UPT Bahasa kampus',
        source_type: 'partner_educator',
        author_name: 'Sensei Maya (Dreamguide)',
        excerpt: 'Panduan belajar terstruktur mulai dari kanji frekuensi tinggi, pola kalimat Dokkai, hingga latihan mendengar (Choukai) berorientasi situasi dunia kerja nyata.',
        content: `<p>Mencapai level N3 seringkali menjadi momok karena lompatan jumlah kanji (~650 kanji) dan kosakata (~3.750 kata). UPT Bahasa kampus dan Dreamguide membagikan metode bertahap yang telah terbukti membantu ratusan siswa lolos seleksi industri:</p>\n<h4>Fase 1: Fondasi Kanji Aktif (Bulan 1-2)</h4>\n<p>Fokus pada kanji yang berkaitan dengan instruksi kerja, arah, angka, dan lingkungan perkantoran. Gunakan kartu memori berbasis spaced repetition.</p>\n<h4>Fase 2: Pemahaman Pola Kalimat Menengah (Bulan 3-4)</h4>\n<p>Pelajari partikel nuansa seperti ~wake da, ~wake dewa nai, ~ni kakawarazu yang sering muncul di soal teks bacaan panjang.</p>\n<h4>Fase 3: Simulasi Choukai & Ujian Real Time (Bulan 5-6)</h4>\n<p>Latih pendengaran setiap hari dengan podcast percakapan bisnis pendek dan rekap rangkuman isi percakapan.</p>`,
        event_date: null,
        event_location: null,
        external_link: null,
        tags: 'JLPT, N3, Dreamguide, UPT Bahasa kampus, Belajar',
        is_pinned: 0,
        is_published: 1,
      },
      {
        title: 'Membangun Karir Global Melalui Ekosistem Bisnis IJB-Net & KS Global',
        title_jp: 'IJB-NetとKS Globalを通じたグローバルキャリア構築',
        slug: 'membangun-karir-global-ijb-net-ks-global',
        category: 'article',
        source_name: 'KS Global & IJB-Net',
        source_type: 'corporate',
        author_name: 'Direktorat Hubungan Industri KS Global',
        excerpt: 'Bagaimana jejaring Indonesia Japan Business Network (IJB-Net) mempertemukan kebutuhan talenta teknologi tinggi dengan korporasi manufaktur dan IT di Tokyo & Osaka.',
        content: `<p>Jepang saat ini mengalami penurunan populasi usia produktif, menciptakan kebutuhan lebih dari 700.000 tenaga ahli di sektor rekayasa dan teknologi pada dekade ini. IJB-Net bersama KS Global aktif membangun jembatan langsung bagi lulusan universitas terkemuka Indonesia untuk bergabung ke perusahaan Jepang tanpa perantara agen yang membebani kandidat.</p>`,
        event_date: null,
        event_location: null,
        external_link: null,
        tags: 'IJB-Net, KS Global, Karir Jepang, Networking',
        is_pinned: 0,
        is_published: 1,
      },
      {
        title: 'Live Webinar: Peluang Kerja & Budaya Perusahaan di KS Global & Kiseki Co., Ltd.',
        title_jp: 'KS Global & Kiseki Co. 採用説明会・企業文化ウェビナー',
        slug: 'live-webinar-peluang-kerja-ks-global-kiseki-2026',
        category: 'event',
        source_name: 'KS Global Japan',
        source_type: 'corporate',
        author_name: 'HR Team KS Global & Kiseki',
        excerpt: 'Temu langsung dengan tim rekrutmen KS Global dan Kiseki. Pembahasan lowongan posisi Software Engineer, CAD Designer, serta program relokasi ke Jepang.',
        content: `<p>Jangan lewatkan kesempatan berinteraksi langsung dengan HR Manager dari KS Global dan Kiseki Co., Ltd. Acara ini ditujukan khusus bagi siswa JITA dan mahasiswa kampus yang ingin memahami lebih dalam proses rekrutmen dan benefit penempatan kerja di Jepang.</p>\n<h4>Agenda Acara:</h4>\n<ul>\n  <li>13:30 - 14:00: Profil Perusahaan & Portofolio Proyek di Jepang</li>\n  <li>14:00 - 14:40: Penjelasan Posisi Terbuka (Full-time & Internship)</li>\n  <li>14:40 - 15:15: Q&A Interaktif bersama Alumnus Indonesia yang telah bekerja</li>\n  <li>15:15 - 15:30: Fast-track submission via portal JITA</li>\n</ul>`,
        event_date: '2026-10-18 13:30:00',
        event_location: 'Zoom Online Meeting (ID & Passcode dikirim via email)',
        external_link: 'https://zoom.us/webinar/register/jita-ksglobal',
        tags: 'Webinar, KS Global, Kiseki, Rekrutmen, Lowongan',
        is_pinned: 1,
        is_published: 1,
      },
      {
        title: 'Workshop Bunkasai: Simulasi Interview Kerja Bahasa Jepang & Business Etiquette',
        title_jp: '日本企業模擬面接・ビジネスマナーワークショップ',
        slug: 'workshop-bunkasai-simulasi-interview-kerja-jepang',
        category: 'event',
        source_name: 'Japan Club & UPT Bahasa Jepang kampus',
        source_type: 'partner_educator',
        author_name: 'Tim Acara Japan Club',
        excerpt: 'Latihan tatap muka simulasi wawancara kerja Jepang (Menzetsu), cara masuk ruangan (Shitsurei Shimasu), gestur ojigi, dan merespon pertanyaan sulit dengan sopan.',
        content: `<p>Simulasi wawancara kerja Jepang memerlukan kesiapan fisik, bahasa, dan etika. Workshop interaktif ini dipandu langsung oleh penutur asli Jepang (native speaker) dan instruktur profesional dari Japan Club dan UPT Bahasa kampus.</p>\n<p>Tempat terbatas untuk 40 peserta. Peserta diwajibkan mengenakan pakaian formal (suit/kemeja putih rapi).</p>`,
        event_date: '2026-10-25 09:00:00',
        event_location: 'Auditorium Pusat Es kampus Lt. 3 / Hybrid Stream',
        external_link: 'https://uptbahasa.kampus.ac.id/event/jita-workshop',
        tags: 'Workshop, Interview, Japan Club, UPT Bahasa kampus',
        is_pinned: 0,
        is_published: 1,
      },
    ];

    for (const p of samplePosts) {
      await pool.query(
        `INSERT INTO posts (
          title, title_jp, slug, category, source_name, source_type, author_name,
          excerpt, content, event_date, event_location, external_link, tags,
          is_pinned, is_published
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          p.title,
          p.title_jp,
          p.slug,
          p.category,
          p.source_name,
          p.source_type,
          p.author_name,
          p.excerpt,
          p.content,
          p.event_date,
          p.event_location,
          p.external_link,
          p.tags,
          p.is_pinned,
          p.is_published,
        ]
      );
    }
    console.log('✅ Seeded realistic posts (announcements, articles, events).');
  }

  console.log('🎉 Database seeding selesai dengan sukses!');
  process.exit(0);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runSeeder().catch((err) => {
    console.error('Seeder error:', err);
    process.exit(1);
  });
}

export { runSeeder, initSchema };
export default { runSeeder, initSchema };

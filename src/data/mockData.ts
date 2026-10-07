// =============================================
// JITA V2 — Mock Data
// Japan Industry Training Academy
// =============================================

export type UserRole =
  'student' | 'corporate' | 'educator_bilingual' | 'educator_silver' | 'alumni' | 'admin';

export interface MockUser {
  id: string;
  name: string;
  nameJp?: string;
  email: string;
  role: UserRole;
  avatar?: string;
  iceUuid?: string;
  company?: string;
  title?: string;
}

export const MOCK_USERS: MockUser[] = [
  {
    id: 'u-001',
    name: 'Budi Santoso',
    email: 'budi@student.jita.id',
    role: 'student',
    title: 'Kandidat Program Teknik Manufaktur',
  },
  {
    id: 'u-002',
    name: 'Tanaka Hiroshi',
    nameJp: '田中 浩',
    email: 'tanaka@recruit.co.jp',
    role: 'corporate',
    company: 'Tanaka Manufacturing Co., Ltd.',
    title: 'HR Manager',
  },
  {
    id: 'u-003',
    name: 'Sari Indrawati',
    email: 'sari@educator.jita.id',
    role: 'educator_bilingual',
    title: 'Instruktur Bahasa Jepang N3',
  },
  {
    id: 'u-004',
    name: 'Yamamoto Kenji',
    nameJp: '山本 健二',
    email: 'yamamoto@silver.jita.id',
    role: 'educator_silver',
    company: 'Retired — Toyota Motor Corporation',
    title: 'Senior Industry Mentor',
  },
  {
    id: 'u-005',
    name: 'Rina Kusuma',
    email: 'rina@alumni.jita.id',
    role: 'alumni',
    company: 'Nippon Steel Corporation',
    title: 'Quality Engineer — Osaka Plant',
  },
];

// --- Curriculum Modules ---
export interface CurriculumModule {
  id: string;
  phase: 1 | 2 | 3 | 4;
  phaseLabel: string;
  title: string;
  titleJp?: string;
  description: string;
  progress: number; // 0–100
  status: 'completed' | 'in_progress' | 'locked';
  sessions: number;
  completedSessions: number;
}

export const CURRICULUM_MODULES: CurriculumModule[] = [
  {
    id: 'mod-01',
    phase: 1,
    phaseLabel: 'Fase 1',
    title: 'Fondasi Bahasa Jepang',
    titleJp: '日本語基礎',
    description: 'Hiragana, Katakana, kosakata dasar N5–N4 dengan pengantar Bahasa Indonesia.',
    progress: 100,
    status: 'completed',
    sessions: 12,
    completedSessions: 12,
  },
  {
    id: 'mod-02',
    phase: 2,
    phaseLabel: 'Fase 2',
    title: 'Budaya & Etiket Kerja',
    titleJp: '職場文化・礼儀',
    description:
      'Memahami budaya perusahaan Jepang: honne/tatemae, nemawashi, dan hierarki organisasi.',
    progress: 75,
    status: 'in_progress',
    sessions: 8,
    completedSessions: 6,
  },
  {
    id: 'mod-03',
    phase: 3,
    phaseLabel: 'Fase 3',
    title: 'Simulasi Keigo & Negosiasi',
    titleJp: '敬語・交渉シミュレーション',
    description:
      'Latihan langsung dengan Silver Jinzai: Keigo tingkat lanjut dan simulasi rapat bisnis nyata.',
    progress: 0,
    status: 'locked',
    sessions: 6,
    completedSessions: 0,
  },
  {
    id: 'mod-04',
    phase: 4,
    phaseLabel: 'Fase 4',
    title: 'Sertifikasi & Persiapan Kerja',
    titleJp: '資格認定・就職準備',
    description: 'Ujian akhir JITA, penerbitan sertifikat kompetensi, dan pembuatan Rirekisho.',
    progress: 0,
    status: 'locked',
    sessions: 4,
    completedSessions: 0,
  },
];

// --- JITA Credentials / Document Vault ---
export interface JitaCredential {
  id: string;
  type: 'certificate' | 'transcript' | 'badge';
  title: string;
  titleJp?: string;
  issuedDate: string;
  issuedBy: string;
  status: 'valid' | 'pending' | 'expired';
  programName: string;
}

export const JITA_CREDENTIALS: JitaCredential[] = [
  {
    id: 'cred-001',
    type: 'certificate',
    title: 'Sertifikat Fondasi Bahasa Jepang',
    titleJp: '日本語基礎修了証',
    issuedDate: '2025-03-15',
    issuedBy: 'JITA Core Authority',
    status: 'valid',
    programName: 'Program Persiapan Industri Jepang 2025',
  },
  {
    id: 'cred-002',
    type: 'badge',
    title: 'Badge Kultural Level 1',
    titleJp: '文化バッジ Lv.1',
    issuedDate: '2025-04-02',
    issuedBy: 'JITA Core Authority',
    status: 'valid',
    programName: 'Program Persiapan Industri Jepang 2025',
  },
  {
    id: 'cred-003',
    type: 'transcript',
    title: 'Transkrip Program (Draft)',
    issuedDate: '—',
    issuedBy: 'JITA Core Authority',
    status: 'pending',
    programName: 'Program Persiapan Industri Jepang 2025',
  },
];

// --- Corporate Candidates ---
export interface Candidate {
  id: string;
  name: string;
  age: number;
  origin: string;
  program: string;
  jlptLevel: string;
  languageScore: number; // 0–100
  culturalScore: number; // 0–100
  technicalScore: number; // 0–100
  overallScore: number; // 0–100
  specialization: string[];
  status: 'available' | 'interviewing' | 'placed';
  completedModules: number;
  totalModules: number;
  certCount: number;
}

export const CANDIDATES: Candidate[] = [
  {
    id: 'cand-001',
    name: 'Ahmad Fauzi',
    age: 24,
    origin: 'Bandung, Jawa Barat',
    program: 'Teknik Manufaktur',
    jlptLevel: 'N3',
    languageScore: 82,
    culturalScore: 91,
    technicalScore: 88,
    overallScore: 87,
    specialization: ['Manufaktur', 'Otomotif', 'Quality Control'],
    status: 'available',
    completedModules: 4,
    totalModules: 4,
    certCount: 3,
  },
  {
    id: 'cand-002',
    name: 'Dewi Rahayu',
    age: 23,
    origin: 'Surabaya, Jawa Timur',
    program: 'Teknologi Informasi',
    jlptLevel: 'N3',
    languageScore: 89,
    culturalScore: 85,
    technicalScore: 92,
    overallScore: 89,
    specialization: ['IT', 'Software Development', 'Semiconductor'],
    status: 'interviewing',
    completedModules: 4,
    totalModules: 4,
    certCount: 4,
  },
  {
    id: 'cand-003',
    name: 'Reza Pratama',
    age: 25,
    origin: 'Yogyakarta, DIY',
    program: 'Teknik Sipil & Konstruksi',
    jlptLevel: 'N4',
    languageScore: 74,
    culturalScore: 88,
    technicalScore: 86,
    overallScore: 83,
    specialization: ['Konstruksi', 'Infrastruktur'],
    status: 'available',
    completedModules: 4,
    totalModules: 4,
    certCount: 2,
  },
  {
    id: 'cand-004',
    name: 'Siti Nurhaliza',
    age: 22,
    origin: 'Medan, Sumatera Utara',
    program: 'Perhotelan & Pariwisata',
    jlptLevel: 'N3',
    languageScore: 94,
    culturalScore: 96,
    technicalScore: 79,
    overallScore: 90,
    specialization: ['Hospitality', 'Pariwisata', 'Pelayanan'],
    status: 'available',
    completedModules: 4,
    totalModules: 4,
    certCount: 5,
  },
  {
    id: 'cand-005',
    name: 'Bagus Wicaksono',
    age: 26,
    origin: 'Semarang, Jawa Tengah',
    program: 'Pertanian Modern',
    jlptLevel: 'N4',
    languageScore: 71,
    culturalScore: 80,
    technicalScore: 90,
    overallScore: 80,
    specialization: ['Agribisnis', 'Pertanian Presisi'],
    status: 'placed',
    completedModules: 4,
    totalModules: 4,
    certCount: 3,
  },
  {
    id: 'cand-006',
    name: 'Maya Sari',
    age: 23,
    origin: 'Denpasar, Bali',
    program: 'Desain & Kreatif',
    jlptLevel: 'N3',
    languageScore: 86,
    culturalScore: 93,
    technicalScore: 88,
    overallScore: 89,
    specialization: ['Desain Grafis', 'Animasi', 'Media Kreatif'],
    status: 'available',
    completedModules: 4,
    totalModules: 4,
    certCount: 4,
  },
];

// --- Sessions (Educator) ---
export interface Session {
  id: string;
  title: string;
  titleJp?: string;
  studentName: string;
  date: string;
  time: string;
  duration: string;
  type: 'bilingual' | 'silver';
  status: 'scheduled' | 'completed' | 'cancelled';
  topic: string;
}

export const SESSIONS: Session[] = [
  {
    id: 'sess-001',
    title: 'Keigo Dasar — Percakapan Kantor',
    titleJp: '敬語基礎 — オフィス会話',
    studentName: 'Budi Santoso',
    date: '2026-07-12',
    time: '09:00',
    duration: '60 menit',
    type: 'bilingual',
    status: 'scheduled',
    topic: 'Percakapan formal di lingkungan kantor Jepang',
  },
  {
    id: 'sess-002',
    title: 'Simulasi Rapat Bisnis',
    titleJp: 'ビジネス会議シミュレーション',
    studentName: 'Ahmad Fauzi',
    date: '2026-07-12',
    time: '14:00',
    duration: '90 menit',
    type: 'silver',
    status: 'scheduled',
    topic: 'Negosiasi kontrak dan presentasi proyek dalam bahasa Jepang murni',
  },
  {
    id: 'sess-003',
    title: 'Budaya Nemawashi & Ringi',
    studentName: 'Dewi Rahayu',
    date: '2026-07-11',
    time: '10:00',
    duration: '60 menit',
    type: 'bilingual',
    status: 'completed',
    topic: 'Proses pengambilan keputusan kolektif di perusahaan Jepang',
  },
  {
    id: 'sess-004',
    title: 'Etika Nomikai & Hubungan Sosial',
    titleJp: '飲み会・社会関係の礼儀',
    studentName: 'Siti Nurhaliza',
    date: '2026-07-10',
    time: '15:00',
    duration: '60 menit',
    type: 'silver',
    status: 'completed',
    topic: 'Tata krama acara sosial perusahaan Jepang',
  },
];

// --- Student Progress ---
export interface StudentProgress {
  studentId: string;
  name: string;
  module: string;
  languageProgress: number;
  culturalProgress: number;
  lastActivity: string;
  notes: string;
}

export const STUDENT_PROGRESS: StudentProgress[] = [
  {
    studentId: 'u-001',
    name: 'Budi Santoso',
    module: 'Fase 2 — Budaya & Etiket',
    languageProgress: 78,
    culturalProgress: 72,
    lastActivity: '2026-07-10',
    notes: 'Membutuhkan latihan lebih untuk penggunaan keigo sopan (teineigo).',
  },
  {
    studentId: 'u-006',
    name: 'Citra Lestari',
    module: 'Fase 1 — Fondasi Bahasa',
    languageProgress: 55,
    culturalProgress: 40,
    lastActivity: '2026-07-11',
    notes: 'Perkembangan baik di hiragana. Perlu lebih banyak latihan katakana.',
  },
  {
    studentId: 'u-007',
    name: 'Hendro Wijaya',
    module: 'Fase 2 — Budaya & Etiket',
    languageProgress: 85,
    culturalProgress: 88,
    lastActivity: '2026-07-09',
    notes: 'Siswa sangat proaktif. Siap naik ke Fase 3.',
  },
];

// --- Career Timeline (Alumni) ---
export interface CareerMilestone {
  id: string;
  date: string;
  type:
    'placement' | 'promotion' | 'contract_renewal' | 'transfer' | 'certification' | 'notification';
  title: string;
  titleJp?: string;
  company: string;
  location: string;
  description: string;
  salaryChange?: string;
  isProactive?: boolean;
  proactiveMessage?: string;
}

export const CAREER_MILESTONES: CareerMilestone[] = [
  {
    id: 'car-001',
    date: '2025-04-01',
    type: 'placement',
    title: 'Penempatan Pertama',
    titleJp: '初就職',
    company: 'Nippon Steel Corporation',
    location: 'Osaka, Japan',
    description: 'Memulai karir sebagai Quality Engineer di lini produksi baja Osaka.',
  },
  {
    id: 'car-002',
    date: '2025-10-15',
    type: 'certification',
    title: 'Sertifikasi ISO 9001 Internal Auditor',
    company: 'Nippon Steel Corporation',
    location: 'Osaka, Japan',
    description: 'Berhasil mendapatkan sertifikasi internal auditor standar kualitas ISO 9001.',
  },
  {
    id: 'car-003',
    date: '2026-04-01',
    type: 'promotion',
    title: 'Kenaikan Jabatan: Senior QE',
    titleJp: '昇進: シニア品質エンジニア',
    company: 'Nippon Steel Corporation',
    location: 'Osaka, Japan',
    description: 'Dipromosikan menjadi Senior Quality Engineer setelah 12 bulan kinerja unggul.',
    salaryChange: '+18%',
  },
  {
    id: 'car-004',
    date: '2026-07-11',
    type: 'notification',
    title: '⚡ Rekomendasi JITA: Waktu Negosiasi Kontrak',
    company: 'Nippon Steel Corporation',
    location: 'Osaka, Japan',
    description:
      'Berdasarkan data platform, kontrak Anda akan berakhir dalam 90 hari. Ini adalah jendela optimal untuk memulai diskusi perpanjangan atau eksplorasi peluang baru.',
    isProactive: true,
    proactiveMessage:
      'Rata-rata alumni JITA yang bernegosiasi di bulan ke-15–18 berhasil mendapatkan kenaikan 12–22%. Anda saat ini berada di bulan ke-15.',
  },
];

// --- Platform Stats (Landing Page) ---
export const PLATFORM_STATS = {
  totalAlumni: 45,
  placementRate: 85.5,
  partnerCompanies: 6,
  avgTimeToPlacement: 4.3, // months
  countriesServed: 1,
  japaneseProvinces: 3,
};

export type PostCategory = 'announcement' | 'article' | 'event';
export type PostSourceType = 'ice_center' | 'corporate' | 'partner_educator' | 'official';

export interface Post {
  id: number;
  title: string;
  title_jp?: string;
  slug: string;
  category: PostCategory;
  source_name: string;
  source_type: PostSourceType;
  author_name?: string;
  excerpt?: string;
  content: string;
  cover_image?: string;
  event_date?: string;
  event_location?: string;
  external_link?: string;
  tags?: string;
  is_pinned?: number | boolean;
  is_published?: number | boolean;
  views_count?: number;
  created_at: string;
  updated_at?: string;
}

export const MOCK_POSTS: Post[] = [
  {
    id: 1,
    title: 'Pendaftaran Gelombang 2 Pelatihan Pra-Migrasi JITA x Pusat Es Kampus Resmi Dibuka',
    title_jp: 'JITA × Pusat Es Kampus 第2期事前移住研修 募集開始',
    slug: 'pendaftaran-gelombang-2-jita-ice-center-kampus-2026',
    category: 'announcement',
    source_name: 'Pusat Es Kampus',
    source_type: 'ice_center',
    author_name: 'Tim Akademik Pusat Es Kampus',
    excerpt:
      'Program pembekalan intensif kompetensi teknis, bahasa Jepang, dan kesiapan kultural bagi mahasiswa Kampus & fresh graduate untuk persiapan karir di industri Jepang.',
    content: `
      <h3>Pembukaan Seleksi Talenta JITA Gelombang 2</h3>
      <p>Pusat Es Kampus bekerja sama dengan Japan Industry Training Academy (JITA) secara resmi membuka pendaftaran Gelombang 2 untuk program pembekalan karir industri Jepang batch 2026/2027.</p>
      
      <h4>Benefit Program:</h4>
      <ul>
        <li><strong>Pelatihan Terarah:</strong> Bahasa Jepang intensif kurikulum kerja standar JLPT N3/N2.</li>
        <li><strong>Etika Bisnis Jepang:</strong> Hou-Ren-So, Business Manners, Keigo bersama instruktur bilingual dan pensiunan industri (Silver Jinzai).</li>
        <li><strong>AI Smart Matching:</strong> Akses langsung ke 15+ mitra industri terverifikasi di Jepang.</li>
        <li><strong>Fasilitasi Dokumen:</strong> Pembuatan CV bilingual format baku JIS dan persiapan wawancara dengan native speaker.</li>
      </ul>

      <h4>Tahapan Seleksi:</h4>
      <ol>
        <li>Pengisian formulir pendaftaran & verifikasi akun SSO Pusat Es.</li>
        <li>Tes asesmen kemampuan logika dan dasar bahasa Jepang (online).</li>
        <li>Wawancara motivasi dan kesiapan karir bersama tim instruktur JITA.</li>
      </ol>

      <p>Pendaftaran dibuka hingga <strong>30 Oktober 2026</strong>. Mahasiswa dan alumni Kampus yang telah memiliki akun SSO dapat langsung login menggunakan tombol Pusat Es SSO.</p>
    `,
    event_date: undefined,
    event_location: undefined,
    external_link: 'https://pusates.kampusmu.id',
    tags: 'Pusat Es, Kampus, Pendaftaran, Beasiswa',
    is_pinned: 1,
    is_published: 1,
    views_count: 342,
    created_at: '2026-10-01T08:00:00.000Z',
  },
  {
    id: 2,
    title: 'Live Webinar: Peluang Kerja & Budaya Perusahaan di KS Global & Kiseki Co., Ltd.',
    title_jp: 'KS Global & Kiseki Co. 採用説明会・企業文化ウェビナー',
    slug: 'live-webinar-peluang-kerja-ks-global-kiseki-2026',
    category: 'event',
    source_name: 'KS Global Japan',
    source_type: 'corporate',
    author_name: 'HR Team KS Global & Kiseki',
    excerpt:
      'Temu langsung dengan tim rekrutmen KS Global dan Kiseki. Pembahasan posisi terbuka Software Engineer, CAD Designer, serta program relokasi kerja ke Jepang.',
    content: `
      <p>Jangan lewatkan kesempatan berinteraksi langsung dengan HR Manager dari <strong>KS Global</strong> dan <strong>Kiseki Co., Ltd.</strong> Acara ini ditujukan khusus bagi siswa JITA dan mahasiswa Kampus yang ingin memahami lebih dalam proses rekrutmen dan benefit penempatan kerja di Jepang.</p>
      
      <h4>Agenda Acara:</h4>
      <ul>
        <li><strong>13:30 - 14:00:</strong> Profil Perusahaan & Portofolio Proyek di Tokyo & Osaka.</li>
        <li><strong>14:00 - 14:40:</strong> Penjelasan Posisi Terbuka (Full-time & Internship).</li>
        <li><strong>14:40 - 15:15:</strong> Q&A Interaktif bersama Alumnus Indonesia yang telah bekerja di Jepang.</li>
        <li><strong>15:15 - 15:30:</strong> Fast-track submission via portal rekrutmen JITA.</li>
      </ul>

      <p>Peserta yang menghadiri webinar akan mendapatkan prioritas review dokumen (Fast Track Screening) oleh manajemen KS Global.</p>
    `,
    event_date: '2026-10-18T13:30:00.000Z',
    event_location: 'Zoom Online Meeting (ID & Link dikirim via email)',
    external_link: 'https://zoom.us/webinar/register/jita-ksglobal',
    tags: 'Webinar, KS Global, Kiseki, Rekrutmen, Lowongan',
    is_pinned: 1,
    is_published: 1,
    views_count: 512,
    created_at: '2026-09-28T10:30:00.000Z',
  },
  {
    id: 3,
    title: 'Standar & Kualifikasi Engineer Manufaktur yang Dibutuhkan Pabrik Otomotif Jepang',
    title_jp: '日本の自動車産業が求めるエンジニアの要件と基準',
    slug: 'standar-kualifikasi-engineer-manufaktur-jepang-yuki',
    category: 'article',
    source_name: 'Yuki Engineering',
    source_type: 'corporate',
    author_name: 'Yuki Engineering Recruiting Team',
    excerpt:
      'Memahami ekspektasi industri manufaktur Jepang: perpaduan gambar teknik (CAD/CAM), budaya Kaizen 5S, dan komunikasi Hou-Ren-So di lantai produksi.',
    content: `
      <p>Banyak talenta teknis di Indonesia memiliki kemampuan rekayasa mekanikal atau otomotif yang mumpuni, namun seringkali menemui hambatan pada cara kerja tim di industri manufaktur Jepang. Dalam artikel ini, <strong>Yuki Engineering</strong> merangkum 3 pilar utama kesiapan kerja:</p>

      <h4>1. Budaya Kaizen & 5S di Lini Produksi</h4>
      <p>Di Jepang, perbaikan berkelanjutan (Kaizen) bukan sekadar slogan, melainkan kebiasaan harian. Engineer diharapkan tidak hanya menerima masalah, tetapi proaktif menganalisis akar masalah menggunakan metode 5-Why.</p>

      <h4>2. Penguasaan Keigo Teknis</h4>
      <p>Komunikasi keselamatan kerja (<em>Anzen Dai-ichi</em>) membutuhkan kejelasan mutlak. Memahami istilah teknis pabrik dalam bahasa Jepang jauh lebih krusial daripada sekadar skor tes gramatikal umum.</p>

      <h4>3. Keandalan dan Ketepatan Waktu</h4>
      <p>Komitmen terhadap tenggat waktu dan transparansi status pekerjaan (<em>Hou-Ren-So</em>: Houkoku, Renraku, Soudan) adalah dasar utama pembentukan kepercayaan antara manajemen Jepang dan engineer asing.</p>
    `,
    event_date: undefined,
    event_location: undefined,
    external_link: undefined,
    tags: 'Manufaktur, Yuki Engineering, Kaizen, Karir',
    is_pinned: 0,
    is_published: 1,
    views_count: 420,
    created_at: '2026-09-25T14:15:00.000Z',
  },
  {
    id: 4,
    title: 'Strategi Efektif Lolos JLPT N3 Dalam 6 Bulan untuk Persiapan Karir',
    title_jp: '就職準備のためのJLPT N3合格戦略',
    slug: 'strategi-efektif-lolos-jlpt-n3-dalam-6-bulan',
    category: 'article',
    source_name: 'Dreamguide Academy & UPT Bahasa Kampus',
    source_type: 'partner_educator',
    author_name: 'Sensei Maya (Dreamguide)',
    excerpt:
      'Panduan belajar bertahap mulai dari kanji frekuensi tinggi, pola kalimat Dokkai, hingga latihan mendengar (Choukai) berorientasi situasi dunia kerja nyata.',
    content: `
      <p>Mencapai level N3 seringkali menjadi tantangan terbesar karena adanya lompatan jumlah kanji (~650 kanji) dan kosakata (~3.750 kata). UPT Bahasa Kampus bersama Dreamguide membagikan metode bertahap yang telah terbukti membantu ratusan siswa lolos seleksi industri:</p>

      <h4>Fase 1: Fondasi Kanji Aktif (Bulan 1-2)</h4>
      <p>Fokus pada kanji yang berkaitan dengan instruksi kerja, arah, angka, dan lingkungan perkantoran. Gunakan kartu memori berbasis spaced repetition (SRS).</p>

      <h4>Fase 2: Pemahaman Pola Kalimat Menengah (Bulan 3-4)</h4>
      <p>Pelajari partikel nuansa seperti <em>~wake da</em>, <em>~wake dewa nai</em>, dan <em>~ni kakawarazu</em> yang sering muncul di teks bacaan panjang maupun percakapan formal.</p>

      <h4>Fase 3: Simulasi Choukai & Ujian Real Time (Bulan 5-6)</h4>
      <p>Latih pendengaran setiap hari dengan rekaman percakapan bisnis pendek dan latihan merangkum isi percakapan secara langsung.</p>
    `,
    event_date: undefined,
    event_location: undefined,
    external_link: undefined,
    tags: 'JLPT, N3, Dreamguide, UPT Bahasa Kampus, Belajar',
    is_pinned: 0,
    is_published: 1,
    views_count: 678,
    created_at: '2026-09-20T09:00:00.000Z',
  },
  {
    id: 5,
    title: 'Workshop Bunkasai: Simulasi Interview Kerja Bahasa Jepang & Business Etiquette',
    title_jp: '日本企業模擬面接・ビジネスマナーワークショップ',
    slug: 'workshop-bunkasai-simulasi-interview-kerja-jepang',
    category: 'event',
    source_name: 'Japan Club & UPT Bahasa Jepang Kampus',
    source_type: 'partner_educator',
    author_name: 'Tim Acara Japan Club',
    excerpt:
      'Latihan tatap muka simulasi wawancara kerja Jepang (Menzetsu), etika masuk ruangan (Shitsurei Shimasu), gestur ojigi, dan menjawab pertanyaan psikologis.',
    content: `
      <p>Simulasi wawancara kerja Jepang memerlukan kesiapan fisik, bahasa, dan etika. Workshop interaktif ini dipandu langsung oleh penutur asli Jepang (native speaker) dan instruktur profesional dari Japan Club dan UPT Bahasa Kampus.</p>
      
      <h4>Materi Workshop:</h4>
      <ul>
        <li>Ketukan pintu dan salam masuk ruangan (<em>Shitsurei Itashimasu</em>).</li>
        <li>Sudut membungkuk (<em>Ojigi</em>): Eshaku (15°), Keirei (30°), dan Saikeirei (45°).</li>
        <li>Penjelasan Jiko PR (Promosi Diri) dalam 1 menit yang memikat pewawancara.</li>
        <li>Simulasi tanya jawab langsung dengan feedback per peserta.</li>
      </ul>
      <p>Tempat terbatas untuk 40 peserta. Peserta diwajibkan mengenakan pakaian formal rapi.</p>
    `,
    event_date: '2026-10-25T09:00:00.000Z',
    event_location: 'Auditorium Pusat Es Kampus Lt. 3 / Hybrid Online',
    external_link: 'https://uptbahasa.kampusmus.id/event/jita-workshop',
    tags: 'Workshop, Interview, Japan Club, UPT Bahasa Kampus',
    is_pinned: 0,
    is_published: 1,
    views_count: 289,
    created_at: '2026-09-18T11:20:00.000Z',
  },
  {
    id: 6,
    title: 'Sosialisasi Beasiswa Monbukagakusho (MEXT) & Jalur Visa Tokutei Ginou 2026/2027',
    title_jp: 'MEXT奨学金及び特定技能ビザ説明会',
    slug: 'sosialisasi-beasiswa-mext-tokutei-ginou-2026',
    category: 'announcement',
    source_name: 'Konsulat Jenderal Jepang',
    source_type: 'partner_educator',
    author_name: 'Divisi Pendidikan & Kebudayaan Konjen',
    excerpt:
      'Informasi resmi skema beasiswa pemerintah Jepang dan update regulasi visa keahlian khusus (Tokutei Ginou) untuk bidang teknologi informasi dan manufaktur.',
    content: `
      <p>Konsulat Jenderal Jepang bekerja sama dengan JITA mengundang mahasiswa dan profesional muda untuk menghadiri sesi sosialisasi komprehensif mengenai jalur studi lanjutan dan karir profesional di Jepang.</p>

      <h4>Materi Pembahasan:</h4>
      <ol>
        <li>Persyaratan dokumen dan timeline seleksi Beasiswa MEXT (Gakubu & Kenkyusei).</li>
        <li>Kebijakan terbaru Kementerian Kehakiman Jepang terkait visa Specified Skilled Worker (SSW/Tokutei Ginou) bidang IT & Teknik.</li>
        <li>Dukungan adaptasi hidup dan fasilitas jaminan sosial bagi tenaga kerja asing di wilayah Kanto dan Kansai.</li>
      </ol>
      <p>Terbuka untuk umum. Registrasi gratis melalui tautan resmi Konsulat Jenderal Jepang.</p>
    `,
    event_date: undefined,
    event_location: undefined,
    external_link: 'https://www.surabaya.id.emb-japan.go.jp/',
    tags: 'MEXT, Konjen, Beasiswa, Visa',
    is_pinned: 0,
    is_published: 1,
    views_count: 530,
    created_at: '2026-09-15T15:00:00.000Z',
  },
  {
    id: 7,
    title: 'Membangun Karir Global Melalui Ekosistem Bisnis IJB-Net & KS Global',
    title_jp: 'IJB-NetとKS Globalを通じたグローバルキャリア構築',
    slug: 'membangun-karir-global-ijb-net-ks-global',
    category: 'article',
    source_name: 'KS Global & IJB-Net',
    source_type: 'corporate',
    author_name: 'Direktorat Hubungan Industri KS Global',
    excerpt:
      'Bagaimana jejaring Indonesia Japan Business Network (IJB-Net) mempertemukan kebutuhan talenta teknologi tinggi dengan korporasi manufaktur dan IT di Tokyo & Osaka.',
    content: `
      <p>Jepang saat ini mengalami penurunan populasi usia produktif, menciptakan kebutuhan lebih dari 700.000 tenaga ahli di sektor rekayasa dan teknologi pada dekade ini. IJB-Net bersama KS Global aktif membangun jembatan langsung bagi lulusan universitas terkemuka Indonesia untuk bergabung ke perusahaan Jepang tanpa perantara agen yang membebani kandidat.</p>
      
      <p>Kolaborasi JITA dan IJB-Net memastikan bahwa setiap kandidat yang direkrut telah melalui verifikasi kemampuan teknis, kesiapan mental, dan adaptasi kultural, sehingga masa adaptasi di Jepang menjadi jauh lebih mulus dan bermartabat.</p>
    `,
    event_date: undefined,
    event_location: undefined,
    external_link: undefined,
    tags: 'IJB-Net, KS Global, Karir Jepang, Networking',
    is_pinned: 0,
    is_published: 1,
    views_count: 310,
    created_at: '2026-09-10T16:30:00.000Z',
  },
];

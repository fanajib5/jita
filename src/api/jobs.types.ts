export interface Company {
  id: number;
  name: string;
  name_jp?: string;
  industry?: string;
  website?: string;
  description?: string;
  contact_email?: string;
}

export interface Job {
  id: number;
  company_id: number;
  company_name?: string;
  company_name_jp?: string;
  title: string;
  title_jp?: string;
  description?: string;
  requirements?: string;
  specialization?: string;
  min_jlpt?: string;
  location?: string;
  employment_type: 'fulltime' | 'contract' | 'internship';
  target_audience?: 'all' | 'student' | 'graduated';
  salary_range?: string;
  is_active: 0 | 1;
  created_at: string;
  matchScore?: number;
}

export interface JobApplication {
  id: number;
  job_id: number;
  user_id: number;
  type: 'apply' | 'scout';
  message?: string;
  status: 'submitted' | 'shortlisted' | 'rejected' | 'accepted' | 'withdrawn';
  job_title?: string;
  company_name?: string;
  created_at: string;
}

export interface ScoutCandidate {
  id: number;
  name: string;
  nameJp?: string;
  jlptLevel?: string;
  specialization: string[];
  originCity?: string;
  bioId?: string;
  bioJp?: string;
  matchScore?: number;
}

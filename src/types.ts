export interface Application {
  id: string;
  name: string;
  description: string;
  owner: string;
  status: 'Draft' | 'Active' | 'Archived';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateApplicationDTO {
  name: string;
  description: string;
  owner?: string;
  status?: 'Draft' | 'Active' | 'Archived';
  notes?: string;
}

export type NavItem = 'applications' | 'packages' | 'explorer' | 'metrics' | 'blueprints' | 'prompts';

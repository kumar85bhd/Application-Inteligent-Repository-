export interface Application {
  id: string;
  name: string;
  description: string;
  owner: string;
  status: 'Draft' | 'Active' | 'Archived';
  notes?: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface CreateApplicationDTO {
  name: string;
  description: string;
  owner?: string;
  status?: 'Draft' | 'Active' | 'Archived';
  notes?: string;
}

export interface UpdateApplicationDTO {
  name?: string;
  description?: string;
  owner?: string;
  status?: 'Draft' | 'Active' | 'Archived';
  notes?: string;
}

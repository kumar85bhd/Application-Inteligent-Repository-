export interface BusinessColumn {
  name: string;
  datatype: string;
  business_meaning: string;
  application_usage: string;
  metric_relevance: string;
}

export type ImportantColumn = BusinessColumn;

export interface BusinessObject {
  name: string;
  description: string;
  table: string;
  columns: BusinessColumn[];
  useful_fields: string[];
}

export interface Workflow {
  name: string;
  description: string;
}

export interface BusinessRule {
  id: string;
  description: string;
}

export interface Relationship {
  source: string;
  target: string;
  type: string;
  description: string;
}

export interface KnowledgeRepository {
  package_version: string;
  upload_date: string;
  business_objects: BusinessObject[];
  relationships?: Relationship[];
  business_rules?: BusinessRule[];
  workflows?: Workflow[];
}

export type ExtractedKnowledge = KnowledgeRepository;

export interface ApplicationPackage {
  id: string;
  package_version: string;
  status: 'Draft' | 'Reviewed' | 'Approved';
  active: boolean;
  upload_date: string;
  business_objects: BusinessObject[];
  relationships?: Relationship[];
  business_rules?: BusinessRule[];
  workflows?: Workflow[];
}

export interface MetricBlueprint {
  id: string;
  name: string;
  business_purpose: string;
  business_object_name: string;
  required_fields: string[];
  formula_description: string;
  visualization_recommendation: string;
  implementation_notes?: string;
  last_updated: string;
}

export interface Application {
  id: string;
  name: string;
  description: string;
  url?: string;
  status: 'Draft' | 'Active' | 'Archived';
  notes?: string;
  extracted_knowledge?: KnowledgeRepository;
  packages?: ApplicationPackage[];
  metric_blueprints?: MetricBlueprint[];
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
}

export interface CreateApplicationDTO {
  name: string;
  description: string;
  url?: string;
  status?: 'Draft' | 'Active' | 'Archived';
  notes?: string;
  packages?: ApplicationPackage[];
  metric_blueprints?: MetricBlueprint[];
}

export interface UpdateApplicationDTO {
  name?: string;
  description?: string;
  url?: string;
  status?: 'Draft' | 'Active' | 'Archived';
  notes?: string;
  packages?: ApplicationPackage[];
  metric_blueprints?: MetricBlueprint[];
}

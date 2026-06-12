import { BusinessObject, Relationship, BusinessRule, MetricBlueprint } from "../types";

export interface PromptBuilderInput {
  businessObjects: BusinessObject[];
  relationships?: Relationship[];
  businessRules?: BusinessRule[];
  existingBlueprints?: MetricBlueprint[];
}

export function buildMetricDiscoveryPrompt(input: PromptBuilderInput): string {
  const { businessObjects, relationships, businessRules, existingBlueprints } = input;

  let prompt = `You are an expert Data Architect and Business Analyst. Your task is to recommend high-value business metrics and KPIs based on the provided enterprise schema and business models.

### Business Objects
${businessObjects.map(bo => `
Name: ${bo.name}
Description: ${bo.description}
Table/Entity: ${bo.table}
Fields:
${bo.columns.map(c => `  - ${c.name} (${c.datatype}): ${c.business_meaning || 'No description'}. Usage: ${c.application_usage || 'Unknown'}. Relevance: ${c.metric_relevance || 'Unknown'}`).join('\n')}
`).join('\n')}
`;

  if (relationships && relationships.length > 0) {
    prompt += `
### Relationships
${relationships.map(r => `- ${r.source} -> ${r.target} (${r.type}): ${r.description}`).join('\n')}
`;
  }

  if (businessRules && businessRules.length > 0) {
    prompt += `
### Business Rules
${businessRules.map(br => `- [${br.id}] ${br.description}`).join('\n')}
`;
  }

  if (existingBlueprints && existingBlueprints.length > 0) {
    prompt += `
### Existing Metric Blueprints (Avoid Duplicates)
${existingBlueprints.map(bp => `- ${bp.name} (Object: ${bp.business_object_name}): ${bp.business_purpose}`).join('\n')}
`;
  }

  prompt += `
### Output Requirements
Generate a list of recommended metrics prioritizing highest business value. 
For each metric, provide:
1. Metric Name (e.g. Average Resolution Time)
2. Business Purpose
3. Business Value (Why it matters to the organization)
4. Source Business Objects involved
5. Required Fields (List exact field names)
6. Suggested Formula (Plain English description of how to calculate it)
7. Recommended Visualization (e.g. Line Chart, Bar Chart, KPI Card)
8. Reasoning (Why this metric is a natural fit for this schema)
9. Confidence Score (0-100) and Confidence Level (High, Medium, Low) based on data availability.

Format the response as highly structured JSON.
`;

  return prompt.trim();
}

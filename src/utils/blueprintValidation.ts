import { MetricBlueprint } from "../types";

export const getBlueprintQuality = (bp: {
  name: string;
  business_purpose: string;
  business_object_name: string;
  required_fields: string[];
  formula_description: string;
}) => {
  const checks = {
    name: !!bp.name?.trim(),
    purpose: !!bp.business_purpose?.trim() && bp.business_purpose.trim().length >= 10,
    object: !!bp.business_object_name?.trim(),
    fields: bp.required_fields && bp.required_fields.length > 0,
    formula: !!bp.formula_description?.trim() && bp.formula_description.trim().length >= 10,
  };

  const totalWeight = 5;
  const scored = (checks.name ? 1 : 0) + 
                 (checks.purpose ? 1 : 0) + 
                 (checks.object ? 1 : 0) + 
                 (checks.fields ? 1 : 0) + 
                 (checks.formula ? 1 : 0);
  
  const percentage = Math.round((scored / totalWeight) * 100);
  const isComplete = checks.name && !!bp.business_purpose?.trim() && checks.object && checks.fields && !!bp.formula_description?.trim();

  return {
    percentage,
    isComplete,
    checks,
    statusLabel: isComplete ? "Complete" : "Incomplete",
    missing: [
      !checks.name && "Metric Name",
      !bp.business_purpose?.trim() && "Business Purpose",
      bp.business_purpose?.trim() && !checks.purpose && "Business Purpose (minimum 10 characters for proper explainability)",
      !checks.object && "Target Business Object selection",
      !checks.fields && "At least one metric relevant database field",
      !bp.formula_description?.trim() && "Formula Description",
      bp.formula_description?.trim() && !checks.formula && "Formula Description (minimum 10 characters explaining calculation methodology)",
    ].filter(Boolean) as string[]
  };
};

export const validateBlueprintForm = (form: {
  name: string;
  purpose: string;
  boName: string;
  requiredFields: string[];
  formula: string;
}): string[] => {
  const errors: string[] = [];
  const placeholders = ["test", "n/a", "tbd", "undefined", "null", "none", "x", "na"];
  
  if (!form.name.trim()) {
    errors.push("Metric Name is required.");
  }
  
  const lowerPurpose = form.purpose.trim().toLowerCase();
  if (!form.purpose.trim()) {
    errors.push("Business Purpose is required.");
  } else if (form.purpose.trim().length <= 10) {
    errors.push("Business Purpose description must be clearly descriptive (minimum 10 characters).");
  } else if (placeholders.includes(lowerPurpose) || lowerPurpose.startsWith("test")) {
    errors.push("Business Purpose cannot be a placeholder value (e.g., 'Test', 'TBD', 'N/A').");
  }
  
  if (!form.boName) {
    errors.push("Related Business Object is required.");
  }
  
  if (!form.requiredFields || form.requiredFields.length === 0) {
    errors.push("Required Fields classification is required. Select at least one column that supports this metric compute.");
  }
  
  const lowerFormula = form.formula.trim().toLowerCase();
  if (!form.formula.trim()) {
    errors.push("Formula Description is required.");
  } else if (form.formula.trim().length <= 10) {
    errors.push("Formula Description must clearly explain the calculation methodology (minimum 10 characters).");
  } else if (placeholders.includes(lowerFormula) || lowerFormula.startsWith("test")) {
    errors.push("Formula Description cannot be a placeholder value (e.g., 'Test', 'TBD', 'N/A').");
  }

  return errors;
};

import { AIMetricSuggestion } from "../types";

export async function fetchMockAISuggestions(): Promise<AIMetricSuggestion[]> {
  // Simulate network delay
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        {
          id: "ai-sug-1",
          metric_name: "Average Customer Registration Time",
          business_purpose: "To track the efficiency of the onboarding process by tracking the duration from account creation to first platform usage.",
          business_value: "A lower duration directly reduces drop-off rates and improves initial customer satisfaction, directly impacting bottom-line revenue conversions.",
          required_fields: ["created_at", "first_login_at", "status"],
          suggested_formula: "Average(first_login_at - created_at) where status is 'Active'",
          recommended_visualization: "Line Chart trending over weeks",
          reasoning: "The schema contains explicit creation timestamps as well as login events. Measuring the delta gives clear visibility into onboarding friction.",
          confidence_score: 92,
          confidence_level: "High",
          source_business_objects: ["Customer", "Account"]
        },
        {
          id: "ai-sug-2",
          metric_name: "Stale Resource Allocation Ratio",
          business_purpose: "Measure the percentage of financial or technical resources that are currently unassigned or idle for over 30 days.",
          business_value: "Identifies capital or computing inefficiencies leading to direct cost savings when stale resources are retired or reallocated.",
          required_fields: ["resource_id", "last_active_date", "total_allocated", "current_usage"],
          suggested_formula: "Count(resources where last_active_date < NOW() - 30 days) / Count(all active resources) * 100",
          recommended_visualization: "Donut Chart",
          reasoning: "Given the presence of 'last_active_date' and resource tracking tables, aging analysis is highly reliable.",
          confidence_score: 85,
          confidence_level: "Medium",
          source_business_objects: ["Resource Allocation"]
        },
        {
          id: "ai-sug-3",
          metric_name: "Customer Attrition Risk Index",
          business_purpose: "Identify customers displaying behavioral patterns often leading to churn.",
          business_value: "Enables proactive intervention from the Customer Success team before the revenue is actually lost.",
          required_fields: ["customer_id", "login_frequency_last_30_days", "open_support_tickets_count", "contract_renewal_date"],
          suggested_formula: "Weighted score: 50% * (1 / login_frequency) + 30% * open_support_tickets + 20% * (days_until_renewal)",
          recommended_visualization: "Risk Matrix Heatmap",
          reasoning: "Combines data from support ticket volume and login frequency which are both present in the schema. Some heuristics required for weights.",
          confidence_score: 68,
          confidence_level: "Medium",
          source_business_objects: ["Customer", "Support Ticket"]
        }
      ]);
    }, 1500);
  });
}

import { BusinessObject } from "../types";

export interface MetricSuggestion {
  name: string;
  category: "Volume Metrics" | "Duration Metrics" | "Status Metrics" | "Financial Metrics" | "Quality Metrics";
  description: string;
  reasoning: string;    // Explicit business-friendly rationale
  formula: string;      // Simple plain English business description (no SQL)
  visualization: string;
  fields: string[];
}

export const getSuggestionsForObject = (bo: BusinessObject): MetricSuggestion[] => {
  if (!bo) return [];
  const cols = bo.columns || [];

  const dateCols = cols.filter(c => {
    const n = c.name.toLowerCase();
    const d = c.datatype.toLowerCase();
    return d.includes('date') || d.includes('timestamp') || d.includes('time') || 
           n.endsWith('_at') || n.endsWith('_date') || n.startsWith('date') || n === 'created' || n === 'updated';
  });

  const statusCols = cols.filter(c => {
    const n = c.name.toLowerCase();
    const d = c.datatype.toLowerCase();
    return n.includes('status') || n.includes('state') || n.includes('stage') || n.includes('priority') ||
           d.includes('varchar') || d.includes('char') || d.includes('string') || d.includes('enum') || n === 'status';
  });

  const amountCols = cols.filter(c => {
    const n = c.name.toLowerCase();
    const d = c.datatype.toLowerCase();
    return n.includes('amount') || n.includes('spend') || n.includes('price') || n.includes('cost') || 
           n.includes('total') || n.includes('revenue') || n.includes('sum') || n.includes('value') ||
           d.includes('decimal') || d.includes('double') || d.includes('numeric') || d.includes('float') || d.includes('money');
  });

  const sugList: MetricSuggestion[] = [];
  const boName = bo.name;
  const boLower = boName.toLowerCase();

  // Context tag classification
  const isServiceDesk = boLower.includes("ticket") || boLower.includes("service") || boLower.includes("incident") || boLower.includes("support");
  const isProcurement = boLower.includes("order") || boLower.includes("purchase") || boLower.includes("procure") || boLower.includes("vendor") || boLower.includes("invoice") || boLower.includes("spend");
  const isHR = boLower.includes("employee") || boLower.includes("onboarding") || boLower.includes("candidate") || boLower.includes("staff") || boLower.includes("hr");

  // 1. VOLUME METRICS
  if (isServiceDesk) {
    sugList.push({
      name: "Ticket Volume",
      category: "Volume Metrics",
      description: `Track total support queries or service submissions recorded over active operating cycles.`,
      reasoning: `Suggested because:\n- Incoming row entries represent distinct client tickets\n- Counting total records calculates overall inbound support load\n- A timeline marker is available to group results into reporting periods`,
      formula: "Count all tickets created during the selected reporting period.",
      visualization: "Big Number Card",
      fields: dateCols.length > 0 ? [dateCols[0].name] : (cols.length > 0 ? [cols[0].name] : [])
    });
  } else if (isProcurement) {
    sugList.push({
      name: "Purchase Order Count",
      category: "Volume Metrics",
      description: `Track standard purchase orders volume ratios handled across administrative channels.`,
      reasoning: `Suggested because:\n- Incoming rows record transaction-level procurement requests\n- Counting entries measures total commercial purchase activity\n- Supports identifying business purchasing volume trends`,
      formula: "Count all purchase orders submitted over the select calendar period.",
      visualization: "Big Number Card",
      fields: dateCols.length > 0 ? [dateCols[0].name] : (cols.length > 0 ? [cols[0].name] : [])
    });
  } else if (isHR) {
    sugList.push({
      name: "Employee Onboarding Volume",
      category: "Volume Metrics",
      description: `Monitor total staff cohorts initialized inside the organization's hiring structure.`,
      reasoning: `Suggested because:\n- Hiring candidate or onboarding records exist in this table\n- Aggregating entries measures total talent ingestion volumes\n- Allows HR teams to predict training or workspace seating loads`,
      formula: "Count all onboarding employee processes initialized during the selected reporting period.",
      visualization: "Area Chart",
      fields: dateCols.length > 0 ? [dateCols[0].name] : (cols.length > 0 ? [cols[0].name] : [])
    });
  } else {
    sugList.push({
      name: `${boName} Volume`,
      category: "Volume Metrics",
      description: `Track overall record entries and scale ratios of active ${boName} elements.`,
      reasoning: `Suggested because:\n- Records track active database changes for ${boName}\n- Grouping inputs by dates allows calculating overall volume rates`,
      formula: `Count all ${boName} records created during the selected reporting period.`,
      visualization: "Line Chart",
      fields: dateCols.length > 0 ? [dateCols[0].name] : (cols.length > 0 ? [cols[0].name] : [])
    });
  }

  // 2. DURATION METRICS
  if (isServiceDesk && dateCols.length >= 2) {
    const createdCol = dateCols.find(c => c.name.toLowerCase().includes("create") || c.name.toLowerCase().includes("start"))?.name || dateCols[0].name;
    const closedCol = dateCols.find(c => c.name.toLowerCase().includes("close") || c.name.toLowerCase().includes("end") || c.name.toLowerCase().includes("solve") || c.name.toLowerCase().includes("finish"))?.name || dateCols[1].name;
    sugList.push({
      name: "Average Resolution Time",
      category: "Duration Metrics",
      description: `Analyze standard time durations spent to resolve incidents from creation to closure.`,
      reasoning: `Suggested because:\n- '${createdCol}' exists (start timestamp)\n- '${closedCol}' exists (end timestamp)\n- duration can be calculated dynamically as the delta between these two values`,
      formula: "Calculate the average duration between ticket creation and ticket closure.",
      visualization: "Bar Chart",
      fields: [createdCol, closedCol]
    });
  } else if (isProcurement && dateCols.length >= 2) {
    const createdCol = dateCols.find(c => c.name.toLowerCase().includes("create") || c.name.toLowerCase().includes("submit"))?.name || dateCols[0].name;
    const approvedCol = dateCols.find(c => c.name.toLowerCase().includes("approve") || c.name.toLowerCase().includes("close") || c.name.toLowerCase().includes("complete"))?.name || dateCols[1].name;
    sugList.push({
      name: "Average Approval Time",
      category: "Duration Metrics",
      description: `Measure administrative efficiency bottleneck speeds by parsing request-to-approval times.`,
      reasoning: `Suggested because:\n- '${createdCol}' exists (submission timestamp)\n- '${approvedCol}' exists (approval timestamp)\n- delta calculation measures typical wait delays and pinpoints operational friction`,
      formula: "Calculate the average turnaround duration from purchase order creation to formal manager approval.",
      visualization: "Bar Chart",
      fields: [createdCol, approvedCol]
    });
  } else if (isHR && dateCols.length >= 2) {
    const createdCol = dateCols.find(c => c.name.toLowerCase().includes("create") || c.name.toLowerCase().includes("start"))?.name || dateCols[0].name;
    const completedCol = dateCols.find(c => c.name.toLowerCase().includes("complete") || c.name.toLowerCase().includes("finish"))?.name || dateCols[1].name;
    sugList.push({
      name: "Employee Onboarding Duration",
      category: "Duration Metrics",
      description: `Benchmarking team initiation speeds by computing full process turnaround periods.`,
      reasoning: `Suggested because:\n- '${createdCol}' exists (onboarding start)\n- '${completedCol}' exists (onboarding complete)\n- computing delta tracks duration metrics to measure HR initiation timeline speed`,
      formula: "Calculate the average duration from onboarding initiation date to formal completion verification.",
      visualization: "Line Chart",
      fields: [createdCol, completedCol]
    });
  } else if (dateCols.length >= 2) {
    const d1 = dateCols[0].name;
    const d2 = dateCols[1].name;
    sugList.push({
      name: `${boName} Average Turnaround`,
      category: "Duration Metrics",
      description: `Monitor key process performance speeds across consecutive status timestamps.`,
      reasoning: `Suggested because:\n- '${d1}' exists\n- '${d2}' exists\n- duration can be calculated to measure step turnaround or operational efficiency`,
      formula: `Calculate the average elapsed duration between the '${d1}' time point and the '${d2}' time point.`,
      visualization: "Bar Chart",
      fields: [d1, d2]
    });
  } else if (dateCols.length > 0) {
    const fDate = dateCols[0].name;
    sugList.push({
      name: `${boName} Cycle Delay`,
      category: "Duration Metrics",
      description: `Track backlog aging parameters for outstanding items currently stored on table rows.`,
      reasoning: `Suggested because:\n- timeline coordinate '${fDate}' exists\n- backlog age can be tracked by evaluating elapsed time between original date and today's status`,
      formula: `Calculate the average elapsed duration between the start date and the current runtime date.`,
      visualization: "Line Chart",
      fields: [fDate]
    });
  }

  // 3. STATUS METRICS
  if (statusCols.length > 0) {
    const statCol = statusCols[0].name;
    if (isServiceDesk) {
      sugList.push({
        name: "Open Ticket Backlog",
        category: "Status Metrics",
        description: `Map out pending workflow files waiting resolved status switches.`,
        reasoning: `Suggested because:\n- status field '${statCol}' exists\n- status values can be grouped and counted to partition pending items from finished ones`,
        formula: "Count all tickets currently filtered under non-closed/active status values.",
        visualization: "Donut Chart",
        fields: [statCol]
      });
    } else if (isProcurement) {
      sugList.push({
        name: "Purchase Order Status Mix",
        category: "Status Metrics",
        description: `Measure administrative pipelines split levels across draft, approval, or completion phases.`,
        reasoning: `Suggested because:\n- state indicator '${statCol}' exists\n- records can be grouped and tallied to find pipeline distributions`,
        formula: "Count all purchase orders grouped by primary approval status.",
        visualization: "Donut Chart",
        fields: [statCol]
      });
    } else if (isHR) {
      sugList.push({
        name: "Onboarding Completion Rate",
        category: "Status Metrics",
        description: `Evaluate percentage successes of hiring operations over selected periods.`,
        reasoning: `Suggested because:\n- state/status column '${statCol}' exists\n- lets the system evaluate completed onboarding checkboxes versus outstanding profiles`,
        formula: "Calculate the percentage of onboarding employees who successfully finalize all required onboarding checklists.",
        visualization: "Big Number Card",
        fields: [statCol]
      });
    } else {
      sugList.push({
        name: `${boName} Status Mix`,
        category: "Status Metrics",
        description: `Graph state splits showing pipeline bottlenecks.`,
        reasoning: `Suggested because:\n- status field '${statCol}' exists\n- status values can be grouped and counted to analyze workflow split patterns`,
        formula: `Count all records grouped by distinct values in the '${statCol}' column.`,
        visualization: "Donut Chart",
        fields: [statCol]
      });
    }
  }

  // 4. FINANCIAL METRICS
  if (amountCols.length > 0) {
    const amtCol = amountCols[0].name;
    if (isProcurement) {
      sugList.push({
        name: "Purchase Order Spend",
        category: "Financial Metrics",
        description: `Summarize total capital allocation values mapped inside approved procurement entries.`,
        reasoning: `Suggested because:\n- monetary column '${amtCol}' exists\n- currency values can be aggregated with sum operations to track total spend caps`,
        formula: "Calculate the total value of approved purchase orders.",
        visualization: "Big Number Card",
        fields: [amtCol]
      });
      
      const vendorCol = cols.find(c => c.name.toLowerCase().includes("vendor") || c.name.toLowerCase().includes("supplier") || c.name.toLowerCase().includes("partner"))?.name;
      if (vendorCol) {
        sugList.push({
          name: "Vendor Spend Distribution",
          category: "Financial Metrics",
          description: `Map out procurement spend sums grouped by individual external partner categories.`,
          reasoning: `Suggested because:\n- monetary column '${amtCol}' exists\n- partner identity column '${vendorCol}' exists\n- grouping standard totals by supplier helps compare supplier allocation levels`,
          formula: "Group the total cumulative purchase order values by supplier credentials.",
          visualization: "Pie Chart",
          fields: [amtCol, vendorCol]
        });
      }
    } else {
      sugList.push({
        name: `${boName} Total Financial Spend`,
        category: "Financial Metrics",
        description: `Total sum metrics across standard numeric columns.`,
        reasoning: `Suggested because:\n- numeric value attribute '${amtCol}' exists\n- values can be accumulated to measure overall ledger scale and total cost volume`,
        formula: `Calculate the total value by summing up all values in the '${amtCol}' column.`,
        visualization: "Big Number Card",
        fields: [amtCol]
      });
    }
  }

  // 5. QUALITY METRICS
  if (isServiceDesk) {
    sugList.push({
      name: "SLA Compliance Rate",
      category: "Quality Metrics",
      description: `Identify support correctness ratio by evaluating tickets resolved inside formal agreement window thresholds.`,
      reasoning: `Suggested because:\n- service operations are governed by agreements (SLA)\n- status or timeline differences are available to evaluate the percentage of resolved issues finished on-time`,
      formula: "Calculate the percentage of closed tickets resolved within SLA target response windows.",
      visualization: "Big Number Card",
      fields: statusCols.length > 0 ? [statusCols[0].name] : []
    });
  } else if (isProcurement) {
    sugList.push({
      name: "Purchase Order Completion Accuracy",
      category: "Quality Metrics",
      description: `Evaluate percentage of requested items delivered error-free to detect procurement quality defects.`,
      reasoning: `Suggested because:\n- commercial order logs exist\n- state transitions and logs let us calculate order-accuracy and partner compliance ratios`,
      formula: "Calculate the percentage of fully completed and accepted orders without items rejection or errors.",
      visualization: "Big Number Card",
      fields: statusCols.length > 0 ? [statusCols[0].name] : []
    });
  } else if (isHR) {
    sugList.push({
      name: "Onboarding Success Rate",
      category: "Quality Metrics",
      description: `Track new hire onboarding quality compliance by tracking items processed within standard timeline targets.`,
      reasoning: `Suggested because:\n- new hire track coordinates are recorded\n- completion time compared against 30-day compliance targets measures SLA success percentages`,
      formula: "Percentage of newly onboarded hires who successfully completed all mandatory checklists within the target timeframe.",
      visualization: "Big Number Card",
      fields: dateCols.length > 0 ? [dateCols[0].name] : []
    });
  } else {
    sugList.push({
      name: `${boName} Record Accuracy Rate`,
      category: "Quality Metrics",
      description: `Evaluate data consistency quality by tracking complete information density.`,
      reasoning: `Suggested because:\n- standard database records are registered\n- measuring filled versus empty attributes evaluates information correctness and database health standard quality`,
      formula: "Calculate the average percentage of non-null fields over the schema across total recorded entries.",
      visualization: "Big Number Card",
      fields: cols.slice(0, 3).map(c => c.name)
    });
  }

  return sugList;
};

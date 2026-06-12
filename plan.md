# AIR (Application Intelligence Repository) - Product Roadmap

## Vision

AIR enables architects, analysts, and engineering teams to rapidly understand unfamiliar enterprise applications and discover meaningful business metrics without manually studying databases, source code, or application documentation.

Target Workflow:

Application
→ Knowledge Package
→ Knowledge Repository
→ Metric Discovery
→ AI Assisted Discovery
→ Metric Blueprint
→ Implementation Package
→ Metric Implementation

---

# Current State

## AIR v1.0 Release Candidate

### Completed

* Application Registry
* Application URL Support
* Knowledge Repository
* YAML Package Upload
* Package Validation
* Package Versioning
* Package Approval Workflow
* Active Package Selection
* Notes Support
* Knowledge Review
* Business Object Analysis
* Deterministic Metric Discovery
* Metric Suggestions
* Suggestion Reasoning
* Metric Blueprint Builder
* Blueprint Library
* Blueprint Validation Framework
* AI Discovery Framework
* Prompt Builder Framework
* Mock AI Suggestion Provider

### Current Focus

Stabilization, testing, and preparation for LiteLLM integration.

---

# Phase 1.5 – Stabilization & Testing

## Goal

Prepare AIR v1.0 for internal usage and future AI integration.

## Scope

### Manual Testing

Validate:

* Application Registration
* Application Editing
* Application Deletion
* Package Upload
* Package Validation
* Package Approval
* Active Package Selection
* Knowledge Repository
* Metric Discovery
* Blueprint Creation
* Blueprint Editing
* Persistence After Refresh

### Bug Fixes

Resolve:

* Navigation issues
* Validation issues
* UI visibility issues
* Persistence issues
* Package lifecycle issues

### Automated Testing

Introduce Playwright smoke tests.

Test Scenarios:

* Register Application
* Upload Package
* Approve Package
* Set Active Package
* Open Metric Discovery
* Create Blueprint
* Verify Persistence

## Success Criteria

AIR can be repeatedly tested without regressions.

## Out of Scope

* AI
* LiteLLM
* SQL Generation
* Dashboard Generation
* Agents
* Code Generation

---

# Phase 2A – AI Assisted Metric Discovery

## Goal

Replace mock AI recommendations with real LiteLLM-powered recommendations.

## Architecture

Knowledge Repository
→ Prompt Builder
→ LiteLLM
→ AI Suggestions
→ User Review
→ Blueprint Creation

## Deliverables

### LiteLLM Provider

Create:

services/litellmMetricDiscoveryProvider.ts

Responsibilities:

* Build Prompt
* Call LiteLLM
* Validate Response
* Return Structured Suggestions

### AI Configuration

Support:

* Model Selection
* Temperature
* Maximum Suggestions

### AI Suggestion Review

Display:

* Metric Name
* Business Purpose
* Business Value
* Reasoning
* Confidence Score
* Required Fields
* Visualization Recommendation

Actions:

* Accept
* Reject
* Convert To Blueprint

### Response Validation

Require structured JSON.

Reject malformed responses.

### Blueprint Integration

Accepted suggestions automatically populate Blueprint Builder.

## Success Criteria

Users can generate AI-powered metric suggestions and convert them into Metric Blueprints.

## Out of Scope

* Agents
* SQL Generation
* Dashboard Generation
* Code Generation

---

# Phase 2B – Discovery Intelligence

## Goal

Improve recommendation quality and user trust.

## Deliverables

### Existing Blueprint Awareness

Include existing blueprints in AI prompts.

Avoid duplicate recommendations.

### Suggestion History

Store:

* Analysis Date
* Prompt Version
* Model Used
* Suggestions Generated

### Re-analysis

Allow users to regenerate recommendations without affecting existing blueprints.

### Business Context Awareness

Prompt includes:

* Application Name
* Application Description
* Business Domain
* Existing Metrics

### Confidence Improvements

Improve confidence scoring and reasoning transparency.

## Success Criteria

AI recommendations become application-aware and progressively more useful.

---

# Phase 3 – Metric Implementation Package Generator

## Goal

Convert approved Metric Blueprints into implementation-ready design packages.

## Input

Approved Metric Blueprint

## Output

Implementation Package

## Package Contents

### Business Context

* Metric Name
* Business Purpose
* Business Value

### Data Requirements

* Business Objects
* Required Tables
* Required Columns
* Relationships

### Metric Logic

* Formula Description
* Aggregation Method
* Filters
* Dimensions
* Time Grain

### Visualization Guidance

* Recommended Chart Type
* KPI Card Guidance
* Reporting Frequency

### Implementation Notes

* Assumptions
* Known Constraints
* Validation Considerations

## Output Format

Markdown

Must be consumable by:

* Roo
* Claude Code
* Codex
* Cursor
* GitHub Copilot

## Success Criteria

An engineer can implement a metric using only the generated package.

## Out of Scope

* SQL Generation
* Code Generation

---

# Phase 4 – Metric Implementation Assistant

## Goal

Generate implementation artifacts from approved implementation packages.

## Deliverables

### SQL Generation

Generate:

* SQL Queries
* Views
* Materialized Views

### API Requirements

Generate:

* Required Endpoints
* Required Filters
* API Specifications

### Visualization Configuration

Generate:

* KPI Cards
* Tables
* Bar Charts
* Line Charts
* Pie Charts

### Human Review Workflow

All generated artifacts require user review before implementation.

## Success Criteria

Implementation effort is significantly reduced while maintaining human oversight.

---

# Phase 5 – Knowledge Evolution & Impact Analysis

## Goal

Support long-term application evolution.

## Deliverables

### Package Comparison

Compare:

Version A
vs
Version B

Identify:

* Added Tables
* Removed Tables
* Added Columns
* Removed Columns
* Relationship Changes

### Impact Analysis

Identify:

* Affected Metrics
* Affected Blueprints
* Broken Dependencies

### Blueprint Validation

Warn when:

* Required Columns Removed
* Required Tables Removed
* Relationships Changed

### Knowledge Evolution Dashboard

Track:

* Package History
* Blueprint History
* Metric Evolution

## Success Criteria

AIR remains useful as enterprise applications evolve.

---

# Technical Backlog

Do Not Prioritize Before Phase 2A

### Shared Type Models

Consolidate:

src/types.ts
server/types.ts

into:

shared/types.ts

### Package Notes

Support package-level release notes.

### Domain Templates

Templates for:

* Service Desk
* HR
* Procurement
* CRM
* Incident Management

### Advanced Playwright Coverage

Expand automated regression coverage.

---

# Release Roadmap

## AIR v1.0

Phase 1.5 Complete

Deliverables:

* Stabilized Repository
* Metric Discovery
* Blueprint Builder
* Automated Smoke Tests

---

## AIR v1.1

Phase 2A Complete

Deliverables:

* LiteLLM Integration
* AI Metric Suggestions
* Blueprint Conversion

---

## AIR v1.2

Phase 2B Complete

Deliverables:

* Suggestion History
* Duplicate Detection
* Re-analysis
* Context-Aware Discovery

---

## AIR v2.0

Phase 3 Complete

Deliverables:

* Metric Implementation Package Generator

---

## AIR v3.0

Phase 4 Complete

Deliverables:

* SQL Generation
* API Guidance
* Visualization Configuration

---

## AIR v4.0

Phase 5 Complete

Deliverables:

* Impact Analysis
* Knowledge Evolution
* Blueprint Validation Against Schema Changes

---

# Implementation Principles

1. Build incrementally.
2. Complete and test each phase before starting the next.
3. Never skip validation gates.
4. Keep human review mandatory.
5. Avoid autonomous agents until implementation packages prove value.
6. Prioritize explainability over automation.
7. Preserve backward compatibility wherever possible.
8. Every phase must deliver standalone business value.

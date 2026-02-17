# Worked Example — Design Mode

> Reference example for `/visualize-project --objective "..."`. Shows the complete output for designing a staggered DiD causal inference workflow.

---

**Objective:** `"Estimate the causal effect of a staggered policy intervention on employment using difference-in-differences with staggered adoption"`

Running `/visualize-project --objective "Estimate the causal effect of a staggered policy intervention on employment using difference-in-differences with staggered adoption" --depth 2` produces:

```json
{
  "title": "Staggered DiD: Policy Effect on Employment",
  "description": "Causal inference workflow using difference-in-differences with staggered adoption to estimate the effect of a policy intervention on employment outcomes. Three phases: data construction, estimation, and reporting.",
  "_generationMode": "design",
  "_objective": "Estimate the causal effect of a staggered policy intervention on employment using difference-in-differences with staggered adoption",
  "_generatedAt": "2026-02-16T15:00:00Z",
  "modules": [
    { "id": "phase_data", "label": "Data Construction", "color": "#e0f2fe", "borderColor": "#7dd3fc",
      "status": "planned",
      "description": "Acquire, clean, and construct the analytical panel dataset with treatment indicators and outcome variables." },
    { "id": "mod_acquire", "label": "Data Acquisition", "color": "#dbeafe", "borderColor": "#93c5fd",
      "parent": "phase_data", "status": "planned", "confidence": "high",
      "description": "Download or import raw administrative data on employment and policy adoption dates.",
      "interface": {
        "inputs": [{ "name": "raw_employment", "description": "Administrative employment records", "format": "CSV or API" },
                   { "name": "policy_dates", "description": "Adoption dates by jurisdiction", "format": "CSV with columns: jurisdiction_id, adoption_date" }],
        "outputs": [{ "name": "raw_panel", "description": "Merged raw panel with employment and policy columns", "format": "CSV" }]
      }
    },
    { "id": "mod_clean", "label": "Sample Construction", "color": "#e0e7ff", "borderColor": "#a5b4fc",
      "parent": "phase_data", "status": "planned", "confidence": "medium", "needsHumanReview": true,
      "checkpointReason": "Sample restrictions (age range, industry, balanced panel requirement) are domain-specific choices that affect external validity",
      "description": "Apply sample restrictions, handle missing data, and construct a balanced panel.",
      "interface": {
        "inputs": [{ "name": "raw_panel", "description": "Merged raw panel", "format": "CSV" }],
        "outputs": [{ "name": "clean_panel", "description": "Balanced panel with sample restrictions applied", "format": "CSV with columns: unit_id, time, employed, treated, post" }]
      }
    },
    { "id": "mod_variables", "label": "Variable Construction", "color": "#fef3c7", "borderColor": "#fcd34d",
      "parent": "phase_data", "status": "planned", "confidence": "low", "needsHumanReview": true,
      "checkpointReason": "Outcome operationalization (employment rate vs hours vs earnings), control variable selection, and treatment timing coding require domain expertise",
      "description": "Construct treatment indicators, outcome measures, and control variables for the DiD specification.",
      "interface": {
        "inputs": [{ "name": "clean_panel", "description": "Balanced panel dataset", "format": "CSV" }],
        "outputs": [{ "name": "analytical_dataset", "description": "Panel with treatment dummies, cohort indicators, outcome variables, and controls", "format": "CSV or Parquet" }]
      }
    },
    { "id": "phase_estimation", "label": "Estimation", "color": "#fef2f2", "borderColor": "#fca5a5",
      "status": "planned",
      "description": "Estimate the causal effect using staggered DiD methods with diagnostic checks." },
    { "id": "mod_diagnostic", "label": "Pre-Estimation Diagnostics", "color": "#fee2e2", "borderColor": "#fca5a5",
      "parent": "phase_estimation", "status": "planned", "confidence": "medium", "needsHumanReview": true,
      "checkpointReason": "Parallel trends test specification and interpretation require econometric judgment",
      "description": "Test parallel trends assumption and check for anticipation effects before running main specification.",
      "interface": {
        "inputs": [{ "name": "analytical_dataset", "description": "Panel with all variables", "format": "CSV or Parquet" }],
        "outputs": [{ "name": "diagnostic_results", "description": "Pre-trends test statistics, event-study plot data", "format": "JSON or CSV" }]
      }
    },
    { "id": "mod_estimate", "label": "Main Estimation", "color": "#fce7f3", "borderColor": "#f9a8d4",
      "parent": "phase_estimation", "status": "planned", "confidence": "low", "needsHumanReview": true,
      "checkpointReason": "Estimator choice (Callaway-Sant'Anna vs Sun-Abraham vs imputation) and SE clustering level are critical methodological decisions",
      "description": "Run the staggered DiD estimator with appropriate standard error clustering.",
      "interface": {
        "inputs": [{ "name": "analytical_dataset", "description": "Panel with all variables", "format": "CSV or Parquet" }],
        "outputs": [{ "name": "estimates", "description": "Point estimates, SEs, confidence intervals by cohort and event time", "format": "JSON or CSV" }]
      }
    },
    { "id": "mod_robustness", "label": "Robustness Checks", "color": "#ede9fe", "borderColor": "#c4b5fd",
      "parent": "phase_estimation", "status": "planned", "confidence": "low", "needsHumanReview": true,
      "checkpointReason": "Which robustness checks matter depends on the setting: alternative controls, different outcome definitions, placebo treatments, leave-one-out jurisdictions",
      "description": "Run sensitivity analyses: alternative specifications, placebo tests, and robustness to sample restrictions.",
      "interface": {
        "inputs": [{ "name": "analytical_dataset", "description": "Panel with all variables", "format": "CSV or Parquet" },
                   { "name": "estimates", "description": "Main estimates for comparison", "format": "JSON or CSV" }],
        "outputs": [{ "name": "robustness_results", "description": "Table of estimates across specifications", "format": "CSV" }]
      }
    },
    { "id": "phase_reporting", "label": "Reporting", "color": "#ecfdf5", "borderColor": "#6ee7b7",
      "status": "planned",
      "description": "Compile results into publication-ready tables, figures, and narrative." },
    { "id": "mod_tables", "label": "Tables & Figures", "color": "#d1fae5", "borderColor": "#6ee7b7",
      "parent": "phase_reporting", "status": "planned", "confidence": "high",
      "description": "Generate formatted regression tables, event-study plots, and summary statistics.",
      "interface": {
        "inputs": [{ "name": "estimates", "description": "Main and robustness estimates", "format": "JSON or CSV" },
                   { "name": "diagnostic_results", "description": "Pre-trends and diagnostic output", "format": "JSON or CSV" }],
        "outputs": [{ "name": "tables", "description": "LaTeX or HTML formatted tables", "format": "LaTeX (.tex)" },
                    { "name": "figures", "description": "Event-study and coefficient plots", "format": "PDF or PNG" }]
      }
    },
    { "id": "mod_writeup", "label": "Narrative & Review", "color": "#f0fdf4", "borderColor": "#86efac",
      "parent": "phase_reporting", "status": "planned", "confidence": "medium", "needsHumanReview": true,
      "checkpointReason": "Interpretation of results and policy implications require domain expertise and careful framing",
      "description": "Draft results narrative, interpret findings, and prepare for co-author or referee review.",
      "interface": {
        "inputs": [{ "name": "tables", "description": "Formatted tables", "format": "LaTeX" },
                   { "name": "figures", "description": "Generated plots", "format": "PDF or PNG" }],
        "outputs": [{ "name": "draft_paper", "description": "Results section draft with embedded tables and figures", "format": "LaTeX or Markdown" }]
      }
    }
  ],
  "nodes": [
    { "id": "acq_fetch", "module": "mod_acquire", "label": "acquire.fetch_data",
      "description": "Download or import raw employment records and policy adoption dates from source." },
    { "id": "acq_merge", "module": "mod_acquire", "label": "acquire.merge_sources",
      "description": "Merge employment data with policy adoption dates on jurisdiction and time." },
    { "id": "cln_restrict", "module": "mod_clean", "label": "clean.apply_restrictions",
      "description": "Apply sample restrictions: age range, industry codes, geographic scope." },
    { "id": "cln_balance", "module": "mod_clean", "label": "clean.balance_panel",
      "description": "Construct a balanced panel, handling entry/exit of units over time.",
      "style": { "shape": "diamond" } },
    { "id": "cln_missing", "module": "mod_clean", "label": "clean.handle_missing",
      "description": "Impute or drop observations with missing outcome or covariate values." },
    { "id": "var_treatment", "module": "mod_variables", "label": "variables.code_treatment",
      "description": "Construct treatment indicators, cohort dummies, and relative-time variables." },
    { "id": "var_outcome", "module": "mod_variables", "label": "variables.define_outcome",
      "description": "Operationalize the employment outcome measure (rate, hours, earnings, etc.)." },
    { "id": "var_controls", "module": "mod_variables", "label": "variables.select_controls",
      "description": "Choose and construct time-varying and time-invariant control variables." },
    { "id": "diag_trends", "module": "mod_diagnostic", "label": "diagnostic.test_parallel_trends",
      "description": "Run pre-trends test: regress outcome on leads of treatment to check for differential pre-trends." },
    { "id": "diag_check", "module": "mod_diagnostic", "label": "diagnostic.review_diagnostics",
      "description": "Evaluate diagnostic results. If pre-trends fail, revisit sample or specification.",
      "style": { "shape": "diamond" } },
    { "id": "est_run", "module": "mod_estimate", "label": "estimate.run_did",
      "description": "Estimate the staggered DiD model using chosen estimator (e.g., Callaway-Sant'Anna)." },
    { "id": "est_cluster", "module": "mod_estimate", "label": "estimate.cluster_se",
      "description": "Compute clustered standard errors at the appropriate level (jurisdiction, state, etc.)." },
    { "id": "rob_alt_spec", "module": "mod_robustness", "label": "robustness.alt_specifications",
      "description": "Re-estimate with alternative outcome definitions, control sets, and sample windows." },
    { "id": "rob_placebo", "module": "mod_robustness", "label": "robustness.placebo_tests",
      "description": "Run placebo tests with fake treatment dates or untreated subsamples." },
    { "id": "rob_compare", "module": "mod_robustness", "label": "robustness.compare_estimators",
      "description": "Compare results across estimators (TWFE, CS, SA, imputation) for robustness." },
    { "id": "tab_summary", "module": "mod_tables", "label": "tables.summary_stats",
      "description": "Generate summary statistics table for treatment and control groups." },
    { "id": "tab_main", "module": "mod_tables", "label": "tables.main_results",
      "description": "Format main regression results into a publication-ready table." },
    { "id": "tab_event", "module": "mod_tables", "label": "tables.event_study_plot",
      "description": "Generate event-study coefficient plot with confidence intervals." },
    { "id": "wr_draft", "module": "mod_writeup", "label": "writeup.draft_results",
      "description": "Write the results section narrative interpreting the estimates and robustness findings." },
    { "id": "wr_review", "module": "mod_writeup", "label": "writeup.co_author_review",
      "description": "Submit draft for co-author review and incorporate feedback." }
  ],
  "edges": [
    { "source": "acq_fetch", "target": "acq_merge", "label": "merge", "style": "solid" },
    { "source": "acq_merge", "target": "cln_restrict", "label": "restrict sample", "style": "solid",
      "description": "Pass merged raw panel to sample construction for filtering.", "confidence": "high" },
    { "source": "cln_restrict", "target": "cln_balance", "label": "balance", "style": "solid" },
    { "source": "cln_balance", "target": "cln_missing", "label": "handle missing", "style": "solid" },
    { "source": "cln_missing", "target": "var_treatment", "label": "construct variables", "style": "solid",
      "description": "Pass clean balanced panel to variable construction.", "confidence": "high" },
    { "source": "var_treatment", "target": "var_outcome", "label": "define outcome", "style": "solid" },
    { "source": "var_outcome", "target": "var_controls", "label": "add controls", "style": "solid" },
    { "source": "var_controls", "target": "diag_trends", "label": "run diagnostics", "style": "solid",
      "description": "Pass analytical dataset to pre-estimation diagnostics.", "confidence": "high" },
    { "source": "diag_trends", "target": "diag_check", "label": "evaluate", "style": "solid" },
    { "source": "diag_check", "target": "est_run", "label": "trends OK", "style": "solid",
      "description": "Proceed to estimation if parallel trends assumption is supported.", "confidence": "medium" },
    { "source": "diag_check", "target": "var_treatment", "label": "revise spec", "style": "dashed",
      "description": "If pre-trends fail, return to variable construction to adjust specification.", "confidence": "low" },
    { "source": "est_run", "target": "est_cluster", "label": "compute SEs", "style": "solid" },
    { "source": "est_cluster", "target": "rob_alt_spec", "label": "run robustness", "style": "solid",
      "description": "Pass main estimates to robustness checks for sensitivity analysis.", "confidence": "high" },
    { "source": "rob_alt_spec", "target": "rob_placebo", "label": "placebo", "style": "solid" },
    { "source": "rob_placebo", "target": "rob_compare", "label": "compare", "style": "solid" },
    { "source": "rob_compare", "target": "tab_summary", "label": "generate tables", "style": "solid",
      "description": "Pass all estimates to table/figure generation.", "confidence": "high" },
    { "source": "tab_summary", "target": "tab_main", "label": "main table", "style": "solid" },
    { "source": "tab_main", "target": "tab_event", "label": "event plot", "style": "solid" },
    { "source": "tab_event", "target": "wr_draft", "label": "draft narrative", "style": "solid",
      "description": "Pass formatted tables and figures to narrative drafting.", "confidence": "high" },
    { "source": "wr_draft", "target": "wr_review", "label": "review", "style": "solid", "actor": "human",
      "description": "Co-author reviews the draft and provides feedback.", "confidence": "high" }
  ],
  "criticalPath": ["acq_fetch", "acq_merge", "cln_restrict", "cln_balance",
    "cln_missing", "var_treatment", "var_outcome", "var_controls",
    "diag_trends", "diag_check", "est_run", "est_cluster",
    "rob_alt_spec", "rob_placebo", "rob_compare",
    "tab_summary", "tab_main", "tab_event", "wr_draft", "wr_review"]
}
```

3 phases, 8 modules, 20 nodes, 20 edges — all `status: "planned"`, no `files`, no `details`, no `trustLevels`. Domain-specific modules (`mod_variables`, `mod_estimate`, `mod_robustness`, `mod_writeup`) flagged with `needsHumanReview: true` and specific `checkpointReason` explaining what requires expertise.

**Note on interface port nodes:** This example omits port nodes for brevity.
In a complete graph, every module would also have `_isInterfacePort` input
and output nodes generated per Step 2.3b, and cross-module edges would
route through them. See the scan-mode worked example (`examples/scan-example.md`) for the full
port node pattern.

# EKZ M&E — Test Data Walkthrough

This document provides a step-by-step sequence of API calls to populate the system with realistic
test data. Every call builds on the previous one — follow the order exactly.

All requests go to `{{BASE_URL}}/api` (e.g. `https://your-server.com/api`).

---

## Prerequisites

1. The server is running and migrations have completed
2. The seed has been run (`pnpm run seed`) — this creates the admin user
3. You have a tool like Postman, Insomnia, or curl

---

## Step 0 — Login as Admin

```
POST /api/auth/login
```
```json
{
  "email": "admin@ekz.com",
  "password": "Admin123!"
}
```

**Save the `token` from the response.** Use it as `Authorization: Bearer <token>` on all
subsequent requests.

---

## Step 1 — Invite Users

Create users for each role so you can test permissions.

### 1a — M&E Staff

```
POST /api/users/invite
```
```json
{
  "name": "Funke Ogunleye",
  "email": "funke.ogunleye@ekz.com",
  "role": "me_staff"
}
```

### 1b — Programme Staff (field officer)

```
POST /api/users/invite
```
```json
{
  "name": "Chidi Nwosu",
  "email": "chidi.nwosu@ekz.com",
  "role": "programme_staff"
}
```

### 1c — Viewer

```
POST /api/users/invite
```
```json
{
  "name": "Bola Adeyemi",
  "email": "bola.adeyemi@ekz.com",
  "role": "viewer"
}
```

**Note:** All invited users get the default password from `DEFAULT_USER_PASSWORD` env var.
They must change it on first login via `POST /api/auth/change-password`.

---

## Step 2 — Build the Logframe

The hierarchy is: **Goal → Outcome → Output → Activity**.
Each level requires a parent of the correct type (except Goal, which has no parent).

### 2a — Create the Goal

```
POST /api/logframe/nodes
```
```json
{
  "type": "goal",
  "code": "G-1",
  "title": "Accelerated economic growth and job creation in Ekiti State",
  "description": "Overall programme goal aligned with AfDB's High 5 priorities",
  "order": 0
}
```

**Save the returned `id` as `GOAL_ID`.**

### 2b — Create Outcomes (under the Goal)

```
POST /api/logframe/nodes
```
```json
{
  "type": "outcome",
  "code": "OC-1",
  "title": "Increased youth employability through skills development",
  "description": "Youth gain market-relevant technical and entrepreneurial skills",
  "parent_id": "{{GOAL_ID}}",
  "order": 0
}
```

**Save as `OUTCOME_1_ID`.**

```
POST /api/logframe/nodes
```
```json
{
  "type": "outcome",
  "code": "OC-2",
  "title": "Strengthened SME ecosystem in Ekiti State",
  "parent_id": "{{GOAL_ID}}",
  "order": 1
}
```

**Save as `OUTCOME_2_ID`.**

### 2c — Create Outputs (under Outcomes)

```
POST /api/logframe/nodes
```
```json
{
  "type": "output",
  "code": "OP-1.1",
  "title": "TVET centres upgraded and operational",
  "description": "Physical infrastructure and equipment for 6 TVET centres across Ekiti LGAs",
  "parent_id": "{{OUTCOME_1_ID}}",
  "order": 0
}
```

**Save as `OUTPUT_1_1_ID`.**

```
POST /api/logframe/nodes
```
```json
{
  "type": "output",
  "code": "OP-1.2",
  "title": "Youth enrolled in TVET programmes",
  "parent_id": "{{OUTCOME_1_ID}}",
  "order": 1
}
```

**Save as `OUTPUT_1_2_ID`.**

```
POST /api/logframe/nodes
```
```json
{
  "type": "output",
  "code": "OP-2.1",
  "title": "SMEs receive business development support",
  "parent_id": "{{OUTCOME_2_ID}}",
  "order": 0
}
```

**Save as `OUTPUT_2_1_ID`.**

### 2d — Create Activities (under Outputs)

```
POST /api/logframe/nodes
```
```json
{
  "type": "activity",
  "code": "ACT-1.1.1",
  "title": "Procure workshop equipment for TVET centres",
  "parent_id": "{{OUTPUT_1_1_ID}}",
  "order": 0
}
```

```
POST /api/logframe/nodes
```
```json
{
  "type": "activity",
  "code": "ACT-1.2.1",
  "title": "Conduct youth enrollment drives in 16 LGAs",
  "parent_id": "{{OUTPUT_1_2_ID}}",
  "order": 0
}
```

### 2e — Verify the tree

```
GET /api/logframe
```

This returns the full nested tree. You should see G-1 → OC-1/OC-2 → OP-x.x → ACT-x.x.x.

---

## Step 3 — Create Indicators

### 3a — Output-level indicator (linked to OP-1.2)

```
POST /api/indicators
```
```json
{
  "code": "OUT-1.2.1",
  "name": "Number of youths enrolled in TVET programmes",
  "description": "Cumulative count of youth who have completed enrollment into any TVET programme",
  "level": "output",
  "unit": "individuals",
  "baseline": 0,
  "target": 5000,
  "frequency": "quarterly",
  "logframe_level_id": "{{OUTPUT_1_2_ID}}",
  "sdg_ids": [4, 8],
  "responsible_party": "TVET Directorate",
  "means_of_verification": "Enrollment registers and training attendance sheets"
}
```

**Save as `INDICATOR_1_ID`.**

### 3b — Outcome-level indicator (linked to OC-2)

```
POST /api/indicators
```
```json
{
  "code": "OCM-2.1",
  "name": "Number of SMEs receiving business development support",
  "description": "Count of SMEs that have participated in at least one BDS training or mentorship session",
  "level": "outcome",
  "unit": "enterprises",
  "baseline": 0,
  "target": 200,
  "frequency": "bi_annually",
  "logframe_level_id": "{{OUTPUT_2_1_ID}}",
  "sdg_ids": [8, 9],
  "responsible_party": "Enterprise Development Unit",
  "means_of_verification": "Training attendance and BDS session reports"
}
```

**Save as `INDICATOR_2_ID`.**

### 3c — Impact-level indicator (no logframe link)

```
POST /api/indicators
```
```json
{
  "code": "IMP-1",
  "name": "Youth unemployment rate reduction in Ekiti State",
  "description": "Percentage point reduction in youth unemployment compared to 2024 baseline",
  "level": "impact",
  "unit": "percentage points",
  "baseline": 0,
  "target": 5,
  "frequency": "annually",
  "sdg_ids": [1, 8],
  "responsible_party": "M&E Unit",
  "means_of_verification": "National Bureau of Statistics labour force survey"
}
```

**Save as `INDICATOR_3_ID`.**

---

## Step 4 — Link an Indicator to a Logframe Node

If you created an indicator without `logframe_level_id`, you can link it after the fact:

```
POST /api/logframe/nodes/{{GOAL_ID}}/indicators
```
```json
{
  "indicator_id": "{{INDICATOR_3_ID}}"
}
```

---

## Step 5 — Log Progress on Indicators

### 5a — Q1 progress on youth enrollment

```
POST /api/indicators/{{INDICATOR_1_ID}}/progress
```
```json
{
  "value": 1250,
  "date": "2026-03-31T00:00:00Z",
  "notes": "Q1 2026 — enrollment across 6 TVET centres",
  "submittedBy": "Funke Ogunleye"
}
```

### 5b — Q2 progress (higher value — indicator should move toward on_track)

```
POST /api/indicators/{{INDICATOR_1_ID}}/progress
```
```json
{
  "value": 2800,
  "date": "2026-06-30T00:00:00Z",
  "notes": "Q2 2026 — mid-year enrollment figures",
  "submittedBy": "Funke Ogunleye"
}
```

### 5c — SME indicator progress

```
POST /api/indicators/{{INDICATOR_2_ID}}/progress
```
```json
{
  "value": 45,
  "date": "2026-06-30T00:00:00Z",
  "notes": "H1 2026 — BDS sessions completed in 3 LGAs",
  "submittedBy": "Adebola Johnson"
}
```

### 5d — Verify progress history

```
GET /api/indicators/{{INDICATOR_1_ID}}/progress
```

Returns entries oldest-first. The indicator's `current_value` and `status` are updated to
match the most recent entry by date.

---

## Step 6 — Create Project Locations

### 6a — TVET Centre location (with geofence)

```
POST /api/locations/projects
```
```json
{
  "name": "Ado-Ekiti TVET Centre",
  "sector": "Education",
  "description": "Main vocational training facility in Ado-Ekiti",
  "lat": 7.6211,
  "lng": 5.2216,
  "radius_m": 500,
  "indicator_ids": ["{{INDICATOR_1_ID}}"]
}
```

**Save as `LOCATION_1_ID`.** Note: `created_by` is set automatically from your JWT.

### 6b — Second location

```
POST /api/locations/projects
```
```json
{
  "name": "Ikere-Ekiti Enterprise Hub",
  "sector": "Enterprise",
  "description": "SME support centre and co-working space",
  "lat": 7.4969,
  "lng": 5.2321,
  "radius_m": 300,
  "indicator_ids": ["{{INDICATOR_2_ID}}"]
}
```

**Save as `LOCATION_2_ID`.**

### 6c — Verify GeoJSON output

```
GET /api/locations/projects
```

Returns a GeoJSON `FeatureCollection` with computed `status` and `completion` per location.

---

## Step 7 — Create a Data Collection Form

First, get the user IDs. You'll need the programme_staff user's ID for assignment:

```
GET /api/users
```

Find Chidi Nwosu's `id` and save as `OFFICER_ID`.

```
POST /api/forms
```
```json
{
  "title": "Youth Training Enrollment Log",
  "description": "Field officers use this form to record youth enrolling in TVET programmes",
  "fields": [
    { "id": "f1", "label": "Full Name", "type": "text", "required": true, "order": 1 },
    { "id": "f2", "label": "Age", "type": "number", "required": true, "order": 2 },
    { "id": "f3", "label": "Gender", "type": "select", "options": ["Male", "Female"], "required": true, "order": 3 },
    { "id": "f4", "label": "LGA of Residence", "type": "text", "required": true, "order": 4 },
    { "id": "f5", "label": "TVET Programme", "type": "select", "options": ["Welding", "Carpentry", "ICT", "Tailoring", "Plumbing"], "required": true, "order": 5 },
    { "id": "f6", "label": "Phone Number", "type": "text", "required": false, "order": 6 }
  ],
  "indicator_ids": ["{{INDICATOR_1_ID}}"],
  "assigned_to": ["{{OFFICER_ID}}"],
  "status": "published"
}
```

**Save as `FORM_ID`.** Note: `created_by` is set automatically from JWT.

---

## Step 8 — Submit Field Data

Login as the programme staff user first (or keep using admin — admin can submit too).

### 8a — On-site submission (GPS inside the TVET centre geofence)

```
POST /api/submissions
```
```json
{
  "id": "a1b2c3d4-1111-4000-a000-000000000001",
  "formId": "{{FORM_ID}}",
  "officerId": "{{OFFICER_ID}}",
  "data": {
    "Full Name": "Adesola Oluwafemi",
    "Age": 22,
    "Gender": "Female",
    "LGA of Residence": "Ado-Ekiti",
    "TVET Programme": "ICT",
    "Phone Number": "08012345678"
  },
  "location": { "lat": 7.6215, "lng": 5.2220 },
  "submittedAt": "2026-04-10T09:30:00Z"
}
```

Should return `{ id: "...", status: "accepted" }`. The `on_site` field will be `true`
because the GPS is within 500m of Ado-Ekiti TVET Centre.

### 8b — Off-site submission (GPS far from any location — triggers alert)

```
POST /api/submissions
```
```json
{
  "id": "a1b2c3d4-2222-4000-a000-000000000002",
  "formId": "{{FORM_ID}}",
  "officerId": "{{OFFICER_ID}}",
  "data": {
    "Full Name": "Babajide Adeniyi",
    "Age": 19,
    "Gender": "Male",
    "LGA of Residence": "Irepodun/Ifelodun",
    "TVET Programme": "Welding"
  },
  "location": { "lat": 6.5000, "lng": 3.3000 },
  "submittedAt": "2026-04-10T14:00:00Z"
}
```

This GPS is in Lagos — `on_site` will be `false`, and admin/ME staff will receive a
`data_flag` alert and email.

### 8c — Submission without GPS

```
POST /api/submissions
```
```json
{
  "id": "a1b2c3d4-3333-4000-a000-000000000003",
  "formId": "{{FORM_ID}}",
  "officerId": "{{OFFICER_ID}}",
  "data": {
    "Full Name": "Ngozi Eze",
    "Age": 24,
    "Gender": "Female",
    "LGA of Residence": "Ikere",
    "TVET Programme": "Tailoring"
  },
  "submittedAt": "2026-04-11T08:15:00Z"
}
```

No geofencing runs — `on_site` and `location_id` will be `null`.

### 8d — Batch submission (offline sync scenario)

```
POST /api/submissions/batch
```
```json
[
  {
    "id": "a1b2c3d4-4444-4000-a000-000000000004",
    "formId": "{{FORM_ID}}",
    "officerId": "{{OFFICER_ID}}",
    "data": { "Full Name": "Tunde Bakare", "Age": 20, "Gender": "Male", "LGA of Residence": "Ado-Ekiti", "TVET Programme": "Carpentry" },
    "location": { "lat": 7.6210, "lng": 5.2218 },
    "submittedAt": "2026-04-12T10:00:00Z"
  },
  {
    "id": "a1b2c3d4-5555-4000-a000-000000000005",
    "formId": "{{FORM_ID}}",
    "officerId": "{{OFFICER_ID}}",
    "data": { "Full Name": "Yetunde Alabi", "Age": 21, "Gender": "Female", "LGA of Residence": "Ado-Ekiti", "TVET Programme": "Plumbing" },
    "location": { "lat": 7.6212, "lng": 5.2215 },
    "submittedAt": "2026-04-12T10:05:00Z"
  }
]
```

Returns `{ accepted: [...], rejected: [...] }`.

---

## Step 9 — Validate Submissions

### 9a — Approve the first submission

```
PUT /api/submissions/a1b2c3d4-1111-4000-a000-000000000001/validate
```
```json
{
  "action": "approve",
  "comment": "Verified on-site. Enrollment confirmed."
}
```

### 9b — Reject the off-site submission

```
PUT /api/submissions/a1b2c3d4-2222-4000-a000-000000000002/validate
```
```json
{
  "action": "reject",
  "comment": "GPS coordinates are in Lagos, not Ekiti. Please verify and resubmit."
}
```

The officer receives an email notification for both actions.

---

## Step 10 — Check the Dashboard

```
GET /api/dashboards/executive
```

Returns:
- `kpis` — indicator counts by status, submissions this month, pending_sync count
- `monthly_trend` — 6-month chart data
- `status_distribution` — on_track / at_risk / off_track counts
- `sdg_progress` — progress per linked SDG
- `recent_submissions` — last 5 submissions
- `recent_alerts` — last 3 unread alerts for you

---

## Step 11 — Check Alerts

```
GET /api/alerts
```

You should see:
- `sync_success` alerts for the officer (one per submission)
- `data_flag` alert for admin (the off-site submission)
- `missed_target` alerts if any indicator moved to at_risk or off_track

Filter by type:
```
GET /api/alerts?type=data_flag
GET /api/alerts?type=sync_success
```

---

## Step 12 — Check Audit Log

```
GET /api/audit-log
```

Every mutation from steps 1–9 should have a corresponding audit entry. Filter:

```
GET /api/audit-log?resource=indicator
GET /api/audit-log?action=submit
GET /api/audit-log?resource=submission&action=update
```

---

## Step 13 — Generate a Report

```
POST /api/reports/generate
```
```json
{
  "title": "Q1 2026 Programme Performance Report",
  "format": "pdf",
  "indicator_ids": ["{{INDICATOR_1_ID}}", "{{INDICATOR_2_ID}}"],
  "date_from": "2026-01-01",
  "date_to": "2026-03-31"
}
```

Returns `{ report_id, download_url, format }`. The `download_url` is `#` — actual PDF generation
happens on the frontend.

---

## Step 14 — Create an API Token

```
POST /api/api-tokens
```
```json
{
  "name": "Mobile Sync Service"
}
```

**Save the `rawToken`** — it's shown only once. You can now use it as
`Authorization: Bearer <rawToken>` on `POST /api/submissions` and `POST /api/submissions/batch`
for service-to-service integration.

---

## Verification Summary

After completing all steps, you should have:

- 4 users (1 admin, 1 me_staff, 1 programme_staff, 1 viewer)
- 7 logframe nodes (1 goal, 2 outcomes, 3 outputs, 2 activities)
- 3 indicators linked to the logframe
- 3 progress entries across 2 indicators
- 2 project locations with geofences
- 1 published form with 6 fields
- 5 submissions (3 single + 2 batch), with 1 approved and 1 rejected
- Multiple alerts (sync_success, data_flag)
- Audit log entries for every mutation
- 1 report metadata record
- 1 API token

# DocCompare — Request for Quote (RFQ)

## 1. Executive Summary

DocCompare is an AI-powered document audit platform for the toy and children's product import industry. The system validates packaging artwork across three sequential departments: **Attendimento (Customer Service) → Design → CQ (Quality Control)**.

**Current Status:** Phase 0 (Foundation) and Phase 1 (IA Validator) are **complete and live in production**. We are now seeking quotes for **Phase 2 (Design Review)** and optionally Phases 3-5.

**Repository:** https://github.com/fabiosilva42-cmd/doccompare  
**Production URL:** http://108.174.150.102:3000  
**VPS:** Ubuntu 22.04, PM2, MySQL 8.0 (Docker)

---

## 2. What Already Exists (Do Not Quote For This)

The following is fully built, tested, and deployed. You will work **on top of this codebase**, not from scratch.

### Backend (Hono + tRPC + Drizzle ORM + MySQL)
- Authentication system with role-based access (user, admin, supervisor)
- Department-based routing (atendimento, design, cq)
- Full database schema: users, pedidos, prompts, comparacoes, comparacao_itens, documentos, divergencias, notificacoes, metricas
- OCR pipeline: pdf-parse → Mistral OCR 3 → Tesseract.js fallback
- 4 programmatic validators: CNPJ, EAN-13, DUN-14, NCM
- Orchestrator that extracts and validates all data from Order Details
- PDF report generation (HTML template → PDF via Puppeteer)
- Executive Summary PDF template for Phase 1
- Upload system accepting tipoDocumento and tipoEmbalagem per file
- AI integration with Kimi k2.5 (Moonshot AI) via REST API
- tRPC routers: comparacao, pedido, upload, documento, pdf, setup, prompt, usuario, metricas, notificacao, aql, divergencia

### Frontend (React 19 + Vite + Tailwind + shadcn/ui)
- Login page with authentication
- Dashboard with KPI cards
- Nova Comparacao wizard with 3-step flow:
  - Step 1: Multi-file upload with drag-and-drop
  - Step 2: Per-file document type classification (dropdown with 11 types)
  - Step 3: Order data input + execution
- Resultado page showing AI analysis per packaging type
- Historico page for past comparisons
- Admin pages for prompts and users
- Notification bell with real-time badges
- Sidebar navigation with department-based menu items
- 40+ shadcn/ui components installed and configured

### DevOps
- Production VPS with PM2 process manager
- GitHub repository with GitHub Actions deploy workflow (SSH-based)
- Build script: `vite build && esbuild api/boot.ts --bundle --format=esm`

---

## 3. What We Need Built

### PHASE 2 — Design Review (Primary Quote)

**Objective:** Enable the Design department to validate developed artwork against Order Details and Phase 1 briefing.

#### 3.1 Visual OCR for Artwork PDFs
- Current OCR extracts text from native PDFs but artwork PDFs often have text embedded as vector graphics or images
- Must use Mistral OCR 3 to extract visible text from artwork images
- Must extract text, numbers, barcodes, and QR codes from visual artwork layouts
- Output must be structured JSON matching the Order Details format for comparison

#### 3.2 Artwork vs Order Details Comparison
- AI prompt must compare every element of the artwork against Order Details
- Fields to validate per packaging type (barcode_label, color_box, master_carton):
  - Texts: spelling, no typos, correct language
  - Barcodes: EAN-13 and DUN-14 correctness, readability, scan verification
  - Dimensions: L x W x H must match Order Details
  - Weight: gross and net weight must match specifications
  - QR Code position: height > width → lateral face; width > height → top face
  - Colors: Pantone/CMYK must match specification
  - Fonts: legible sizes, correct styles
  - Logos and marks: correct positioning, no distortion
  - Materials: type and grammage must match Order Details
  - Warnings and markings: age recommendation, usage instructions, safety marks

#### 3.3 Interactive Checklist per Packaging Type
- After AI returns analysis, the Design reviewer must mark each item as:
  - OK (green)
  - NOK — Not OK (red)
  - Pending (yellow)
- Each item must be saved to the database with reviewer name, timestamp, and notes
- Checklist state must be visible to CQ in Phase 3

#### 3.4 Multiple Artwork Version Upload
- Design team may submit version 1, get feedback, submit version 2, etc.
- System must track version number per artwork submission
- Must show version history in the UI
- AI comparison must run against the specific version being reviewed
- Previous versions must remain viewable but not editable

#### 3.5 Phase 1 Briefing Integration
- Design phase must receive and display the Phase 1 Executive Summary PDF
- Design must see all contradictions and recommendations from Phase 1
- Design must be able to mark each Phase 1 item as "Addressed" or "Ignored with reason"

---

### PHASE 3 — CQ Review (Secondary Quote — Optional)

**Objective:** Enable CQ to validate supplier sketch/contraprova against approved artwork and Order Details.

#### 3.1 Sketch vs Artwork Comparison
- Upload supplier sketch PDF or photos
- AI compares sketch against approved artwork from Phase 2
- Validates visual conformity, barcode legibility, real dimensions, weight compliance

#### 3.2 Physical Product Photo Validation
- Upload photos of actual product from factory
- AI validates that physical product matches approved artwork
- Checks all angles: front, back, sides, top, bottom, interior

#### 3.3 Final Approval Workflow
- CQ marks entire packaging type as Approved, Rejected, or Conditional
- Conditional requires specific corrections listed
- Rejected requires full re-submission from Design

---

### PHASE 4 — Metrics & Intelligence (Tertiary Quote — Optional)

#### 4.1 KPI Dashboard
- Average time per phase (Attendimento → Design → CQ)
- Rework rate (how many times a packaging type goes back)
- Most frequent error types by category and by supplier
- Monthly trend charts

#### 4.2 Supplier Score
- Each supplier accumulates a quality score based on CQ findings
- Score factors: number of rejections, types of errors, correction speed
- Display supplier ranking in dashboard

#### 4.3 Predictive Alerts
- If a supplier has recurring error patterns (e.g., QR Code always wrong), alert before next order
- Suggest pre-checks based on supplier history

#### 4.4 Monthly Auto-Report
- PDF generated automatically on the 1st of each month
- Contains: total orders processed, average time, top errors, supplier rankings
- Emailed to management (in-app notification for now — no email service needed)

---

### PHASE 5 — Integrations (Future — Do Not Quote)

This phase is for 2026/2027 and is explicitly **out of scope** for this RFQ. Listed for context only:
- ERP API integration for automatic order import
- Email/Teams notifications between departments
- Supplier webhook for approved artwork delivery
- Field inspector photo upload integration

---

## 4. Technical Constraints & Decisions

### Must Use (Existing Stack)
- React 19 + Vite + Tailwind CSS + shadcn/ui (frontend)
- Hono + tRPC + Drizzle ORM (backend)
- MySQL 8.0 via Docker (database)
- Kimi k2.5 from Moonshot AI (AI model — non-negotiable)
- Ubuntu 22.04 + PM2 (deployment)

### Must NOT Use (Explicitly Out of Scope)
- **No Docker/Kubernetes for deployment** — we use direct PM2 on Ubuntu
- **No AWS S3 / cloud storage** — files stored as base64 in MySQL for now
- **No email service (SendGrid, SES, etc.)** — notifications are in-app only
- **No SMS/Twilio** — will never be part of this product
- **No CI/CD pipeline beyond GitHub Actions** — deploy is `git pull && npm run build && pm2 restart`
- **No ERP integration** — manual upload only

### AI Configuration (Non-Negotiable)
- Model: `kimi-k2.5`
- Endpoint: `https://api.moonshot.ai/v1/chat/completions`
- Phase 1 temperature: `0.3` (maximum accuracy)
- Phase 2 temperature: `0.3` to `0.5` (to be determined during testing)
- Max tokens: `8000`
- Output format: Strict JSON with defined schema per phase

---

## 5. Deliverables per Phase

### Phase 2 Deliverables
1. Visual OCR module for artwork PDF extraction
2. Updated AI prompt for Design comparison (3 packaging types)
3. Interactive checklist UI component with OK/NOK/Pending states
4. Database schema update for checklist items and version tracking
5. Artwork version upload and history UI
6. Phase 1 briefing display and addressing workflow
7. Updated `Resultado.tsx` page for Design phase results
8. Updated `NovaComparacao.tsx` to support Design document types
9. Backend router updates for Design comparison execution
10. Integration tests for visual OCR + AI pipeline

### Phase 3 Deliverables
1. Sketch/photo upload with multiple angles
2. AI prompt for CQ comparison against approved artwork
3. Final approval workflow (Approved/Rejected/Conditional)
4. CQ result page with approval buttons
5. Database schema for approval records
6. Phase 2 checklist visibility in Phase 3

### Phase 4 Deliverables
1. KPI dashboard page with charts
2. Supplier score calculation and ranking
3. Predictive alert system based on error patterns
4. Monthly auto-report PDF generation
5. Admin page for report configuration

---

## 6. Acceptance Criteria

### Phase 2 Acceptance
- Upload an artwork PDF with embedded text as image → system extracts all visible text correctly
- Run Design comparison → AI identifies at least 90% of discrepancies compared to manual review
- Interactive checklist → reviewer can mark items, data persists, CQ can view in Phase 3
- Upload version 2 of artwork → system tracks versions, runs comparison against correct version
- Phase 1 briefing visible → Design can see all contradictions and mark as addressed

### Phase 3 Acceptance
- Upload supplier sketch → AI compares against approved artwork with visual accuracy
- CQ approves/rejects → state changes, notifications appear in dashboard
- Approval record saved with reviewer name, timestamp, and notes

### Phase 4 Acceptance
- Dashboard shows real KPIs from production data
- Supplier score updates automatically based on CQ findings
- Monthly report generates without manual intervention

---

## 7. Pricing Request

Please provide separate quotes for:

| Item | Your Estimate |
|---|---|
| **Phase 2 — Design Review** (fixed scope as defined in Section 3) | $_____ |
| **Phase 3 — CQ Review** (fixed scope as defined in Section 3) | $_____ |
| **Phase 4 — Metrics & Intelligence** (fixed scope as defined in Section 3) | $_____ |
| **All Phases (2+3+4) package** (discounted) | $_____ |
| **Hourly rate** (if you prefer time-and-materials) | $_____ / hour |
| **Estimated timeline** for Phase 2 only | _____ weeks |
| **Estimated timeline** for Phases 2+3+4 | _____ weeks |

**Payment terms:** We prefer 30% upfront, 40% at midpoint, 30% at delivery per phase.

---

## 8. How to Review the Existing Code

1. Clone: `git clone https://github.com/fabiosilva42-cmd/doccompare.git`
2. Install: `npm install`
3. Build: `npm run build` (must pass with 0 errors)
4. Check key files:
   - `api/comparacao-router.ts` — comparison execution with AI
   - `api/lib/validador-programatico.ts` — programmatic validation
   - `api/setup-router.ts` — AI prompts
   - `src/pages/NovaComparacao.tsx` — upload wizard
   - `src/pages/Resultado.tsx` — results display
   - `db/schema.ts` — database schema

---

## 9. Contact & Next Steps

Please review this RFQ and send your proposal including:
1. Fixed price or hourly estimate per phase
2. Timeline with milestones
3. Any assumptions or clarifications
4. Team composition and relevant experience

We will evaluate proposals based on technical understanding, realistic timelines, and value — not just lowest price.

---

*This RFQ was prepared on June 5, 2026. The existing codebase represents approximately 3 months of development work by a dedicated technical lead.*

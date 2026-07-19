-- ==================================================
-- BlueChain MRV — Full Database Schema
-- Migration: mrv_schema
-- Created: 2026-07-19
-- ==================================================
-- This migration creates the complete MRV data model:
--   1. ecosystem_parameters  — versioned carbon calculation inputs
--   2. monitoring_reports    — core field report records
--   3. report_images         — images uploaded per report
--   4. ai_verifications      — Gemini Vision classification results
--   5. carbon_assessments    — deterministic, server-side carbon estimates
--   6. mrv_reviews           — human/authorised review records
--   7. carbon_credits        — credit eligibility and issuance records
-- ==================================================

-- --------------------------------------------------
-- ENUMS
-- --------------------------------------------------

CREATE TYPE public.report_status AS ENUM (
  'draft',
  'submitted',
  'ai_verifying',
  'ai_verified',
  'ai_rejected',
  'pending_mrv_review',
  'verified',
  'rejected',
  'credit_eligible',
  'credit_issued'
);

CREATE TYPE public.ecosystem_type AS ENUM (
  'mangrove',
  'seagrass',
  'salt_marsh'
);

CREATE TYPE public.location_source AS ENUM (
  'gps_auto',
  'manual'
);

-- --------------------------------------------------
-- TABLE 1: ecosystem_parameters
-- Versioned carbon calculation parameters.
-- These are ESTIMATES based on published blue carbon
-- literature (IPCC, Howard et al. 2014).
-- They are NOT universal scientific measurements.
-- --------------------------------------------------

CREATE TABLE public.ecosystem_parameters (
  id                       UUID        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ecosystem_type           public.ecosystem_type NOT NULL,
  biomass_density_t_per_ha NUMERIC(10,4) NOT NULL,  -- above+below ground, t/ha
  carbon_fraction          NUMERIC(6,4)  NOT NULL,  -- fraction of biomass that is carbon
  co2_conversion_factor    NUMERIC(6,4)  NOT NULL,  -- CO2e per unit C (default 3.67)
  version                  TEXT          NOT NULL DEFAULT 'v1',
  is_active                BOOLEAN       NOT NULL DEFAULT TRUE,
  notes                    TEXT,
  created_at               TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- Only one active parameter set per ecosystem per version
CREATE UNIQUE INDEX ecosystem_parameters_active_idx
  ON public.ecosystem_parameters (ecosystem_type, version)
  WHERE is_active = TRUE;

-- Seed MVP v1 parameters
-- Source: Howard et al. (2014) Coastal Blue Carbon, IPCC Wetlands Supplement.
-- These are simplified MVP estimates and must be labelled as such in the UI.
INSERT INTO public.ecosystem_parameters
  (ecosystem_type, biomass_density_t_per_ha, carbon_fraction, co2_conversion_factor, version, is_active, notes)
VALUES
  ('mangrove',   150.0, 0.47, 3.67, 'v1', TRUE,
   'MVP estimate. Biomass density 150 t/ha (above+below). Carbon fraction 0.47 (IPCC 2013). CO2 conversion 3.67. Not a verified site measurement.'),
  ('seagrass',    25.0, 0.43, 3.67, 'v1', TRUE,
   'MVP estimate. Biomass density 25 t/ha. Carbon fraction 0.43. CO2 conversion 3.67. Seagrass values are highly site-specific. Treat as indicative only.'),
  ('salt_marsh',  40.0, 0.45, 3.67, 'v1', TRUE,
   'MVP estimate. Biomass density 40 t/ha. Carbon fraction 0.45. CO2 conversion 3.67. Values vary significantly by location and plant species.');

-- RLS: anyone authenticated can read parameters; nobody can write from client
ALTER TABLE public.ecosystem_parameters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read ecosystem parameters"
  ON public.ecosystem_parameters FOR SELECT
  TO authenticated
  USING (TRUE);

-- --------------------------------------------------
-- TABLE 2: monitoring_reports
-- Core table — one row per field monitoring session.
-- --------------------------------------------------

CREATE TABLE public.monitoring_reports (
  id               UUID               NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id          UUID               NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status           public.report_status NOT NULL DEFAULT 'draft',
  -- Location
  latitude         NUMERIC(10,7),
  longitude        NUMERIC(10,7),
  location_source  public.location_source,
  gps_accuracy_m   NUMERIC(8,2),        -- actual accuracy from browser geolocation API
  -- Ecosystem
  ecosystem_type   public.ecosystem_type,
  area_hectares    NUMERIC(10,4),
  -- Notes
  notes            TEXT,
  -- Timestamps
  created_at       TIMESTAMPTZ        NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ        NOT NULL DEFAULT now()
);

CREATE INDEX monitoring_reports_user_id_idx    ON public.monitoring_reports (user_id);
CREATE INDEX monitoring_reports_status_idx     ON public.monitoring_reports (status);
CREATE INDEX monitoring_reports_created_at_idx ON public.monitoring_reports (created_at DESC);

-- Trigger: auto-update updated_at
CREATE TRIGGER update_monitoring_reports_updated_at
  BEFORE UPDATE ON public.monitoring_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS
ALTER TABLE public.monitoring_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports"
  ON public.monitoring_reports FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own reports"
  ON public.monitoring_reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own draft/submitted reports"
  ON public.monitoring_reports FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id AND status IN ('draft', 'submitted'))
  WITH CHECK (auth.uid() = user_id);

-- Users cannot delete reports once submitted (only drafts)
CREATE POLICY "Users can delete own draft reports"
  ON public.monitoring_reports FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id AND status = 'draft');

-- --------------------------------------------------
-- TABLE 3: report_images
-- Images uploaded for a monitoring report.
-- Actual file stored in Supabase Storage (monitoring-images bucket).
-- --------------------------------------------------

CREATE TABLE public.report_images (
  id               UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id        UUID         NOT NULL REFERENCES public.monitoring_reports(id) ON DELETE CASCADE,
  user_id          UUID         NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  storage_path     TEXT         NOT NULL,   -- path in Supabase Storage bucket
  file_name        TEXT         NOT NULL,
  file_size_bytes  BIGINT       NOT NULL,
  mime_type        TEXT         NOT NULL,
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX report_images_report_id_idx ON public.report_images (report_id);
CREATE INDEX report_images_user_id_idx   ON public.report_images (user_id);

-- RLS
ALTER TABLE public.report_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own report images"
  ON public.report_images FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own report images"
  ON public.report_images FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- No UPDATE or DELETE from client — images are immutable after upload

-- --------------------------------------------------
-- TABLE 4: ai_verifications
-- AI classification results from Gemini Vision.
-- CRITICAL SECURITY: No INSERT/UPDATE/DELETE from client.
-- Only service_role (Edge Function) can write to this table.
-- This prevents clients from fabricating verification results.
-- --------------------------------------------------

CREATE TABLE public.ai_verifications (
  id                            UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_id                      UUID         NOT NULL REFERENCES public.report_images(id) ON DELETE CASCADE,
  report_id                     UUID         NOT NULL REFERENCES public.monitoring_reports(id) ON DELETE CASCADE,
  is_valid_blue_carbon_ecosystem BOOLEAN      NOT NULL,
  ecosystem_type                TEXT         NOT NULL,  -- 'mangrove','seagrass','salt_marsh','invalid'
  detected_subject              TEXT         NOT NULL,
  confidence                    NUMERIC(5,2) NOT NULL,  -- 0.00 to 100.00
  reason                        TEXT         NOT NULL,
  raw_response                  JSONB,
  model_version                 TEXT         NOT NULL DEFAULT 'gemini-1.5-flash',
  created_at                    TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX ai_verifications_report_id_idx ON public.ai_verifications (report_id);
CREATE INDEX ai_verifications_image_id_idx  ON public.ai_verifications (image_id);

-- RLS: clients can only READ verifications for their own reports
-- WRITE is blocked for all client roles — only service_role (Edge Function) can write
ALTER TABLE public.ai_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view AI verifications for own reports"
  ON public.ai_verifications FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.monitoring_reports mr
      WHERE mr.id = ai_verifications.report_id
        AND mr.user_id = auth.uid()
    )
  );

-- NO INSERT/UPDATE/DELETE policy for authenticated role — only service_role bypasses RLS

-- --------------------------------------------------
-- TABLE 5: carbon_assessments
-- Deterministic, server-calculated carbon estimates.
-- CRITICAL SECURITY: No INSERT/UPDATE/DELETE from client.
-- Only service_role (Edge Function) can write results.
-- Carbon calculation only runs after AI verification passes.
-- Results are ESTIMATES — not verified scientific measurements.
-- --------------------------------------------------

CREATE TABLE public.carbon_assessments (
  id                       UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id                UUID         NOT NULL REFERENCES public.monitoring_reports(id) ON DELETE CASCADE,
  -- Inputs used in calculation
  ecosystem_type           public.ecosystem_type NOT NULL,
  area_hectares            NUMERIC(10,4) NOT NULL,
  biomass_density_t_per_ha NUMERIC(10,4) NOT NULL,
  carbon_fraction          NUMERIC(6,4)  NOT NULL,
  co2_conversion_factor    NUMERIC(6,4)  NOT NULL,
  -- Outputs
  estimated_co2e_tons      NUMERIC(12,4) NOT NULL,  -- the primary estimate
  potential_credits        NUMERIC(12,4) NOT NULL,  -- 80% of estimated (conservative buffer)
  estimated_value_usd      NUMERIC(12,2) NOT NULL,  -- indicative only, at $15/t CO2e
  -- Audit trail
  parameter_version        TEXT          NOT NULL DEFAULT 'v1',
  calculation_method       TEXT          NOT NULL DEFAULT 'versioned_parameter_model_v1',
  status                   TEXT          NOT NULL DEFAULT 'estimated',  -- estimated | verified
  -- Timestamp
  created_at               TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX carbon_assessments_report_id_idx ON public.carbon_assessments (report_id);

-- RLS: read-only for clients; write blocked (Edge Function uses service_role)
ALTER TABLE public.carbon_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view carbon assessments for own reports"
  ON public.carbon_assessments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.monitoring_reports mr
      WHERE mr.id = carbon_assessments.report_id
        AND mr.user_id = auth.uid()
    )
  );

-- NO INSERT/UPDATE/DELETE for authenticated role

-- --------------------------------------------------
-- TABLE 6: mrv_reviews
-- Human/authorised review of a monitoring report.
-- Normal users cannot approve their own reports.
-- --------------------------------------------------

CREATE TABLE public.mrv_reviews (
  id          UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id   UUID         NOT NULL REFERENCES public.monitoring_reports(id) ON DELETE CASCADE,
  reviewer_id UUID         REFERENCES public.profiles(id) ON DELETE SET NULL,
  status      TEXT         NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  notes       TEXT,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX mrv_reviews_report_id_idx ON public.mrv_reviews (report_id);
CREATE INDEX mrv_reviews_status_idx    ON public.mrv_reviews (status);

CREATE TRIGGER update_mrv_reviews_updated_at
  BEFORE UPDATE ON public.mrv_reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: report owners can view reviews of their own reports (read-only)
-- Only service_role / admin can write
ALTER TABLE public.mrv_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view MRV reviews for own reports"
  ON public.mrv_reviews FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.monitoring_reports mr
      WHERE mr.id = mrv_reviews.report_id
        AND mr.user_id = auth.uid()
    )
  );

-- --------------------------------------------------
-- TABLE 7: carbon_credits
-- Credit eligibility and issuance records.
-- Issued only after MRV review approval.
-- Blockchain integration is planned (not yet live).
-- --------------------------------------------------

CREATE TABLE public.carbon_credits (
  id                  UUID         NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  report_id           UUID         NOT NULL REFERENCES public.monitoring_reports(id) ON DELETE CASCADE,
  assessment_id       UUID         NOT NULL REFERENCES public.carbon_assessments(id) ON DELETE CASCADE,
  status              TEXT         NOT NULL DEFAULT 'eligible',  -- eligible | issued | revoked
  credit_amount       NUMERIC(12,4) NOT NULL,
  -- Prototype audit record (real blockchain tx planned in future)
  verification_hash   TEXT,           -- SHA-256 of (report_id + assessment_id + timestamp)
  blockchain_status   TEXT         NOT NULL DEFAULT 'prototype_audit_record',
  blockchain_tx_hash  TEXT,           -- NULL until real blockchain integration
  blockchain_network  TEXT,           -- NULL until real blockchain integration
  issued_at           TIMESTAMPTZ,
  created_at          TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX carbon_credits_report_id_idx ON public.carbon_credits (report_id);
CREATE INDEX carbon_credits_status_idx    ON public.carbon_credits (status);

-- RLS: owners can view their own credits (read-only from client)
ALTER TABLE public.carbon_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own carbon credits"
  ON public.carbon_credits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.monitoring_reports mr
      WHERE mr.id = carbon_credits.report_id
        AND mr.user_id = auth.uid()
    )
  );

-- Grant read access to authenticated role for all tables
GRANT SELECT ON public.ecosystem_parameters  TO authenticated;
GRANT SELECT, INSERT ON public.monitoring_reports TO authenticated;
GRANT SELECT, INSERT ON public.report_images     TO authenticated;
GRANT SELECT ON public.ai_verifications          TO authenticated;
GRANT SELECT ON public.carbon_assessments        TO authenticated;
GRANT SELECT ON public.mrv_reviews               TO authenticated;
GRANT SELECT ON public.carbon_credits            TO authenticated;

-- Grant full access to service_role (used by Edge Functions)
GRANT ALL ON public.ecosystem_parameters  TO service_role;
GRANT ALL ON public.monitoring_reports    TO service_role;
GRANT ALL ON public.report_images         TO service_role;
GRANT ALL ON public.ai_verifications      TO service_role;
GRANT ALL ON public.carbon_assessments    TO service_role;
GRANT ALL ON public.mrv_reviews           TO service_role;
GRANT ALL ON public.carbon_credits        TO service_role;

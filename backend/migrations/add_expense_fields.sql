-- Migration: Expand hr_operational_expenses table
-- Run this on the Render PostgreSQL DB via the shell or psql
-- Date: 2026-04-09

ALTER TABLE hr_operational_expenses
  ADD COLUMN IF NOT EXISTS subcategory VARCHAR(50),
  ADD COLUMN IF NOT EXISTS currency VARCHAR(5) DEFAULT 'CLP',
  ADD COLUMN IF NOT EXISTS amount_original FLOAT,
  ADD COLUMN IF NOT EXISTS iva_recuperable BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS retencion FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deductible_percent INTEGER DEFAULT 100,
  ADD COLUMN IF NOT EXISTS date VARCHAR(10),
  ADD COLUMN IF NOT EXISTS tx_type VARCHAR(20) DEFAULT 'egreso',
  ADD COLUMN IF NOT EXISTS payment_method VARCHAR(30),
  ADD COLUMN IF NOT EXISTS notes TEXT,
  ADD COLUMN IF NOT EXISTS attachment_name VARCHAR(255);

-- Widen existing columns that had narrow limits
ALTER TABLE hr_operational_expenses
  ALTER COLUMN category TYPE VARCHAR(50),
  ALTER COLUMN provider_rut TYPE VARCHAR(20);

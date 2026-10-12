-- =====================================================================
-- CrewLink Migration 00007: Multi-day Project Scheduling Support
-- Adds start_date, end_date to projects and date, daily_wage to shifts
-- =====================================================================

ALTER TABLE crewlink.projects
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE;

ALTER TABLE crewlink.shifts
  ADD COLUMN IF NOT EXISTS date DATE,
  ADD COLUMN IF NOT EXISTS daily_wage BIGINT;

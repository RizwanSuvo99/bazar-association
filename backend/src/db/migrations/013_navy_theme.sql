-- Add the "navy" accent theme (matches the member ID card palette).
ALTER TABLE site_settings DROP CONSTRAINT site_settings_active_theme_check;
ALTER TABLE site_settings ADD CONSTRAINT site_settings_active_theme_check
  CHECK (active_theme IN ('emerald', 'royal-blue', 'warm-amber', 'crimson', 'navy'));

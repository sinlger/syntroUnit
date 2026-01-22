CREATE TABLE IF NOT EXISTS conversion_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_unit TEXT NOT NULL,
  target_unit TEXT NOT NULL,
  source_value TEXT NOT NULL,
  target_value TEXT,
  unit_type TEXT,
  count INTEGER DEFAULT 1,
  last_updated INTEGER,
  UNIQUE(source_unit, target_unit, source_value)
);

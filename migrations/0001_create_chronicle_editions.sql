CREATE TABLE IF NOT EXISTS chronicle_editions (
  edition_date TEXT PRIMARY KEY,
  horizon_date TEXT NOT NULL,
  headline TEXT NOT NULL,
  lead TEXT NOT NULL,
  content_json TEXT NOT NULL,
  format_version INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_chronicle_editions_updated_at
  ON chronicle_editions (updated_at);

CREATE TABLE monitoring(
  id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  "timestamp" TIMESTAMPTZ NOT NULL,
  temperature INTEGER NOT NULL,
  "freeBytes" BIGINT NOT NULL,
  "usedBytes" BIGINT NOT NULL,
  "totalBytes" BIGINT NOT NULL,
  "cpuLoad" REAL[] NOT NULL
);
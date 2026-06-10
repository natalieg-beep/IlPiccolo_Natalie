-- Offene Verbindungen auf die betroffenen Tabellen killen
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE state = 'idle in transaction'
  AND query_start < now() - interval '30 seconds';

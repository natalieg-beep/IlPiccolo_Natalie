-- patch30b: RPC-Funktion für atomares Hochzählen von processed_files in scan_batches
-- Wird von der scan-batch Edge Function aufgerufen

CREATE OR REPLACE FUNCTION increment_batch_processed(batch_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE scan_batches
  SET processed_files = processed_files + 1
  WHERE id = batch_id;
$$;

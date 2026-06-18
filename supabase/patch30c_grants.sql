-- patch30c: Anon-Rolle darf scan_batches und receipt_items lesen/schreiben
-- (RLS ist deaktiviert, aber GRANT braucht man trotzdem)

GRANT ALL ON scan_batches  TO anon, authenticated;
GRANT ALL ON receipt_items TO anon, authenticated;

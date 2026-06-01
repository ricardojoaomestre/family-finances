ALTER TABLE "transaction" ALTER COLUMN "inserted_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "transaction" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
CREATE OR REPLACE FUNCTION transaction_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;--> statement-breakpoint
DROP TRIGGER IF EXISTS transaction_set_updated_at ON "transaction";--> statement-breakpoint
CREATE TRIGGER transaction_set_updated_at
BEFORE UPDATE ON "transaction"
FOR EACH ROW
EXECUTE PROCEDURE transaction_set_updated_at();

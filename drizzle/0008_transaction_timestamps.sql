ALTER TABLE "transaction" ADD COLUMN "inserted_at" timestamp DEFAULT now();--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "updated_at" timestamp DEFAULT now();

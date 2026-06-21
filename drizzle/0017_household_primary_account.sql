ALTER TABLE "household" ADD COLUMN "primaryAccountMerchant" text;--> statement-breakpoint
UPDATE "household" SET "primaryAccountMerchant" = 'bpi' WHERE "primaryAccountMerchant" IS NULL;

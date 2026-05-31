ALTER TABLE "import" ADD COLUMN "skippedCount" integer;--> statement-breakpoint
CREATE TABLE "import_skipped_row" (
	"id" text PRIMARY KEY NOT NULL,
	"importId" text NOT NULL,
	"rowIndex" integer NOT NULL,
	"date" timestamp,
	"description" text NOT NULL,
	"value" numeric(14, 2),
	"balance" numeric(14, 2),
	"reason" text NOT NULL,
	"errors" text
);
--> statement-breakpoint
ALTER TABLE "import_skipped_row" ADD CONSTRAINT "import_skipped_row_importId_import_id_fk" FOREIGN KEY ("importId") REFERENCES "public"."import"("id") ON DELETE cascade ON UPDATE no action;

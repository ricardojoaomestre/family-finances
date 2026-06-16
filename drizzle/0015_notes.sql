CREATE TABLE "note" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant" text NOT NULL,
	"date" timestamp NOT NULL,
	"value" numeric(14, 2) NOT NULL,
	"categoryId" text NOT NULL,
	"context" text,
	"archivedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "note" ADD CONSTRAINT "note_categoryId_category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE restrict ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "note_active_merchant_date_value_idx" ON "note" USING btree ("merchant","date","value") WHERE "archivedAt" IS NULL;

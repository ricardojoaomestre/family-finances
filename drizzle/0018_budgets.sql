CREATE TABLE "budget" (
	"id" text PRIMARY KEY NOT NULL,
	"householdId" text NOT NULL,
	"categoryId" text NOT NULL,
	"amount" numeric(14, 2) NOT NULL,
	"period" text DEFAULT 'monthly' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "budget" ADD CONSTRAINT "budget_householdId_household_id_fk" FOREIGN KEY ("householdId") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "budget" ADD CONSTRAINT "budget_categoryId_category_id_fk" FOREIGN KEY ("categoryId") REFERENCES "public"."category"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "budget_household_category_idx" ON "budget" USING btree ("householdId","categoryId");

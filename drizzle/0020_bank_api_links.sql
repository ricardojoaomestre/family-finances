CREATE TABLE IF NOT EXISTS "bank_connection" (
	"id" text PRIMARY KEY NOT NULL,
	"householdId" text NOT NULL,
	"providerId" text NOT NULL,
	"externalSessionId" text NOT NULL,
	"institutionId" text,
	"connectedByUserId" text,
	"accessValidUntil" timestamp,
	"status" text DEFAULT 'linked' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "bank_account_api_link" (
	"id" text PRIMARY KEY NOT NULL,
	"bankAccountId" text NOT NULL,
	"connectionId" text NOT NULL,
	"externalAccountId" text NOT NULL,
	"accountIban" text,
	"accountName" text,
	"linkedAt" timestamp DEFAULT now() NOT NULL,
	"lastSyncedAt" timestamp,
	"lastSyncStatus" text,
	"lastSyncError" text,
	"lastSyncImportId" text,
	"syncsTodayCount" integer DEFAULT 0 NOT NULL,
	"syncsTodayDate" text,
	"syncInProgressAt" timestamp
);
--> statement-breakpoint
ALTER TABLE "bank_connection" ADD CONSTRAINT "bank_connection_householdId_household_id_fk" FOREIGN KEY ("householdId") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "bank_connection" ADD CONSTRAINT "bank_connection_connectedByUserId_user_id_fk" FOREIGN KEY ("connectedByUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "bank_account_api_link" ADD CONSTRAINT "bank_account_api_link_bankAccountId_bank_account_id_fk" FOREIGN KEY ("bankAccountId") REFERENCES "public"."bank_account"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "bank_account_api_link" ADD CONSTRAINT "bank_account_api_link_connectionId_bank_connection_id_fk" FOREIGN KEY ("connectionId") REFERENCES "public"."bank_connection"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "bank_account_api_link_bank_account_unique" ON "bank_account_api_link" ("bankAccountId");
--> statement-breakpoint
ALTER TABLE "import" ADD COLUMN IF NOT EXISTS "source" text DEFAULT 'file' NOT NULL;
--> statement-breakpoint
ALTER TABLE "import" ADD COLUMN IF NOT EXISTS "periodFrom" text;
--> statement-breakpoint
ALTER TABLE "import" ADD COLUMN IF NOT EXISTS "periodTo" text;
--> statement-breakpoint
ALTER TABLE "import" ALTER COLUMN "filename" DROP NOT NULL;

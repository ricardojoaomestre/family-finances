CREATE TABLE "household" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "household_member" (
	"householdId" text NOT NULL,
	"userId" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "household_member_householdId_userId_pk" PRIMARY KEY("householdId","userId")
);
--> statement-breakpoint
CREATE TABLE "household_invite" (
	"id" text PRIMARY KEY NOT NULL,
	"householdId" text NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"token" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"invitedByUserId" text,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"expiresAt" timestamp,
	CONSTRAINT "household_invite_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "household_member" ADD CONSTRAINT "household_member_householdId_household_id_fk" FOREIGN KEY ("householdId") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_member" ADD CONSTRAINT "household_member_userId_user_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_invite" ADD CONSTRAINT "household_invite_householdId_household_id_fk" FOREIGN KEY ("householdId") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "household_invite" ADD CONSTRAINT "household_invite_invitedByUserId_user_id_fk" FOREIGN KEY ("invitedByUserId") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "household_invite_pending_email_idx" ON "household_invite" USING btree ("householdId","email") WHERE "status" = 'pending';--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "activeHouseholdId" text;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_activeHouseholdId_household_id_fk" FOREIGN KEY ("activeHouseholdId") REFERENCES "public"."household"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category" ADD COLUMN "householdId" text;--> statement-breakpoint
ALTER TABLE "category_import_snapshot" ADD COLUMN "householdId" text;--> statement-breakpoint
ALTER TABLE "import" ADD COLUMN "householdId" text;--> statement-breakpoint
ALTER TABLE "note" ADD COLUMN "householdId" text;--> statement-breakpoint
ALTER TABLE "report" ADD COLUMN "householdId" text;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "householdId" text;--> statement-breakpoint
DO $$
DECLARE
	legacy_household_id text;
	has_financial_data boolean;
BEGIN
	has_financial_data := EXISTS (SELECT 1 FROM "category" LIMIT 1)
		OR EXISTS (SELECT 1 FROM "category_import_snapshot" LIMIT 1)
		OR EXISTS (SELECT 1 FROM "import" LIMIT 1)
		OR EXISTS (SELECT 1 FROM "note" LIMIT 1)
		OR EXISTS (SELECT 1 FROM "report" LIMIT 1)
		OR EXISTS (SELECT 1 FROM "transaction" LIMIT 1);

	IF NOT has_financial_data THEN
		RETURN;
	END IF;

	SELECT id INTO legacy_household_id FROM "household" LIMIT 1;

	IF legacy_household_id IS NULL THEN
		legacy_household_id := gen_random_uuid()::text;
		INSERT INTO "household" ("id", "name", "createdAt", "updatedAt")
		VALUES (legacy_household_id, 'Household', now(), now());
	END IF;

	UPDATE "category" SET "householdId" = legacy_household_id WHERE "householdId" IS NULL;
	UPDATE "category_import_snapshot" SET "householdId" = legacy_household_id WHERE "householdId" IS NULL;
	UPDATE "import" SET "householdId" = legacy_household_id WHERE "householdId" IS NULL;
	UPDATE "note" SET "householdId" = legacy_household_id WHERE "householdId" IS NULL;
	UPDATE "report" SET "householdId" = legacy_household_id WHERE "householdId" IS NULL;
	UPDATE "transaction" SET "householdId" = legacy_household_id WHERE "householdId" IS NULL;

	INSERT INTO "household_member" ("householdId", "userId", "role", "createdAt")
	SELECT legacy_household_id, u.id, 'owner', now()
	FROM "user" u
	WHERE NOT EXISTS (
		SELECT 1
		FROM "household_member" hm
		WHERE hm."householdId" = legacy_household_id
			AND hm."userId" = u.id
	);

	UPDATE "user"
	SET "activeHouseholdId" = legacy_household_id
	WHERE "activeHouseholdId" IS NULL;
END $$;--> statement-breakpoint
ALTER TABLE "category" ALTER COLUMN "householdId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "category" ADD CONSTRAINT "category_householdId_household_id_fk" FOREIGN KEY ("householdId") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "category" DROP CONSTRAINT "category_name_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "category_household_name_idx" ON "category" USING btree ("householdId","name");--> statement-breakpoint
ALTER TABLE "category_import_snapshot" ALTER COLUMN "householdId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "category_import_snapshot" ADD CONSTRAINT "category_import_snapshot_householdId_unique" UNIQUE("householdId");--> statement-breakpoint
ALTER TABLE "category_import_snapshot" ADD CONSTRAINT "category_import_snapshot_householdId_household_id_fk" FOREIGN KEY ("householdId") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import" ALTER COLUMN "householdId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "import" ADD CONSTRAINT "import_householdId_household_id_fk" FOREIGN KEY ("householdId") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note" ALTER COLUMN "householdId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "note" ADD CONSTRAINT "note_householdId_household_id_fk" FOREIGN KEY ("householdId") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
DROP INDEX "note_active_merchant_date_value_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "note_active_merchant_date_value_idx" ON "note" USING btree ("householdId","merchant","date","value") WHERE "archivedAt" IS NULL;--> statement-breakpoint
ALTER TABLE "report" ALTER COLUMN "householdId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "report" ADD CONSTRAINT "report_householdId_household_id_fk" FOREIGN KEY ("householdId") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ALTER COLUMN "householdId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_householdId_household_id_fk" FOREIGN KEY ("householdId") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;

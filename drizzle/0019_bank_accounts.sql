CREATE TABLE "bank_account" (
	"id" text PRIMARY KEY NOT NULL,
	"householdId" text NOT NULL,
	"slug" text NOT NULL,
	"label" text NOT NULL,
	"importProfile" jsonb NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bank_account" ADD CONSTRAINT "bank_account_householdId_household_id_fk" FOREIGN KEY ("householdId") REFERENCES "public"."household"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bank_account_household_slug_idx" ON "bank_account" USING btree ("householdId","slug");--> statement-breakpoint
ALTER TABLE "household" ADD COLUMN "primaryBankAccountId" text;--> statement-breakpoint
ALTER TABLE "import" ADD COLUMN "bankAccountId" text;--> statement-breakpoint
ALTER TABLE "note" ADD COLUMN "bankAccountId" text;--> statement-breakpoint
ALTER TABLE "transaction" ADD COLUMN "bankAccountId" text;--> statement-breakpoint
INSERT INTO "bank_account" ("id", "householdId", "slug", "label", "importProfile", "createdAt", "updatedAt")
SELECT
	gen_random_uuid()::text,
	accounts."householdId",
	accounts.slug,
	CASE accounts.slug
		WHEN 'activo-credito-ricardo' THEN 'Activo Bank - crédito - Ricardo'
		WHEN 'activo-debito-joana' THEN 'Activo Bank - débito - Joana'
		WHEN 'activo-debito-ricardo' THEN 'Activo Bank - débito - Ricardo'
		WHEN 'bpi' THEN 'BPI'
		WHEN 'coverflex' THEN 'Coverflex'
		WHEN 'santander-credito' THEN 'Santander - crédito'
		WHEN 'santander-debito' THEN 'Santander - débito'
		WHEN 'santander-refeicao' THEN 'Santander - cartão refeição'
		WHEN 'ticket' THEN 'Ticket'
		ELSE accounts.slug
	END,
	'{"dateColumns":["date","data","data mov.","data mov","data valor","data movimento","dt. operação","dt operação"],"descriptionColumns":["description","descrição","descricao","movimento","detalhe","detalhes","descritivo"],"valueColumns":["value","valor","montante","importe","amount"],"debitColumns":["débito","debito","debit"],"creditColumns":["crédito","credito","credit"],"balanceColumns":["balance","saldo"],"dateFormat":"auto","signRule":"as-is"}'::jsonb,
	now(),
	now()
FROM (
	SELECT DISTINCT "householdId", merchant AS slug
	FROM (
		SELECT "householdId", merchant FROM "transaction"
		UNION
		SELECT "householdId", merchant FROM "note"
		UNION
		SELECT "householdId", merchant FROM "import"
	) AS combined
) AS accounts;
--> statement-breakpoint
UPDATE "transaction" AS t
SET "bankAccountId" = ba.id
FROM "bank_account" AS ba
WHERE t."householdId" = ba."householdId"
	AND t.merchant = ba.slug;--> statement-breakpoint
UPDATE "note" AS n
SET "bankAccountId" = ba.id
FROM "bank_account" AS ba
WHERE n."householdId" = ba."householdId"
	AND n.merchant = ba.slug;--> statement-breakpoint
UPDATE "import" AS i
SET "bankAccountId" = ba.id
FROM "bank_account" AS ba
WHERE i."householdId" = ba."householdId"
	AND i.merchant = ba.slug;--> statement-breakpoint
UPDATE "household" AS h
SET "primaryBankAccountId" = ba.id
FROM "bank_account" AS ba
WHERE h.id = ba."householdId"
	AND ba.slug = COALESCE(h."primaryAccountMerchant", 'bpi');--> statement-breakpoint
ALTER TABLE "transaction" ALTER COLUMN "bankAccountId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "note" ALTER COLUMN "bankAccountId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "import" ALTER COLUMN "bankAccountId" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "transaction" DROP COLUMN "merchant";--> statement-breakpoint
ALTER TABLE "note" DROP COLUMN "merchant";--> statement-breakpoint
ALTER TABLE "import" DROP COLUMN "merchant";--> statement-breakpoint
ALTER TABLE "household" DROP COLUMN "primaryAccountMerchant";--> statement-breakpoint
DROP INDEX IF EXISTS "note_active_merchant_date_value_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "note_active_bank_account_date_value_idx" ON "note" USING btree ("householdId","bankAccountId","date","value") WHERE "archivedAt" is null;--> statement-breakpoint
ALTER TABLE "household" ADD CONSTRAINT "household_primaryBankAccountId_bank_account_id_fk" FOREIGN KEY ("primaryBankAccountId") REFERENCES "public"."bank_account"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "import" ADD CONSTRAINT "import_bankAccountId_bank_account_id_fk" FOREIGN KEY ("bankAccountId") REFERENCES "public"."bank_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "note" ADD CONSTRAINT "note_bankAccountId_bank_account_id_fk" FOREIGN KEY ("bankAccountId") REFERENCES "public"."bank_account"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_bankAccountId_bank_account_id_fk" FOREIGN KEY ("bankAccountId") REFERENCES "public"."bank_account"("id") ON DELETE restrict ON UPDATE no action;

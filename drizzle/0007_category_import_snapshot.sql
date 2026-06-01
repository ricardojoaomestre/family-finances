CREATE TABLE "category_import_snapshot" (
	"id" text PRIMARY KEY NOT NULL,
	"payload" jsonb NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);

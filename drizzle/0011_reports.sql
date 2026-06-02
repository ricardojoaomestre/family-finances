CREATE TABLE "report" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"dateFrom" text NOT NULL,
	"dateTo" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);

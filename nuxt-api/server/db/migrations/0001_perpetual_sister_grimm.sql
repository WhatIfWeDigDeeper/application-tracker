CREATE TABLE "vue_nuxt"."application_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"application_id" uuid NOT NULL,
	"sequence" integer NOT NULL,
	"description" varchar(500) NOT NULL,
	"changes" jsonb NOT NULL,
	"patches" jsonb NOT NULL,
	"inverse_patches" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "application_events_application_id_sequence_unique" UNIQUE("application_id","sequence")
);
--> statement-breakpoint
CREATE TABLE "vue_nuxt"."application_snapshots" (
	"id" uuid PRIMARY KEY NOT NULL,
	"application_id" uuid NOT NULL,
	"at_sequence" integer NOT NULL,
	"state" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "application_snapshots_application_id_at_sequence_unique" UNIQUE("application_id","at_sequence")
);
--> statement-breakpoint
ALTER TABLE "vue_nuxt"."application_events" ADD CONSTRAINT "application_events_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "vue_nuxt"."applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vue_nuxt"."application_snapshots" ADD CONSTRAINT "application_snapshots_application_id_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "vue_nuxt"."applications"("id") ON DELETE cascade ON UPDATE no action;
CREATE TABLE "combat_reports" (
	"id" text PRIMARY KEY NOT NULL,
	"attacker_id" text NOT NULL,
	"defender_id" text,
	"timestamp" timestamp NOT NULL,
	"outcome" text NOT NULL,
	"log" jsonb NOT NULL,
	"loot" jsonb
);
--> statement-breakpoint
ALTER TABLE "combat_reports" ADD CONSTRAINT "combat_reports_attacker_id_user_id_fk" FOREIGN KEY ("attacker_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "combat_reports" ADD CONSTRAINT "combat_reports_defender_id_user_id_fk" FOREIGN KEY ("defender_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
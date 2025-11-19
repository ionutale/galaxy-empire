CREATE TABLE "build_queue" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"ship_template_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"started_at" timestamp NOT NULL,
	"eta" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "missions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"ship_template_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"started_at" timestamp NOT NULL,
	"eta" timestamp NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_buildings" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"building_id" text NOT NULL,
	"level" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_research" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"tech_id" text NOT NULL,
	"level" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_ships" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"ship_template_id" text NOT NULL,
	"quantity" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_state" (
	"user_id" text PRIMARY KEY NOT NULL,
	"level" integer DEFAULT 1 NOT NULL,
	"power" integer DEFAULT 10 NOT NULL,
	"credits" integer DEFAULT 1000 NOT NULL,
	"metal" integer DEFAULT 500 NOT NULL,
	"crystal" integer DEFAULT 200 NOT NULL,
	"fuel" integer DEFAULT 100 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "processed_builds" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"ship_template_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"processed_at" timestamp NOT NULL,
	"rolled_back" integer DEFAULT 0 NOT NULL,
	"rolled_back_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "processed_missions" (
	"id" text PRIMARY KEY NOT NULL,
	"mission_id" text NOT NULL,
	"user_id" text NOT NULL,
	"ship_template_id" text NOT NULL,
	"quantity" integer NOT NULL,
	"quantity_lost" integer DEFAULT 0 NOT NULL,
	"outcome" text NOT NULL,
	"reward_credits" integer DEFAULT 0 NOT NULL,
	"reward_metal" integer DEFAULT 0 NOT NULL,
	"reward_crystal" integer DEFAULT 0 NOT NULL,
	"completed_at" timestamp NOT NULL,
	"rolled_back" integer DEFAULT 0 NOT NULL,
	"rolled_back_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ship_template" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"role" text NOT NULL,
	"build_time" integer NOT NULL,
	"cost_credits" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"age" integer,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	CONSTRAINT "user_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "build_queue" ADD CONSTRAINT "build_queue_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "build_queue" ADD CONSTRAINT "build_queue_ship_template_id_ship_template_id_fk" FOREIGN KEY ("ship_template_id") REFERENCES "public"."ship_template"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "missions" ADD CONSTRAINT "missions_ship_template_id_ship_template_id_fk" FOREIGN KEY ("ship_template_id") REFERENCES "public"."ship_template"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_buildings" ADD CONSTRAINT "player_buildings_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_research" ADD CONSTRAINT "player_research_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_ships" ADD CONSTRAINT "player_ships_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_ships" ADD CONSTRAINT "player_ships_ship_template_id_ship_template_id_fk" FOREIGN KEY ("ship_template_id") REFERENCES "public"."ship_template"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_state" ADD CONSTRAINT "player_state_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processed_builds" ADD CONSTRAINT "processed_builds_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processed_builds" ADD CONSTRAINT "processed_builds_ship_template_id_ship_template_id_fk" FOREIGN KEY ("ship_template_id") REFERENCES "public"."ship_template"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processed_missions" ADD CONSTRAINT "processed_missions_mission_id_missions_id_fk" FOREIGN KEY ("mission_id") REFERENCES "public"."missions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processed_missions" ADD CONSTRAINT "processed_missions_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processed_missions" ADD CONSTRAINT "processed_missions_ship_template_id_ship_template_id_fk" FOREIGN KEY ("ship_template_id") REFERENCES "public"."ship_template"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
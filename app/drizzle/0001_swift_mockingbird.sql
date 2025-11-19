ALTER TABLE "build_queue" ALTER COLUMN "ship_template_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "build_queue" ALTER COLUMN "quantity" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "build_queue" ADD COLUMN "type" text DEFAULT 'ship' NOT NULL;--> statement-breakpoint
ALTER TABLE "build_queue" ADD COLUMN "building_id" text;--> statement-breakpoint
ALTER TABLE "build_queue" ADD COLUMN "tech_id" text;--> statement-breakpoint
ALTER TABLE "build_queue" ADD COLUMN "total_duration" integer DEFAULT 0 NOT NULL;
DROP INDEX "projects_user_id_created_at_idx";--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "sort_order" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
CREATE INDEX "projects_user_id_sort_order_idx" ON "projects" USING btree ("user_id","sort_order");
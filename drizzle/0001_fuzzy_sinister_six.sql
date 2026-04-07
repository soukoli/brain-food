CREATE INDEX "ideas_user_id_created_at_idx" ON "ideas" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "ideas_project_id_idx" ON "ideas" USING btree ("project_id");--> statement-breakpoint
CREATE INDEX "ideas_user_id_status_idx" ON "ideas" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "ideas_scheduled_for_today_idx" ON "ideas" USING btree ("scheduled_for_today");--> statement-breakpoint
CREATE INDEX "projects_user_id_created_at_idx" ON "projects" USING btree ("user_id","created_at");
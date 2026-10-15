CREATE TABLE "c_analytics" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_blueprint" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_bookings" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_branding" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_cards" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_checkpoints" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_emails" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_enrollments" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_events" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_faqs" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_forms" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_free_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_free_tool" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_free_tool_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_goals" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_habit_checks" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_habits" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_journey_stages" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_lead_sources" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_leads" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_lessons" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_letters" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_notes" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_outbox" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_pages" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_pipeline_stages" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_plans" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_products" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_purchases" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_quiz" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_settings" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_stages" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_submissions" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_toolkits" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_users" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_wheel_areas" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_wheel_scores" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "c_work" (
	"id" text PRIMARY KEY NOT NULL,
	"sort" integer DEFAULT 0 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"owner_id" text,
	"data" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"user_agent" text
);
--> statement-breakpoint
CREATE INDEX "c_analytics_owner_idx" ON "c_analytics" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_analytics_sort_idx" ON "c_analytics" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_analytics_data_gin" ON "c_analytics" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_blueprint_owner_idx" ON "c_blueprint" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_blueprint_sort_idx" ON "c_blueprint" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_blueprint_data_gin" ON "c_blueprint" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_bookings_owner_idx" ON "c_bookings" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_bookings_sort_idx" ON "c_bookings" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_bookings_data_gin" ON "c_bookings" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_branding_owner_idx" ON "c_branding" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_branding_sort_idx" ON "c_branding" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_branding_data_gin" ON "c_branding" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_cards_owner_idx" ON "c_cards" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_cards_sort_idx" ON "c_cards" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_cards_data_gin" ON "c_cards" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_checkpoints_owner_idx" ON "c_checkpoints" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_checkpoints_sort_idx" ON "c_checkpoints" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_checkpoints_data_gin" ON "c_checkpoints" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_emails_owner_idx" ON "c_emails" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_emails_sort_idx" ON "c_emails" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_emails_data_gin" ON "c_emails" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_enrollments_owner_idx" ON "c_enrollments" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_enrollments_sort_idx" ON "c_enrollments" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_enrollments_data_gin" ON "c_enrollments" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_events_owner_idx" ON "c_events" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_events_sort_idx" ON "c_events" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_events_data_gin" ON "c_events" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_faqs_owner_idx" ON "c_faqs" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_faqs_sort_idx" ON "c_faqs" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_faqs_data_gin" ON "c_faqs" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_forms_owner_idx" ON "c_forms" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_forms_sort_idx" ON "c_forms" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_forms_data_gin" ON "c_forms" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_free_questions_owner_idx" ON "c_free_questions" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_free_questions_sort_idx" ON "c_free_questions" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_free_questions_data_gin" ON "c_free_questions" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_free_tool_owner_idx" ON "c_free_tool" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_free_tool_sort_idx" ON "c_free_tool" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_free_tool_data_gin" ON "c_free_tool" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_free_tool_submissions_owner_idx" ON "c_free_tool_submissions" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_free_tool_submissions_sort_idx" ON "c_free_tool_submissions" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_free_tool_submissions_data_gin" ON "c_free_tool_submissions" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_goals_owner_idx" ON "c_goals" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_goals_sort_idx" ON "c_goals" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_goals_data_gin" ON "c_goals" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_habit_checks_owner_idx" ON "c_habit_checks" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_habit_checks_sort_idx" ON "c_habit_checks" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_habit_checks_data_gin" ON "c_habit_checks" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_habits_owner_idx" ON "c_habits" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_habits_sort_idx" ON "c_habits" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_habits_data_gin" ON "c_habits" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_journey_stages_owner_idx" ON "c_journey_stages" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_journey_stages_sort_idx" ON "c_journey_stages" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_journey_stages_data_gin" ON "c_journey_stages" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_lead_sources_owner_idx" ON "c_lead_sources" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_lead_sources_sort_idx" ON "c_lead_sources" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_lead_sources_data_gin" ON "c_lead_sources" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_leads_owner_idx" ON "c_leads" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_leads_sort_idx" ON "c_leads" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_leads_data_gin" ON "c_leads" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_lessons_owner_idx" ON "c_lessons" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_lessons_sort_idx" ON "c_lessons" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_lessons_data_gin" ON "c_lessons" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_letters_owner_idx" ON "c_letters" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_letters_sort_idx" ON "c_letters" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_letters_data_gin" ON "c_letters" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_notes_owner_idx" ON "c_notes" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_notes_sort_idx" ON "c_notes" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_notes_data_gin" ON "c_notes" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_outbox_owner_idx" ON "c_outbox" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_outbox_sort_idx" ON "c_outbox" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_outbox_data_gin" ON "c_outbox" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_pages_owner_idx" ON "c_pages" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_pages_sort_idx" ON "c_pages" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_pages_data_gin" ON "c_pages" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_pipeline_stages_owner_idx" ON "c_pipeline_stages" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_pipeline_stages_sort_idx" ON "c_pipeline_stages" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_pipeline_stages_data_gin" ON "c_pipeline_stages" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_plans_owner_idx" ON "c_plans" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_plans_sort_idx" ON "c_plans" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_plans_data_gin" ON "c_plans" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_products_owner_idx" ON "c_products" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_products_sort_idx" ON "c_products" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_products_data_gin" ON "c_products" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_purchases_owner_idx" ON "c_purchases" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_purchases_sort_idx" ON "c_purchases" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_purchases_data_gin" ON "c_purchases" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_quiz_owner_idx" ON "c_quiz" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_quiz_sort_idx" ON "c_quiz" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_quiz_data_gin" ON "c_quiz" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_settings_owner_idx" ON "c_settings" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_settings_sort_idx" ON "c_settings" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_settings_data_gin" ON "c_settings" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_stages_owner_idx" ON "c_stages" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_stages_sort_idx" ON "c_stages" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_stages_data_gin" ON "c_stages" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_submissions_owner_idx" ON "c_submissions" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_submissions_sort_idx" ON "c_submissions" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_submissions_data_gin" ON "c_submissions" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_toolkits_owner_idx" ON "c_toolkits" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_toolkits_sort_idx" ON "c_toolkits" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_toolkits_data_gin" ON "c_toolkits" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_users_owner_idx" ON "c_users" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_users_sort_idx" ON "c_users" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_users_data_gin" ON "c_users" USING gin ("data");--> statement-breakpoint
CREATE UNIQUE INDEX "c_users_email_uq" ON "c_users" USING btree (lower("data" ->> 'email'));--> statement-breakpoint
CREATE INDEX "c_wheel_areas_owner_idx" ON "c_wheel_areas" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_wheel_areas_sort_idx" ON "c_wheel_areas" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_wheel_areas_data_gin" ON "c_wheel_areas" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_wheel_scores_owner_idx" ON "c_wheel_scores" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_wheel_scores_sort_idx" ON "c_wheel_scores" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_wheel_scores_data_gin" ON "c_wheel_scores" USING gin ("data");--> statement-breakpoint
CREATE INDEX "c_work_owner_idx" ON "c_work" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "c_work_sort_idx" ON "c_work" USING btree ("sort","created_at");--> statement-breakpoint
CREATE INDEX "c_work_data_gin" ON "c_work" USING gin ("data");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_idx" ON "sessions" USING btree ("expires_at");
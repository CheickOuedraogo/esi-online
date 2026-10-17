ALTER TABLE "users" DROP CONSTRAINT IF EXISTS "users_program_id_programs_id_fk";--> statement-breakpoint
ALTER TABLE "documents" DROP CONSTRAINT IF EXISTS "documents_subject_id_subjects_id_fk";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN IF EXISTS "search_vector";--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "subject" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "level_id" uuid;--> statement-breakpoint
UPDATE "documents" d SET "subject" = s."name", "level_id" = s."level_id" FROM "subjects" s WHERE d."subject_id" = s."id";--> statement-breakpoint
UPDATE "documents" SET "subject" = 'Non précisée' WHERE "subject" IS NULL;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "subject" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "search_vector" "tsvector" GENERATED ALWAYS AS (to_tsvector('french', coalesce("title", '') || ' ' || coalesce("description", '') || ' ' || coalesce("subject", ''))) STORED;--> statement-breakpoint
DROP INDEX IF EXISTS "documents_subject_id_idx";--> statement-breakpoint
ALTER TABLE "documents" DROP COLUMN IF EXISTS "subject_id";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN IF EXISTS "program_id";--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "documents" ADD CONSTRAINT "documents_level_id_levels_id_fk" FOREIGN KEY ("level_id") REFERENCES "public"."levels"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "documents_level_id_idx" ON "documents" USING btree ("level_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "documents_title_trgm_idx" ON "documents" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "documents_subject_trgm_idx" ON "documents" USING gin ("subject" gin_trgm_ops);--> statement-breakpoint
ALTER TABLE "programs" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "subjects" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "programs" CASCADE;--> statement-breakpoint
DROP TABLE "subjects" CASCADE;

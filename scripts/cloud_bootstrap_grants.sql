-- Dev/test only: movebooks-ai / movebooks-beta-pg / movebooks.
-- Executed by the existing operator through Cloud SQL import, not by runtime.
-- No passwords, role membership, database ownership or cloudsqlsuperuser grant.
BEGIN;
GRANT CONNECT ON DATABASE movebooks
  TO "movebooks-beta-schema@movebooks-ai.iam", "movebooks-beta-api@movebooks-ai.iam";
GRANT USAGE ON SCHEMA public
  TO "movebooks-beta-schema@movebooks-ai.iam", "movebooks-beta-api@movebooks-ai.iam";
GRANT CREATE ON SCHEMA public TO "movebooks-beta-schema@movebooks-ai.iam";
COMMIT;

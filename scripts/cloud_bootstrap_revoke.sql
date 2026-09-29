-- Run only after successful schema initialization and table-only runtime grants.
-- Removes the explicit bootstrap grants; the schema account is also disabled in IAM.
BEGIN;
REVOKE CREATE, USAGE ON SCHEMA public FROM "movebooks-beta-schema@movebooks-ai.iam";
REVOKE CONNECT ON DATABASE movebooks FROM "movebooks-beta-schema@movebooks-ai.iam";
COMMIT;

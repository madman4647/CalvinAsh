-- Up Migration

-- The app connects as a restricted role; migrations run as the owner. No
-- password is set here - scripts/db/setup-app-role.js sets it from the
-- APP_DB_PASSWORD env var, so no secret lives in a committed migration.
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'calvin_app') THEN
    CREATE ROLE calvin_app NOLOGIN;
  END IF;
END
$$;

DO $$
BEGIN
  EXECUTE format('GRANT CONNECT ON DATABASE %I TO calvin_app', current_database());
END
$$;

GRANT USAGE ON SCHEMA public TO calvin_app;

-- Future tables/sequences (Loop 2 onward) inherit these grants automatically,
-- so nobody has to remember to re-grant on every new migration.
ALTER DEFAULT PRIVILEGES FOR ROLE CURRENT_USER IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO calvin_app;
ALTER DEFAULT PRIVILEGES FOR ROLE CURRENT_USER IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO calvin_app;

-- Existing tables from earlier migrations need the grant applied directly -
-- ALTER DEFAULT PRIVILEGES only covers objects created after this point.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO calvin_app;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO calvin_app;

-- The one deliberate restriction this loop adds: the app role can add audit
-- rows and read them, but can never alter or erase one. Loop 5 does the same
-- for marks.
REVOKE UPDATE, DELETE ON audit_log FROM calvin_app;

-- Down Migration

GRANT UPDATE, DELETE ON audit_log TO calvin_app;
REVOKE SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM calvin_app;
REVOKE USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public FROM calvin_app;
ALTER DEFAULT PRIVILEGES FOR ROLE CURRENT_USER IN SCHEMA public
  REVOKE USAGE, SELECT ON SEQUENCES FROM calvin_app;
ALTER DEFAULT PRIVILEGES FOR ROLE CURRENT_USER IN SCHEMA public
  REVOKE SELECT, INSERT, UPDATE, DELETE ON TABLES FROM calvin_app;
REVOKE USAGE ON SCHEMA public FROM calvin_app;
DO $$
BEGIN
  EXECUTE format('REVOKE CONNECT ON DATABASE %I FROM calvin_app', current_database());
END
$$;
DROP ROLE IF EXISTS calvin_app;

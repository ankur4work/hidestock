-- Add columns required by @shopify/shopify-app-session-storage-prisma v9 (expiring offline tokens)
ALTER TABLE "Session" ADD COLUMN "refreshToken" TEXT;
ALTER TABLE "Session" ADD COLUMN "refreshTokenExpires" TIMESTAMP(3);

-- Purge existing sessions: their stored offline tokens are NON-expiring and are now rejected
-- by Shopify's Admin API. Clearing them forces a fresh token exchange (expiring=1) on next load.
DELETE FROM "Session";

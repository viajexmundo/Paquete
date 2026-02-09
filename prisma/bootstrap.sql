PRAGMA foreign_keys = OFF;

DROP TABLE IF EXISTS "PackageMedia";
DROP TABLE IF EXISTS "Package";
DROP TABLE IF EXISTS "User";

PRAGMA foreign_keys = ON;

CREATE TABLE "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "fullName" TEXT,
  "passwordHash" TEXT NOT NULL,
  "role" TEXT NOT NULL DEFAULT 'EDITOR',
  "isActive" BOOLEAN NOT NULL DEFAULT 1,
  "canManagePackages" BOOLEAN NOT NULL DEFAULT 1,
  "canManageCsv" BOOLEAN NOT NULL DEFAULT 0,
  "canManageUsers" BOOLEAN NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

CREATE TABLE "Package" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "packageCode" TEXT NOT NULL UNIQUE,
  "slug" TEXT NOT NULL UNIQUE,
  "name" TEXT NOT NULL,
  "destination" TEXT NOT NULL,
  "durationDays" INTEGER NOT NULL,
  "basePrice" INTEGER NOT NULL,
  "offerPrice" INTEGER,
  "isOffer" BOOLEAN NOT NULL DEFAULT 0,
  "offerLabel" TEXT,
  "currency" TEXT NOT NULL DEFAULT 'GTQ',
  "summary" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "coverImageUrl" TEXT NOT NULL,
  "gallery" JSONB NOT NULL,
  "includes" JSONB NOT NULL,
  "excludes" JSONB NOT NULL,
  "itinerary" JSONB NOT NULL,
  "whatsappPrefillTemplate" TEXT,
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "createdById" TEXT,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL,
  CONSTRAINT "Package_createdById_fkey"
    FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "PackageMedia" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "packageId" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "altText" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PackageMedia_packageId_fkey"
    FOREIGN KEY ("packageId") REFERENCES "Package" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "PackageMedia_packageId_sortOrder_idx" ON "PackageMedia"("packageId", "sortOrder");

ALTER TABLE "Product" ADD COLUMN "details" TEXT, ADD COLUMN "importKey" TEXT, ADD COLUMN "deletedAt" TIMESTAMP(3);
CREATE UNIQUE INDEX "Product_importKey_key" ON "Product"("importKey");
ALTER TABLE "Variant" ADD COLUMN "availabilityConfirmed" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Variant" ADD CONSTRAINT "Variant_confirmed_available" CHECK (NOT "available" OR "availabilityConfirmed");
ALTER TABLE "Photo" ADD COLUMN "color" TEXT;
CREATE TYPE "CatalogEventType" AS ENUM ('PRODUCT_VIEW', 'SIZE_SELECT', 'COLOR_SELECT', 'WHATSAPP_CLICK');
CREATE TABLE "CatalogEvent" (
 "id" TEXT PRIMARY KEY, "type" "CatalogEventType" NOT NULL, "productId" TEXT NOT NULL,
 "size" INTEGER, "color" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
 CONSTRAINT "CatalogEvent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "CatalogEvent_createdAt_type_idx" ON "CatalogEvent"("createdAt", "type");
CREATE INDEX "CatalogEvent_productId_createdAt_idx" ON "CatalogEvent"("productId", "createdAt");
CREATE TABLE "EventGate" ("key" TEXT PRIMARY KEY, "count" INTEGER NOT NULL DEFAULT 1, "expiresAt" TIMESTAMP(3) NOT NULL);
CREATE INDEX "EventGate_expiresAt_idx" ON "EventGate"("expiresAt");

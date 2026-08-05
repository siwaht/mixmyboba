-- AlterTable: record sales tax and whether cancellation already returned stock
ALTER TABLE "Order" ADD COLUMN "tax" REAL NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN "stockRestored" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: keep the selected variant and purchase option on the line item so
-- the charged price can be reconciled against the catalogue after the fact
ALTER TABLE "OrderItem" ADD COLUMN "basePrice" REAL NOT NULL DEFAULT 0;
ALTER TABLE "OrderItem" ADD COLUMN "variantId" TEXT;
ALTER TABLE "OrderItem" ADD COLUMN "purchaseType" TEXT NOT NULL DEFAULT 'onetime';

-- Existing rows predate the promotion, so the charged price was the catalogue price
UPDATE "OrderItem" SET "basePrice" = "price" WHERE "basePrice" = 0;

-- Backfill variantId by matching the stored label against the product's variants
UPDATE "OrderItem"
SET "variantId" = (
  SELECT "ProductVariant"."id"
  FROM "ProductVariant"
  WHERE "ProductVariant"."productId" = "OrderItem"."productId"
    AND "ProductVariant"."label" = "OrderItem"."variantLabel"
  LIMIT 1
)
WHERE "variantLabel" IS NOT NULL AND "variantId" IS NULL;

-- CreateIndex
CREATE INDEX "OrderItem_variantId_idx" ON "OrderItem"("variantId");

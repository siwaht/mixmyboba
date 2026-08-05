-- Retire peptide-catalogue fields and rename `purity` to `servings`, which is
-- what the value has actually held since the store became a boba brand.
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" REAL NOT NULL,
    "description" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "servings" TEXT NOT NULL,
    "stock" INTEGER NOT NULL DEFAULT 100,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "storageTemp" TEXT NOT NULL DEFAULT 'Cool & Dry',
    "form" TEXT NOT NULL DEFAULT 'Instant Powder Mix',
    "tag" TEXT,
    "batchNumber" TEXT,
    "lotNumber" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Product" ("id", "slug", "name", "price", "description", "imageUrl", "category", "servings", "stock", "active", "storageTemp", "form", "tag", "batchNumber", "lotNumber", "createdAt", "updatedAt")
SELECT "id", "slug", "name", "price", "description", "imageUrl", "category", "purity", "stock", "active", "storageTemp", "form", "tag", "batchNumber", "lotNumber", "createdAt", "updatedAt" FROM "Product";
DROP TABLE "Product";
ALTER TABLE "new_Product" RENAME TO "Product";
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE INDEX "Product_category_idx" ON "Product"("category");
CREATE INDEX "Product_active_idx" ON "Product"("active");
CREATE INDEX "Product_active_category_idx" ON "Product"("active", "category");

-- COA: `purityResult` becomes the more general `result`, and the default lab is
-- no longer the peptide-testing lab the old catalogue used.
CREATE TABLE "new_COA" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "batchNumber" TEXT NOT NULL,
    "labName" TEXT NOT NULL DEFAULT 'Independent Lab',
    "testDate" DATETIME NOT NULL,
    "result" TEXT NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "COA_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_COA" ("id", "productId", "batchNumber", "labName", "testDate", "result", "fileUrl", "createdAt")
SELECT "id", "productId", "batchNumber", "labName", "testDate", "purityResult", "fileUrl", "createdAt" FROM "COA";
DROP TABLE "COA";
ALTER TABLE "new_COA" RENAME TO "COA";
CREATE INDEX "COA_productId_idx" ON "COA"("productId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

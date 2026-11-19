CREATE TABLE "Category" (
  "id" TEXT NOT NULL, "name" TEXT NOT NULL,
  CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
CREATE TABLE "Product" (
  "id" TEXT NOT NULL, "slug" TEXT NOT NULL, "name" TEXT NOT NULL,
  "description" TEXT NOT NULL, "material" TEXT NOT NULL,
  "price" DECIMAL(10,2) NOT NULL CHECK ("price" > 0),
  "published" BOOLEAN NOT NULL DEFAULT false, "demo" BOOLEAN NOT NULL DEFAULT false,
  "categoryId" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Product_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE INDEX "Product_published_categoryId_idx" ON "Product"("published", "categoryId");
CREATE TABLE "Variant" (
  "id" TEXT NOT NULL, "productId" TEXT NOT NULL,
  "size" INTEGER NOT NULL CHECK ("size" > 0), "color" TEXT NOT NULL,
  "available" BOOLEAN NOT NULL DEFAULT false,
  CONSTRAINT "Variant_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Variant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Variant_productId_size_color_key" ON "Variant"("productId", "size", "color");
CREATE INDEX "Variant_size_available_idx" ON "Variant"("size", "available");
CREATE TABLE "Photo" (
  "id" TEXT NOT NULL, "productId" TEXT NOT NULL,
  "url" TEXT NOT NULL, "alt" TEXT NOT NULL,
  "position" INTEGER NOT NULL CHECK ("position" >= 0),
  CONSTRAINT "Photo_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "Photo_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Photo_productId_position_key" ON "Photo"("productId", "position");

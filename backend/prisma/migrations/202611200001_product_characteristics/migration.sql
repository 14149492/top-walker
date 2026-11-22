-- Optional characteristics: existing products retain all their data.
ALTER TABLE "Product"
ADD COLUMN "sole" TEXT,
ADD COLUMN "insole" TEXT,
ADD COLUMN "lining" TEXT;

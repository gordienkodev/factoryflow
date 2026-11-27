-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'completed');

-- CreateTable
CREATE TABLE "Order" (
    "id" SERIAL NOT NULL,
    "number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");

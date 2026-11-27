-- CreateEnum
CREATE TYPE "DowntimeType" AS ENUM ('MAINTENANCE', 'BREAKDOWN', 'OTHER');

-- CreateTable
CREATE TABLE "Operation" (
    "id" SERIAL NOT NULL,
    "orderId" INTEGER NOT NULL,
    "machineId" INTEGER NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Operation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Downtime" (
    "id" SERIAL NOT NULL,
    "machineId" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "type" "DowntimeType" NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Downtime_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Operation_orderId_startTime_endTime_idx" ON "Operation"("orderId", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "Operation_machineId_startTime_endTime_idx" ON "Operation"("machineId", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "Downtime_machineId_startTime_endTime_idx" ON "Downtime"("machineId", "startTime", "endTime");

-- AddForeignKey
ALTER TABLE "Operation" ADD CONSTRAINT "Operation_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Operation" ADD CONSTRAINT "Operation_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Downtime" ADD CONSTRAINT "Downtime_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

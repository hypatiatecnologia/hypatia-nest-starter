-- CreateTable
CREATE TABLE "ServiceHealthCheck" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ServiceHealthCheck_pkey" PRIMARY KEY ("id")
);

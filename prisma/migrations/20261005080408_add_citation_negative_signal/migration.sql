-- CreateEnum
CREATE TYPE "NegativeSignalType" AS ENUM ('CLOSED', 'PRICE_MISMATCH', 'OTHER');

-- AlterTable
ALTER TABLE "citations" ADD COLUMN     "negative_signal_at" TIMESTAMP(3),
ADD COLUMN     "negative_signal_note" TEXT,
ADD COLUMN     "negative_signal_type" "NegativeSignalType";

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateTable
CREATE TABLE "trip_invitations" (
    "id" TEXT NOT NULL,
    "trip_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "CollaboratorRole" NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "invited_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "responded_at" TIMESTAMP(3),

    CONSTRAINT "trip_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "trip_invitations_trip_id_status_idx" ON "trip_invitations"("trip_id", "status");

-- CreateIndex
CREATE INDEX "trip_invitations_email_status_idx" ON "trip_invitations"("email", "status");

-- CreateIndex
CREATE INDEX "trip_invitations_invited_by_idx" ON "trip_invitations"("invited_by");

-- CreateIndex
CREATE UNIQUE INDEX "trip_invitations_trip_id_email_key" ON "trip_invitations"("trip_id", "email");

-- CreateIndex
CREATE INDEX "collaborators_user_id_idx" ON "collaborators"("user_id");

-- CreateIndex
CREATE INDEX "collaborators_plan_id_role_idx" ON "collaborators"("plan_id", "role");

-- AddForeignKey
ALTER TABLE "trip_invitations" ADD CONSTRAINT "trip_invitations_trip_id_fkey" FOREIGN KEY ("trip_id") REFERENCES "trips"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trip_invitations" ADD CONSTRAINT "trip_invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

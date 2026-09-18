-- CreateIndex
CREATE UNIQUE INDEX "votes_item_id_user_id_key" ON "votes"("item_id", "user_id");

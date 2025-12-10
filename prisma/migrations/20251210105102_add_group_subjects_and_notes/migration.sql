-- AlterTable
ALTER TABLE "Group" ADD COLUMN     "note" TEXT;

-- CreateTable
CREATE TABLE "_GroupToSubject" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_GroupToSubject_AB_unique" ON "_GroupToSubject"("A", "B");

-- CreateIndex
CREATE INDEX "_GroupToSubject_B_index" ON "_GroupToSubject"("B");

-- AddForeignKey
ALTER TABLE "_GroupToSubject" ADD CONSTRAINT "_GroupToSubject_A_fkey" FOREIGN KEY ("A") REFERENCES "Group"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GroupToSubject" ADD CONSTRAINT "_GroupToSubject_B_fkey" FOREIGN KEY ("B") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "SharedDocument" (
    "id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "shared_by" TEXT NOT NULL,
    "shared_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SharedDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SharedDocument_connection_id_idx" ON "SharedDocument"("connection_id");

-- CreateIndex
CREATE INDEX "SharedDocument_document_id_idx" ON "SharedDocument"("document_id");

-- CreateIndex
CREATE UNIQUE INDEX "SharedDocument_connection_id_document_id_key" ON "SharedDocument"("connection_id", "document_id");

-- AddForeignKey
ALTER TABLE "SharedDocument" ADD CONSTRAINT "SharedDocument_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "Connection"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedDocument" ADD CONSTRAINT "SharedDocument_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SharedDocument" ADD CONSTRAINT "SharedDocument_shared_by_fkey" FOREIGN KEY ("shared_by") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

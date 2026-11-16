-- CreateTable
CREATE TABLE "DomicilioAdicional" (
    "id" TEXT NOT NULL,
    "direccion" TEXT NOT NULL,
    "profesionalId" TEXT NOT NULL,
    "localidadId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DomicilioAdicional_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DomicilioAdicional_profesionalId_idx" ON "DomicilioAdicional"("profesionalId");

-- CreateIndex
CREATE INDEX "DomicilioAdicional_localidadId_idx" ON "DomicilioAdicional"("localidadId");

-- AddForeignKey
ALTER TABLE "DomicilioAdicional" ADD CONSTRAINT "DomicilioAdicional_profesionalId_fkey" FOREIGN KEY ("profesionalId") REFERENCES "Profesional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DomicilioAdicional" ADD CONSTRAINT "DomicilioAdicional_localidadId_fkey" FOREIGN KEY ("localidadId") REFERENCES "Localidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RLS (obligatorio por AGENTS.md; Prisma usa service_role y lo bypasea)
ALTER TABLE "DomicilioAdicional" ENABLE ROW LEVEL SECURITY;

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'PROFESIONAL');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDIENTE', 'ACTIVO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "SolicitudStatus" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA');

-- CreateEnum
CREATE TYPE "CategoriaKineClub" AS ENUM ('TURISMO', 'SALUD', 'GASTRONOMIA', 'COMERCIOS', 'EDUCACION', 'OTROS');

-- CreateTable
CREATE TABLE "Profesional" (
    "id" TEXT NOT NULL,
    "wp_id" TEXT,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "full_name" TEXT,
    "email" TEXT,
    "matricula" TEXT NOT NULL,
    "dni" TEXT,
    "telefono" TEXT,
    "whatsapp" TEXT,
    "direccion" TEXT,
    "horarios" TEXT,
    "foto_url" TEXT,
    "slug" TEXT NOT NULL,
    "localidadId" TEXT NOT NULL,
    "userId" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'PROFESIONAL',
    "status" "Status" NOT NULL DEFAULT 'ACTIVO',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profesional_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Localidad" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Localidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Especialidad" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Especialidad_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Noticia" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "resumen" TEXT,
    "contenido" TEXT NOT NULL,
    "imagen_url" TEXT,
    "publicada" BOOLEAN NOT NULL DEFAULT false,
    "publicada_en" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Noticia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObraSocial" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "logo_url" TEXT,
    "convenio_url" TEXT,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ObraSocial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeneficioKineClub" (
    "id" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "descuento" TEXT,
    "logo_url" TEXT,
    "url" TEXT,
    "categoria" "CategoriaKineClub" NOT NULL DEFAULT 'OTROS',
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BeneficioKineClub_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Solicitud" (
    "id" TEXT NOT NULL,
    "status" "SolicitudStatus" NOT NULL DEFAULT 'PENDIENTE',
    "datos" JSONB NOT NULL,
    "email" TEXT NOT NULL,
    "matricula" TEXT NOT NULL,
    "creada_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revisada_en" TIMESTAMP(3),

    CONSTRAINT "Solicitud_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_EspecialidadToProfesional" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_EspecialidadToProfesional_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profesional_wp_id_key" ON "Profesional"("wp_id");

-- CreateIndex
CREATE UNIQUE INDEX "Profesional_email_key" ON "Profesional"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Profesional_matricula_key" ON "Profesional"("matricula");

-- CreateIndex
CREATE UNIQUE INDEX "Profesional_slug_key" ON "Profesional"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Profesional_userId_key" ON "Profesional"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Localidad_nombre_key" ON "Localidad"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Especialidad_nombre_key" ON "Especialidad"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Noticia_slug_key" ON "Noticia"("slug");

-- CreateIndex
CREATE INDEX "_EspecialidadToProfesional_B_index" ON "_EspecialidadToProfesional"("B");

-- AddForeignKey
ALTER TABLE "Profesional" ADD CONSTRAINT "Profesional_localidadId_fkey" FOREIGN KEY ("localidadId") REFERENCES "Localidad"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EspecialidadToProfesional" ADD CONSTRAINT "_EspecialidadToProfesional_A_fkey" FOREIGN KEY ("A") REFERENCES "Especialidad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_EspecialidadToProfesional" ADD CONSTRAINT "_EspecialidadToProfesional_B_fkey" FOREIGN KEY ("B") REFERENCES "Profesional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Limpieza de las "Especialidad" creadas por el bug de gestionarSolicitud.
--
-- Qué pasó: al aprobar una solicitud, el código hacía `connectOrCreate` por `nombre`
-- usando el ID que mandaba el formulario. Resultado: una Especialidad por aprobación
-- cuyo nombre es un cuid (ej. "cmorf6cmc000f21fbv5y792dv"), visible en el select
-- público de /registro y en los filtros del admin.
--
-- La buena noticia: ese nombre basura ES el ID de la especialidad real que el
-- profesional eligió, así que el vínculo correcto se puede reconstruir.
--
-- Correr paso por paso en el SQL Editor de Supabase, revisando el resultado de cada uno.

-- PASO 1 — Ver el daño antes de tocar nada.
SELECT
  basura.id      AS especialidad_basura_id,
  basura.nombre  AS especialidad_basura_nombre,
  real.nombre    AS especialidad_real,
  prof.matricula,
  prof.apellido || ', ' || prof.nombre AS profesional
FROM "Especialidad" basura
LEFT JOIN "_EspecialidadToProfesional" ep ON ep."A" = basura.id
LEFT JOIN "Profesional" prof ON prof.id = ep."B"
LEFT JOIN "Especialidad" real ON real.id = basura.nombre
WHERE basura.nombre ~ '^c[a-z0-9]{20,}$'
ORDER BY basura.nombre;

-- PASO 2 — Reconectar cada profesional con su especialidad real.
-- Si en el PASO 1 la columna `especialidad_real` salió NULL para alguna fila,
-- esa especialidad ya no existe: resolvela a mano antes de seguir.
INSERT INTO "_EspecialidadToProfesional" ("A", "B")
SELECT real.id, ep."B"
FROM "Especialidad" basura
JOIN "_EspecialidadToProfesional" ep ON ep."A" = basura.id
JOIN "Especialidad" real ON real.id = basura.nombre
WHERE basura.nombre ~ '^c[a-z0-9]{20,}$'
ON CONFLICT DO NOTHING;

-- PASO 3 — Borrar las especialidades basura.
-- El FK de "_EspecialidadToProfesional" es ON DELETE CASCADE, así que los vínculos
-- viejos se van solos. Correr sólo después de verificar el PASO 2.
DELETE FROM "Especialidad"
WHERE nombre ~ '^c[a-z0-9]{20,}$';

-- PASO 4 — Verificar que no quedó ninguna.
SELECT count(*) AS basura_restante
FROM "Especialidad"
WHERE nombre ~ '^c[a-z0-9]{20,}$';

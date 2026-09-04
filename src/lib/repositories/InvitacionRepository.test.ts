import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  default: {
    profesional: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  supabaseAdmin: {
    auth: {
      admin: {
        listUsers: vi.fn(),
      },
    },
  },
}));

import prisma from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  InvitacionRepository,
  diaDeEnvio,
  type InvitacionProfesional,
} from "./InvitacionRepository";

const mockFindMany = vi.mocked(prisma.profesional.findMany);
const mockListUsers = vi.mocked(supabaseAdmin.auth.admin.listUsers);

const profesional = (
  matricula: string,
  extra: Partial<{ email: string | null; userId: string | null }> = {}
) => ({
  id: `prof-${matricula}`,
  nombre: "Nombre",
  apellido: `Apellido-${matricula}`,
  matricula,
  email: `${matricula}@example.com`,
  userId: null,
  ...extra,
});

/** Marca de activación tal como la escribe `updatePassword` o el backfill. */
const marcaDeActivacion = (cuando = "2026-09-02T18:05:00.000Z") => ({
  activacion_completada_en: cuando,
  activacion_origen: "usuario",
});

const usuarioAuth = (
  id: string,
  extra: Partial<{
    invited_at: string | null;
    created_at: string;
    email_confirmed_at: string | null;
    last_sign_in_at: string | null;
    user_metadata: Record<string, unknown>;
  }> = {}
) => ({
  id,
  created_at: "2026-09-02T14:00:00.000Z",
  invited_at: "2026-09-02T14:00:00.000Z",
  email_confirmed_at: null,
  last_sign_in_at: null,
  app_metadata: {},
  user_metadata: {},
  aud: "authenticated",
  ...extra,
});

/** Una sola página de Auth: la paginación corta cuando vienen < 1000. */
const paginaAuth = (usuarios: ReturnType<typeof usuarioAuth>[]) => ({
  data: { users: usuarios, aud: "authenticated" },
  error: null,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("diaDeEnvio", () => {
  it("agrupa por día de Mendoza, no por UTC", () => {
    // 2026-09-03T02:00Z son las 23:00 del 2 en Mendoza (UTC-3).
    expect(diaDeEnvio("2026-09-03T02:00:00.000Z")).toBe("2026-09-02");
  });

  it("devuelve null cuando no hay fecha o es inválida", () => {
    expect(diaDeEnvio(null)).toBeNull();
    expect(diaDeEnvio("cualquier cosa")).toBeNull();
  });
});

describe("InvitacionRepository.agruparEnTandas", () => {
  it("arma una tanda por día y calcula el porcentaje de ingreso", () => {
    const filas: InvitacionProfesional[] = [
      {
        id: "1",
        matricula: "K-1",
        apellido: "A",
        nombre: "A",
        email: "a@x.com",
        estado: "ACTIVADO",
        invitadoEl: "2026-09-02T14:00:00.000Z",
        ultimoIngreso: "2026-09-02T15:00:00.000Z",
      },
      {
        id: "2",
        matricula: "K-2",
        apellido: "B",
        nombre: "B",
        email: "b@x.com",
        estado: "EN_LIMBO",
        invitadoEl: "2026-09-02T14:00:00.000Z",
        ultimoIngreso: null,
      },
      {
        id: "3",
        matricula: "K-3",
        apellido: "C",
        nombre: "C",
        email: "c@x.com",
        estado: "EN_LIMBO",
        invitadoEl: "2026-09-03T14:00:00.000Z",
        ultimoIngreso: null,
      },
      {
        id: "4",
        matricula: "K-4",
        apellido: "D",
        nombre: "D",
        email: null,
        estado: "SIN_EMAIL",
        invitadoEl: null,
        ultimoIngreso: null,
      },
    ];

    expect(InvitacionRepository.agruparEnTandas(filas)).toEqual([
      { fecha: "2026-09-02", invitados: 2, entraron: 1, enLimbo: 1, huerfanos: 0, porcentaje: 50 },
      { fecha: "2026-09-03", invitados: 1, entraron: 0, enLimbo: 1, huerfanos: 0, porcentaje: 0 },
    ]);
  });

  /**
   * Criterio del change: alguien sin contraseña propia NO cuenta como "entró".
   * Entró, sí, pero no puede volver — funcionalmente quedó afuera, y contarlo
   * como éxito de la tanda repite acá el número falso que el change corrige
   * arriba. Suma en `invitados` y en ninguna de las dos columnas: por eso 1 de 2
   * da 50% y no 100%.
   */
  it("SIN_CONTRASENA no cuenta como entrada en el porcentaje de la tanda", () => {
    const fila = (
      id: string,
      estado: InvitacionProfesional["estado"]
    ): InvitacionProfesional => ({
      id,
      matricula: `K-${id}`,
      apellido: id,
      nombre: id,
      email: `${id}@x.com`,
      estado,
      invitadoEl: "2026-09-02T14:00:00.000Z",
      ultimoIngreso: null,
    });

    expect(
      InvitacionRepository.agruparEnTandas([
        fila("1", "ACTIVADO"),
        fila("2", "SIN_CONTRASENA"),
      ])
    ).toEqual([
      { fecha: "2026-09-02", invitados: 2, entraron: 1, enLimbo: 0, huerfanos: 0, porcentaje: 50 },
    ]);
  });
});

describe("InvitacionRepository.getResumen", () => {
  it("clasifica cada profesional según su cuenta de Auth", async () => {
    mockFindMany.mockResolvedValue([
      profesional("K-1", { userId: "auth-1" }), // activó: tiene contraseña
      profesional("K-2", { userId: "auth-2" }), // invitado, nunca entró
      profesional("K-3"), // nunca invitado
      profesional("K-4", { email: null }), // no invitable
      profesional("K-5", { userId: "auth-fantasma" }), // huérfano
      profesional("K-6", { userId: "auth-6" }), // entró, no guardó contraseña
    ] as never);

    mockListUsers.mockResolvedValue(
      paginaAuth([
        usuarioAuth("auth-1", {
          last_sign_in_at: "2026-09-02T18:00:00.000Z",
          user_metadata: marcaDeActivacion(),
        }),
        usuarioAuth("auth-2"),
        usuarioAuth("auth-6", { last_sign_in_at: "2026-09-02T18:00:00.000Z" }),
      ]) as never
    );

    const resumen = await InvitacionRepository.getResumen();

    expect(resumen.total).toBe(6);
    expect(resumen.activados).toBe(1);
    expect(resumen.sinContrasena).toBe(1);
    expect(resumen.enLimbo).toBe(1);
    expect(resumen.sinInvitar).toBe(1);
    expect(resumen.sinEmail).toBe(1);
    expect(resumen.huerfanos).toBe(1);
    expect(resumen.invitados).toBe(4);
    expect(resumen.cuentasAuth).toBe(3);
  });

  it("ACTIVADO es tener contraseña propia, no haber abierto el link", async () => {
    mockFindMany.mockResolvedValue([profesional("K-9", { userId: "auth-9" })] as never);
    mockListUsers.mockResolvedValue(
      paginaAuth([
        usuarioAuth("auth-9", {
          last_sign_in_at: "2026-09-02T18:00:00.000Z",
          user_metadata: marcaDeActivacion(),
        }),
      ]) as never
    );

    const resumen = await InvitacionRepository.getResumen();

    expect(resumen.profesionales[0].estado).toBe("ACTIVADO");
    expect(resumen.activados).toBe(1);
    expect(resumen.sinContrasena).toBe(0);
    expect(resumen.enLimbo).toBe(0);
  });

  /**
   * El caso que motivó el change: hasta acá el panel lo contaba como ACTIVADO y
   * el Círculo veía un número que no significaba nada. Esta persona no puede
   * volver a entrar cuando se le venza la sesión del link.
   */
  it("quien confirmó el mail pero no guardó contraseña queda SIN_CONTRASENA, no ACTIVADO", async () => {
    mockFindMany.mockResolvedValue([profesional("K-9", { userId: "auth-9" })] as never);
    mockListUsers.mockResolvedValue(
      paginaAuth([
        usuarioAuth("auth-9", { email_confirmed_at: "2026-09-02T18:00:00.000Z" }),
      ]) as never
    );

    const resumen = await InvitacionRepository.getResumen();

    expect(resumen.profesionales[0].estado).toBe("SIN_CONTRASENA");
    expect(resumen.activados).toBe(0);
    expect(resumen.sinContrasena).toBe(1);
    expect(resumen.enLimbo).toBe(0);
  });

  it("quien nunca entró sigue siendo EN_LIMBO, que conserva su significado", async () => {
    mockFindMany.mockResolvedValue([profesional("K-9", { userId: "auth-9" })] as never);
    mockListUsers.mockResolvedValue(paginaAuth([usuarioAuth("auth-9")]) as never);

    const resumen = await InvitacionRepository.getResumen();

    expect(resumen.profesionales[0].estado).toBe("EN_LIMBO");
    expect(resumen.enLimbo).toBe(1);
    expect(resumen.sinContrasena).toBe(0);
  });

  /**
   * Un huérfano no tiene cuenta que mirar: clasificarlo por activación sería
   * inventarle un estado. Reenviar tampoco lo arregla.
   */
  it("el huérfano no se clasifica por activación", async () => {
    mockFindMany.mockResolvedValue([
      profesional("K-9", { userId: "auth-que-no-existe" }),
    ] as never);
    mockListUsers.mockResolvedValue(paginaAuth([]) as never);

    const resumen = await InvitacionRepository.getResumen();

    expect(resumen.profesionales[0].estado).toBe("HUERFANO");
    expect(resumen.sinContrasena).toBe(0);
    expect(resumen.activados).toBe(0);
    expect(resumen.enLimbo).toBe(0);
  });

  it("una marca basura en user_metadata no alcanza para figurar activado", async () => {
    mockFindMany.mockResolvedValue([profesional("K-9", { userId: "auth-9" })] as never);
    mockListUsers.mockResolvedValue(
      paginaAuth([
        usuarioAuth("auth-9", {
          last_sign_in_at: "2026-09-02T18:00:00.000Z",
          user_metadata: { activacion_completada_en: "" },
        }),
      ]) as never
    );

    const resumen = await InvitacionRepository.getResumen();

    expect(resumen.profesionales[0].estado).toBe("SIN_CONTRASENA");
  });

  it("propaga el error de Auth en lugar de devolver números incompletos", async () => {
    mockFindMany.mockResolvedValue([] as never);
    mockListUsers.mockResolvedValue({
      data: { users: [] },
      error: { message: "token vencido" },
    } as never);

    await expect(InvitacionRepository.getResumen()).rejects.toThrow("token vencido");
  });
});

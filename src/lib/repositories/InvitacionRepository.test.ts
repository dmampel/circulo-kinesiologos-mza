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

const usuarioAuth = (
  id: string,
  extra: Partial<{
    invited_at: string | null;
    created_at: string;
    email_confirmed_at: string | null;
    last_sign_in_at: string | null;
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
});

describe("InvitacionRepository.getResumen", () => {
  it("clasifica cada profesional según su cuenta de Auth", async () => {
    mockFindMany.mockResolvedValue([
      profesional("K-1", { userId: "auth-1" }), // entró
      profesional("K-2", { userId: "auth-2" }), // invitado, sin activar
      profesional("K-3"), // nunca invitado
      profesional("K-4", { email: null }), // no invitable
      profesional("K-5", { userId: "auth-fantasma" }), // huérfano
    ] as never);

    mockListUsers.mockResolvedValue(
      paginaAuth([
        usuarioAuth("auth-1", { last_sign_in_at: "2026-09-02T18:00:00.000Z" }),
        usuarioAuth("auth-2"),
      ]) as never
    );

    const resumen = await InvitacionRepository.getResumen();

    expect(resumen.total).toBe(5);
    expect(resumen.activados).toBe(1);
    expect(resumen.enLimbo).toBe(1);
    expect(resumen.sinInvitar).toBe(1);
    expect(resumen.sinEmail).toBe(1);
    expect(resumen.huerfanos).toBe(1);
    expect(resumen.invitados).toBe(3);
    expect(resumen.cuentasAuth).toBe(2);
  });

  it("cuenta como activado a quien confirmó el mail aunque nunca haya vuelto a entrar", async () => {
    mockFindMany.mockResolvedValue([profesional("K-9", { userId: "auth-9" })] as never);
    mockListUsers.mockResolvedValue(
      paginaAuth([
        usuarioAuth("auth-9", { email_confirmed_at: "2026-09-02T18:00:00.000Z" }),
      ]) as never
    );

    const resumen = await InvitacionRepository.getResumen();

    expect(resumen.activados).toBe(1);
    expect(resumen.enLimbo).toBe(0);
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

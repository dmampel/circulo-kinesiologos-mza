import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TurnoRepository } from './TurnoRepository';
import { EstadoTurno } from '@prisma/client';

vi.mock('@/lib/prisma', () => ({
  default: {
    turno: {
      findMany: vi.fn(),
      create: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import prisma from '@/lib/prisma';

const mockFindMany = vi.mocked(prisma.turno.findMany);
const mockUpdateMany = vi.mocked(prisma.turno.updateMany);

// Helper: crea un turno mock con los campos mínimos que usa detectarSolapamiento
function makeTurno(horaInicio: string, duracion: number, estado = EstadoTurno.PENDIENTE) {
  return {
    id: 'turno-1',
    fecha: new Date(`2026-06-01T${horaInicio}:00Z`),
    duracion,
    estado,
    profesionalId: 'prof-1',
    pacienteId: 'pac-1',
    motivo: null,
    notas: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('TurnoRepository.detectarSolapamiento', () => {
  const PROF_ID = 'prof-1';
  const BASE_DATE = new Date('2026-06-01T10:00:00Z');

  it('retorna false cuando no hay turnos en el día', async () => {
    mockFindMany.mockResolvedValue([]);
    const result = await TurnoRepository.detectarSolapamiento(PROF_ID, BASE_DATE, 50);
    expect(result).toBe(false);
  });

  it('retorna false cuando solo hay un turno cancelado en la misma franja', async () => {
    // El filtro de Prisma ya excluye CANCELADO, así que findMany devuelve []
    mockFindMany.mockResolvedValue([]);
    const result = await TurnoRepository.detectarSolapamiento(PROF_ID, BASE_DATE, 50);
    expect(result).toBe(false);
  });

  it('retorna true en solapamiento parcial al inicio (nuevo empieza antes de que termine el existente)', async () => {
    // Existente: 10:00–10:50. Nuevo: 10:30–11:20 → solapa
    const existente = makeTurno('10:00', 50);
    mockFindMany.mockResolvedValue([existente]);
    const nuevaFecha = new Date('2026-06-01T10:30:00Z');
    const result = await TurnoRepository.detectarSolapamiento(PROF_ID, nuevaFecha, 50);
    expect(result).toBe(true);
  });

  it('retorna true en solapamiento parcial al final (nuevo termina después de que empiece el existente)', async () => {
    // Existente: 10:30–11:20. Nuevo: 10:00–10:50 → solapa
    const existente = makeTurno('10:30', 50);
    mockFindMany.mockResolvedValue([existente]);
    const nuevaFecha = new Date('2026-06-01T10:00:00Z');
    const result = await TurnoRepository.detectarSolapamiento(PROF_ID, nuevaFecha, 50);
    expect(result).toBe(true);
  });

  it('retorna true en solapamiento exacto', async () => {
    // Existente y nuevo: 10:00–10:50
    const existente = makeTurno('10:00', 50);
    mockFindMany.mockResolvedValue([existente]);
    const result = await TurnoRepository.detectarSolapamiento(PROF_ID, BASE_DATE, 50);
    expect(result).toBe(true);
  });

  it('retorna false cuando los turnos son contiguos pero no solapan', async () => {
    // Existente: 10:00–10:50. Nuevo: 10:50–11:40 → no solapa (borde exacto)
    const existente = makeTurno('10:00', 50);
    mockFindMany.mockResolvedValue([existente]);
    const nuevaFecha = new Date('2026-06-01T10:50:00Z');
    const result = await TurnoRepository.detectarSolapamiento(PROF_ID, nuevaFecha, 50);
    expect(result).toBe(false);
  });

  it('retorna false cuando excludeId coincide con el único turno que solaparía', async () => {
    // El turno existente que solaparía tiene id 'turno-excluido'
    // El mock devuelve [] porque Prisma ya lo filtra por excludeId
    mockFindMany.mockResolvedValue([]);
    const result = await TurnoRepository.detectarSolapamiento(PROF_ID, BASE_DATE, 50, 'turno-excluido');
    expect(result).toBe(false);
  });
});

describe('TurnoRepository.autoCompletarPasados', () => {
  it('llama updateMany con filtro de fecha pasada y estados PENDIENTE/CONFIRMADO', async () => {
    mockUpdateMany.mockResolvedValue({ count: 3 });
    await TurnoRepository.autoCompletarPasados('prof-1');
    expect(mockUpdateMany).toHaveBeenCalledOnce();
    const call = mockUpdateMany.mock.calls[0][0];
    expect(call.where.profesionalId).toBe('prof-1');
    expect(call.where.estado).toEqual({ in: [EstadoTurno.PENDIENTE, EstadoTurno.CONFIRMADO] });
    expect(call.where.fecha).toHaveProperty('lt');
    expect(call.data).toEqual({ estado: EstadoTurno.COMPLETADO });
  });
});

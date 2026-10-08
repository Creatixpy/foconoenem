import { describe, expect, it } from 'vitest';
import { calculateOperatingHours, operatingHoursForUser } from '../../lib/contracts/operating-hours';
import { parseOperatingHoursAccess } from '../../lib/client/operating-hours-api';

const userId = '01928cf9-4aca-4037-8ba0-673edc94be5a';
const midnight = new Date('2026-10-09T03:00:00Z');
const access = { userId, expiresAt: '2026-10-10T03:00:00Z' };

describe('disponibilidade de estudo por assinatura', () => {
  it('mantém Free fechado de madrugada e Max válido disponível 24 horas', () => {
    expect(calculateOperatingHours(midnight).isOpen).toBe(false);
    const info = calculateOperatingHours(midnight, false, access);
    expect(info.isOpen).toBe(true);
    expect(info.unrestrictedAccess).toEqual(access);
    expect(info.message).toContain('Max disponível 24 horas');
    expect(info.currentTime).toBe('00:00');
  });

  it.each(['invalid-date', '2026-10-09T02:59:59Z', '2026-10-09T03:00:00Z'])('recusa isenção com validade %s', (expiresAt) => {
    const info = calculateOperatingHours(midnight, false, { userId, expiresAt });
    expect(info.isOpen).toBe(false);
    expect(info.unrestrictedAccess).toBeUndefined();
  });

  it('retorna ao horário Free quando a validade termina em uma página já aberta', () => {
    const initial = calculateOperatingHours(midnight, false, access);
    expect(operatingHoursForUser(initial, userId, new Date('2026-10-10T02:59:59Z')).isOpen).toBe(true);
    const expired = operatingHoursForUser(initial, userId, new Date(access.expiresAt));
    expect(expired.isOpen).toBe(false);
    expect(expired.unrestrictedAccess).toBeUndefined();
  });

  it('não reaproveita a isenção de outro usuário ou de uma sessão ausente', () => {
    const initial = calculateOperatingHours(midnight, false, access);
    expect(operatingHoursForUser(initial, userId, midnight).isOpen).toBe(true);
    for (const currentUser of ['outro-usuario', undefined]) {
      const info = operatingHoursForUser(initial, currentUser, midnight);
      expect(info.isOpen).toBe(false);
      expect(info.unrestrictedAccess).toBeUndefined();
    }
  });

  it('mantém o horário Free disponível durante o dia após a validade Max terminar', () => {
    const initial = calculateOperatingHours(midnight, true, access);
    const info = operatingHoursForUser(initial, userId, new Date('2026-10-10T15:00:00Z'));
    expect(info.isOpen).toBe(true);
    expect(info.unrestrictedAccess).toBeUndefined();
    expect(info.usedFallback).toBe(true);
    expect(info.message).toContain('até às 23h30');
  });
});

describe('atualização da disponibilidade pela assinatura verificada', () => {
  const response = { authenticated: true, userId, subscription: { planCode: 'max', hasMaxAccess: true, currentPeriodEnd: access.expiresAt } };

  it('aplica a nova validade de uma renovação sem recarregar a página', () => {
    const renewed = parseOperatingHoursAccess(response, userId);
    expect(renewed).toEqual(access);
    expect(calculateOperatingHours(midnight, false, renewed).isOpen).toBe(true);
  });

  it('revoga a indicação Max quando a assinatura deixa de conceder acesso', () => {
    expect(parseOperatingHoursAccess({ ...response, subscription: { ...response.subscription, hasMaxAccess: false } }, userId)).toBeUndefined();
    expect(parseOperatingHoursAccess({ authenticated: false, userId: null }, userId)).toBeUndefined();
  });

  it('não aplica uma resposta atrasada referente a outra sessão', () => {
    expect(parseOperatingHoursAccess(response, 'outro-usuario')).toBeUndefined();
  });

  it.each([null, {}, { authenticated: true, userId }, { ...response, subscription: { hasMaxAccess: 'true' } },
    { ...response, subscription: { ...response.subscription, currentPeriodEnd: 'invalid' } }])('recusa resposta inválida sem inventar acesso: %j', (payload) => {
    expect(() => parseOperatingHoursAccess(payload, userId)).toThrow();
  });
});

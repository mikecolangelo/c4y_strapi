import { describe, it, expect } from 'vitest';
import { slugify } from './slugify';

describe('slugify (vehicle-document-category)', () => {
  it('convierte un nombre simple a slug', () => {
    expect(slugify('Tarjeta de Circulación')).toBe('tarjeta-de-circulacion');
  });

  it('elimina acentos y caracteres especiales', () => {
    expect(slugify('Póliza / Seguro #1')).toBe('poliza-seguro-1');
  });

  it('colapsa espacios y guiones repetidos y recorta extremos', () => {
    expect(slugify('  Foto   --  Frontal  ')).toBe('foto-frontal');
  });

  it('cae en "categoria" cuando no queda nada utilizable', () => {
    expect(slugify('!!!')).toBe('categoria');
    expect(slugify('')).toBe('categoria');
  });
});

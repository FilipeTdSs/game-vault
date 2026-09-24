import { isValidCpf } from './is-cpf.validator';

describe('isValidCpf', () => {
  it.each(['529.982.247-25', '52998224725', '111.444.777-35'])(
    'accepts valid CPF %s',
    (cpf) => {
      expect(isValidCpf(cpf)).toBe(true);
    },
  );

  it.each([
    ['wrong check digits', '529.982.247-24'],
    ['all digits equal', '111.111.111-11'],
    ['too short', '1234567890'],
    ['too long', '123456789012'],
    ['empty', ''],
  ])('rejects %s', (_, cpf) => {
    expect(isValidCpf(cpf)).toBe(false);
  });

  it('rejects non-string values', () => {
    expect(isValidCpf(52998224725)).toBe(false);
    expect(isValidCpf(null)).toBe(false);
  });
});

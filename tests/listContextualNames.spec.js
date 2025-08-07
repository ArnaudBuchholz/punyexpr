'use strict'

describe('listContextualNames', () => {
  it('returns an empty array if no context is used', () => {
    expect(punyexpr('1 + 1').listContextualNames()).toStrictEqual([]);
  });

  it('returns the list of contextual names used', () => {
    expect(punyexpr('abc + def').listContextualNames().sort()).toStrictEqual(['abc', 'def']);
  });

  it('returns the list of unique contextual names used', () => {
    expect(punyexpr('abc + def * !abc').listContextualNames().sort()).toStrictEqual(['abc', 'def']);
  });
});

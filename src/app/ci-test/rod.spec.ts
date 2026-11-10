// Feiler med vilje for å bevise at CI blokkerer merge. Skal aldri merges.
describe('CI-portvokter', () => {
  it('feiler med vilje', () => {
    expect(1).toBe(2);
  });
});

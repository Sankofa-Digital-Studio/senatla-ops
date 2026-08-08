describe('asset registration auth boundary', () => {
  it('redirects unauthenticated asset-register visits to office login without using demo credentials', () => {
    cy.visit('/asset-register');

    cy.location('pathname').should('eq', '/login/office');
    cy.contains(/Role-gated login for office/i).should('be.visible');
    cy.contains(/Use the work email and password provisioned in Supabase Auth/i).should('be.visible');
    cy.contains(/demo/i).should('not.exist');
  });
});
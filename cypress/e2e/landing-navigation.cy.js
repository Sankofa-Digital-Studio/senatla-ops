describe('public landing navigation', () => {
  it('shows the cornerstone welcome gate and routes both public navigation links to real sections', () => {
    cy.visit('/landing');

    cy.get('.cornerstone-loader')
      .should('be.visible')
      .and('contain.text', 'Senatla means a rock');
    cy.get('.cornerstone-loader').should('not.exist');

    cy.get('a[href="#capabilities"]').first().click();
    cy.get('#capabilities').should('be.visible');
    cy.get('a[href="#assurance"]').first().click();
    cy.get('#assurance').should('be.visible');
    cy.get('a[href="#mobile-app"]').first().click();
    cy.get('#mobile-app').should('be.visible').and('contain.text', 'iPhone / iPad web app').and('contain.text', 'Android UAT app');
    cy.get('#mobile-app a').contains('Open iOS web app').should('have.attr', 'href', '/login');
    cy.get('#mobile-app a').contains('Download Android APK').should('have.attr', 'href').and('include', '/dev-latest/senatla-ops-dev.apk');
    cy.viewport(390, 844);
    cy.get('.mobile-menu summary').click();
    cy.get('.mobile-menu a[href="#mobile-app"]').click();
    cy.get('#mobile-app').should('be.visible');
    cy.screenshot('platform-download-menu-mobile-390x844', { capture: 'viewport' });
  });

  it('recommends the iPhone and iPad web app to Apple visitors', () => {
    cy.viewport(390, 844);
    cy.visit('/landing', {
      onBeforeLoad(win) {
        Object.defineProperty(win.navigator, 'userAgent', { value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)' });
      },
    });
    cy.get('.cornerstone-loader').should('not.exist');
    cy.get('.mobile-app-card--recommended').should('contain.text', 'iPhone / iPad web app');
    cy.get('.mobile-menu summary').click();
    cy.get('.mobile-menu a[href="#mobile-app"]').should('contain.text', 'iPhone / iPad').and('have.attr', 'href', '#mobile-app');
    cy.get('#mobile-app').scrollIntoView().should('be.visible');
    cy.screenshot('platform-download-menu-ios-390x844', { capture: 'viewport' });
  });

  it('offers the direct APK to Android visitors', () => {
    cy.viewport(390, 844);
    cy.visit('/landing', {
      onBeforeLoad(win) {
        Object.defineProperty(win.navigator, 'userAgent', { value: 'Mozilla/5.0 (Linux; Android 15; Pixel 9)' });
      },
    });
    cy.get('.cornerstone-loader').should('not.exist');
    cy.get('.mobile-menu summary').click();
    cy.get('.mobile-menu a[download]').should('contain.text', 'Download Android').and('have.attr', 'href').and('include', 'senatla-ops-dev.apk');
    cy.get('.mobile-menu a[download]').click();
    cy.get('#mobile-app .mobile-app-card--recommended').should('contain.text', 'Android UAT app');
    cy.screenshot('platform-download-menu-android-390x844', { capture: 'viewport' });
  });
});
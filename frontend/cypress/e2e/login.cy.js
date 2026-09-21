describe('Login Flow', () => {
  it('successfully logs in and checks accessibility', () => {
    cy.visit('http://localhost:5173/login');
    
    // Accessibility Testing (a11y)
    cy.injectAxe();
    cy.checkA11y();
    
    cy.get('input[type="email"]').type('admin@test.com');
    cy.get('input[type="password"]').type('password123');
    
    cy.get('button[type="submit"]').click();
    
    // Assert redirect to admin dashboard
    cy.url().should('include', '/admin-dashboard');
    cy.contains('Admin Dashboard').should('be.visible');
  });
});

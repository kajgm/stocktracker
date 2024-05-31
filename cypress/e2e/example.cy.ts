// https://on.cypress.io/api

describe('Page navigation', () => {
  it('visits the app root url', () => {
    cy.visit('/')
    cy.contains('h1', 'Stock Tracker')
  })
})

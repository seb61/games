const React = require('react');
const { render, screen, fireEvent } = require('@testing-library/react');
const App = require('./public/app');

// mock fetch to avoid fetch is not defined
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve([]),
  })
);

test('search movies', async () => {
  jest.spyOn(React, 'useState')
  .mockImplementationOnce(() => [true, jest.fn()]); // loggedIn = true

  render(React.createElement(App, { initialLoggedIn: true }));

  // search for input whose placeholder matches /search/i
  const searchInput = screen.getByPlaceholderText(/search/i);

  fireEvent.change(searchInput, { target: { value: 'the dark knight' } });

  const movies = screen.getAllByRole('heading', { level: 2 }); // title rendered as h2

  expect(movies.length).toBeGreaterThan(0);
  expect(movies[0].textContent.toLowerCase()).toContain('the dark knight');
});
const React = require('react');
require('@testing-library/jest-dom');

const { render, screen, fireEvent } = require('@testing-library/react');
const App = require('./public/app');

beforeEach(() => {
  // mock fetch to avoid fetch is not defined
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () =>
        Promise.resolve([
          {
            title: 'The Dark Knight',
            description: 'Batman movie',
            coverImage: 'Batman confronts the Joker, a criminal mastermind whose chaotic schemes threaten to plunge Gotham City into anarchy.',
            rating: '',
          },
        ]),
    })
  );
});

afterEach(() => {
  // clear mocks so tests dont collide
  jest.clearAllMocks();
});

describe('App', () => {

  test('renders login modal by default', () => {
    render(React.createElement(App));

    // heading with text "login" exists
    expect(
      screen.getByRole('heading', { name: /login/i })
    ).toBeInTheDocument();

    // username input field exists
    expect(
      screen.getByPlaceholderText(/input username/i)
    ).toBeInTheDocument();
  });

  test('renders movies after successful login', async () => {
    // pass prop to simulate logged in state
    render(React.createElement(App, { initialLoggedIn: true }));

    const movies = await screen.findAllByRole('heading', { level: 2 });  // title rendered as h2

    expect(movies.length).toBeGreaterThan(0);
  });

  test('adds movie', () => {
    render(React.createElement(App, { initialLoggedIn: true }));

    // fire dom events
    fireEvent.click(
      screen.getAllByRole('button', { name: /\+ add movie/i })[0]
    );

    fireEvent.change(screen.getByPlaceholderText(/enter title/i), {
      target: { value: 'Inception' },
    });

    fireEvent.change(screen.getByPlaceholderText(/enter a short description/i), {
      target: { value: 'Dream movie' },
    });

    fireEvent.click(screen.getByText(/^add$/i));

    expect(screen.getByText('Inception')).toBeInTheDocument();
  });

  test('removes last movie', () => {
    render(React.createElement(App, { initialLoggedIn: true }));

    fireEvent.click(
      screen.getAllByRole('button', { name: /\+ add movie/i })[0]
    );

    fireEvent.change(screen.getByPlaceholderText(/enter title/i), {
      target: { value: 'Test Movie' },
    });

    fireEvent.change(screen.getByPlaceholderText(/enter a short description/i), {
      target: { value: 'desc' },
    });

    fireEvent.click(screen.getByText(/^add$/i));

    fireEvent.click(
      screen.getByRole('button', { name: /remove movie/i })
    );

    expect(
      screen.queryByText('Test Movie')
    ).not.toBeInTheDocument();
  });

  test('rates movie', async () => {
    render(React.createElement(App, { initialLoggedIn: true }));

    const stars = await screen.findAllByText('★');

    fireEvent.click(stars[4]);

    expect(stars[4]).toHaveClass('selected');
  });

  test('add movie modal opens and closes', () => {
    render(React.createElement(App, { initialLoggedIn: true }));

    fireEvent.click(
      screen.getAllByRole('button', { name: /\+ add movie/i })[0]
    );

    expect(
      screen.getByRole('heading', { name: /add a movie/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByText(/cancel/i));

    expect(
      screen.queryByRole('heading', { name: /add a movie/i })
    ).not.toBeInTheDocument();
  });

});
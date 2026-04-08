import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import App from "./public/app";
import React from "react";
import { StarRating } from "./public/components/StarRating";


global.useState = React.useState;
global.useEffect = React.useEffect;
global.PosterSearchOverlay = () => null;

jest.mock("./public/components/PosterSearch", () => () => (
  <div>test</div>
));

beforeAll(() => {
  window.SettingsCard = ({ children }) => <div>{children}</div>;

  window.CataloguePage = ({ movies = [] }) => (
    <div>
      {movies.map((m, i) => (
        <div key={i}>{m.title}</div>
      ))}
    </div>
  );
});

// mock fetch globally
beforeEach(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    })
  );
});

// login mock helper
const mockLoginSuccess = () => {
  fetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ success: true, accountType: "admin" }),
  });
};

// empty catalogue helper
const mockEmptyCatalogue = () => {
  fetch.mockResolvedValue({
    ok: true,
    json: async () => ({ movies: [] }),
  });
};

test("wrong credentials", async () => {
  fetch.mockResolvedValueOnce({
    ok: false,
    status: 401,
    json: async () => ({ message: "Invalid credentials" }),
  });

  render(<App />);

  fireEvent.change(screen.getByPlaceholderText(/username/i), {
    target: { value: "wrong" },
  });

  fireEvent.change(screen.getByPlaceholderText(/password/i), {
    target: { value: "wrong" },
  });

  fireEvent.click(screen.getByRole("button", { name: /login/i }));

  expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument();
});

test("renders login screen on start", () => {
  render(<App />);
  expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
});

test("UI updates after login", async () => {
  mockLoginSuccess();
  mockEmptyCatalogue();

  render(<App />);

  fireEvent.change(screen.getByPlaceholderText(/username/i), {
    target: { value: "admin" },
  });

  fireEvent.change(screen.getByPlaceholderText(/password/i), {
    target: { value: "admin" },
  });

  fireEvent.click(screen.getByRole("button", { name: /login/i }));

  expect(await screen.findByText("admin")).toBeInTheDocument();
});

test("add movie modal", async () => {
  mockLoginSuccess();
  mockEmptyCatalogue();

  render(<App />);

  fireEvent.click(screen.getByText("+"));

  expect(screen.getByText(/add a movie/i)).toBeInTheDocument();
});

test("add movie", async () => {
  mockLoginSuccess();
  mockEmptyCatalogue();

  render(<App />);

  fireEvent.click(screen.getByText("+"));

  fireEvent.change(screen.getByPlaceholderText(/enter title/i), {
    target: { value: "Movie Name" },
  });

  fireEvent.click(screen.getByRole("button", { name: /^Add$/i }));

  await waitFor(() => {
    expect(screen.getByText("Movie Name")).toBeInTheDocument();
  });
});

test("search movies", async () => {
  mockLoginSuccess();
  mockEmptyCatalogue();

  render(<App />);

  // add
  fireEvent.click(screen.getByText("+"));

  fireEvent.change(screen.getByPlaceholderText(/title/i), {
    target: { value: "Movie Name" },
  });

  fireEvent.click(screen.getByRole("button", { name: /^Add$/i }));

  // search
  fireEvent.change(screen.getByPlaceholderText(/search movie/i), {
    target: { value: "Movie Name" },
  });

  await waitFor(() => {
    expect(screen.getByText("Movie Name")).toBeInTheDocument();
  });
});

test("logout returns to login screen", async () => {
  mockLoginSuccess();
  mockEmptyCatalogue();

  render(<App />);

  fireEvent.click(screen.getByText("admin"));
  fireEvent.click(screen.getByText(/logout/i));

  expect(screen.getByRole("button", { name: /login/i })).toBeInTheDocument();
});

test("starrating", () => {
  const StarRating = window.StarRating;

  const onRateMock = jest.fn();

  const { container } = render(
    <StarRating rating={2} onRate={onRateMock} />
  );

  const stars = container.querySelectorAll(".star");

  expect(stars[0]).toHaveClass("selected");
  expect(stars[1]).toHaveClass("selected");

  stars[3].click();

  expect(onRateMock).toHaveBeenCalledWith(4);
});
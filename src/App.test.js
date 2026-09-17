import { render, screen } from '@testing-library/react';

// react-plotly.js renders charts via plotly.js, which needs real browser
// canvas/WebGL APIs that jsdom does not implement. Mock it out so component
// trees that include chart components (e.g. Stockdata) can still be
// imported/rendered in tests without crashing.
jest.mock('react-plotly.js', () => () => null);

import App from './App';

test('renders the Stock Analyzer home page', () => {
  render(<App />);
  const heading = screen.getByRole('heading', {
    name: /welcome to stock analyzer/i,
  });
  expect(heading).toBeInTheDocument();
});

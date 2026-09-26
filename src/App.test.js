import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Stock Analyzer logo text', () => {
  render(<App />);
  const logoElements = screen.getAllByText(/Stock Analyzer/i);
  expect(logoElements.length).toBeGreaterThan(0);
});



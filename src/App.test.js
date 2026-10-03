import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import StocksList from './components/StockList';

test('shows home heading and search box', () => {
  render(
    <MemoryRouter>
      <StocksList />
    </MemoryRouter>
  );
  expect(screen.getByText(/Welcome to Stock Analyzer!/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Search for stocks/i)).toBeInTheDocument();
});

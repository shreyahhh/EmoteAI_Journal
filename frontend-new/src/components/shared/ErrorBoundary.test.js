import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from './ErrorBoundary';

function Bomb({ shouldThrow }) {
  if (shouldThrow) throw new Error('boom');
  return <div>fine</div>;
}

// React logs the caught error to the console by default; keep test output clean.
const originalError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});
afterAll(() => {
  console.error = originalError;
});

test('renders children when there is no error', () => {
  render(
    <ErrorBoundary resetKey="a">
      <Bomb shouldThrow={false} />
    </ErrorBoundary>,
  );
  expect(screen.getByText('fine')).toBeInTheDocument();
});

test('shows a fallback instead of crashing when a child throws', () => {
  render(
    <ErrorBoundary resetKey="a">
      <Bomb shouldThrow />
    </ErrorBoundary>,
  );
  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
});

test('clears the error when resetKey changes', () => {
  const { rerender } = render(
    <ErrorBoundary resetKey="a">
      <Bomb shouldThrow />
    </ErrorBoundary>,
  );
  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

  rerender(
    <ErrorBoundary resetKey="b">
      <Bomb shouldThrow={false} />
    </ErrorBoundary>,
  );
  expect(screen.getByText('fine')).toBeInTheDocument();
});

test('"Try again" clears the error without a resetKey change', async () => {
  const user = userEvent.setup();
  // Simulate the underlying problem being resolved, then user retries.
  const { rerender } = render(<ErrorBoundary resetKey="a"><Bomb shouldThrow /></ErrorBoundary>);
  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

  rerender(<ErrorBoundary resetKey="a"><Bomb shouldThrow={false} /></ErrorBoundary>);
  // Still showing the fallback since resetKey didn't change...
  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

  await user.click(screen.getByRole('button', { name: /try again/i }));
  expect(screen.getByText('fine')).toBeInTheDocument();
});

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

// Supabase isn't configured in the test environment (no REACT_APP_SUPABASE_URL),
// so App should fall back to the public landing page rather than try to load a session.
test('renders the landing page when signed out', async () => {
  render(<App />);
  expect(await screen.findByText(/a private journal for the end of the day/i)).toBeInTheDocument();
});

test('navigates from the landing page to sign up', async () => {
  const user = userEvent.setup();
  render(<App />);
  await screen.findByText(/a private journal for the end of the day/i);

  await user.click(screen.getAllByRole('button', { name: /start writing/i })[0]);

  expect(await screen.findByRole('heading', { name: /start your journal/i })).toBeInTheDocument();
});

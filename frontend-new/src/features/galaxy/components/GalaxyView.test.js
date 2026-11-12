import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GalaxyView from './GalaxyView';

jest.mock('../../../supabaseClient', () => {
  const actual = jest.requireActual('../../../supabaseClient');
  return { ...actual, supabase: { from: jest.fn() } };
});

const { supabase } = require('../../../supabaseClient');

/** Minimal chainable Supabase query stub: .from(table).select(...).eq(...) -> {data, error}. */
function stubSupabase(byTable) {
  supabase.from.mockImplementation((table) => {
    const result = byTable[table] ?? { data: [], error: null };
    const chain = {
      select: () => chain,
      eq: () => chain,
      then: (resolve) => resolve(result),
    };
    return chain;
  });
}

const USER = { id: 'u1', email: 'test@example.com' };

describe('GalaxyView', () => {
  beforeEach(() => jest.clearAllMocks());

  test('shows the "no planets yet" message when nothing is visible', async () => {
    stubSupabase({ planet_state: { data: [], error: null }, planet_assignments: { data: [], error: null }, goals: { data: [], error: null } });
    render(<GalaxyView entries={[]} user={USER} />);
    expect(await screen.findByText(/planets appear as your life takes shape/i)).toBeInTheDocument();
  });

  test('a visible planet is tappable and opens its detail with linked entries', async () => {
    const user = userEvent.setup();
    stubSupabase({
      planet_state: {
        data: [{ user_id: 'u1', planet: 'jupiter', entry_count: 4, size_stage: 1, avg_mood: 5, last_entry_at: new Date().toISOString(), visible: true }],
        error: null,
      },
      planet_assignments: {
        data: [{ entry_id: 'e1', user_id: 'u1', planet: 'jupiter', is_primary: true, score: 0.9, source: 'ai', created_at: new Date().toISOString() }],
        error: null,
      },
      goals: { data: [], error: null },
    });
    const entries = [{ id: 'e1', title: 'Got the job!', content: 'Great news today.', sentimentScore: 8, mood: 'happy', createdAt: new Date().toISOString() }];

    render(<GalaxyView entries={entries} user={USER} />);

    // Jupiter isn't the default-focused planet (venus, index 0) — step forward to it (index 4).
    const nextButton = await screen.findByRole('button', { name: 'Next planet' });
    for (let i = 0; i < 4; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await user.click(nextButton);
    }

    const jupiterFocused = await screen.findByRole('button', { name: /jupiter — view details/i });
    await user.click(jupiterFocused);

    expect(await screen.findByRole('heading', { name: /jupiter/i })).toBeInTheDocument();
    expect(screen.getByText('Got the job!')).toBeInTheDocument();
  });
});

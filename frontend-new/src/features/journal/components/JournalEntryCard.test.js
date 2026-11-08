import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import JournalEntryCard from './JournalEntryCard';

const baseEntry = {
  id: 'e1',
  title: 'A good day',
  content: 'Went for a walk and felt calmer.',
  mood: 'happy',
  emotions: ['Joy'],
  themes: ['Exercise'],
  activities: ['walk'],
  activityLabels: { walk: 'Walk' },
  createdAt: '2026-01-15T10:00:00.000Z',
};

test('shows the entry title, content, and tags', () => {
  render(<JournalEntryCard entry={baseEntry} onDelete={jest.fn()} />);
  expect(screen.getByText('A good day')).toBeInTheDocument();
  expect(screen.getByText('Went for a walk and felt calmer.')).toBeInTheDocument();
  expect(screen.getByText('Joy')).toBeInTheDocument();
  expect(screen.getByText('Exercise')).toBeInTheDocument();
  expect(screen.getByText('Walk')).toBeInTheDocument();
});

test('falls back to "Untitled entry" when there is no title', () => {
  render(<JournalEntryCard entry={{ ...baseEntry, title: '' }} onDelete={jest.fn()} />);
  expect(screen.getByText('Untitled entry')).toBeInTheDocument();
});

test('delete button calls onDelete and does not open the detail modal', async () => {
  const user = userEvent.setup();
  const onDelete = jest.fn();
  render(<JournalEntryCard entry={baseEntry} onDelete={onDelete} />);

  await user.click(screen.getByRole('button', { name: /delete entry/i }));

  expect(onDelete).toHaveBeenCalledTimes(1);
  // The full-entry detail dialog has its own "A good day" heading; if the click
  // bubbled to the card it would have opened, giving a second match.
  expect(screen.getAllByText('A good day')).toHaveLength(1);
});

test('clicking a theme chip calls onThemeClick with that theme, not the card onClick', async () => {
  const user = userEvent.setup();
  const onThemeClick = jest.fn();
  render(<JournalEntryCard entry={baseEntry} onDelete={jest.fn()} onThemeClick={onThemeClick} />);

  await user.click(screen.getByRole('button', { name: 'Exercise' }));

  expect(onThemeClick).toHaveBeenCalledWith('Exercise');
  expect(screen.getAllByText('A good day')).toHaveLength(1);
});

test('clicking the card body opens the full entry detail view', async () => {
  const user = userEvent.setup();
  render(<JournalEntryCard entry={baseEntry} onDelete={jest.fn()} />);

  await user.click(screen.getByText('Went for a walk and felt calmer.'));

  expect(screen.getByRole('dialog')).toBeInTheDocument();
});

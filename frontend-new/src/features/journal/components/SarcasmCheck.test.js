import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import fixture from '../models/__fixtures__/analyze-response.json';
import { toStoredAnalysis } from '../models/journalEntryAnalysis';
import SarcasmCheck from './SarcasmCheck';

jest.mock('../../../supabaseClient', () => ({ supabase: { marker: 'stub' } }));
// Jest 27 (react-scripts 5) can't resolve Radix's `exports` map, so stub the dialog
// wrapper; the real one builds fine under webpack. What matters here is that the
// questions render inside it when the chip is opened.
jest.mock('../../../components/ui/dialog', () => {
  const R = require('react');
  const wrap = (name) => ({ children }) => R.createElement('div', { 'data-ui': name }, children);
  return {
    Dialog: ({ open, children }) => (open ? R.createElement('div', { 'data-ui': 'dialog' }, children) : null),
    DialogContent: wrap('content'),
    DialogHeader: wrap('header'),
    DialogTitle: wrap('title'),
  };
});
jest.mock('../models/journalSarcasmFeedback', () => {
  const actual = jest.requireActual('../models/journalSarcasmFeedback');
  return { ...actual, answerSarcasm: jest.fn() };
});
const { answerSarcasm } = require('../models/journalSarcasmFeedback');

global.IS_REACT_ACT_ENVIRONMENT = true;

const entry = { id: 'e1', userId: 'u1', content: fixture.text, analysis: toStoredAnalysis(fixture.plain, {}) };
const mounted = [];

async function mount(el) {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  // eslint-disable-next-line testing-library/no-unnecessary-act -- react-dom root.render, not Testing Library's render
  await act(async () => { root.render(el); });
  mounted.push({ root, container });
  return container;
}
const buttons = (root) => [...root.querySelectorAll('button')];
const byText = (root, re) => buttons(root).find((b) => re.test(b.textContent));
async function click(el) {
  await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
}

beforeEach(() => {
  jest.clearAllMocks();
  window.localStorage.clear();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(async () => {
  while (mounted.length) {
    const { root, container } = mounted.pop();
    await act(async () => root.unmount());
    container.remove();
  }
  document.body.innerHTML = '';
});

describe('SarcasmCheck', () => {
  test('asks about each flagged line, quoting it and previewing the alternative reading', async () => {
    const c = await mount(<SarcasmCheck entry={entry} />);
    expect(c.textContent).toContain('Sounds sarcastic');
    expect(c.textContent).toContain('Great, another all-hands at 8am on a Monday, just what I needed.');
    expect(c.textContent).toContain('I finally got the promotion I worked so hard for!');
    expect(c.textContent).toMatch(/this line will read as angry/);
    expect(buttons(c).filter((b) => /Yes, sarcasm/.test(b.textContent))).toHaveLength(2);
  });

  test('renders nothing when there is no analysis or nothing is flagged', async () => {
    const none = await mount(<SarcasmCheck entry={{ ...entry, analysis: null }} />);
    expect(none.innerHTML).toBe('');
    const clean = toStoredAnalysis({ ...fixture.plain, lines: fixture.plain.lines.map((l) => ({ ...l, sarcasm: { ...l.sarcasm, needsReview: false } })) }, {});
    const nothing = await mount(<SarcasmCheck entry={{ ...entry, analysis: clean }} />);
    expect(nothing.innerHTML).toBe('');
  });

  test('"No, I meant it" records a sincere answer, sharing off by default, and clears that question', async () => {
    answerSarcasm.mockResolvedValue();
    const c = await mount(<SarcasmCheck entry={entry} />);
    await click(byText(c, /No, I meant it/));
    expect(answerSarcasm).toHaveBeenCalledTimes(1);
    expect(answerSarcasm.mock.calls[0][0]).toMatchObject({ answer: 'sincere', shareForTraining: false, entry });
    expect(answerSarcasm.mock.calls[0][0].line.text).toBe('I finally got the promotion I worked so hard for!');
    expect(c.textContent).not.toContain('I finally got the promotion I worked so hard for!');
    expect(c.textContent).toContain('Great, another all-hands');
  });

  test('ticking the opt-in is remembered and sent with the next answer', async () => {
    answerSarcasm.mockResolvedValue();
    const c = await mount(<SarcasmCheck entry={entry} />);
    await click(c.querySelector('input[type="checkbox"]'));
    expect(window.localStorage.getItem('emote.sarcasm.shareForTraining')).toBe('1');
    await click(byText(c, /Yes, sarcasm/));
    expect(answerSarcasm.mock.calls[0][0]).toMatchObject({ answer: 'sarcastic', shareForTraining: true });
  });

  test('a failed answer shows an error and keeps the question so she can retry', async () => {
    answerSarcasm.mockRejectedValue(new Error('down'));
    const c = await mount(<SarcasmCheck entry={entry} />);
    await click(byText(c, /Yes, sarcasm/));
    expect(c.textContent).toMatch(/Could not update this entry right now/);
    expect(c.textContent).toContain('I finally got the promotion');
  });

  test('buttons do not trigger the card behind them', async () => {
    answerSarcasm.mockResolvedValue();
    const onCardClick = jest.fn();
    const c = await mount(<div onClick={onCardClick}><SarcasmCheck entry={entry} /></div>);
    await click(byText(c, /Skip/));
    expect(onCardClick).not.toHaveBeenCalled();
  });

  test('compact cards show a chip that opens the question in a dialog', async () => {
    answerSarcasm.mockResolvedValue();
    const c = await mount(<SarcasmCheck entry={entry} compact />);
    expect(c.textContent).toBe('2 lines to check for sarcasm');
    await click(byText(c, /lines to check/));
    expect(document.body.textContent).toContain('Did you mean that sarcastically?');
    expect(document.body.textContent).toContain('Sounds sarcastic');
  });
});

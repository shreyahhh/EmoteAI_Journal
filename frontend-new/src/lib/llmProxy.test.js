/**
 * How the browser talks to the AI proxy: llm-proxy first, the older gemini-proxy
 * only if llm-proxy isn't deployed (404). Exercised through getThemes / getChatResponse.
 */
const mockInvoke = jest.fn();
jest.mock('../supabaseClient', () => ({ supabase: { functions: { invoke: (...a) => mockInvoke(...a) } } }));

const { getThemes, getChatResponse } = require('./gemini');

const reply = (text) => ({ data: { candidates: [{ content: { parts: [{ text }] } }], provider: 'groq' }, error: null });
const httpError = (status) => ({ data: null, error: { name: 'FunctionsHttpError', context: { status } } });

beforeEach(() => {
  mockInvoke.mockReset();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

test('uses llm-proxy and sends the Gemini-shaped payload', async () => {
  mockInvoke.mockResolvedValue(reply('{"themes":["Work","Pride","Rest","Extra"]}'));
  expect(await getThemes('I got promoted')).toEqual(['Work', 'Pride', 'Rest']);
  expect(mockInvoke).toHaveBeenCalledTimes(1);
  const [name, opts] = mockInvoke.mock.calls[0];
  expect(name).toBe('llm-proxy');
  expect(opts.body.payload.contents[0].parts[0].text).toContain('I got promoted');
  expect(opts.body.payload.generationConfig).toEqual({ responseMimeType: 'application/json' });
});

test('falls back to the old gemini-proxy only when llm-proxy is not deployed (404)', async () => {
  mockInvoke.mockResolvedValueOnce(httpError(404)).mockResolvedValueOnce(reply('{"themes":["Work"]}'));
  expect(await getThemes('x')).toEqual(['Work']);
  expect(mockInvoke.mock.calls.map((c) => c[0])).toEqual(['llm-proxy', 'gemini-proxy']);
});

test('other proxy errors (e.g. every provider failed, 502) are NOT retried against gemini-proxy', async () => {
  mockInvoke.mockResolvedValue(httpError(502));
  expect(await getThemes('x')).toBeNull();
  expect(mockInvoke).toHaveBeenCalledTimes(1);
});

test('an empty reply is an error the callers already handle', async () => {
  mockInvoke.mockResolvedValue({ data: { candidates: [] }, error: null });
  expect(await getThemes('x')).toBeNull();
  expect(await getChatResponse('q', 'entries')).toMatch(/couldn't connect/i);
});

test('plain-text chat answers pass through unchanged', async () => {
  mockInvoke.mockResolvedValue(reply('You felt proud on Monday.'));
  expect(await getChatResponse('How was Monday?', 'Monday: promoted')).toBe('You felt proud on Monday.');
  expect(mockInvoke.mock.calls[0][1].body.payload.generationConfig).toBeUndefined();
});

test('hitting the per-user limit (429) gives a friendly chat message and is not retried elsewhere', async () => {
  mockInvoke.mockResolvedValue(httpError(429));
  expect(await getChatResponse('q', 'entries')).toMatch(/usage limit/i);
  expect(mockInvoke).toHaveBeenCalledTimes(1);
});

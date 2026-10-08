/**
 * The model server only answers signed-in users, so the browser must send the Supabase
 * access token with every analysis request, and cope when it can't.
 */
const mockGetSession = jest.fn();
jest.mock('../supabaseClient', () => ({ supabase: { auth: { getSession: (...a) => mockGetSession(...a) } } }));

let analyzeWithModel;
beforeAll(() => {
  process.env.REACT_APP_EMOTE_API_URL = 'http://model.test:8000/';
  ({ analyzeWithModel } = require('./emotionApi'));
});
beforeEach(() => {
  mockGetSession.mockReset();
  global.fetch = jest.fn();
});

const ok = (body) => ({ ok: true, status: 200, json: async () => body });

test('sends the login token and the lines already confirmed as sarcastic', async () => {
  mockGetSession.mockResolvedValue({ data: { session: { access_token: 'tok-123' } } });
  global.fetch.mockResolvedValue(ok({ mood: 'happy' }));
  expect(await analyzeWithModel('hello', { confirmedTexts: ['a line'] })).toEqual({ mood: 'happy' });

  const [url, init] = global.fetch.mock.calls[0];
  expect(url).toBe('http://model.test:8000/analyze'); // trailing slash in the env var is tolerated
  expect(init.headers.Authorization).toBe('Bearer tok-123');
  expect(JSON.parse(init.body)).toEqual({ text: 'hello', sarcasm_confirmed_texts: ['a line'] });
});

test('without a session it sends no Authorization header (the server will answer 401)', async () => {
  mockGetSession.mockResolvedValue({ data: { session: null } });
  global.fetch.mockResolvedValue({ ok: false, status: 401, json: async () => ({}) });
  await expect(analyzeWithModel('hello')).rejects.toThrow('401');
  expect(global.fetch.mock.calls[0][1].headers.Authorization).toBeUndefined();
});

test('rate limited (429) and server errors surface as errors so callers can fall back', async () => {
  mockGetSession.mockResolvedValue({ data: { session: { access_token: 't' } } });
  global.fetch.mockResolvedValue({ ok: false, status: 429, json: async () => ({}) });
  await expect(analyzeWithModel('x')).rejects.toThrow('429');
});

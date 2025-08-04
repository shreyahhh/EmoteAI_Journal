import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Mock Firebase auth since we don't have actual API keys in tests
jest.mock('./firebase', () => ({
  auth: {
    onAuthStateChanged: jest.fn(() => () => {}), // Mock unsubscribe function
  },
  db: {}
}));

// Mock Firebase auth functions
jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn((auth, callback) => {
    // Simulate no user logged in
    setTimeout(() => callback(null), 0);
    return jest.fn(); // Return mock unsubscribe function
  }),
}));

test('renders app without crashing', () => {
  render(<App />);
  
  // Should render the app without errors
  expect(document.body).toBeInTheDocument();
});

test('error boundary provides fallback UI', () => {
  // Test that our error boundary works
  const ErrorBoundary = require('./components/ErrorBoundary').default;
  
  const ThrowError = () => {
    throw new Error('Test error');
  };
  
  const { container } = render(
    <ErrorBoundary>
      <ThrowError />
    </ErrorBoundary>
  );
  
  expect(container.textContent).toContain('Something went wrong');
});

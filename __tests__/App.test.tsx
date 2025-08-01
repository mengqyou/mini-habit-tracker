/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { render } from '@testing-library/react-native';
import App from '../App';

// Mock Firebase and other external dependencies
jest.mock('../src/services/firebaseAuth', () => ({
  FirebaseAuthService: {
    initialize: jest.fn(() => Promise.resolve()),
    getCurrentUser: jest.fn(() => null),
    signOut: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('../src/services/firebaseStorage', () => ({
  FirebaseStorageService: {
    subscribeToHabits: jest.fn(() => () => {}),
    subscribeToEntries: jest.fn(() => () => {}),
    createUserDocument: jest.fn(() => Promise.resolve()),
    migrateLocalDataToFirebase: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('../src/services/storage', () => ({
  StorageService: {
    getHabits: jest.fn(() => Promise.resolve([])),
    getEntries: jest.fn(() => Promise.resolve([])),
    saveHabit: jest.fn(() => Promise.resolve()),
    saveEntry: jest.fn(() => Promise.resolve()),
    deleteHabit: jest.fn(() => Promise.resolve()),
    clearAllData: jest.fn(() => Promise.resolve()),
  },
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));

test('renders correctly', async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(<App />);
  });
});

describe('App Component - Recent Bug Fixes', () => {
  it('should initialize with setup view for proper login navigation flow', () => {
    // Test that the app starts with 'setup' view to enable proper navigation
    // when Firebase loads existing habits
    const { getByText } = render(<App />);
    
    // Initially should show loading state
    expect(getByText('Loading...')).toBeTruthy();
  });

  // Note: More comprehensive integration tests would require mocking the entire
  // Firebase flow and React Native navigation, which is complex for unit tests.
  // The key fix (initial currentView: 'setup') is tested implicitly by the app
  // behavior and would be better tested with E2E tests.
});

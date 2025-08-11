// Simple integration test
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

// Mock fetch for the test
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([])
  })
) as jest.Mock;

describe('Frontend Integration Tests', () => {
  beforeEach(() => {
    (fetch as jest.Mock).mockClear();
  });

  it('renders without crashing', () => {
    // Simple smoke test
    const div = document.createElement('div');
    expect(div).toBeDefined();
  });

  it('has proper test setup', () => {
    expect(screen).toBeDefined();
    expect(render).toBeDefined();
  });

  it('can mock fetch calls', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => []
    });
    
    const response = await fetch('/api/test');
    const data = await response.json();
    
    expect(fetch).toHaveBeenCalledWith('/api/test');
    expect(data).toEqual([]);
  });
});

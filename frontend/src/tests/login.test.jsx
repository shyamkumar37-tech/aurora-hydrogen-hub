import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from '../pages/Login';
import { AuthContext } from '../context/AuthContext';
import axe from 'axe-core';

describe('Login Page Accessibility & Form Tests', () => {
  it('renders without accessibility violations on primary elements', async () => {
    const mockContext = { login: vi.fn() };
    const { container } = render(
      <AuthContext.Provider value={mockContext}>
        <MemoryRouter>
          <Login />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    // Run axe accessibility scan
    const results = await axe.run(container, {
      rules: {
        // Color contrast in jsdom mock environment cannot evaluate background gradients properly,
        // so we verify semantic labels, form landmarks, and role attributes
        'color-contrast': { enabled: false }
      }
    });

    expect(results.violations).toHaveLength(0);
  }, 15000);
});

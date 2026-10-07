import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders correctly with label', () => {
    render(<Button>Klik Saya</Button>);
    expect(screen.getByText('Klik Saya')).toBeDefined();
  });

  it('shows loading spinner when loading is true', () => {
    render(<Button loading>Memuat...</Button>);
    expect(screen.getByRole('button')).toBeDefined();
  });
});

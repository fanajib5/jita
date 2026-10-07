import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatCard } from './StatCard';
import { PLATFORM_STATS } from '../../data/mockData';

describe('StatCard Component with Mock Data', () => {
  it('renders correctly with platform stats', () => {
    render(
      <StatCard
        label="Tingkat Penempatan"
        value={PLATFORM_STATS.placementRate}
        unit="%"
        accent="red"
        sublabel="Persentase lulusan diserap industri Jepang"
      />
    );

    expect(screen.getByText('Tingkat Penempatan')).toBeDefined();
    expect(screen.getByText(String(PLATFORM_STATS.placementRate))).toBeDefined();
    expect(screen.getByText('%')).toBeDefined();
    expect(screen.getByText('Persentase lulusan diserap industri Jepang')).toBeDefined();
  });

  it('renders positive trend correctly', () => {
    render(
      <StatCard
        label="Total Alumni"
        value={PLATFORM_STATS.totalAlumni}
        trend={{ value: '+12% bln ini', positive: true }}
      />
    );

    expect(screen.getByText('Total Alumni')).toBeDefined();
    expect(screen.getByText(String(PLATFORM_STATS.totalAlumni))).toBeDefined();
    expect(screen.getByText('+12% bln ini')).toBeDefined();
    expect(screen.getByText('↑')).toBeDefined();
  });
});

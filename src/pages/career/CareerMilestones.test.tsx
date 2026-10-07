import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CAREER_MILESTONES } from '../../data/mockData';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

describe('Career Milestones UI Integration with Mock Data', () => {
  it('renders alumni career milestones and proactive recommendation correctly', () => {
    render(
      <div>
        {CAREER_MILESTONES.map((item) => (
          <Card key={item.id} className="test-milestone">
            <h3>{item.title}</h3>
            <p>{item.company}</p>
            {item.isProactive && (
              <Badge variant="accent" dot>
                Rekomendasi AI
              </Badge>
            )}
            <p>{item.description}</p>
          </Card>
        ))}
      </div>
    );

    // Verify placement
    expect(screen.getByText('Penempatan Pertama')).toBeDefined();
    expect(screen.getAllByText('Nippon Steel Corporation').length).toBeGreaterThan(0);

    // Verify proactive notification
    expect(screen.getByText('⚡ Rekomendasi JITA: Waktu Negosiasi Kontrak')).toBeDefined();
    expect(screen.getByText('Rekomendasi AI')).toBeDefined();
  });
});

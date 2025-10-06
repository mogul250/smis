import React from 'react';
import { render, screen } from '@testing-library/react';
import StatCard from '../StatCard';
import { FiUsers } from 'react-icons/fi';

describe('StatCard', () => {
  it('renders correctly with all props', () => {
    render(
      <StatCard
        title="Total Users"
        value="150"
        trendValue="+12%"
        trendLabel="from last month"
        icon={FiUsers}
        iconColor="green"
      />
    );

    expect(screen.getByText('Total Users')).toBeInTheDocument();
    expect(screen.getByText('150')).toBeInTheDocument();
    expect(screen.getByText('+12%')).toBeInTheDocument();
    expect(screen.getByText('from last month')).toBeInTheDocument();
  });

  it('renders without optional props', () => {
    render(
      <StatCard
        title="Simple Card"
        value="42"
      />
    );

    expect(screen.getByText('Simple Card')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
  });
});

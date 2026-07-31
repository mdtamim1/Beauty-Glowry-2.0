import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

describe('Simple Button Component', () => {
  it('renders correctly and responds to clicks', () => {
    const handleClick = jest.fn();
    render(<button onClick={handleClick}>Click Me</button>);

    const buttonElement = screen.getByText('Click Me');
    expect(buttonElement).toBeInTheDocument();

    fireEvent.click(buttonElement);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

import React from 'react'
import { render, screen } from '@testing-library/react'

// Prueba de configuración simple
describe('Test Configuration', () => {
  it('should render a simple React component', () => {
    const TestComponent = () => <div>Testing configuration works!</div>
    render(<TestComponent />)

    expect(screen.getByText('Testing configuration works!')).toBeInTheDocument()
  })

  it('should handle CSS classes', () => {
    const TestComponent = () => (
      <div className="test-class bg-green-500">Styled component</div>
    )
    render(<TestComponent />)

    const element = screen.getByText('Styled component')
    expect(element).toHaveClass('test-class', 'bg-green-500')
  })

  it('should handle user interactions', () => {
    const TestComponent = () => {
      const [count, setCount] = React.useState(0)
      return (
        <div>
          <span data-testid="count">{count}</span>
          <button onClick={() => setCount(count + 1)}>Increment</button>
        </div>
      )
    }

    render(<TestComponent />)

    expect(screen.getByTestId('count')).toHaveTextContent('0')
    expect(
      screen.getByRole('button', { name: 'Increment' })
    ).toBeInTheDocument()
  })
})

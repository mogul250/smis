import { render, screen } from '@testing-library/react'
import Card from '../Card'

describe('Card Component', () => {
  it('renders card with children', () => {
    render(
      <Card>
        <div>Card content</div>
      </Card>
    )
    expect(screen.getByText('Card content')).toBeInTheDocument()
  })

  it('applies default styles', () => {
    const { container } = render(<Card>Content</Card>)
    const card = container.firstChild
    expect(card).toHaveClass('bg-white', 'rounded-lg', 'shadow-sm', 'border', 'border-gray-200')
  })

  it('applies custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>)
    const card = container.firstChild
    expect(card).toHaveClass('custom-class')
  })

  it('forwards additional props', () => {
    const { container } = render(<Card data-testid="test-card">Content</Card>)
    const card = container.firstChild
    expect(card).toHaveAttribute('data-testid', 'test-card')
  })

  describe('Card.Header', () => {
    it('renders header with children', () => {
      render(
        <Card>
          <Card.Header>
            <h2>Header content</h2>
          </Card.Header>
        </Card>
      )
      expect(screen.getByText('Header content')).toBeInTheDocument()
    })

    it('applies header styles', () => {
      const { container } = render(
        <Card>
          <Card.Header>Header</Card.Header>
        </Card>
      )
      const header = container.querySelector('.px-6.py-4.border-b.border-gray-200')
      expect(header).toBeInTheDocument()
    })
  })

  describe('Card.Title', () => {
    it('renders title with children', () => {
      render(
        <Card>
          <Card.Title>Card Title</Card.Title>
        </Card>
      )
      expect(screen.getByText('Card Title')).toBeInTheDocument()
    })

    it('applies title styles', () => {
      const { container } = render(
        <Card>
          <Card.Title>Title</Card.Title>
        </Card>
      )
      const title = container.querySelector('.text-lg.font-semibold.text-gray-900')
      expect(title).toBeInTheDocument()
    })
  })

  describe('Card.Content', () => {
    it('renders content with children', () => {
      render(
        <Card>
          <Card.Content>
            <p>Card content</p>
          </Card.Content>
        </Card>
      )
      expect(screen.getByText('Card content')).toBeInTheDocument()
    })

    it('applies content styles', () => {
      const { container } = render(
        <Card>
          <Card.Content>Content</Card.Content>
        </Card>
      )
      const content = container.querySelector('.px-6.py-4')
      expect(content).toBeInTheDocument()
    })
  })

  describe('Card.Footer', () => {
    it('renders footer with children', () => {
      render(
        <Card>
          <Card.Footer>
            <button>Footer button</button>
          </Card.Footer>
        </Card>
      )
      expect(screen.getByText('Footer button')).toBeInTheDocument()
    })

    it('applies footer styles', () => {
      const { container } = render(
        <Card>
          <Card.Footer>Footer</Card.Footer>
        </Card>
      )
      const footer = container.querySelector('.px-6.py-4.border-t.border-gray-200.bg-gray-50')
      expect(footer).toBeInTheDocument()
    })
  })

  it('renders complete card with all components', () => {
    render(
      <Card>
        <Card.Header>
          <Card.Title>Test Card</Card.Title>
        </Card.Header>
        <Card.Content>
          <p>This is the card content</p>
        </Card.Content>
        <Card.Footer>
          <button>Action</button>
        </Card.Footer>
      </Card>
    )

    expect(screen.getByText('Test Card')).toBeInTheDocument()
    expect(screen.getByText('This is the card content')).toBeInTheDocument()
    expect(screen.getByText('Action')).toBeInTheDocument()
  })

  it('maintains proper semantic structure', () => {
    const { container } = render(
      <Card>
        <Card.Header>
          <Card.Title>Accessible Card</Card.Title>
        </Card.Header>
        <Card.Content>
          Content here
        </Card.Content>
      </Card>
    )

    // Check that the structure is maintained
    const card = container.firstChild
    const header = card.firstChild
    const content = card.lastChild

    expect(header).toHaveClass('border-b')
    expect(content).not.toHaveClass('border-b')
  })
})

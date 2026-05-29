import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import FlipCard from './FlipCard'

// Mock lucide-react icons to simple spans
vi.mock('lucide-react', () => ({
  Volume2: (props) => <span data-testid="icon-volume" {...props} />,
  Sparkles: (props) => <span data-testid="icon-sparkles" {...props} />,
  Languages: (props) => <span data-testid="icon-languages" {...props} />,
  Eye: (props) => <span data-testid="icon-eye" {...props} />,
}))

const mockCard = {
  id: 1,
  wo: 'Na nga def?',
  fr: 'Comment vas-tu ?',
  audioWo: '/audio/wo/1.mp3',
  audioFr: '/audio/fr/1.mp3',
}

const mockCardNoAudio = {
  id: 2,
  wo: 'Jaam ngaam',
  fr: 'Je vais bien',
}

describe('FlipCard', () => {
  let mockPlay

  beforeEach(() => {
    mockPlay = vi.fn().mockResolvedValue(undefined)
    // Use a class-style mock so `new Audio()` works
    vi.stubGlobal('Audio', vi.fn(function () {
      this.play = mockPlay
    }))
  })

  it('renders front face with Wolof text by default', () => {
    render(<FlipCard card={mockCard} flipped={false} onFlip={() => {}} />)
    // wo text appears on both faces (front h2 + back span), so use getAllByText
    const woElements = screen.getAllByText('Na nga def?')
    expect(woElements.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Wolof')).toBeInTheDocument()
    expect(screen.getByText('Appuyez pour r\u00e9v\u00e9ler la traduction')).toBeInTheDocument()
  })

  it('renders back face with French text when flipped', () => {
    render(<FlipCard card={mockCard} flipped={true} onFlip={() => {}} />)
    expect(screen.getByText('Comment vas-tu ?')).toBeInTheDocument()
    expect(screen.getByText('Fran\u00e7ais')).toBeInTheDocument()
  })

  it('calls onFlip when card is clicked', () => {
    const onFlip = vi.fn()
    const { container } = render(<FlipCard card={mockCard} flipped={false} onFlip={onFlip} />)
    // Click the outermost div which has the onClick handler
    fireEvent.click(container.firstChild)
    expect(onFlip).toHaveBeenCalledTimes(1)
  })

  it('plays audio when replay button is clicked', () => {
    render(<FlipCard card={mockCard} flipped={false} onFlip={() => {}} />)
    const audioBtn = screen.getByTestId('icon-volume').closest('button')
    fireEvent.click(audioBtn)
    expect(globalThis.Audio).toHaveBeenCalledWith('/audio/wo/1.mp3')
    expect(mockPlay).toHaveBeenCalled()
  })

  it('does not render audio button when card has no audioWo', () => {
    render(<FlipCard card={mockCardNoAudio} flipped={false} onFlip={() => {}} />)
    expect(screen.queryByTestId('icon-volume')).toBeNull()
  })

  it('has iOS-safe backface-visibility styles on both faces', () => {
    const { container } = render(<FlipCard card={mockCard} flipped={false} onFlip={() => {}} />)
    // The flip container (second div) should have willChange
    const flipContainer = container.firstChild.firstChild
    expect(flipContainer.style.willChange).toBe('transform')

    // Both faces should have backface-visibility hidden
    const faces = flipContainer.children
    expect(faces[0].style.backfaceVisibility).toBe('hidden')
    expect(faces[1].style.backfaceVisibility).toBe('hidden')

    // Front face should have translateZ(0)
    expect(faces[0].style.transform).toContain('translateZ')
    // Back face should have rotateY(180deg) translateZ(1px)
    expect(faces[1].style.transform).toContain('rotateY(180deg)')
    expect(faces[1].style.transform).toContain('translateZ(1px)')
  })

  it('applies rotateY(180deg) to flip container when flipped', () => {
    const { container } = render(<FlipCard card={mockCard} flipped={true} onFlip={() => {}} />)
    const flipContainer = container.firstChild.firstChild
    expect(flipContainer.style.transform).toBe('rotateY(180deg)')
  })

  it('applies rotateY(0deg) when not flipped', () => {
    const { container } = render(<FlipCard card={mockCard} flipped={false} onFlip={() => {}} />)
    const flipContainer = container.firstChild.firstChild
    expect(flipContainer.style.transform).toBe('rotateY(0deg)')
  })
})

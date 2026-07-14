import { render, screen, fireEvent } from '@testing-library/react'
import { Pagination } from '../pagination'

describe('Pagination', () => {
  const onPageChange = jest.fn()

  beforeEach(() => {
    onPageChange.mockClear()
  })

  it('renders page numbers', () => {
    render(<Pagination page={1} limit={10} total={50} onPageChange={onPageChange} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('renders prev and next buttons', () => {
    render(<Pagination page={2} limit={10} total={50} onPageChange={onPageChange} />)
    expect(screen.getByText('Anterior')).toBeInTheDocument()
    expect(screen.getByText('Siguiente')).toBeInTheDocument()
  })

  it('highlights current page', () => {
    const { container } = render(
      <Pagination page={3} limit={10} total={50} onPageChange={onPageChange} />,
    )
    const buttons = container.querySelectorAll('button')
    const pageButtons = Array.from(buttons).filter((b) => b.textContent === '3')
    expect(pageButtons[0]).toHaveClass('bg-primary')
  })

  it('calls onPageChange when clicking a page number', () => {
    render(<Pagination page={1} limit={10} total={50} onPageChange={onPageChange} />)
    fireEvent.click(screen.getByText('2'))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('calls onPageChange with prev page', () => {
    render(<Pagination page={3} limit={10} total={50} onPageChange={onPageChange} />)
    fireEvent.click(screen.getByText('Anterior'))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('calls onPageChange with next page', () => {
    render(<Pagination page={1} limit={10} total={50} onPageChange={onPageChange} />)
    fireEvent.click(screen.getByText('Siguiente'))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('disables prev button on first page', () => {
    render(<Pagination page={1} limit={10} total={50} onPageChange={onPageChange} />)
    expect(screen.getByText('Anterior')).toBeDisabled()
  })

  it('disables next button on last page', () => {
    render(<Pagination page={5} limit={10} total={50} onPageChange={onPageChange} />)
    expect(screen.getByText('Siguiente')).toBeDisabled()
  })

  it('shows total count display', () => {
    render(<Pagination page={1} limit={10} total={50} onPageChange={onPageChange} />)
    expect(screen.getByText(/50 resultados/)).toBeInTheDocument()
  })

  it('returns null when totalPages is 1 or less', () => {
    const { container } = render(
      <Pagination page={1} limit={10} total={5} onPageChange={onPageChange} />,
    )
    expect(container.firstChild).toBeNull()
  })
})

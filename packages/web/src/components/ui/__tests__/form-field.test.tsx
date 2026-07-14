import { render, screen, fireEvent } from '@testing-library/react'
import { FormField, Input, Select } from '../form-field'

describe('FormField', () => {
  it('renders label and children', () => {
    render(
      <FormField label="Nombre">
        <input data-testid="child" />
      </FormField>,
    )
    expect(screen.getByText('Nombre')).toBeInTheDocument()
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('renders error message', () => {
    render(
      <FormField label="Nombre" error="Campo requerido">
        <input />
      </FormField>,
    )
    expect(screen.getByText('Campo requerido')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <FormField label="Nombre" className="custom">
        <input />
      </FormField>,
    )
    expect(container.firstChild).toHaveClass('custom')
  })
})

describe('Input', () => {
  it('renders and accepts value change', () => {
    const handleChange = jest.fn()
    render(<Input data-testid="input" onChange={handleChange} />)
    const input = screen.getByTestId('input')
    fireEvent.change(input, { target: { value: 'test' } })
    expect(handleChange).toHaveBeenCalled()
  })

  it('shows hasError styling', () => {
    const { container } = render(<Input hasError />)
    const input = container.querySelector('input')
    expect(input).toHaveClass('border-destructive')
  })

  it('uses default border when no error', () => {
    const { container } = render(<Input />)
    const input = container.querySelector('input')
    expect(input).toHaveClass('border-input')
  })
})

describe('Select', () => {
  const options = [
    { value: '1', label: 'Uno' },
    { value: '2', label: 'Dos' },
  ]

  it('renders options', () => {
    render(<Select options={options} />)
    expect(screen.getByText('Uno')).toBeInTheDocument()
    expect(screen.getByText('Dos')).toBeInTheDocument()
  })

  it('renders placeholder', () => {
    render(<Select options={options} placeholder="Seleccione" />)
    expect(screen.getByText('Seleccione')).toBeInTheDocument()
  })

  it('handles selection', () => {
    const handleChange = jest.fn()
    render(<Select options={options} data-testid="select" onChange={handleChange} />)
    const select = screen.getByTestId('select')
    fireEvent.change(select, { target: { value: '2' } })
    expect(handleChange).toHaveBeenCalled()
  })

  it('shows hasError styling', () => {
    const { container } = render(<Select options={options} hasError />)
    const select = container.querySelector('select')
    expect(select).toHaveClass('border-destructive')
  })
})

import { render } from '@testing-library/react'
import { Spinner } from '../spinner'

describe('Spinner', () => {
  it('renders', () => {
    const { container } = render(<Spinner />)
    expect(container.firstChild).toBeInTheDocument()
  })

  it('has animate-spin class', () => {
    const { container } = render(<Spinner />)
    const spinnerDiv = container.querySelector('.animate-spin')
    expect(spinnerDiv).toBeInTheDocument()
  })
})

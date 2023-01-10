import { Principal } from '@modules/auth'
import { expect } from 'chai'

describe('Principal', () => {
  it('should throw error on bad resource id', () => {
    const principal = new Principal(undefined)
    expect(() => principal.isResourceOwner(123)).to.throw('Bad resource id')
  })

  it('should return false for isInRole if details undefined', async () => {
    const principal = new Principal(undefined)
    expect(await principal.isInRole('admin')).to.equal(false)
  })
})

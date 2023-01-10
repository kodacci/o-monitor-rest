import { ResourceId } from '@modules/auth/resource-id'
import { expect } from 'chai'

describe('ResourceId', () => {
  it('should get path and method from resource id', () => {
    const path = '/test/path'
    const method = 'POST'
    const id = new ResourceId(path, method)

    expect(id.getPath()).to.equal(path)
    expect(id.getMethod()).to.equal(method)
  })
})

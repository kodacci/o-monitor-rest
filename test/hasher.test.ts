import { Hasher } from '@modules/auth'
import crypto, { BinaryLike } from 'node:crypto'

describe('Hasher', () => {
  it('should reject promise on pbkdf2 error', async () => {
    const hasher = new Hasher()

    jest
      .spyOn(crypto, 'pbkdf2')
      .mockImplementationOnce(
        (
          _arg1: BinaryLike,
          _arg2: BinaryLike,
          _arg3: number,
          _arg4: number,
          _arg5: string,
          cb: (err: Error | null, hash: Buffer) => void
        ) => cb(new Error('Dummy error'), Buffer.from(''))
      )

    await expect(hasher.pbkdf2('', '')).rejects.toEqual(
      new Error('Error hashing password: Dummy error')
    )
  })
})

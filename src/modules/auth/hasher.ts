import crypto from 'node:crypto'

export class Hasher {
  private static readonly SALT_BYTES_LENGTH = 256
  private static readonly CYPHER_ITERATIONS = 10000
  private static readonly CYPHER_KEY_LENGTH = 512
  private static readonly CYPHER_DIGEST = 'sha512'

  pbkdf2(password: string, salt: string): Promise<string> {
    return new Promise((resolve, reject) =>
      crypto.pbkdf2(
        password,
        salt,
        Hasher.CYPHER_ITERATIONS,
        Hasher.CYPHER_KEY_LENGTH,
        Hasher.CYPHER_DIGEST,
        (err, hash) => {
          if (err) {
            reject(new Error(`Error hashing password: ${err.message}`))
          } else {
            resolve(hash.toString('hex'))
          }
        }
      )
    )
  }

  async hash(value: string): Promise<string> {
    const salt = crypto.randomBytes(Hasher.SALT_BYTES_LENGTH).toString('hex')
    const hash = await this.pbkdf2(value, salt)

    return `${salt}:${hash}`
  }
}

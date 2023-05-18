import bcrypt from 'bcrypt'

export class Hasher {
  private static readonly SALT_ROUNDS = 10

  hash(value: string): Promise<string> {
    return bcrypt.hash(value, Hasher.SALT_ROUNDS)
  }

  compare(value: string, encrypted: string): Promise<boolean> {
    return bcrypt.compare(value, encrypted)
  }
}

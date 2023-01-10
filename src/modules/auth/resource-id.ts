export class ResourceId {
  constructor(private readonly path: string, private readonly method: string) {}

  getPath(): string {
    return this.path
  }

  getMethod(): string {
    return this.method
  }
}

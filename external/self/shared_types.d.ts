declare module '@koishijs/plugin-console' {
  interface Events {
    'docs/add-category'(name: string): Promise<boolean>
    'docs/get-categories'(): Promise<Array<{ id: number, category: string, enabled: boolean }>>
    'docs/remove-category'(category: string): Promise<boolean>
    'docs/get-docs'(category: string): Promise<Array<{ id: string, content: string, [key: string]: any }>>
    'docs/add-doc'(params: { category: string, content: string, metadata?: Record<string, any> }): Promise<boolean>
    'docs/update-doc'(params: { category: string, id: string, content: string, metadata?: Record<string, any> }): Promise<boolean>
    'docs/remove-doc'(category: string, id: string): Promise<boolean>
    'docs/rebuild-embeddings'(category: string): Promise<boolean>
  }
}

export { }
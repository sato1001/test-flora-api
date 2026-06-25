export interface DictionaryProvider {
  getDefinition(word: string): Promise<any>;
}

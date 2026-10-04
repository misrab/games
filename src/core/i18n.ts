type Messages = Record<string, string>;

const bundles: Messages[] = [];
let locale = 'en';

export function setLocale(next: string): void {
  locale = next;
}

export function registerMessages(messages: Messages): void {
  bundles.push(messages);
}

export function t(key: string, vars?: Record<string, string | number>): string {
  for (const bundle of bundles) {
    const value = bundle[key];
    if (value !== undefined) {
      if (!vars) return value;
      return value.replace(/\{(\w+)\}/g, (_, k: string) => String(vars[k] ?? `{${k}}`));
    }
  }
  return key;
}

export function getLocale(): string {
  return locale;
}

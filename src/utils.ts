import pc from 'picocolors';

export const colors = {
  red: pc.red,
  green: pc.green,
  yellow: pc.yellow,
  blue: pc.blue,
  cyan: pc.cyan,
  gray: pc.gray,
  bold: pc.bold,
};

export function getTreblleAsciiArt(): string {
  const art = `
████████╗██████╗ ███████╗██████╗ ██╗     ██╗     ███████╗
╚══██╔══╝██╔══██╗██╔════╝██╔══██╗██║     ██║     ██╔════╝
   ██║   ██████╔╝█████╗  ██████╔╝██║     ██║     █████╗  
   ██║   ██╔══██╗██╔══╝  ██╔══██╗██║     ██║     ██╔══╝  
   ██║   ██║  ██║███████╗██████╔╝███████╗███████╗███████╗
   ╚═╝   ╚═╝  ╚═╝╚══════╝╚═════╝ ╚══════╝╚══════╝╚══════╝
`;
  
  return colors.cyan(art);
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as unknown as T;
  if (Array.isArray(obj)) return obj.map(deepClone) as unknown as T;
  if (typeof obj === 'object') {
    const cloned = {} as Record<string, unknown>;
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        cloned[key] = deepClone(obj[key]);
      }
    }
    return cloned as T;
  }
  return obj;
}

export function countNestedKey(obj: unknown, key: string): number {
  let count = 0;
  
  if (isObject(obj)) {
    if (key in obj) count++;
    for (const value of Object.values(obj)) {
      count += countNestedKey(value, key);
    }
  } else if (Array.isArray(obj)) {
    for (const item of obj) {
      count += countNestedKey(item, key);
    }
  }
  
  return count;
}
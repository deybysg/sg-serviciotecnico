// Convierte un string de snake_case a camelCase
function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Convierte las keys de un objeto de snake_case a camelCase
export function keysToCamelCase(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(keysToCamelCase);
  }
  if (typeof obj !== 'object') return obj;

  const result = {};
  for (const key of Object.keys(obj)) {
    const camelKey = toCamelCase(key);
    result[camelKey] = keysToCamelCase(obj[key]);
  }
  return result;
}

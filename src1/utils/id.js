// Utilidad para mostrar IDs cortos en la UI sin afectar el ID real
export const shortId = (id, length = 6) => {
  const str = String(id ?? "");
  if (!str) return "";
  return str.slice(-Math.max(1, Math.min(32, length))).toUpperCase();
};

// Opción: normalizar a string (útil para comparaciones)
export const toIdString = (id) => String(id ?? "");

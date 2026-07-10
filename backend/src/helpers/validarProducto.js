import { body } from "express-validator";

const CATEGORIAS_VALIDAS = [
    "accesorio para auto",
    "articulos de belleza",
    "auriculares",
    "cables usb",
    "camaras",
    "cargadores",
    "celulares",
    "deporte",
    "hogar",
    "juguetes",
    "linternas",
    "mouse",
    "otros",
    "parlantes",
    "perifericos",
    "varios"
];

export const validarProducto = [
	body("nombre", "El nombre es obligatorio").notEmpty().isLength({ min: 2 }),
	body("categoria", `La categoría es obligatoria y debe ser una de: ${CATEGORIAS_VALIDAS.join(", ")}`).notEmpty().isIn(CATEGORIAS_VALIDAS),
	body("precio", "El precio es obligatorio y debe ser mayor a 0 y numerico").notEmpty().isNumeric().custom((value) => value > 0),
	body("stock", "El stock es obligatorio y debe ser numerico").notEmpty().isNumeric(),
	body("descripcion", "La descripción debe ser texto").optional().isString(),
	body("imagen", "La imagen es obligatoria y debe ser una URL válida").notEmpty().isURL()
];

import { body } from "express-validator";

const CATEGORIAS_VALIDAS = [
    "celulares",
    "computadoras",
    "audio",
    "accesorios",
    "componentes",
    "perifericos",
    "auriculares",
    "parlantes",
    "cargadores",
    "hogar",
    "camaras",
    "linternas",
    "cables usb",
    "mouse",
    "accesorio para auto",
    "varios",
    "otros"
];

export const validarProducto = [
	body("nombre", "El nombre es obligatorio").notEmpty().isLength({ min: 2 }),
	body("categoria", `La categoría es obligatoria y debe ser una de: ${CATEGORIAS_VALIDAS.join(", ")}`).notEmpty().isIn(CATEGORIAS_VALIDAS),
	body("precio", "El precio es obligatorio y debe ser mayor a 0 y numerico").notEmpty().isNumeric().custom((value) => value > 0),
	body("stock", "El stock es obligatorio y debe ser numerico").notEmpty().isNumeric(),
	body("descripcion", "La descripción es obligatoria y debe tener al menos 5 caracteres").notEmpty().isLength({ min: 5 }),
	body("imagen", "La imagen es obligatoria y debe ser una URL válida").notEmpty().isURL()
];

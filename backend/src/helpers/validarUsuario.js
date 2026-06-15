import { body } from "express-validator";

export const validarUsuario = [
  body("username", "El nombre de usuario es obligatorio").notEmpty().isLength({ min: 3 }),
  body("password", "La contraseña es obligatoria y debe tener al menos 6 caracteres").notEmpty().isLength({ min: 6 }),
  body("role", "El rol es obligatorio y debe ser 'admin', 'user' o 'superadmin'").notEmpty().isIn(["admin", "user", "superadmin"])
];

// Para actualización: password opcional, pero si viene debe tener mínimo 6
export const validarUsuarioUpdate = [
  body("username", "El nombre de usuario es obligatorio").notEmpty().isLength({ min: 3 }),
  body("role", "El rol es obligatorio y debe ser 'admin', 'user' o 'superadmin'").notEmpty().isIn(["admin", "user", "superadmin"]),
  body("password")
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ min: 6 })
    .withMessage("La contraseña debe tener al menos 6 caracteres")
];

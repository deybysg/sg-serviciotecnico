import { Schema, model } from "mongoose";

const cartsSchema = new Schema({
  _id: { type: String, required: true }, // igual al username para compatibilidad
  username: { type: String, required: true },
  items: [{
    id: { type: String },
    nombre: { type: String },
    categoria: { type: String },
    precio: { type: Number },
    cantidad: { type: Number },
    stock: { type: Number },
    imagen: { type: String },
    descripcion: { type: String }
  }],
  updatedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => new Date(Date.now() + 24 * 60 * 60 * 1000) } // 24 horas desde ahora
}, {
  _id: false, // deshabilitamos auto-generación de _id para usar nuestro string
  timestamps: false
});

const CartsModel = model("carts", cartsSchema);
export default CartsModel;

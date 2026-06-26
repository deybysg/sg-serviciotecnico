import { Schema, model } from "mongoose";

const CATEGORIAS_VALIDAS = [
  "accesorio para auto",
  "auriculares",
  "cables usb",
  "camaras",
  "cargadores",
  "celulares",
  "hogar",
  "linternas",
  "mouse",
  "otros",
  "parlantes",
  "perifericos",
  "varios"
];

const productosSchema = new Schema({
  codigo: { type: String, required: true, unique: true },
  nombre: { type: String, required: true },
  categoria: {
    type: String,
    required: true,
    enum: CATEGORIAS_VALIDAS
  },
  precio: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
  descripcion: { type: String, required: true },
  imagen: { type: String, required: true },
}, {
  timestamps: true
});


const ProductosModel = model("productos", productosSchema);
export default ProductosModel;

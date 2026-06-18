import { Schema, model } from "mongoose";

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

const productosSchema = new Schema({
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

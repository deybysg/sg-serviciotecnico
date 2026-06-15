import { Schema, model } from "mongoose";

const productosSchema = new Schema({
  nombre: { type: String, required: true },
  categoria: { 
    type: String, 
    required: true,
    enum: ["celulares", "computadoras", "accesorios"]
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

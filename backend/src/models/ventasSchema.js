import { Schema, model } from "mongoose";

const ventasSchema = new Schema({
  username: { type: String, required: true },
  fechaCompra: { type: Date, required: true },
  totalVenta: { type: Number, required: true },
  metodoPago: { type: String, required: true },
  estado: { 
    type: String, 
    required: true,
    enum: ["Completado", "Cancelado"],
    default: "Completado"
  },
  productosComprados: [{
    productId: { type: String },
    nombre: { type: String, required: true },
    categoria: { type: String },
    precioUnitario: { type: Number, required: true },
    cantidad: { type: Number, required: true },
    subtotal: { type: Number, required: true }
  }]
}, {
  timestamps: true
});

const VentasModel = model("ventas", ventasSchema);
export default VentasModel;

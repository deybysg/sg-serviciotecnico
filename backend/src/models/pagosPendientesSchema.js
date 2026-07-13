import { Schema, model } from "mongoose";

const pagosPendientesSchema = new Schema({
  usuario: { type: Schema.Types.ObjectId, ref: "usuarios" },
  username: { type: String, required: true },
  fechaCompra: { type: Date, required: true },
  totalVenta: { type: Number, required: true },
  comprobante: { type: String, required: true },
  productosComprados: [{
    productId: { type: String },
    nombre: { type: String, required: true },
    categoria: { type: String },
    precioUnitario: { type: Number, required: true },
    cantidad: { type: Number, required: true },
    subtotal: { type: Number, required: true }
  }],
  estado: { 
    type: String, 
    enum: ["Pendiente", "Aceptado", "Rechazado"],
    default: "Pendiente"
  },
  notasAdmin: { type: String, default: "" },
  revisadoPor: { type: String, default: "" },
  fechaRevision: { type: Date }
}, {
  timestamps: true
});

const PagosPendientesModel = model("pagosPendientes", pagosPendientesSchema);
export default PagosPendientesModel;

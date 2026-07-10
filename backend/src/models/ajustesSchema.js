import { Schema, model } from "mongoose";

const ajustesSchema = new Schema({
  productoId: { type: Schema.Types.ObjectId, ref: "productos", required: true },
  productoNombre: { type: String, required: true },
  productoCodigo: { type: String, required: true },
  tipo: { 
    type: String, 
    required: true, 
    enum: ["modificacion", "ajuste_stock", "ajuste_precio", "creacion"],
    default: "modificacion"
  },
  cambios: { type: Schema.Types.Mixed, default: {} },
  stockAnterior: { type: Number, default: 0 },
  stockNuevo: { type: Number, default: 0 },
  precioAnterior: { type: Number, default: 0 },
  precioNuevo: { type: Number, default: 0 },
  motivo: { type: String, default: "" },
  usuario: { type: String, required: true },
}, {
  timestamps: true
});

const AjustesModel = model("ajustes", ajustesSchema);
export default AjustesModel;

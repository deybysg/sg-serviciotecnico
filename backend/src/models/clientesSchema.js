import { Schema, model } from "mongoose";

const clientesSchema = new Schema({
  nombreCompleto: { type: String, required: true },
  celular: { type: String, required: true },
  correo: { type: String, required: false, default: '' },
  direccion: { type: String, required: false, default: '' },
  dni: { type: String, required: false, default: '' },
  serviciosRealizados: [{ type: Schema.Types.ObjectId, ref: 'servicios' }]
}, {
  timestamps: true
});

const ClientesModel = model("clientes", clientesSchema);
export default ClientesModel;

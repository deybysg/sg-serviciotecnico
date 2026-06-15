import { Schema, model } from "mongoose";

const serviciosSchema = new Schema({
  servicioNumero: { type: Number, unique: true },
  cliente: { type: Schema.Types.ObjectId, ref: 'clientes', required: true },
  tipoEquipo: { type: String, required: false, default: '' },
  marcaProducto: { type: String, required: true },
  modeloProducto: { type: String, required: false, default: '' },
  tipoServicio: { 
    type: String, 
    required: true,
    enum: ["reparacion", "mantenimiento", "instalacion", "otro"]
  },
  fallaReportada: { type: String, required: false, default: '' },
  asunto: { type: String, required: false, default: '' },
  detalles: { type: String, required: false, default: '' },
  notasAdicionales: { type: String, required: false, default: '' },
  metodoPago: { type: String, required: false, default: '' },
  anticipo: { type: Number, default: 0 },
  presupuesto: {
    items: [{
      descripcion: { type: String },
      costo: { type: Number }
    }],
    subtotal: { type: Number, default: 0 },
    iva: { type: Number, default: 0 },
    total: { type: Number, default: 0 }
  },
  estado: { 
    type: String, 
    required: true,
    enum: ["pendiente","enRevision","diagnostico","notificacion","sinSolucion","reparacion","terminado","entregado","presupuestoPendiente","revisionTerminada"],
    default: "pendiente"
  },
  detalleCliente: { type: String, default: null },
  seguimiento: [{
    tipo: { type: String },
    mensaje: { type: String },
    autor: { type: String, default: 'taller' },
    fecha: { type: Date, default: Date.now }
  }],
  fechaEntrada: { type: Date, required: true },
  fechaSalida: { type: Date, default: null }
}, {
  timestamps: true
});

// Middleware pre-save para generar servicioNumero automáticamente
serviciosSchema.pre('save', async function(next) {
  if (!this.servicioNumero) {
    try {
      // Buscar el último servicio y sumar 1
      const ultimoServicio = await this.constructor.findOne({}, {}, { sort: { 'servicioNumero': -1 } });
      this.servicioNumero = ultimoServicio ? ultimoServicio.servicioNumero + 1 : 100; // Comienza en 100
    } catch (error) {
      return next(error);
    }
  }
  next();
});

const ServiciosModel = model("servicios", serviciosSchema);
export default ServiciosModel;

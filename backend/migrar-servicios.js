import mongoose from 'mongoose';
import ServiciosModel from './src/models/serviciosSchema.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ServicioTecnico';

async function migrarServicios() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado a MongoDB');

        // Obtener todos los servicios sin servicioNumero
        const serviciosSinNumero = await ServiciosModel.find({ servicioNumero: { $exists: false } }).sort({ createdAt: 1 });
        
        console.log(`📋 Encontrados ${serviciosSinNumero.length} servicios sin número`);

        if (serviciosSinNumero.length === 0) {
            console.log('✅ Todos los servicios ya tienen número asignado');
            await mongoose.disconnect();
            return;
        }

        // Asignar números secuenciales comenzando en 100
        let numeroActual = 100;
        
        for (const servicio of serviciosSinNumero) {
            servicio.servicioNumero = numeroActual;
            await servicio.save();
            console.log(`✅ Servicio ${servicio._id} → N° ${numeroActual}`);
            numeroActual++;
        }

        console.log(`\n🎉 Migración completada. ${serviciosSinNumero.length} servicios actualizados.`);
        console.log(`📊 Rango de números asignados: 100 - ${numeroActual - 1}`);

        await mongoose.disconnect();
        console.log('👋 Desconectado de MongoDB');
    } catch (error) {
        console.error('❌ Error en la migración:', error);
        process.exit(1);
    }
}

migrarServicios();

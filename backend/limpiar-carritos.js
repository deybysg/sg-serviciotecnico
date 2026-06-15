import mongoose from 'mongoose';
import 'dotenv/config';
import CartsModel from './src/models/cartsSchema.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ServicioTecnico';

async function limpiarCarritos() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    console.log('🧹 Limpiando todos los carritos...');
    const result = await CartsModel.updateMany(
      {},
      { 
        $set: { 
          items: [],
          updatedAt: new Date(),
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
        }
      }
    );
    
    console.log(`✅ ${result.modifiedCount} carritos limpiados\n`);
    console.log('🎉 Todos los carritos ahora están vacíos. Cada usuario puede empezar de cero.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

limpiarCarritos();

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ServicioTecnico';

// Capitaliza la primera letra de cada palabra
function capitalizeWords(str) {
    if (!str || typeof str !== 'string') return str;
    return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

async function capitalizarDatos() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Conectado a MongoDB');

        const db = mongoose.connection.db;

        // ===== MIGRAR CLIENTES =====
        console.log('\n📦 Migrando clientes...');
        const clientes = await db.collection('clientes').find({}).toArray();
        console.log(`📋 Encontrados ${clientes.length} clientes`);

        let clientesActualizados = 0;
        for (const cliente of clientes) {
            const nombreNuevo = capitalizeWords(cliente.nombreCompleto);
            const direccionNueva = capitalizeWords(cliente.direccion);

            if (cliente.nombreCompleto !== nombreNuevo || cliente.direccion !== direccionNueva) {
                await db.collection('clientes').updateOne(
                    { _id: cliente._id },
                    { $set: { nombreCompleto: nombreNuevo, direccion: direccionNueva } }
                );
                clientesActualizados++;
                console.log(`  ✅ ${cliente.nombreCompleto} → ${nombreNuevo}`);
            }
        }
        console.log(`📊 Clientes actualizados: ${clientesActualizados}/${clientes.length}`);

        // ===== MIGRAR SERVICIOS =====
        console.log('\n📦 Migrando servicios...');
        const servicios = await db.collection('servicios').find({}).toArray();
        console.log(`📋 Encontrados ${servicios.length} servicios`);

        let serviciosActualizados = 0;
        for (const servicio of servicios) {
            const updates = {};

            if (servicio.marcaProducto) {
                const nuevo = capitalizeWords(servicio.marcaProducto);
                if (servicio.marcaProducto !== nuevo) updates.marcaProducto = nuevo;
            }

            if (servicio.modeloProducto) {
                const nuevo = capitalizeWords(servicio.modeloProducto);
                if (servicio.modeloProducto !== nuevo) updates.modeloProducto = nuevo;
            }

            if (servicio.fallaReportada) {
                const nuevo = capitalizeWords(servicio.fallaReportada);
                if (servicio.fallaReportada !== nuevo) updates.fallaReportada = nuevo;
            }

            if (servicio.asunto) {
                const nuevo = capitalizeWords(servicio.asunto);
                if (servicio.asunto !== nuevo) updates.asunto = nuevo;
            }

            if (servicio.detalles) {
                const nuevo = capitalizeWords(servicio.detalles);
                if (servicio.detalles !== nuevo) updates.detalles = nuevo;
            }

            if (servicio.notasAdicionales) {
                const nuevo = capitalizeWords(servicio.notasAdicionales);
                if (servicio.notasAdicionales !== nuevo) updates.notasAdicionales = nuevo;
            }

            if (Object.keys(updates).length > 0) {
                await db.collection('servicios').updateOne(
                    { _id: servicio._id },
                    { $set: updates }
                );
                serviciosActualizados++;
                console.log(`  ✅ Servicio #${servicio.servicioNumero || servicio._id} actualizado`);
            }
        }
        console.log(`📊 Servicios actualizados: ${serviciosActualizados}/${servicios.length}`);

        // ===== MIGRAR PRODUCTOS =====
        console.log('\n📦 Migrando productos...');
        const productos = await db.collection('productos').find({}).toArray();
        console.log(`📋 Encontrados ${productos.length} productos`);

        let productosActualizados = 0;
        for (const producto of productos) {
            const updates = {};

            if (producto.nombre) {
                const nuevo = capitalizeWords(producto.nombre);
                if (producto.nombre !== nuevo) updates.nombre = nuevo;
            }

            if (producto.descripcion) {
                const nuevo = capitalizeWords(producto.descripcion);
                if (producto.descripcion !== nuevo) updates.descripcion = nuevo;
            }

            if (Object.keys(updates).length > 0) {
                await db.collection('productos').updateOne(
                    { _id: producto._id },
                    { $set: updates }
                );
                productosActualizados++;
                console.log(`  ✅ Producto "${producto.nombre}" actualizado`);
            }
        }
        console.log(`📊 Productos actualizados: ${productosActualizados}/${productos.length}`);

        console.log('\n🎉 Migración completada exitosamente');

        await mongoose.disconnect();
        console.log('👋 Desconectado de MongoDB');
    } catch (error) {
        console.error('❌ Error en la migración:', error);
        process.exit(1);
    }
}

capitalizarDatos();

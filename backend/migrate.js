import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import 'dotenv/config';

// Import models
import UsuariosModel from './src/models/usuariosSchema.js';
import ProductosModel from './src/models/productosSchema.js';
import ClientesModel from './src/models/clientesSchema.js';
import ServiciosModel from './src/models/serviciosSchema.js';
import VentasModel from './src/models/ventasSchema.js';
import CartsModel from './src/models/cartsSchema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Conectar a MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ServicioTecnico';

async function migrateData() {
  try {
    console.log('🔌 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');

    // Leer db.json
    const dbJsonPath = path.join(__dirname, '..', 'db.json');
    const dbData = JSON.parse(fs.readFileSync(dbJsonPath, 'utf-8'));

    // Limpiar colecciones existentes (opcional, comentá estas líneas si querés mantener datos)
    console.log('🧹 Limpiando colecciones...');
    await UsuariosModel.deleteMany({});
    await ProductosModel.deleteMany({});
    await ClientesModel.deleteMany({});
    await ServiciosModel.deleteMany({});
    await VentasModel.deleteMany({});
    await CartsModel.deleteMany({});
    console.log('✅ Colecciones limpiadas\n');

    // 1. MIGRAR USUARIOS
    console.log('👥 Migrando usuarios...');
    const usuariosMap = {}; // para mapear id legado a _id Mongo
    
    for (const user of dbData.Usuarios) {
      // Hashear contraseña (si es muy corta, usar mínimo "123456")
      const plainPassword = user.password.length < 3 ? '123456' : user.password;
      const hashedPassword = await bcrypt.hash(plainPassword, 10);
      
      const nuevoUsuario = new UsuariosModel({
        username: user.username,
        password: hashedPassword,
        role: user.role,
        isProtected: user.isProtected || false
      });
      
      const saved = await nuevoUsuario.save();
      usuariosMap[user.id] = saved._id;
      console.log(`  ✓ ${user.username} (role: ${user.role})`);
    }
    console.log(`✅ ${dbData.Usuarios.length} usuarios migrados\n`);

    // 2. MIGRAR PRODUCTOS
    console.log('📦 Migrando productos...');
    const productosMap = {};
    
    for (const prod of dbData.productos) {
      const nuevoProducto = new ProductosModel({
        nombre: prod.nombre,
        categoria: prod.categoria,
        precio: prod.precio,
        stock: prod.stock || 0,
        descripcion: prod.descripcion,
        imagen: prod.imagen
      });
      
      const saved = await nuevoProducto.save();
      productosMap[prod.id] = saved._id;
      console.log(`  ✓ ${prod.nombre} (${prod.categoria})`);
    }
    console.log(`✅ ${dbData.productos.length} productos migrados\n`);

    // 3. MIGRAR CLIENTES
    console.log('👤 Migrando clientes...');
    const clientesMap = {};
    
    for (const cliente of dbData.clientes) {
      const nuevoCliente = new ClientesModel({
        nombreCompleto: cliente.nombreCompleto,
        celular: cliente.celular,
        correo: cliente.correo,
        direccion: cliente.direccion,
        serviciosRealizados: [] // se llenará después de migrar servicios
      });
      
      const saved = await nuevoCliente.save();
      clientesMap[cliente.id] = saved._id;
      console.log(`  ✓ ${cliente.nombreCompleto}`);
    }
    console.log(`✅ ${dbData.clientes.length} clientes migrados\n`);

    // 4. MIGRAR SERVICIOS
    console.log('🔧 Migrando servicios...');
    const serviciosMap = {};
    
    for (const servicio of dbData.servicios) {
      const clienteObjectId = clientesMap[servicio.clienteId];
      
      if (!clienteObjectId) {
        console.log(`  ⚠️  Servicio ${servicio.id} sin cliente válido, saltando...`);
        continue;
      }
      
      const nuevoServicio = new ServiciosModel({
        cliente: clienteObjectId,
        marcaProducto: servicio.marcaProducto,
        tipoServicio: servicio.tipoServicio,
        detalles: servicio.detalles,
        presupuesto: servicio.presupuesto,
        estado: servicio.estado,
        fechaEntrada: new Date(servicio.fechaEntrada),
        fechaSalida: servicio.fechaSalida ? new Date(servicio.fechaSalida) : null
      });
      
      const saved = await nuevoServicio.save();
      serviciosMap[servicio.id] = saved._id;
      
      // Actualizar serviciosRealizados del cliente
      await ClientesModel.findByIdAndUpdate(
        clienteObjectId,
        { $push: { serviciosRealizados: saved._id } }
      );
      
      console.log(`  ✓ Servicio ${servicio.tipoServicio} para cliente ${servicio.clienteId}`);
    }
    console.log(`✅ ${Object.keys(serviciosMap).length} servicios migrados\n`);

    // 5. MIGRAR VENTAS
    console.log('💰 Migrando ventas...');
    
    for (const venta of dbData.ventas) {
      const nuevaVenta = new VentasModel({
        username: venta.username,
        fechaCompra: new Date(venta.fechaCompra),
        totalVenta: venta.totalVenta,
        metodoPago: venta.metodoPago,
        estado: venta.estado,
        productosComprados: venta.productosComprados
      });
      
      await nuevaVenta.save();
      console.log(`  ✓ Venta de ${venta.username} - $${venta.totalVenta}`);
    }
    console.log(`✅ ${dbData.ventas.length} ventas migradas\n`);

    // 6. MIGRAR CARTS (deduplicar por username)
    console.log('🛒 Migrando carritos...');
    const cartsDeduplicados = {};
    
    // Deduplicar: quedarse con el más reciente por username
    for (const cart of dbData.carts) {
      const existing = cartsDeduplicados[cart.username];
      if (!existing || new Date(cart.updatedAt) > new Date(existing.updatedAt)) {
        cartsDeduplicados[cart.username] = cart;
      }
    }
    
    for (const username in cartsDeduplicados) {
      const cart = cartsDeduplicados[username];
      
      const nuevoCart = new CartsModel({
        _id: username, // usar username como _id
        username: username,
        items: cart.items || [],
        updatedAt: new Date(cart.updatedAt)
      });
      
      await nuevoCart.save();
      console.log(`  ✓ Carrito de ${username}`);
    }
    console.log(`✅ ${Object.keys(cartsDeduplicados).length} carritos migrados (deduplicados)\n`);

    console.log('🎉 ¡Migración completada exitosamente!');
    console.log('\n📊 Resumen:');
    console.log(`  - Usuarios: ${dbData.Usuarios.length}`);
    console.log(`  - Productos: ${dbData.productos.length}`);
    console.log(`  - Clientes: ${dbData.clientes.length}`);
    console.log(`  - Servicios: ${Object.keys(serviciosMap).length}`);
    console.log(`  - Ventas: ${dbData.ventas.length}`);
    console.log(`  - Carritos: ${Object.keys(cartsDeduplicados).length}`);

  } catch (error) {
    console.error('❌ Error en la migración:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Desconectado de MongoDB');
  }
}

// Ejecutar migración
migrateData();

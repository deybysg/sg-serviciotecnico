// Test simple de endpoints de autenticación
// Ejecutar con: node test-auth.js

const BASE_URL = 'http://localhost:4000/api';

// 1. TEST LOGIN
async function testLogin() {
  console.log('\n🔐 Probando LOGIN con superadmin...');
  
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'superadmin',
        password: '1234'
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Login exitoso!');
      console.log('Token:', data.token.substring(0, 50) + '...');
      console.log('Usuario:', data.user);
      return data.token;
    } else {
      console.log('❌ Error en login:', data);
      return null;
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
    return null;
  }
}

// 2. TEST GET PROFILE
async function testGetProfile(token) {
  console.log('\n👤 Probando GET PROFILE con token...');
  
  try {
    const response = await fetch(`${BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Perfil obtenido!');
      console.log('Datos:', data);
    } else {
      console.log('❌ Error al obtener perfil:', data);
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
  }
}

// 3. TEST LISTAR USUARIOS (requiere admin/superadmin)
async function testListarUsuarios(token) {
  console.log('\n👥 Probando LISTAR USUARIOS (requiere rol admin)...');
  
  try {
    const response = await fetch(`${BASE_URL}/usuarios`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log(`✅ ${data.length} usuarios encontrados!`);
      console.log('Primeros 3:', data.slice(0, 3).map(u => ({ username: u.username, role: u.role })));
    } else {
      console.log('❌ Error al listar usuarios:', data);
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
  }
}

// 4. TEST REGISTER
async function testRegister() {
  console.log('\n📝 Probando REGISTER con nuevo usuario...');
  
  const randomNum = Math.floor(Math.random() * 10000);
  
  try {
    const response = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: `test_user_${randomNum}`,
        password: 'password123',
        email: `test${randomNum}@test.com`
      })
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Usuario registrado exitosamente!');
      console.log('Nuevo usuario:', data.user);
    } else {
      console.log('❌ Error en registro:', data);
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
  }
}

// 5. TEST SIN TOKEN (debe fallar con 401)
async function testSinToken() {
  console.log('\n🚫 Probando acceso SIN TOKEN (debe fallar)...');
  
  try {
    const response = await fetch(`${BASE_URL}/usuarios`);
    const data = await response.json();
    
    if (response.status === 401) {
      console.log('✅ Correctamente bloqueado! Status:', response.status);
      console.log('Mensaje:', data.mensaje);
    } else {
      console.log('⚠️  Debería haber devuelto 401, pero devolvió:', response.status);
    }
  } catch (error) {
    console.log('❌ Error de conexión:', error.message);
  }
}

// EJECUTAR TODOS LOS TESTS
async function runAllTests() {
  console.log('🧪 ===== INICIANDO TESTS DE AUTENTICACIÓN JWT =====');
  console.log('⚡ Asegurate de que el backend esté corriendo en puerto 4000\n');

  // Test 1: Login
  const token = await testLogin();
  
  if (token) {
    // Test 2: Get Profile
    await testGetProfile(token);
    
    // Test 3: Listar usuarios con token
    await testListarUsuarios(token);
  }
  
  // Test 4: Register
  await testRegister();
  
  // Test 5: Acceso sin token
  await testSinToken();
  
  console.log('\n🎉 ===== TESTS COMPLETADOS =====\n');
}

runAllTests();

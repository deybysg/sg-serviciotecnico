// import { useState } from 'react';

// const categorias = [
//   { nombre: 'Todos', value: 'todos' },
//   { nombre: 'Celulares', value: 'celulares' },
//   { nombre: 'Computadoras', value: 'computadoras' },
//   { nombre: 'Accesorios', value: 'accesorios' }
// ];


// import { Link } from 'react-router-dom';

// function HamburguesaMenu({ onFiltrar, extraLinks = [] }) {
//   const [abierto, setAbierto] = useState(false);
//   const [closing, setClosing] = useState(false);

//   const handleToggle = () => {
//     if (abierto) {
//       setClosing(true);
//       setTimeout(() => {
//         setAbierto(false);
//         setClosing(false);
//       }, 250);
//     } else {
//       setAbierto(true);
//     }
//   };

//   const handleFiltrar = (value) => {
//     onFiltrar(value);
//     setClosing(true);
//     setTimeout(() => {
//       setAbierto(false);
//       setClosing(false);
//     }, 250);
//   };

//   return (
//     <div className="hamburguesa-menu-sg">
//       <button
//         className="hamburguesa-btn"
//         onClick={handleToggle}
//         aria-label="Abrir menú"
//       >
//         <span className="hamburguesa-icon">&#9776;</span>
//       </button>
//       {abierto && (
//         <div className={`hamburguesa-dropdown${closing ? ' closing' : ''}`}>
//           {categorias.map(cat => (
//             <button
//               key={cat.value}
//               className="hamburguesa-link"
//               onClick={() => handleFiltrar(cat.value)}
//             >
//               {cat.nombre}
//             </button>
//           ))}
//           {extraLinks.length > 0 && <hr style={{margin: '0.7rem 0', border: 'none', borderTop: '1px solid #e0e7ff'}} />}
//           {extraLinks.map(link => (
//             <Link
//               key={link.to}
//               to={link.to}
//               className="hamburguesa-link"
//               onClick={handleToggle}
//             >
//               {link.nombre}
//             </Link>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// }

// export default HamburguesaMenu;

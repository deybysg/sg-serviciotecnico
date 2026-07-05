  
import '../styles/components/CategoriaFiltro.css';

function CategoriaFiltro() {
  // Aquí iría la lógica para filtrar por categoría
  return (
    <div className="categoria-filtro">
      <label>Filtrar por categoría:</label>
      <select>
        <option value="todos">Todos</option>
        <option value="celulares">Celulares</option>
      </select>
    </div>
  );
}

export default CategoriaFiltro;

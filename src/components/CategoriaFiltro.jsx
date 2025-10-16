function CategoriaFiltro() {
  // Aquí iría la lógica para filtrar por categoría
  return (
    <div>
      <label>Filtrar por categoría:</label>
      <select>
        <option value="todos">Todos</option>
        <option value="celulares">Celulares</option>
        <option value="computadoras">Computadoras</option>
        <option value="accesorios">Accesorios</option>
      </select>
    </div>
  );
}

export default CategoriaFiltro;

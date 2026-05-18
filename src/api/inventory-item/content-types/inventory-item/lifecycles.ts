function calculateStockStatus(data: any) {
  if (data.stock === undefined && data.minStock === undefined && data.maxStock === undefined) {
    return;
  }

  const stock = parseFloat(data.stock ?? 0);
  const minStock = parseFloat(data.minStock ?? 0);
  const maxStock = data.maxStock !== undefined && data.maxStock !== null ? parseFloat(data.maxStock) : Infinity;

  if (stock <= minStock) {
    data.stockStatus = 'low';
  } else if (maxStock !== Infinity && stock >= maxStock) {
    data.stockStatus = 'high';
  } else {
    data.stockStatus = 'medium';
  }
}

export default {
  async beforeCreate(event: any) {
    const { data } = event.params;
    calculateStockStatus(data);
  },
  async beforeUpdate(event: any) {
    const { data } = event.params;
    calculateStockStatus(data);
  },
};

export function customFieldMapping(data) {
  data.forEach(each => {
    each.poAmount = each.initialTotal
      ? parseFloat(each.initialTotal.quantity || 0) *
        parseFloat(each.initialTotal.displayTokenSize || 0)
      : 0;
  });
  return data;
}

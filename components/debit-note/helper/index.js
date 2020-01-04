export const parseDebitNoteAdjustmentType = adjustmentType => {
  let type = adjustmentType;

  switch (adjustmentType) {
    case "PRICE":
      type = "Price Adjustment";
      break;
  }

  return type;
};

export const columnItemPO = [
  { header: "PO Item No", field: "purchaseOrderExternalId" },
  { header: "Material Description", field: "materialDescription" },
  {
    header: "Remaining Qty",
    field: "quantity.remaining",
    render: row => {
      return row.quantity.remaining != undefined
        ? Intl.NumberFormat("th-TH", {
            useGrouping: true,
            maximumFractionDigits: 3,
            minimumFractionDigits: 3
          }).format(row.quantity.remaining)
        : "-";
    }
  },
  {
    header: "Qty",
    field: "quantity.initial",
    render: row => {
      return row.quantity.initial != undefined
        ? Intl.NumberFormat("th-TH", {
            useGrouping: true,
            maximumFractionDigits: 3,
            minimumFractionDigits: 3
          }).format(row.quantity.initial)
        : "-";
    }
  },
  {
    header: "Unit Description",
    field: "quantity.unit",
    render: row => {
      return row.quantity.unit != undefined ? row.quantity.unit : "-";
    }
  },
  {
    header: "Unit Price",
    field: "unitPrice",
    render: row => {
      return row.unitPrice != undefined
        ? Intl.NumberFormat("th-TH", {
            useGrouping: true,
            maximumFractionDigits: 2,
            minimumFractionDigits: 2
          }).format(row.unitPrice)
        : "-";
    }
  },
  {
    header: "Amount",
    field: "itemSubTotal",
    render: row => {
      return row.itemSubTotal != undefined
        ? Intl.NumberFormat("th-TH", {
            useGrouping: true,
            maximumFractionDigits: 2,
            minimumFractionDigits: 2
          }).format(row.itemSubTotal)
        : "-";
    }
  },
  { header: "Currency", field: "currency" }
];

export const columnItemGR = [
  { header: "PO Item No", field: "purchaseOrderExternalId" },
  {
    header: "Ref No1",
    field: "referenceField1",
    render: row => {
      return row.goodsReceivedItems[0] != undefined &&
        row.goodsReceivedItems[0].referenceField1 != undefined
        ? row.goodsReceivedItems[0].referenceField1
        : "-";
    }
  },
  { header: "Material Description", field: "materialDescription" },
  {
    header: "GR Qty",
    field: "quantity.remaining",
    render: row => {
      return row.goodsReceivedItems[0] != undefined &&
        row.goodsReceivedItems[0].quantity != undefined
        ? Intl.NumberFormat("th-TH", {
            useGrouping: true,
            maximumFractionDigits: 3,
            minimumFractionDigits: 3
          }).format(row.goodsReceivedItems[0].quantity.initial)
        : "-";
    }
  },
  {
    header: "Qty",
    field: "quantity.initial",
    render: row => {
      return row.quantity.initial != undefined
        ? Intl.NumberFormat("th-TH", {
            useGrouping: true,
            maximumFractionDigits: 3,
            minimumFractionDigits: 3
          }).format(row.quantity.initial)
        : "-";
    }
  },
  {
    header: "Unit Description",
    field: "quantity.unit",
    render: row => {
      return row.quantity.unit != undefined ? row.quantity.unit : "-";
    }
  },
  {
    header: "Unit Price",
    field: "unitPrice",
    render: row => {
      return row.unitPrice != undefined
        ? Intl.NumberFormat("th-TH", {
            useGrouping: true,
            maximumFractionDigits: 2,
            minimumFractionDigits: 2
          }).format(row.unitPrice)
        : "-";
    }
  },
  {
    header: "Amount",
    field: "itemSubTotal",
    render: row => {
      return row.itemSubTotal != undefined
        ? Intl.NumberFormat("th-TH", {
            useGrouping: true,
            maximumFractionDigits: 2,
            minimumFractionDigits: 2
          }).format(row.itemSubTotal)
        : "-";
    }
  },
  { header: "Currency", field: "currency" }
];
export const formatCurrency = (amount, digit) => {
  if (amount == undefined) amount = 0;
  return Intl.NumberFormat("th-TH", {
    useGrouping: true,
    maximumFractionDigits: digit,
    minimumFractionDigits: digit
  }).format(amount);
};
export const formatNumber = (amount, digit) => {
  if (amount == undefined) amount = 0;
  return Intl.NumberFormat("th-TH", {
    useGrouping: true,
    maximumFractionDigits: digit,
    minimumFractionDigits: digit
  }).format(amount);
};
export const numberOnly = event => {
  event.target.value = event.target.value.replace(/\+|-/gi, "");
};
export const GrThead = props => {
  return "";
};

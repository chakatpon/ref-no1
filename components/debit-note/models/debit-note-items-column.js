export const COLUMN_DEBIT_NOTE_ITEMS = [
  {
    header: "DN Item No.",
    data: "externalId",
    targets: [0],
    width: "80px",
    orderable: true,
    className: "text-center"
  },
  {
    header: "Invoice Item No.",
    data: "invoiceItemExternalId",
    targets: [1],
    width: "80px",
    orderable: true,
    className: "text-center"
  },
  {
    header: "Material Description",
    data: "materialDescription",
    targets: [2],
    width: "300px",
    orderable: true,
    className: "text-center"
  },
  {
    header: "PO No.",
    data: "purchaseOrderExternalId",
    targets: [3],
    width: "80px",
    orderable: true,
    className: "text-center"
  },
  {
    header: "Invoice Amount",
    data: "invoiceAmount",
    targets: [4],
    width: "80px",
    orderable: true,
    className: "text-center"
  },
  {
    header: "DN Amount",
    data: "subTotal",
    targets: [5],
    width: "80px",
    orderable: true,
    className: "text-center"
  },
  {
    header: "Currency",
    data: "currency",
    targets: [6],
    width: "80px",
    orderable: true,
    className: "text-center"
  },
  {
    header: "Site",
    data: "site",
    targets: [7],
    width: "80px",
    orderable: true,
    className: "text-center"
  },
  {
    header: "WHT Rate",
    data: "withholdingTaxRate",
    targets: [8],
    width: "80px",
    orderable: true,
    className: "text-center"
  }
];

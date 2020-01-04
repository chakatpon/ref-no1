export const COLUMN_INVOICE_ITEMS = [
  {
    header: "",
    data: "selected",
    targets: [0],
    orderable: false,
    sortable: false,
    width: "60px"
  },
  {
    header: "Invoice Item No.",
    data: "invoiceItemNo",
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
    data: "poNo",
    targets: [3],
    width: "100px",
    orderable: true,
    className: "text-center"
  },
  {
    header: "PO Item No.",
    data: "poItemNo",
    targets: [4],
    width: "80px",
    orderable: true,
    className: "text-center"
  },
  {
    header: "Invoice Amount",
    data: "amount",
    targets: [5],
    width: "80px",
    orderable: true,
    className: "text-center"
  },
  {
    header: "Adjusted Amount",
    data: "adjustedAmount",
    targets: [6],
    width: "80px",
    orderable: true,
    className: "text-center"
  },
  {
    header: "Currency",
    data: "currency",
    targets: [7],
    width: "80px",
    orderable: true,
    className: "text-center"
  }
];

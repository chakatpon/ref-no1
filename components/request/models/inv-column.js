export const INV_COLUMN = {
  name: "inv-column",
  title: "",
  table: {
    name: "inv-column",
    header: "",
    paging: true,
    container: "rows",
    create: true,
    createPermission: "",
    exportPermission: "",
    search: true,
    manualExport: false,
    sortable: true,
    hideAction: false,
    columns: [
      {
        columnIndex: 1,
        requiredColumn: true,
        defaultOrder: 1,
        header: "",
        field: "action",
        editable: false,
        sort: false,
        hidden: false,
        defaultHidden: false,
        export: false,
        defaultExport: false
      },
      {
        columnIndex: 2,
        requiredColumn: true,
        defaultOrder: 2,
        header: "Invoice No.",
        field: "externalId",
        editable: false,
        sort: true,
        hidden: false,
        defaultHidden: false,
        export: true,
        defaultExport: true
      },
      {
        columnIndex: 3,
        defaultOrder: 3,
        header: "Company Code",
        field: "companyCode",
        editable: false,
        sort: true,
        hidden: false,
        defaultHidden: false,
        export: true,
        defaultExport: true
      },
      {
        columnIndex: 4,
        defaultOrder: 4,
        header: "Company Name",
        field: "companyName",
        editable: false,
        sort: true,
        hidden: false,
        defaultHidden: false,
        export: true,
        defaultExport: true
      },
      {
        columnIndex: 5,
        defaultOrder: 5,
        header: "Vendor Code",
        field: "vendorNumber",
        editable: false,
        sort: true,
        hidden: false,
        defaultHidden: false,
        export: true,
        defaultExport: true
      },
      {
        columnIndex: 6,
        defaultOrder: 6,
        header: "Vendor Name",
        field: "vendorName",
        editable: false,
        sort: true,
        hidden: false,
        defaultHidden: false,
        export: true,
        defaultExport: true
      },
      {
        columnIndex: 7,
        defaultOrder: 7,
        header: "Sub Total",
        field: "subTotal",
        type: "number",
        pattern: "#,###.00",
        editable: false,
        sort: true,
        hidden: false,
        defaultHidden: false,
        export: true,
        defaultExport: true
      }
    ],
    lang: "request-create",
    hideColumn: true,
    pageSizeOptions: [],
    export: {
      name: ""
    },
    createRole: []
  },
  form: {
    name: "inv-column",
    size: "medium",
    autoClose: false,
    clearOnClose: false,
    sections: [
      {
        fields: [
          {
            key: "invoiceNumber",
            title: "Invoice No.",
            controlType: "autocomplete",
            type: "api",
            required: false,
            apiUrl: "/api/invoices?invoiceNumber=",
            displayField: "externalId"
          },
          {
            key: "companyName",
            title: "Company Name",
            type: "textbox",
            required: false
          },
          {
            key: "vendorName",
            title: "Vendor Name",
            type: "textbox",
            required: false
          }
        ]
      }
    ],
    buttons: [],
    header: {
      add: "Search"
    }
  },
  search: {
    filters: [],
    url: ""
  }
};

export const INVOICE_CREATE_MODEL = {
  ROUTE_CANCEL: "/invoice",
  DEFAULT_STATE_STEP1: {
    settings: {
      INVOICE_CREATED_BY_DOCUMENT: {},
      INVOICE_CONFIG: {},
      INVOICE_ITEM_DEFAULT_GROUPING: {}
    },
    searchConfig: {},
    resultSearch: {},
    selectedItems: [],
    searching: false,
    clearing: false,
    blockuiTable: false,
    filterParams: {},
    alertModalAlertTitle: "",
    isAlertModalVisible: false,
    buttonAlert: [],
    isTextOnly: false,
    alertModalMsg: []
  },
  SEARCH_RESULT_STRUCTURE: {
    recordsTotal: 0,
    recordsFiltered: 0,
    data: []
  },
  ERROR_MESSAGE: {
    INVOICE_CREATED_BY_DOCUMENT: `The necessary configuration is not found. 
    CONFIG_OPTION:  INVOICE_CREATED_BY_DOCUMENT
    Please contact your administrator for assistance.`,
    INVOICE_CREATED_BY_DOCUMENT_DUPLICATE: `There are multiple configurations for INVOICE_CREATED_BY_DOCUMENT. 
    Please contact your administrator for assistance.`,
    INVOICE_CONFIG: `The necessary configuration is not found. 
    CONFIG_OPTION:  INVOICE_ATTACHMENT
    Please contact your administrator for assistance.`,
    INVOICE_ITEM_DEFAULT_GROUPING: `The necessary configuration is not found. 
    CONFIG_OPTION:  INVOICE_ITEM_DEFAULT_GROUPING
    Please contact your administrator for assistance.`,
    INVOICE_ITEM_DEFAULT_GROUPING_DUPLICATE: `There are multiple configurations for INVOICE_ITEM_DEFAULT_GROUPING. 
    Please contact your administrator for assistance.`
  },
  BTN_SEARCH: {
    text: `<i class="icon icon-search"></i> Search`,
    loading: `<i class="fa fa-circle-o-notch fa-spin" aria-hidden="true"></i> Searching...`
  },
  BTN_CLEAR: {
    text: `<i class="icon icon-x"></i> Clear`,
    loading: `<i class="fa fa-circle-o-notch fa-spin" aria-hidden="true"></i> Clearing...`
  },
  MODEL_PO_ITEM_COLUMN: [
    {
      columnIndex: 1,
      requiredColumn: true,
      defaultOrder: 1,
      header: "PO Item No.",
      field: "poItemNo",
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
      header: "Material Description",
      field: "materialDescription",
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
      header: "PO QTY",
      field: "quantity.remaining",
      type: "number",
      pattern: "#,###.000",
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
      header: "Qty",
      field: "quantity.remaining",
      type: "inputnumber",
      pattern: "#,###.000",
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
      header: "Unit Description",
      field: "unitDescription",
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
      header: "Unit Price",
      field: "poItemUnitPrice",
      type: "inputnumber",
      pattern: "#,###.00",
      editable: false,
      sort: true,
      hidden: false,
      defaultHidden: false,
      export: true,
      defaultExport: true
    },
    {
      columnIndex: 13,
      header: "PO Remaining Quantity",
      field: "quantity.remaining",
      type: "number",
      pattern: "#,###.000",
      editable: false,
      sort: true,
      hidden: true,
      defaultHidden: false,
      export: false,
      defaultExport: true
    },
    {
      columnIndex: 14,
      header: "Unit",
      field: "quantity.unit",
      editable: false,
      sort: true,
      hidden: true,
      defaultHidden: false,
      export: false,
      defaultExport: true
    },
    {
      columnIndex: 15,
      header: "Estimated Price Flag",
      field: "estimatedUnitPrice",
      editable: false,
      sort: true,
      hidden: true,
      defaultHidden: false,
      export: false,
      defaultExport: true
    },
    {
      columnIndex: 16,
      header: "Tax code",
      field: "taxCode",
      editable: false,
      sort: true,
      hidden: true,
      defaultHidden: false,
      export: false,
      defaultExport: true
    },
    {
      columnIndex: 17,
      header: "Tax Rate (%)",
      field: "taxRate",
      editable: false,
      sort: true,
      hidden: true,
      defaultHidden: false,
      export: false,
      defaultExport: true
    },
    {
      columnIndex: 18,
      header: "Section",
      field: "section",
      editable: false,
      sort: true,
      hidden: true,
      defaultHidden: false,
      export: false,
      defaultExport: true
    },
    {
      columnIndex: 19,
      header: "Section Descritpion",
      field: "sectionDescription",
      editable: false,
      sort: true,
      hidden: true,
      defaultHidden: false,
      export: false,
      defaultExport: true
    },
    {
      columnIndex: 20,
      header: "Site",
      field: "site",
      editable: false,
      sort: true,
      hidden: true,
      defaultHidden: false,
      export: false,
      defaultExport: true
    },
    {
      columnIndex: 21,
      header: "Site Descritpion",
      field: "siteDescription",
      editable: false,
      sort: true,
      hidden: true,
      defaultHidden: false,
      export: false,
      defaultExport: true
    },
    {
      columnIndex: 22,
      header: "Cost Center",
      field: "costCenter",
      editable: false,
      sort: true,
      hidden: true,
      defaultHidden: false,
      export: false,
      defaultExport: true
    },
    {
      columnIndex: 23,
      header: "Cost Center Descritpion",
      field: "costCenterDescription",
      editable: false,
      sort: true,
      hidden: true,
      defaultHidden: false,
      export: false,
      defaultExport: true
    },
    {
      columnIndex: 24,
      header: "Cost Type",
      field: "costType",
      editable: false,
      sort: true,
      hidden: true,
      defaultHidden: false,
      export: false,
      defaultExport: true
    },
    {
      columnIndex: 25,
      header: "Cost Type Descritpion",
      field: "costTypeDescription",
      editable: false,
      sort: true,
      hidden: true,
      defaultHidden: false,
      export: false,
      defaultExport: true
    },
    {
      columnIndex: 26,
      header: "Proposed Delivery Date",
      field: "proposedRevisedDeliveryDate",
      editable: false,
      sort: true,
      hidden: true,
      defaultHidden: false,
      export: false,
      defaultExport: true
    },
    {
      columnIndex: 27,
      header: "Revised Delivery Date Reason",
      field: "revisedReason",
      editable: false,
      sort: true,
      hidden: true,
      defaultHidden: false,
      export: false,
      defaultExport: true
    },
    {
      columnIndex: 28,
      header: "Delete Flag",
      field: "deleteFlag",
      editable: false,
      sort: true,
      hidden: true,
      defaultHidden: false,
      export: false,
      defaultExport: true
    },
    {
      columnIndex: 29,
      header: "Free Item Flag",
      field: "freeItemIndicator",
      editable: false,
      sort: true,
      hidden: true,
      defaultHidden: false,
      export: false,
      defaultExport: true
    },
    {
      columnIndex: 30,
      header: "Overdelivery Tolerance Limit",
      field: "overDeliveryTolerance",
      editable: false,
      sort: true,
      hidden: true,
      defaultHidden: false,
      export: false,
      defaultExport: true
    },
    {
      columnIndex: 31,
      header: "Underdelivery Tolerance Limit",
      field: "underDeliveryTolerance",
      editable: false,
      sort: true,
      hidden: true,
      defaultHidden: false,
      export: false,
      defaultExport: true
    },
    {
      columnIndex: 32,
      header: "Account Assignment",
      field: "accountAssignment",
      editable: false,
      sort: true,
      hidden: true,
      defaultHidden: false,
      export: false,
      defaultExport: true
    },
    {
      columnIndex: 33,
      header: "Last Comfirmed By",
      field: "lastConfirmedBy",
      editable: false,
      sort: true,
      hidden: true,
      defaultHidden: false,
      export: false,
      defaultExport: true
    },
    {
      columnIndex: 34,
      header: "Last Comfirmed Date",
      field: "lastConfirmedDate",
      editable: false,
      sort: true,
      hidden: true,
      defaultHidden: false,
      export: false,
      defaultExport: true
    },
    {
      columnIndex: 35,
      header: "Last Updated By",
      field: "lastUpdatedBy",
      editable: false,
      sort: true,
      hidden: true,
      defaultHidden: false,
      export: false,
      defaultExport: true
    },
    {
      columnIndex: 36,
      header: "Last Updated Date",
      field: "lastUpdatedDate",
      editable: false,
      sort: true,
      hidden: true,
      defaultHidden: false,
      export: false,
      defaultExport: true
    }
  ],
  MODEL_PO_COLUMN: [
    {
      columnIndex: 1,
      requiredColumn: true,
      defaultOrder: 1,
      header: "PO No",
      field: "purchaseOrderNumber",
      type: "customLink",
      editable: false,
      sort: false,
      hidden: false,
      defaultHidden: false,
      export: true,
      defaultExport: true,
      className: "text-center",
      optClassName: "text-bold"
    },
    {
      columnIndex: 2,
      defaultOrder: 2,
      header: "Company Name",
      field: "companyName",
      editable: false,
      sort: true,
      hidden: false,
      defaultHidden: false,
      export: true,
      defaultExport: true,
      optClassName: "mw-container text-left"
    },
    {
      columnIndex: 3,
      defaultOrder: 3,
      header: "Vendor Name",
      field: "vendorName",
      editable: false,
      sort: true,
      hidden: false,
      defaultHidden: false,
      export: true,
      defaultExport: true,
      optClassName: "mw-container text-left"
    },
    {
      columnIndex: 4,
      defaultOrder: 4,
      header: "PO Amount",
      field: "poAmount",
      editable: false,
      sort: true,
      hidden: false,
      defaultHidden: false,
      export: true,
      defaultExport: true,
      optClassName: "",
      className: "text-right",
      render: function(txt, row, col) {
        let poAmount =
          row.initialTotal.quantity * row.initialTotal.displayTokenSize;
        return formatCurrency(poAmount, 2);
      }
    },
    {
      columnIndex: 5,
      defaultOrder: 5,
      header: "Payment Term",
      field: "paymentTermDescription",
      editable: false,
      sort: true,
      hidden: false,
      defaultHidden: false,
      export: true,
      defaultExport: true,
      className: "text-center",
      optClassName: "mw-container-multi"
    },
    {
      columnIndex: 6,
      defaultOrder: 6,
      header: "Reference_1_po",
      field: "referenceField1",
      editable: false,
      sort: true,
      hidden: true,
      defaultHidden: false,
      export: false,
      defaultExport: true,
      className: "text-center",
      optClassName: "mw-container"
    },
    {
      columnIndex: 7,
      defaultOrder: 7,
      header: "Company Code",
      field: "companyCode",
      editable: false,
      sort: true,
      hidden: false,
      defaultHidden: false,
      export: true,
      defaultExport: true,
      className: "text-right",
      optClassName: ""
    }
  ],
  CREATE_INVOICE_STEP: [
    {
      stepNo: 1,
      stepTitle: "Select Type of Invoice",
      btnNext: true,
      btnPrevious: false,
      btnCancel: true,
      btnFinish: false
    },
    {
      stepNo: 2,
      stepTitle: "Select Items",
      btnNext: true,
      btnPrevious: true,
      btnCancel: false,
      btnFinish: false
    },
    {
      stepNo: 3,
      stepTitle: "Insert Invoice Details",
      btnNext: true,
      btnPrevious: true,
      btnCancel: false,
      btnFinish: false
    },
    {
      stepNo: 4,
      stepTitle: "Summary",
      btnNext: false,
      btnPrevious: true,
      btnCancel: false,
      btnFinish: true
    }
  ]
};

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

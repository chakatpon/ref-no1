export var REQUEST_HEADER_INFO = {
  MODEL_VENDOR_INFO: {
    header: "Vendor",
    fields: [
      {
        title: "Code",
        key: "vendorNumber",
        defaultValue: "-"
      },
      {
        title: "Name",
        key: "vendorName",
        defaultValue: "-"
      },
      {
        title: "Tax ID",
        key: "vendorTaxNumber",
        defaultValue: "-"
      },
      {
        title: "Branch",
        key: "vendorBranchCode",
        defaultValue: "-"
      },
      {
        title: "Address",
        key: "vendorAddress",
        defaultValue: "-"
      },
      {
        title: "Tel.",
        key: "vendorTelephone",
        defaultValue: "-"
      }
    ],
    lang: "request-detail"
  },
  MODEL_COMPANY_INFO: {
    header: "Company",
    fields: [
      {
        title: "Code",
        key: "companyCode",
        defaultValue: "-"
      },
      {
        title: "Name",
        key: "companyName",
        defaultValue: "-"
      },
      {
        title: "Tax ID",
        key: "companyTaxNumber",
        defaultValue: "-"
      },
      {
        title: "Branch",
        key: "companyBranchCode",
        defaultValue: "-"
      },
      {
        title: "Address",
        key: "companyAddress",
        defaultValue: "-"
      },
      {
        title: "Tel.",
        key: "companyTelephone",
        defaultValue: "-"
      }
    ],
    lang: "request-detail"
  },
  MODEL_REQUEST_INFO: {
    header: "Request Information",
    fields: [
      {
        title: "Request Type",
        key: "type",
        defaultValue: "-"
      },
      {
        title: "Sub Type",
        key: "subType",
        defaultValue: "-"
      },
      {
        title: "Reference Type",
        key: "referenceType",
        defaultValue: "-"
      },
      {
        title: "Reference Number",
        key: "referenceNumber",
        defaultValue: "-"
      },
      {
        title: "Buyer Attachments",
        key: "requestAttachment",
        type: "files",
        download: true,
        defaultValue: "-"
      },
      {
        title: "Request Reason",
        key: "requestReason",
        type: "textArea",
        defaultValue: "-"
      }
    ],
    lang: "request-detail"
  },
  MODEL_REFERENCE: {
    header: "Reference",
    fields: [
      {
        title: "Reference 1",
        key: "referenceField1",
        defaultValue: "-"
      },
      {
        title: "Reference 2",
        key: "referenceField2",
        defaultValue: "-"
      },
      {
        title: "Reference 3",
        key: "referenceField3",
        defaultValue: "-"
      },
      {
        title: "Reference 4",
        key: "referenceField4",
        defaultValue: "-"
      },
      {
        title: "Reference 5",
        key: "referenceField5",
        defaultValue: "-"
      }
    ],
    lang: "request-detail"
  },
  MODEL_DOCUMENT_INFO_LEFT: {
    fields: [
      {
        title: "Document Date",
        key: "documentDate",
        type: "date",
        defaultValue: "-"
      },
      {
        title: "Document Type",
        key: "documentType",
        defaultValue: "-"
      },
      {
        title: "Document No.",
        key: "documentNumber",
        defaultValue: "-"
      },
      {
        title: "Document Attachments",
        key: "documentAttachment",
        type: "files",
        download: true,
        defaultValue: "-"
      },
      {
        title: "Documents Reason",
        key: "documentReason",
        type: "textArea",
        defaultValue: "-"
      }
    ],
    lang: "request-detail"
  },
  MODEL_DOCUMENT_INFO_RIGHT: {
    fields: [
      {
        title: "Payment Due Date",
        key: "paymentDueDate",
        type: "date",
        defaultValue: "-"
      },
      {
        title: "Sub Total",
        key: "subTotal",
        type: "amount",
        classInput: "col-6",
        classUnit: "col-4",
        format: {
          thousand: true,
          decimal: 2
        },
        currency: true
      },
      {
        title: "Tax Total",
        key: "vatTotal",
        type: "amount",
        classInput: "col-6",
        classUnit: "col-4",
        format: {
          thousand: true,
          decimal: 2
        },
        currency: true
      },
      {
        title: "Request Amount (Inc. TAX)",
        key: "total",
        type: "amount",
        classInput: "col-6",
        classUnit: "col-4",
        format: {
          thousand: true,
          decimal: 2
        },
        currency: true
      },
      {
        title: "WHT Amount",
        key: "withholdingTaxAmount",
        type: "amount",
        classInput: "col-6",
        classUnit: "col-4",
        format: {
          thousand: true,
          decimal: 2
        },
        currency: true
      }
    ],
    lang: "request-detail"
  }
};

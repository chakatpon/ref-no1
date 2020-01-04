export const DOCUMENT_LEFT = {
  header: "Vendor",
  fields: [
    {
      title: "Document Date",
      key: "vendorName"
    },
    {
      title: "Document Type",
      key: "vendorTaxNumber"
    },
    {
      title: "Document No.",
      key: "vendorTaxNumber"
    },
    {
      title: "Document Attachment",
      key: "vendorTaxNumber"
    },
    {
      title: "Documents Reason",
      key: "vendorTaxNumber"
    }
  ]
};

export const DOCUMENT_RIGHT = {
  header: "Company",
  fields: [
    {
      title: "Payment Due Date",
      key: "companyCode"
    },
    {
      title: "Sub Total",
      key: "companyName",
      type: "amount"
    },
    {
      title: "Tax Total",
      key: "companyName",
      type: "amount"
    },
    {
      title: "Request Amount (Inc. TAX)",
      key: "companyName",
      type: "amount"
    },
    {
      title: "WHT Amount",
      key: "companyName",
      type: "amount"
    }
  ]
};

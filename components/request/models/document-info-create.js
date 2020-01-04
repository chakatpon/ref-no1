import { AMOUNT_MAX_LENGTH } from "~/configs/constant";

export const MODEL_DOCUMENT_INFO_ONE = {
  fields: [
    {
      title: "Document Date",
      key: "documentDate",
      defaultValue: "-"
    },
    {
      title: "Document Type",
      key: "documentType",
      defaultValue: "-"
    },
    {
      title: "Document No",
      key: "documentNumber",
      defaultValue: "-"
    },
    {
      title: "Document Attachment",
      key: "documentAttachment",
      defaultValue: "-"
    },
    {
      title: "Document Reason",
      key: "documentReason",
      defaultValue: "-"
    }
  ],
  lang: "request-create"
};

export const MODEL_DOCUMENT_INFO_TWO = {
  fields: [
    {
      title: "Payment Due Date",
      key: "paymentDueDate",
      defaultValue: "-"
    },
    {
      title: "Sub Total",
      key: "subTotal",
      canEdit: true,
      type: "amount",
      classInput: "row col-8",
      classUnit: "col-4",
      onBlur: null,
      format: {
        thousand: true,
        decimal: 2
      },
      maxLength: AMOUNT_MAX_LENGTH,
      currency: true
    },
    {
      title: "Tax Total",
      key: "vatTotal",
      canEdit: true,
      type: "amount",
      classInput: "row col-8",
      classUnit: "col-4",
      onBlur: null,
      format: {
        thousand: true,
        decimal: 2
      },
      maxLength: AMOUNT_MAX_LENGTH,
      currency: true
    },
    {
      title: "Request Amount (Inc. TAX)",
      key: "total",
      type: "amount",
      classInput: "row col-8",
      classUnit: "col-4",
      format: {
        thousand: true,
        decimal: 2
      },
      maxLength: AMOUNT_MAX_LENGTH,
      currency: true
    }
  ],
  lang: "request-create"
};

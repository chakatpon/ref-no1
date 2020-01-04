import { AMOUNT_MAX_LENGTH } from "~/configs/constant";

export const MODEL_DEBIT_NOTE_INFO_EDIT_ONE = {
  fields: [
    {
      title: "Debit Note Date",
      key: "debitNoteDate",
      type: "date",
      canEdit: false,
      onChange: null,
      classInput: "row col-8"
    },
    {
      title: "Invoice Ref. No.",
      key: "invoiceExternalId",
      defaultValue: "-"
    },
    {
      title: "Type of DN",
      key: "adjustmentType",
      defaultValue: "-"
    }
  ]
};

export const MODEL_DEBIT_NOTE_INFO_EDIT_TWO = {
  fields: [
    {
      title: "Sub Total",
      key: "subTotal",
      type: "amount",
      classInput: "row col-8",
      classUnit: "col-4",
      canEdit: true,
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
      type: "amount",
      classInput: "row col-8",
      classUnit: "col-4",
      canEdit: true,
      onBlur: null,
      format: {
        thousand: true,
        decimal: 2
      },
      maxLength: AMOUNT_MAX_LENGTH,
      currency: true
    },
    {
      title: "DN Amount (Inc. Tax)",
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
    },
    {
      title: "Reason",
      key: "reason",
      type: "textArea",
      canEdit: true,
      onChange: null
    },
    {
      title: "Due Date",
      key: "initialDueDate",
      type: "date",
      canEdit: false,
      onChange: null,
      classInput: "row col-8"
    }
  ]
};

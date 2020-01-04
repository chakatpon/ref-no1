import { AMOUNT_MAX_LENGTH } from "~/configs/constant";

export const MODEL_DEBIT_NOTE_INFO_ONE = {
  fields: [
    {
      title: "Debit Note Date",
      key: "debitNoteDate",
      defaultValue: "-"
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
  ],
  lang: "debit-create"
};

export const MODEL_DEBIT_NOTE_INFO_TWO = {
  fields: [
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
      defaultValue: "-"
    },
    {
      title: "Due Date",
      key: "dueDate",
      defaultValue: "-"
    }
  ],
  lang: "debit-create"
};

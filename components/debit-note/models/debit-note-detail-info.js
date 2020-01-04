export const MODEL_DEBIT_NOTE_DETAIL_ONE = {
  fields: [
    {
      title: "Debit Note Date",
      key: "debitNoteDate",
      defaultValue: "-"
    },
    {
      title: "Invoice Ref. No.",
      key: "invoiceRef",
      defaultValue: "-",
      type: "link"
    },
    {
      title: "Request No.",
      key: "requestExternalId",
      defaultValue: "-",
      type: "link"
    },
    {
      title: "Type of DN",
      key: "adjustmentType",
      defaultValue: "-"
    },
    {
      title: "Payment Date",
      key: "paymentDate",
      defaultValue: "No"
    },
    {
      title: "Send to CMS",
      key: "sendToCMS",
      defaultValue: "No"
    },
    {
      title: "Send to Bank",
      key: "sendToBank",
      defaultValue: "-"
    }
  ],
  lang: "debit-detail"
};

export const MODEL_DEBIT_NOTE_DETAIL_TWO = {
  fields: [
    {
      title: "Sub Total",
      key: "subTotal"
    },
    {
      title: "Tax Total",
      key: "vatTotal"
    },
    {
      title: "DN Amount (Inc. Tax)",
      key: "totalAmount"
    },
    {
      title: "DN Payable Amount",
      key: "totalPayable"
    },
    {
      title: "Reason",
      key: "reason",
      defaultValue: "-"
    },
    {
      title: "Due Date",
      key: "initialDueDate",
      defaultValue: "-"
    },
    {
      title: "Revised Payment Due Date",
      key: "revisedPaymentDueDate",
      defaultValue: "-",
      type: "dueDate",
      onClick: null
    },
    {
      title: "Last Edited By",
      key: "dueDateLastEditedBy",
      defaultValue: "-"
    },
    {
      title: "Last Edited Date",
      key: "dueDateLastEditedDate",
      defaultValue: "-"
    },
    {
      title: "Last Edited Reason",
      key: "dueDateLastEditedReason",
      defaultValue: "-"
    }
  ],
  lang: "debit-detail"
};

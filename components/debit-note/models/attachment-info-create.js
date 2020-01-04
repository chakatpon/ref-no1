export const MODEL_ATTACHMENT_INFO_ONE = {
  fields: [
    {
      title: "Attach Debit Note",
      key: "DebitNoteAttachments",
      type: "files"
    },
    {
      title: "Attach Others",
      key: "OthersAttachments",
      type: "files"
    }
  ],
  lang: "debit-create"
};

export const MODEL_ATTACHMENT_INFO_TWO = {
  fields: [
    {
      title: "Receipt No.",
      key: "debitNoteReceiptNumber",
      defaultValue: "-"
    },
    {
      title: "Receipt Date",
      key: "receiptDate",
      defaultValue: "-"
    },
    {
      title: "Attach Receipt",
      key: "ReceiptAttachments",
      type: "files"
    }
  ],
  lang: "debit-create"
};

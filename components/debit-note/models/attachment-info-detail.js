export const MODEL_ATTACHMENT_INFO_ONE = {
  fields: [
    {
      title: "Attach Debit Note",
      key: "DebitNoteAttachment",
      type: "files",
      download: true
    },
    {
      title: "Attach Others",
      key: "OthersAttachment",
      type: "files",
      download: true
    }
  ],
  lang: "debit-detail"
};

export const MODEL_ATTACHMENT_INFO_TWO = {
  fields: [
    {
      title: "Receipt No.",
      key: "receiptNumber",
      defaultValue: "-"
    },
    {
      title: "Receipt Date",
      key: "receiptDate",
      defaultValue: "-"
    },
    {
      title: "Attach Receipt",
      key: "ReceiptAttachment",
      type: "files",
      download: true
    }
  ],
  lang: "debit-detail"
};

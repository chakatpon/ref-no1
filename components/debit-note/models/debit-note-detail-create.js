export const MODEL_DN_DETAIL = {
  header: "Insert Details",
  fields: [
    {
      title: "Debit Note No",
      showTitle: true,
      key: "debitNoteNumber",
      placeholder: "Debit Note No",
      minlength: "0",
      maxLength: "30",
      validation: true,
      messageError: "Invalid Debit Note No",
      canEdit: true,
      onChange: null,
      required: true
    },
    {
      title: "Debit Note Date",
      showTitle: true,
      key: "debitNoteDate",
      placeholder: "Debit Note Date",
      validation: false,
      messageError: "",
      columnField: true,
      type: "date",
      canEdit: true,
      onChange: null,
      minDate: null,
      maxDate: null,
      required: true
    },
    {
      title: "Due Date",
      showTitle: true,
      key: "debitNoteDueDate",
      placeholder: "Due Date",
      validation: false,
      messageError: "",
      columnField: true,
      type: "date",
      canEdit: true,
      onChange: null,
      minDate: null,
      maxDate: null,
      required: true
    },
    {
      title: "Receipt No",
      showTitle: true,
      key: "debitNoteReceiptNumber",
      placeholder: "Receipt No",
      validation: false,
      messageError: "",
      canEdit: true,
      onChange: null
    },
    {
      title: "Debit Note Reason",
      showTitle: true,
      key: "debitNoteReason",
      placeholder: "Debit Note Reason",
      validation: false,
      messageError: "",
      type: "textArea",
      rows: "5",
      style: { resize: "none" },
      canEdit: true,
      onChange: null,
      required: true
    }
  ],
  lang: "debit-create"
};

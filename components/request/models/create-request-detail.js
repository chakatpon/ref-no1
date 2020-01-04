export const MODEL_REQUEST_DETAIL = [
  {
    header: "Select Payment Due Date",
    fields: [
      {
        title: "Payment Due Date *",
        showTitle: true,
        key: "paymentDueDate",
        placeholder: "Payment Due Date",
        validation: false,
        messageError: "",
        columnField: true,
        type: "date",
        canEdit: true,
        onChange: null,
        minDate: null,
        maxDate: null
      }
    ],
    lang: "request-create"
  },
  {
    header: "Insert Reference",
    fields: [
      {
        title: "Reference 1",
        showTitle: true,
        key: "referenceField1",
        placeholder: "Reference 1",
        minlength: "0",
        maxLength: "16",
        validation: true,
        messageError: "",
        canEdit: true,
        onChange: null
      },
      {
        title: "Reference 2",
        showTitle: true,
        key: "referenceField2",
        placeholder: "Reference 2",
        minlength: "0",
        maxLength: "16",
        validation: true,
        messageError: "",
        canEdit: true,
        onChange: null
      },
      {
        title: "Reference 3",
        showTitle: true,
        key: "referenceField3",
        placeholder: "Reference 3",
        minlength: "0",
        maxLength: "16",
        validation: true,
        messageError: "",
        canEdit: true,
        onChange: null
      },
      {
        title: "Reference 4",
        showTitle: true,
        key: "referenceField4",
        placeholder: "Reference 4",
        minlength: "0",
        maxLength: "16",
        validation: true,
        messageError: "",
        canEdit: true,
        onChange: null
      },
      {
        title: "Reference 5",
        showTitle: true,
        key: "referenceField5",
        placeholder: "Reference 5",
        minlength: "0",
        maxLength: "16",
        validation: true,
        messageError: "",
        canEdit: true,
        onChange: null
      }
    ],
    lang: "request-create"
  }
];

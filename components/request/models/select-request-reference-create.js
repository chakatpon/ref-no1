export const MODEL_SELECT_REQUEST_REFERENCE = {
  header: "",
  fields: [
    {
      title: "Company Name",
      key: "comName",
      placeholder: "Company Name",
      validation: false,
      messageError: "",
      columnField: true,
      type: "select",
      canEdit: true,
      onChange: null
    },
    {
      title: "Request Type",
      key: "type",
      placeholder: "Request Type",
      validation: false,
      messageError: "",
      columnField: true,
      type: "select",
      canEdit: true,
      onChange: null,
      disabled: true
    },
    {
      title: "Sub Type",
      key: "subType",
      placeholder: "Sub Type",
      validation: false,
      messageError: "",
      columnField: true,
      type: "select",
      canEdit: true,
      onChange: null,
      disabled: true
    },
    {
      key: "subtypeDescription",
      styleInput: { color: "#c3c3c3" }
    },
    {
      title: "Request Reason",
      key: "requestReason",
      placeholder: "Request Reason",
      validation: false,
      messageError: "",
      type: "textArea",
      rows: "5",
      styleInput: { resize: "none" },
      canEdit: true,
      onChange: null,
      showTitle: true
    },
    {
      title: "Ref Type",
      key: "referenceType",
      placeholder: "Ref Type",
      validation: false,
      messageError: "",
      columnField: true,
      type: "select",
      canEdit: true,
      onChange: null,
      disabled: true
    }
  ],
  lang: "request-create"
};

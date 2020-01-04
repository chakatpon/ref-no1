export const MODEL_VENDOR_INFO = {
  header: "Vendor",
  fields: [
    {
      title: "Code",
      key: "vendorNumber",
      labelKey: "code",
      type: "autoComplete",
      inputProps: {
        id: "vendorNumber",
        name: "vendorNumber",
        className: "",
        title: "",
        style: {
          height: 35,
          padding: "0px 0 0px 13px"
        }
      },
      minLength: 3,
      isLoading: false,
      inputValue: "",
      options: [],
      handleAutoCompleteChange: null,
      handleSearch: null,
      canEdit: true,
      disabled: true,
      validation: true,
      messageError: "This code is not found",
      classInputHint: "auto-complete-rbt-input-hint",
      defaultValue: "-"
    },
    {
      title: "Name",
      key: "vendorName",
      defaultValue: "-"
    },
    {
      title: "Tax ID",
      key: "vendorTaxNumber",
      type: "text",
      canEdit: true,
      disabled: true,
      defaultValue: "-"
    },
    {
      title: "Branch",
      key: "vendorBranchCodeId",
      placeholder: "",
      type: "select",
      canEdit: true,
      disabled: true
    },
    {
      title: "Address",
      key: "vendorAddress",
      defaultValue: "-"
    },
    {
      title: "Tel.",
      key: "vendorTelephone",
      defaultValue: "-"
    }
  ],
  lang: "request-create"
};

export const MODEL_COMPANY_INFO = {
  header: "Company",
  fields: [
    {
      title: "Code",
      key: "companyCode",
      type: "text",
      canEdit: true,
      disabled: true,
      defaultValue: "-"
    },
    {
      title: "Name",
      key: "companyName",
      defaultValue: "-"
    },
    {
      title: "Tax ID",
      key: "companyTaxNumber",
      type: "text",
      canEdit: true,
      disabled: true,
      defaultValue: "-"
    },
    {
      title: "Branch",
      key: "companyBranchCodeId",
      placeholder: "",
      type: "select",
      canEdit: true,
      disabled: true,
      defaultValue: "-"
    },
    {
      title: "Address",
      key: "companyAddress",
      defaultValue: "-"
    },
    {
      title: "Tel.",
      key: "companyTelephone",
      defaultValue: "-"
    }
  ],
  lang: "request-create"
};

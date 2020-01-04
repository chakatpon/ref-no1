export const MODEL_VENDOR_INFO = {
  header: "Vendor",
  fields: [
    {
      title: "Code",
      key: "vendorNumber",
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
      defaultValue: "-"
    },
    {
      title: "Branch",
      key: "vendorBranchCodeId",
      placeholder: "",
      type: "select",
      canEdit: true,
      defaultValue: "-",
      onChange: null,
      message: "",
      classMessage: "text-grey",
      styleMessage: {
        display: "block",
        paddingBottom: 5
      }
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
  ]
};

export const MODEL_COMPANY_INFO = {
  header: "Company",
  fields: [
    {
      title: "Code",
      key: "companyCode",
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
      defaultValue: "-"
    },
    {
      title: "Branch",
      key: "companyBranchCode",
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
  ]
};

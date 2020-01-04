import AmountField from "~/components/Fields/AmountField";
import NumberField from "~/components/Fields/NumberField";
import TextField from "~/components/Fields/TextField";
import SelectField from "~/components/Fields/SelectField";
import _ from "lodash";

export const REQUEST_HEADER_INFO = {
  MODEL_VENDOR_INFO: {
    header: "Vendor",
    fields: [
      {
        title: "Code",
        key: "vendorNumber"
      },
      {
        title: "Name",
        key: "vendorName"
      },
      {
        title: "Tax ID",
        key: "vendorTaxNumber"
      },
      {
        title: "Branch",
        key: "vendorBranchCode"
      },
      {
        title: "Address",
        key: "vendorAddress"
      },
      {
        title: "Tel.",
        key: "vendorTelephone"
      }
    ],
    lang: "request-edit"
  },
  MODEL_COMPANY_INFO: {
    header: "Company",
    fields: [
      {
        title: "Code",
        key: "companyCode"
      },
      {
        title: "Name",
        key: "companyName"
      },
      {
        title: "Tax ID",
        key: "companyTaxNumber"
      },
      {
        title: "Branch",
        key: "companyBranchCode"
      },
      {
        title: "Address",
        key: "companyAddress"
      },
      {
        title: "Tel.",
        key: "companyTelephone"
      }
    ],
    lang: "request-edit"
  },
  MODEL_REQUEST_INFO: {
    header: "Request Information",
    fields: [
      {
        title: "Request Type",
        key: "type"
      },
      {
        title: "Sub Type",
        key: "subType"
      },
      {
        title: "Reference Type",
        key: "referenceType"
      },
      {
        title: "Reference Number",
        key: "referenceNumber"
      },
      {
        title: "Buyer Attachments",
        key: "requestAttachment",
        type: "files",
        download: true
      },
      {
        title: "Request Reason",
        key: "requestReason",
        type: "textArea",
        classInput: "col-7"
      }
    ],
    lang: "request-edit"
  },
  MODEL_REFERENCE: {
    header: "Reference",
    fields: [
      {
        title: "Reference 1",
        key: "referenceField1",
        type: "text",
        classInput: "row col-8"
      },
      {
        title: "Reference 2",
        key: "referenceField2",
        type: "text",
        classInput: "row col-8"
      },
      {
        title: "Reference 3",
        key: "referenceField3",
        type: "text",
        classInput: "row col-8"
      },
      {
        title: "Reference 4",
        key: "referenceField4",
        type: "text",
        classInput: "row col-8"
      },
      {
        title: "Reference 5",
        key: "referenceField5",
        type: "text",
        classInput: "row col-8"
      }
    ],
    lang: "request-edit"
  },
  MODEL_DOCUMENT_INFO_LEFT: {
    fields: [
      {
        title: "Document Date",
        key: "documentDate",
        type: "date",
        classInput: "row col-8",
        maxDate: new Date().toISOString()
      },
      {
        title: "Document Type",
        key: "documentType",
        type: "select",
        placeholder: "",
        classInput: "col-7"
      },
      {
        title: "Document No.",
        key: "documentNumber",
        type: "text",
        classInput: "col-7"
      },
      {
        title: "Document Attachments",
        key: "documentAttachment",
        type: "files",
        download: true
      },
      {
        title: "Documents Reason",
        key: "documentReason",
        type: "textArea",
        classInput: "col-7"
      }
    ],
    lang: "request-edit"
  },
  MODEL_DOCUMENT_INFO_RIGHT: {
    fields: [
      {
        title: "Payment Due Date",
        key: "paymentDueDate",
        type: "date",
        classInput: "row col-8"
      },
      {
        title: "Sub Total",
        key: "subTotal",
        type: "number",
        classInput: "row col-8",
        classUnit: "col-4",
        onBlur: null,
        format: {
          thousand: true,
          decimal: 2
        },
        currency: true
      },
      {
        title: "Tax Total",
        key: "vatTotal",
        type: "number",
        classInput: "row col-8",
        classUnit: "col-4",
        onBlur: null,
        format: {
          thousand: true,
          decimal: 2
        },
        currency: true
      },
      {
        title: "Total Amount (Inc. Tax)",
        key: "total",
        type: "number",
        classInput: "row col-8",
        classUnit: "col-4",
        onBlur: null,
        format: {
          thousand: true,
          decimal: 2
        },
        currency: true
      },
      {
        title: "WHT Total",
        key: "withholdingTaxAmount",
        type: "number",
        classInput: "row col-8",
        classUnit: "col-4",
        onBlur: null,
        format: {
          thousand: true,
          decimal: 2
        },
        currency: true
      }
    ],
    lang: "request-edit"
  }
};

export var REQUEST_ITEM_INFO = [
  {
    name: "No.",
    width: "5%",
    selector: "externalId",
    center: true
  },
  {
    name: "Description",
    selector: "description",
    center: true,
    cell: r => (
      <span className="d-inline-flex">
        <TextField
          datas={r}
          field={{
            canEdit: r.descriptionEditable,
            key: "description",
            disabled:
              _.findIndex(!!r.permission ? r.permission : [], {
                field: "description",
                editable: false
              }) >= 0,
            placeholder: "",
            onChange: event => r.onChange.call(this, event)
          }}
        />
      </span>
    )
  },
  {
    name: "Quantity",
    width: "10%",
    selector: "quantityInitial",
    center: true,
    cell: r => (
      <span className="d-inline-flex">
        <AmountField
          datas={r}
          field={{
            canEdit: r.quantityEditable,
            maxLength: "13",
            key: "quantityInitial",
            disabled:
              _.findIndex(!!r.permission ? r.permission : [], {
                field: "quantity",
                editable: false
              }) >= 0,
            placeholder: r.placeholder ? r.placeholder : "",
            format: {
              thousand: true,
              decimal: 3
            },
            onBlur: event => r.onBlur.call(this, event)
          }}
        />
      </span>
    )
  },
  {
    name: "Unit",
    width: "10%",
    selector: "quantityUnit",
    center: true,
    cell: r => (
      <span className="d-inline-flex">
        <TextField
          datas={r}
          field={{
            canEdit: r.unitEditable,
            key: "quantityUnit",
            disabled:
              _.findIndex(!!r.permission ? r.permission : [], {
                field: "quantityUnit",
                editable: false
              }) >= 0,
            placeholder: r.placeholder ? r.placeholder : "",
            onChange: event => r.onChange.call(this, event)
          }}
        />
      </span>
    )
  },
  {
    name: "Unit Price",
    width: "10%",
    selector: "unitPrice",
    center: true,
    cell: r => (
      <span className="d-inline-flex">
        <NumberField
          datas={r}
          field={{
            canEdit: r.unitPriceEditable,
            maxLength: "13",
            key: "unitPrice",
            disabled:
              _.findIndex(!!r.permission ? r.permission : [], {
                field: "unitPrice",
                editable: false
              }) >= 0,
            placeholder: r.placeholder ? r.placeholder : "",
            format: {
              thousand: true,
              decimal: 3
            },
            onBlur: event => r.onBlur.call(this, event)
          }}
        />
      </span>
    )
  },
  {
    name: "TAX",
    width: "10%",
    selector: "vatCode",
    center: true,
    type: "text",
    cell: r => {
      return (
        <span className="d-inline-flex">
          <SelectField
            datas={r}
            field={{
              defaultValue: "-",
              canEdit: r.vatCodeEditable,
              key: "vatCode",
              placeholder: r.placeholder ? r.placeholder : "",
              disabled:
                _.findIndex(!!r.permission ? r.permission : [], {
                  field: "vatCode",
                  editable: false
                }) >= 0,
              onChange: event => r.onChange.call(this, event)
            }}
          />
        </span>
      );
    }
  },
  {
    name: "Sub Total",
    width: "15%",
    selector: "subTotal",
    center: true,
    type: "text",
    cell: r => (
      <span className="d-inline-flex">
        <NumberField
          datas={r}
          field={{
            canEdit: r.subTotalEditable,
            maxLength: "13",
            key: "subTotal",
            disabled:
              _.findIndex(!!r.permission ? r.permission : [], {
                field: "subTotal",
                editable: false
              }) >= 0,
            placeholder: r.placeholder ? r.placeholder : "",
            format: {
              thousand: true,
              decimal: 2
            },
            onBlur: event => r.onBlur.call(this, event)
          }}
        />
      </span>
    )
  },
  {
    name: "Currency",
    width: "8%",
    selector: "currency",
    center: true,
    type: "text",
    cell: r => (
      <span className="d-inline-flex">
        <TextField
          datas={r}
          field={{
            canEdit: r.currencyEditable,
            key: "currency",
            disabled:
              _.findIndex(!!r.permission ? r.permission : [], {
                field: "currency",
                editable: false
              }) >= 0,
            placeholder: r.placeholder ? r.placeholder : "",
            onChange: event => r.onChange.call(this, event)
          }}
        />
      </span>
    )
  },
  {
    name: "Site",
    width: "10%",
    selector: "site",
    center: true,
    type: "text",
    cell: r => (
      <span className="d-inline-flex">
        <TextField
          datas={r}
          field={{
            canEdit: r.siteEditable,
            key: "site",
            disabled:
              _.findIndex(!!r.permission ? r.permission : [], {
                field: "site",
                editable: false
              }) >= 0,
            placeholder: r.placeholder ? r.placeholder : "",
            onChange: event => r.onChange.call(this, event)
          }}
        />
      </span>
    )
  },
  {
    name: "",
    width: "5%",
    selector: "delete",
    center: true,
    type: "text",
    cell: r => (
      <a
        // hidden={!r.requestItemEditable}
        href="javasctip:void(0)"
        id={r.linearId}
        onClick={event => r.onClick.call(this, r.externalId)}
      >
        <span className="d-inline-flex">
          <i className="fa fa-times" />
        </span>
      </a>
    )
  }
];

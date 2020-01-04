import AmountField from "~/components/Fields/AmountField";
import { AMOUNT_MAX_LENGTH } from "~/configs/constant";

export const DEBIT_NOTE_ITEMS_EDIT = [
  {
    name: "Invoice Item No.",
    selector: "externalId",
    center: true,
    type: "text"
  },
  {
    name: "Material Description",
    selector: "materialDescription",
    center: true,
    type: "text"
  },
  {
    name: "PO No.",
    selector: "purchaseOrderExternalId",
    center: true,
    type: "text"
  },
  {
    name: "PO Item No.",
    selector: "purchaseItemExternalId",
    center: true,
    type: "text"
  },
  {
    name: "Invoice Amount",
    selector: "itemSubTotal",
    center: true,
    type: "amount"
  },
  {
    name: "Adjusted Amount",
    selector: "adjustedAmount",
    center: true,
    type: "amount",
    ignoreRowClick: true,
    maxLength: AMOUNT_MAX_LENGTH,
    format: {
      decimal: 5
    },
    cell: r => (
      <div className="d-inline-flex">
        <AmountField
          datas={r}
          field={{
            canEdit: true,
            key: "adjustedAmount",
            disabled: !r.selected,
            placeholder: r.placeholder ? r.placeholder : "",
            format: {
              thousand: true,
              decimal: 2
            },
            maxLength: AMOUNT_MAX_LENGTH,
            onBlur: event => r.onBlur.call(this, event),
            className: `no-spinners form-control text-right ${r.className}`
          }}
        />
      </div>
    )
  },
  {
    name: "Currency",
    selector: "currency",
    center: true,
    type: "text"
  }
];

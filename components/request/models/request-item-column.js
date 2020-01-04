import AmountField from "~/components/Fields/AmountField";
import TextField from "~/components/Fields/TextField";
import SelectField from "~/components/Fields/SelectField";
import _ from "lodash";
import { AMOUNT_MAX_LENGTH } from "~/configs/constant";
import styled from "styled-components";

const Main = styled.div`
  input {
    width: 100% !important;
    min-width: 0 !important;
  }
  select {
    height: 28.5px !important;
    padding: 2px 13px !important;
  }
`;

export const MODEL_REQUEST_ITEM_COLUMN = [
  {
    name: "No.",
    width: "5%",
    selector: "number",
    center: true
  },
  {
    name: "Description",
    width: "20%",
    selector: "description",
    center: true,
    cell: r => {
      const permission = _.find(_.has(r, "permission") ? r.permission : [], {
        field: "description"
      });
      return (
        <Main className="d-inline-flex">
          <TextField
            datas={r}
            field={{
              canEdit: true,
              key: "description",
              disabled: _.has(permission, "editable")
                ? !permission.editable
                : false,
              defaultValue: _.has(permission, "defaultValue")
                ? permission.defaultValue
                : "",
              placeholder: r.placeholder ? r.placeholder : "",
              onChange: event => r.onChange.call(this, event)
            }}
          />
        </Main>
      );
    }
  },
  {
    name: "Quantity",
    width: "10%",
    selector: "quantity",
    center: true,
    cell: r => {
      const permission = _.find(_.has(r, "permission") ? r.permission : [], {
        field: "quantity"
      });
      return (
        <Main className="d-inline-flex">
          <AmountField
            datas={r}
            field={{
              canEdit: true,
              key: "quantity",
              disabled: _.has(permission, "editable")
                ? !permission.editable
                : false,
              defaultValue: _.has(permission, "defaultValue")
                ? permission.defaultValue
                : "",
              placeholder: r.placeholder ? r.placeholder : "",
              format: {
                thousand: true,
                decimal: 3
              },
              maxLength: AMOUNT_MAX_LENGTH,
              onBlur: event => r.onBlur.call(this, event),
              onFocus: event => r.onFocus.call(this, event)
            }}
          />
        </Main>
      );
    }
  },
  {
    name: "Unit",
    width: "10%",
    selector: "unitDescription",
    center: true,
    cell: r => {
      const permission = _.find(_.has(r, "permission") ? r.permission : [], {
        field: "unit"
      });
      return (
        <Main className="d-inline-flex">
          <TextField
            datas={r}
            field={{
              canEdit: true,
              key: "unitDescription",
              disabled: _.has(permission, "editable")
                ? !permission.editable
                : false,
              defaultValue: _.has(permission, "defaultValue")
                ? permission.defaultValue
                : "",
              placeholder: r.placeholder ? r.placeholder : "",
              onChange: event => r.onChange.call(this, event)
            }}
          />
        </Main>
      );
    }
  },
  {
    name: "Unit Price",
    width: "10%",
    selector: "unitPrice",
    center: true,
    cell: r => {
      const permission = _.find(_.has(r, "permission") ? r.permission : [], {
        field: "unitPrice"
      });
      return (
        <Main className="d-inline-flex">
          <AmountField
            datas={r}
            field={{
              canEdit: true,
              key: "unitPrice",
              disabled: _.has(permission, "editable")
                ? !permission.editable
                : false,
              defaultValue: _.has(permission, "defaultValue")
                ? permission.defaultValue
                : "",
              placeholder: r.placeholder ? r.placeholder : "",
              format: {
                thousand: true,
                decimal: 2
              },
              maxLength: AMOUNT_MAX_LENGTH,
              onBlur: event => r.onBlur.call(this, event),
              onFocus: event => r.onFocus.call(this, event)
            }}
          />
        </Main>
      );
    }
  },
  {
    name: "TAX",
    width: "10%",
    selector: "vatCode",
    center: true,
    cell: r => {
      const permission = _.find(_.has(r, "permission") ? r.permission : [], {
        field: "vatCode"
      });
      return (
        <Main className="d-inline-flex">
          <SelectField
            datas={r}
            field={{
              canEdit: true,
              key: "vatCode",
              placeholder: r.placeholder ? r.placeholder : "",
              disabled: _.has(permission, "editable")
                ? !permission.editable
                : false,
              defaultValue: _.has(permission, "defaultValue")
                ? permission.defaultValue
                : "V1",
              onChange: event => r.onChange.call(this, event)
            }}
          />
        </Main>
      );
    }
  },
  {
    name: "Sub Total",
    width: "10%",
    selector: "subTotal",
    center: true,
    cell: r => {
      const permission = _.find(_.has(r, "permission") ? r.permission : [], {
        field: "subTotal"
      });
      return (
        <Main className="d-inline-flex">
          <AmountField
            datas={r}
            field={{
              canEdit: true,
              key: "subTotal",
              disabled: _.has(permission, "editable")
                ? !permission.editable
                : false,
              defaultValue: _.has(permission, "defaultValue")
                ? permission.defaultValue
                : "",
              placeholder: r.placeholder ? r.placeholder : "",
              format: {
                thousand: true,
                decimal: 2
              },
              maxLength: AMOUNT_MAX_LENGTH,
              onBlur: event => r.onBlur.call(this, event),
              onFocus: event => r.onFocus.call(this, event)
            }}
          />
        </Main>
      );
    }
  },
  {
    name: "Currency",
    width: "10%",
    selector: "currency",
    center: true,
    cell: r => {
      const permission = _.find(_.has(r, "permission") ? r.permission : [], {
        field: "currency"
      });
      return (
        <Main className="d-inline-flex">
          <TextField
            datas={r}
            field={{
              canEdit: true,
              key: "currency",
              disabled: _.has(permission, "editable")
                ? !permission.editable
                : false,
              defaultValue: _.has(permission, "defaultValue")
                ? permission.defaultValue
                : "",
              placeholder: r.placeholder ? r.placeholder : "",
              onChange: event => r.onChange.call(this, event)
            }}
          />
        </Main>
      );
    }
  },
  {
    name: "Site",
    width: "10%",
    selector: "site",
    center: true,
    cell: r => {
      const permission = _.find(_.has(r, "permission") ? r.permission : [], {
        field: "site"
      });
      return (
        <Main className="d-inline-flex">
          <TextField
            datas={r}
            field={{
              canEdit: true,
              key: "site",
              disabled: _.has(permission, "editable")
                ? !permission.editable
                : false,
              defaultValue: _.has(permission, "defaultValue")
                ? permission.defaultValue
                : "",
              placeholder: r.placeholder ? r.placeholder : "",
              onChange: event => r.onChange.call(this, event)
            }}
          />
        </Main>
      );
    }
  },
  {
    name: " ",
    width: "5%",
    selector: "delete",
    center: true,
    cell: r => (
      <Main className="d-inline-flex">
        <a
          href="javasctip:void(0)"
          id={r.linearId}
          onClick={event => r.onClick.call(this, event)}
        >
          <div className="d-inline-flex">
            <i className="fa fa-times" />
          </div>
        </a>
      </Main>
    )
  }
];

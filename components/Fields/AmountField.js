import { Fragment } from "react";
import numeral from "numeral/numeral";
import NumberFormat from "react-number-format";
import styled from "styled-components";
import {
  toBigNumber,
  setDefaultValue,
  getKeyElementField,
  checkValue
} from "~/helpers/app";
import _ from "lodash";
/**
 * Component for render amount field
 *
 * @param [field] is a field, we need property
 * {
 *    id: is a field id,
 *    onChange: is a event function (required when canEdit = true),
 *    onBlur: is a event function (required when canEdit = true),
 *    canEdit: is flag for edit,
 *    condition: is condition for display value,
 *    defaultValue: is value for display when condition is true,
 *    disabled: is a disabled field,
 *    placeholder: is a placeholder field,
 *    styleInput: is a css of value,
 *    styleUnit: is a css of unit,
 *    classInput: is css class of value,
 *    classUnit: is css class of unit
 * }
 * @param [datas] is a data of field (required)
 * @return {target.value} The result of value display.
 * @return {target.number} The result of value convert to amount.
 */

const device = {
  xs: `(max-width: 576px)`,
  sm: `(min-width: 576px)`,
  md: `(min-width: 768px)`,
  lg: `(min-width: 992px)`,
  xl: `(min-width: 1200px)`
};

const Main = styled.div`
  width: 100%;
  input {
    height: 28.5px;
    margin-bottom: 2px;
  }

  @media ${device.xs} {
    .amount {
      min-width: 94px;
      padding: 0;
      text-align: left !important;
    }
    .currency {
      padding: 0px 0px 0px 3px;
    }
  }
`;

const Unit = styled.span`
  width: 100%;
`;

const CreateFormatAmount = (thousand = null, decimal = null) => {
  let strAmount = "####";
  if (thousand) {
    strAmount = "#,###";
  }
  if (decimal) {
    strAmount += ".";
    for (let i = 0; i < decimal; i++) strAmount += "0";
  }
  return strAmount;
};

const checkIsAllowed = (values, options, format) => {
  const { value, floatValue } = values;

  const maxLength = parseInt(options.maxLength ? options.maxLength : 99);
  const decimalLength = parseInt(
    (String(numeral(value).format(format)).split(".")[1] || "").length
  );
  const numberLength = maxLength - decimalLength;
  return (
    value === "" ||
    (floatValue >= 0 &&
      String(value.split(".")[0] || 0).length ===
        String(floatValue).split(".")[0].length &&
      decimalLength - String(value.split(".")[1] || "").length >= 0 &&
      numberLength - String(value.split(".")[0] || "").length >= 0)
  );
};

const AmountField = ({ field, datas }) => {
  const keyElement = getKeyElementField(field);

  const thousand =
    field.format && field.format.thousand ? field.format.thousand : "none";
  const decimal =
    field.format && field.format.decimal ? field.format.decimal : false;

  const format = CreateFormatAmount(thousand, decimal);

  const value = numeral(String(datas[keyElement] || "0")).format(format);

  const option = {
    id: keyElement,
    name: keyElement,
    className: `no-spinners form-control text-right field-font-basic ${
      datas[`${keyElement}-className`] ? datas[`${keyElement}-className`] : ""
    }`,
    disabled: !!field.disabled,
    placeholder: field.placeholder ? field.placeholder : "",
    value: value,
    isAllowed: values => checkIsAllowed(values, field, format),
    allowNegative: false,
    maxLength: 99,
    thousandSeparator: thousand,
    style: field.styleInput,
    onChange: event => {
      if (
        field.onChange &&
        toBigNumber(event.target.value || 0).toNumber() !== value
      ) {
        event.target.number = toBigNumber(event.target.value).toNumber();
        field.onChange.call(this, event);
      }
    },
    onBlur: event => {
      if (
        field.onBlur &&
        toBigNumber(event.target.value || 0).toNumber() !== value
      ) {
        event.target.number = toBigNumber(event.target.value).toNumber();
        field.onBlur.call(this, event);
      } else {
        event.target.value = value;
      }
    },
    onFocus: event => {
      if (toBigNumber(event.target.value).toNumber() <= 0) {
        event.target.value = "";
      }
    }
  };

  return field.canEdit ? (
    <Main className="d-inline-flex">
      {!!field.classInput ? (
        <div className={field.classInput}>
          <NumberFormat {...option} />
        </div>
      ) : (
        <NumberFormat {...option} />
      )}

      {field.currency &&
        datas.currency &&
        (!!field.classUnit ? (
          <div className={field.classUnit}>
            <Unit className={`unit`} style={field.styleUnit}>
              {datas.currency}
            </Unit>
          </div>
        ) : (
          <Unit className={`unit`} style={field.styleUnit}>
            {datas.currency}
          </Unit>
        ))}
    </Main>
  ) : (
    <Main className="d-inline-flex">
      {field.condition ? (
        field.defaultValue
      ) : !!field.classInput ? (
        <div className={`text-right ${field.classInput} amount`}>
          <Unit className={``} style={field.styleInput}>
            {numeral(String(datas[field.key])).format(format)}
          </Unit>
        </div>
      ) : (
        <Unit className={`text-right`} style={field.styleInput}>
          {numeral(String(datas[field.key])).format(format)}
        </Unit>
      )}
      {field.currency &&
        datas.currency &&
        (!!field.classUnit ? (
          <div className={`${field.classUnit} currency`}>
            <Unit className="unit">{datas.currency}</Unit>
          </div>
        ) : (
          <Unit className={`unit`} style={field.styleUnit}>
            {datas.currency}
          </Unit>
        ))}
    </Main>
  );
};

export default AmountField;

import { useState, useEffect } from "react";
import styled from "styled-components";
import {
  toBigNumber,
  getKeyElementField,
  isValidAmount,
  isValueNumber
} from "~/helpers/app";
import _ from "lodash";

const device = {
  xs: `(max-width: 576px)`,
  sm: `(min-width: 576px)`,
  md: `(min-width: 768px)`,
  lg: `(min-width: 992px)`,
  xl: `(min-width: 1200px)`
};

const MainWrapper = styled.div`
  width: 100%;
  input {
    height: 28.5px;
    margin-bottom: 2px;
    width: 100%;
    text-align: right;
    &.error {
      color: red;
    }
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

const UnitWrapper = styled.div`
  line-height: 27px;
  span,
  i {
    vertical-align: middle;
  }
  i {
    color: #933393;
    font-size: 19px;
  }
`;
const CurrencyWrapper = styled.span`
  padding: 0.25rem 0.7rem;
  width: 100%;
`;

/**
 * Component for render number field
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
const validateValueError = ({ required = false, value = 0 }) => {
  if (required && value === "") {
    return true;
  }

  return false;
};

const isValidNumber = value => {
  let number = value;

  if (number === "-") return true;

  if (number.charAt(0) === "-") {
    const splitNumber = number.split("-");

    if (splitNumber.length > 2) return false;

    return isValueNumber(splitNumber[1]);
  }

  return isValueNumber(number);
};

const NumberField = ({ field, datas }) => {
  const keyElement = getKeyElementField(field);
  const thousandSeparator = _.has(field, "format.thousand")
    ? field.format.thousand
    : true;
  const decimalLength = _.has(field, "format.decimal")
    ? field.format.decimal
    : 0;

  let amountValue = toBigNumber(
    _.get(datas, keyElement) || datas[keyElement] || field.defaultValue || 0
  ).toFormat(decimalLength);

  if (thousandSeparator === false) {
    amountValue = toBigNumber(amountValue).toNumber();
  }

  const [mainValue, setMainValue] = useState(amountValue);
  const [firstValue, setFirstValue] = useState(amountValue);
  const [errorValue, seterrorValue] = useState(
    validateValueError({
      required: field.required,
      value: mainValue
    })
  );

  useEffect(() => {
    if (amountValue !== firstValue) {
      setFirstValue(amountValue);
      setMainValue(amountValue);
      seterrorValue(
        validateValueError({
          required: field.required,
          value: amountValue
        })
      );
    }
  });

  return field.canEdit ? (
    <MainWrapper className={`d-inline-flex ${field.className}`}>
      <div className={`${field.classInput}`}>
        <input
          id={keyElement}
          name={keyElement}
          disabled={field.disabled || false}
          className={`form-control field-font-basic ${
            errorValue ? "error" : ""
          } ${
            datas[`${keyElement}-className`]
              ? datas[`${keyElement}-className`]
              : ""
          }`}
          type="text"
          value={mainValue}
          placeholder={field.placeholder || ""}
          onFocus={e => {
            let value = toBigNumber(e.target.value).toNumber();
            if (value === 0) {
              value = "";
            }
            setMainValue(value);
          }}
          onChange={e => {
            let error = false;
            let value = e.target.value;
            if (
              value === "" ||
              (isValidNumber(value) &&
                isValidAmount({
                  amount: value,
                  decimalLength: decimalLength
                }))
            ) {
              if (
                validateValueError({
                  required: field.required,
                  value: value
                })
              ) {
                error = true;
              }

              e.target.number = toBigNumber(value).toNumber();
              e.target.value = value;

              if (field.onChange) {
                field.onChange.call(this, e);
              }
              setMainValue(value);
              seterrorValue(error);
            }
          }}
          onBlur={e => {
            let value = toBigNumber(e.target.value).toNumber();
            let number = value;

            if (thousandSeparator) {
              value = toBigNumber(value).toFormat(decimalLength);
            }

            e.target.number = number;
            e.target.value = value;

            if (number !== mainValue) {
              if (field.onBlur) {
                field.onBlur.call(this, e);
              }
            }

            setMainValue(value);
          }}
        />
      </div>

      <div className={`${field.classUnit}`}>
        <UnitWrapper>
          {field.currency && datas.currency && (
            <CurrencyWrapper className={``} style={field.styleUnit}>
              {datas.currency}
            </CurrencyWrapper>
          )}
        </UnitWrapper>
      </div>
    </MainWrapper>
  ) : (
    <MainWrapper className="d-inline-flex">
      {field.condition ? (
        field.defaultValue
      ) : !!field.classInput ? (
        <div
          className={`text-right ${field.classInput} ${
            datas[`${keyElement}-className`]
              ? datas[`${keyElement}-className`]
              : ""
          }`}
        >
          <CurrencyWrapper className={``} style={field.styleInput}>
            {toBigNumber(mainValue).toFormat(decimalLength)}
          </CurrencyWrapper>
        </div>
      ) : (
        <CurrencyWrapper className={`text-right`} style={field.styleInput}>
          {toBigNumber(mainValue).toFormat(decimalLength)}
        </CurrencyWrapper>
      )}
      <div className={`${field.classUnit}`}>
        <UnitWrapper>
          {field.currency && datas.currency && (
            <CurrencyWrapper className={``} style={field.styleUnit}>
              {datas.currency}
            </CurrencyWrapper>
          )}
        </UnitWrapper>
      </div>
    </MainWrapper>
  );
};

export default NumberField;

import _ from "lodash";
import DetailField from "./DetailField";
import { getKeyElementField, checkValue } from "~/helpers/app";
import { withTranslation } from "~/i18n";

const prepareOptions = (options = [], option = {}) => {
  // Fix for pass by reference
  const newOptions = [...options];

  if (_.isEmpty(option)) return newOptions;

  if (option.value === "") newOptions.unshift(option);

  return _.uniqWith(newOptions, _.isEqual);
};

/**
 * Component for render dropdown field
 *
 * @param [field] is a field, we need property
 * {
 *    id: is a field id,
 *    key: is a field name (required),
 *    onChange: is a event function (required when canEdit = true),
 *    canEdit: is flag for edit,
 *    condition: is condition for display value,
 *    defaultValue: is value for display when condition is true,
 *    disabled: is a disabled field,
 *    display: is a value for display,
 *    placeholder: is a placeholder field,
 *    classInput: is css class of value,
 *    styleInput: is css of value
 * }
 * @param [datas] is a data of field (required)
 *    in datas we need field [key]Options: is a value list in dropdown, we support format value list is e.g.
 *      [
 *        {
 *          value: "test",
 *          display: "test"
 *        }
 *      ],
 */
const SelectField = ({ field, datas, lang, t }) => {
  const keyElement = getKeyElementField(field);
  const option = _.find(datas[`${keyElement}Options`] || [], value => {
    return (
      value.value === datas[keyElement] || value.display === datas[keyElement]
    );
  });

  const value = option ? datas[keyElement] : "";
  const valueDisplay = option ? datas[`${keyElement}Display`] : "";
  const showValue = field.display
    ? field.display
    : valueDisplay
    ? valueDisplay
    : value;

  const showPlaceholder = `${
    field.placeholder ? t(`${lang}:${field.placeholder}`) : ""
  } ${field.required && field.canEdit ? "*" : ""}`.trim();

  let options = prepareOptions(datas[`${keyElement}Options`] || [], {
    value: "",
    display: showPlaceholder
  });

  options = prepareOptions(options, {
    value: checkValue(value, ""),
    display: value ? showValue.trim() : showPlaceholder
  });

  return field.canEdit ? (
    <select
      id={keyElement}
      name={keyElement}
      className={`custom-select field-font-basic ${
        field.columnField ? "" : "form-control"
      } ${field.classInput ? field.classInput : ""} ${
        datas[`${keyElement}-className`] ? datas[`${keyElement}-className`] : ""
      }`}
      value={value}
      disabled={field.disabled}
      style={field.style}
      onChange={event =>
        field.onChange ? field.onChange.call(this, event) : {}
      }
      onBlur={event => (field.onBlur ? field.onBlur.call(this, event) : {})}
    >
      {_.map(options, ({ value, display }, index) => (
        <option key={value + index} value={value}>
          {display}
        </option>
      ))}
    </select>
  ) : (
    <DetailField field={field} datas={datas} />
  );
};

export default withTranslation("debit-create", "request-create")(SelectField);

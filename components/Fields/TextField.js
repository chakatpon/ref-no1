import DetailField from "./DetailField";
import _ from "lodash";
import { getKeyElementField } from "~/helpers/app";
import { withTranslation } from "~/i18n";
/**
 * Component for render text field
 *
 * @param [field] is a field, we need property
 * {
 *    id: is a field id,
 *    key: is a field name (required),
 *    onChange: is a event function (required when canEdit = true),
 *    canEdit: is flag for edit,
 *    condition: is condition for display value,
 *    defaultValue: is value for display when condition is true,
 *    minLength: is a min length of value,
 *    maxLength: is a max length of value,
 *    disabled: is a disabled field,
 *    placeholder: is a placeholder field,
 *    classInput: is css class of value,
 *    styleInput: is css of value
 * }
 * @param [datas] is a data of field (required)
 */
const TextField = ({ field, datas, lang, t }) => {
  const keyElement = getKeyElementField(field);
  return field.canEdit ? (
    <div>
      <input
        id={keyElement}
        type="text"
        name={keyElement}
        className={`form-control field-font-basic ${
          field.classInput ? field.classInput : ""
        } ${
          datas[`${keyElement}-className`]
            ? datas[`${keyElement}-className`]
            : ""
        }`}
        minLength={field.minLength ? field.minLength : 0}
        maxLength={field.maxLength ? field.maxLength : 99}
        disabled={field.disabled}
        placeholder={field.placeholder ? t(`${lang}:${field.placeholder}`) : ""}
        style={field.styleInput}
        value={datas[keyElement] || ""}
        onChange={event =>
          field.onChange ? field.onChange.call(this, event) : {}
        }
        onBlur={event => (field.onBlur ? field.onBlur.call(this, event) : {})}
      />
      {_.has(field, "showTitle") &&
        field.showTitle &&
        _.has(field, "title") && (
          <label htmlFor={keyElement}>{`${t(`${lang}:${field.title}`)} ${
            field.required && field.canEdit ? "*" : ""
          }`}</label>
        )}
      {!!datas[`${keyElement}-invalid`] && (
        <small className={`field-invalid`}>
          {datas[`${keyElement}-message`]}
        </small>
      )}
    </div>
  ) : (
    <DetailField field={field} datas={datas} />
  );
};

export default withTranslation(["debit-create", "request-edit"])(TextField);

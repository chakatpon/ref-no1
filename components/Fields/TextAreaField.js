import DetailField from "./DetailField";
import _ from "lodash";
import { getKeyElementField } from "~/helpers/app";
import { withTranslation } from "~/i18n";
/**
 * Component for render text area field
 *
 * @param [field] is a field, we need property
 * {
 *    id: is a field id,
 *    key: is a field name (required),
 *    onChange: is a event function (required when canEdit = true),
 *    canEdit: is flag for edit,
 *    rows: is a number column in field we default 5,
 *    condition: is condition for display value,
 *    defaultValue: is value for display when condition is true,
 *    minLength: is a min length of value,
 *    maxLength: is a max length of value,
 *    disabled: is a disabled field,
 *    placeholder: is a placeholder field
 *    classInput: is css class of value,
 *    styleInput: is css of value
 * }
 * @param [datas] is a data of field (required)
 */
const TextAreaField = ({ field, datas, lang, t }) => {
  const keyElement = getKeyElementField(field);
  return field.canEdit ? (
    <div>
      <textarea
        id={keyElement}
        rows={field.rows ? field.rows : 5}
        className={`form-control border border-1px border-lightgray w-100 field-font-basic ${
          field.classInput ? field.classInput : ""
        } ${
          datas[`${keyElement}-className`]
            ? datas[`${keyElement}-className`]
            : ""
        }`}
        name={keyElement}
        onChange={event => field.onChange.call(this, event)}
        value={datas[keyElement] || ""}
        minLength={field.minLength ? field.minLength : 0}
        maxLength={field.maxLength ? field.maxLength : 99}
        disabled={field.disabled}
        placeholder={field.placeholder ? t(`${lang}:${field.placeholder}`) : ""}
        style={field.styleInput}
      />
      {_.has(field, "showTitle") &&
        field.showTitle &&
        _.has(field, "title") && (
          <label htmlFor={keyElement}>{`${t(`${lang}:${field.title}`)} ${
            field.required && field.canEdit ? "*" : ""
          }`}</label>
        )}
    </div>
  ) : (
    <DetailField field={field} datas={datas} />
  );
};

export default withTranslation([
  "debit-create",
  "request-edit",
  "request-create"
])(TextAreaField);

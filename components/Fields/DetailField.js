import { Fragment } from "react";

/**
 * Component for render detail field
 *
 * @param [field] is a field, we need property
 * {
 *    condition: is condition for display value
 *    defaultValue: is value for display when condition is true
 * }
 * @param [datas] is a data of field (required)
 */
const DetailField = ({ field, datas }) => (
  <Fragment>
    <div
      style={field.styleInput}
      className={
        datas[`${field.key}-className`] ? datas[`${field.key}-className`] : ""
      }
    >
      {field.condition
        ? field.defaultValue || ""
        : datas[`${field.key}Display`] ||
          datas[field.key] ||
          field.defaultValue ||
          ""}
    </div>
  </Fragment>
);

export default DetailField;

import React, { Component } from "react";
import DayPickerInput from "react-day-picker/DayPickerInput";
import { formatDate, parseDate } from "react-day-picker/moment";
import DetailField from "./DetailField";
import styled from "styled-components";
import _ from "lodash";

/**
 * Component for render date field with specify date disabled
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
 *    placeholder: is a placeholder field,
 *    columnField: is a field in one column have no title (required when use the component [ColumnField]),
 *    classInput: is a css class of value,
 *    classIcon: is a css class of icon calendar,
 *    styleInput: is a css of value,
 *    disabledDays: is a date cannot select
 * }
 * @param [datas] is a data of field (required)
 */
const Main = styled.div`
  width: 100%;
  position: relative;
  i {
    right: 23px !important;
    position: absolute !important;
    top: calc(50% - 9px) !important;
  }
  input {
    margin-bottom: 2px;
  }
`;

class DayPickerField extends Component {
  render() {
    const { field, datas } = this.props;

    return field.canEdit ? (
      <Main className={field.classInput ? field.classInput : ""}>
        <DayPickerInput
          formatDate={formatDate}
          parseDate={parseDate}
          format={field.format ? field.format : "DD/MM/YYYY"}
          name={field.key}
          inputProps={{
            id: field.id ? field.id : field.key,
            className: `datepicker form-control ${
              datas[`${field.key}-className`]
                ? datas[`${field.key}-className`]
                : ""
            }`
          }}
          disabled={field.disabled}
          placeholder={field.placeholder ? field.placeholder : ""}
          style={field.styleInput}
          value={datas[field.key] ? datas[field.key] : ""}
          dayPickerProps={{
            disabledDays: field.disabledDays ? field.disabledDays : {}
          }}
          onDayChange={event =>
            field.onChange ? field.onChange.call(this, event) : {}
          }
        />
        {field.columnField ? null : (
          <i
            className={`fa fa-calendar purple ${
              field.classIcon ? field.classIcon : ""
            }`}
            style={{ zIndex: 1 }}
          />
        )}
        {_.has(field, "showTitle") &&
          field.showTitle &&
          _.has(field, "title") && (
            <label htmlFor={field.id}>{`${field.title} ${
              field.required && field.canEdit ? "*" : ""
            }`}</label>
          )}
      </Main>
    ) : (
      <DetailField field={field} datas={datas} />
    );
  }
}

export default DayPickerField;

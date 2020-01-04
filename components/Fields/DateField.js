import React, { Component } from "react";
import DetailField from "./DetailField";
import moment from "moment";
import styled from "styled-components";
import _ from "lodash";
import { getKeyElementField } from "~/helpers/app";
import { withTranslation } from "~/i18n";
/**
 * Component for render date field
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
 *    minDate: is a min range date for select,
 *    maxDate: is a max range date for select
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

class DateField extends Component {
  state = {
    selectedDate: ""
  };

  componentDidMount() {
    const { field, datas } = this.props;
    if (field.canEdit) {
      this.initConfigCalendar(field, datas);
    }
  }

  componentDidUpdate(prevProps, prevState) {
    const { field, datas } = this.props;

    if (
      field.canEdit &&
      (prevProps.datas[field.key] !== datas[field.key] ||
        prevProps.field.minDate !== field.minDate ||
        prevProps.field.maxDate !== field.maxDate)
    ) {
      this.initConfigCalendar(field, datas);
    }
  }

  initConfigCalendar = (field, datas) => {
    const keyElement = getKeyElementField(field);
    const minDate = field.minDate ? field.minDate : null;
    const maxDate = field.maxDate ? field.maxDate : null;

    $(document).ready(() => {
      window
        .jQuery(`#${keyElement}`)
        .daterangepicker({
          singleDatePicker: true,
          showDropdowns: true,
          autoUpdateInput: false,
          autoApply: true,
          minDate: moment(minDate).format("DD/MM/YYYY"),
          maxDate: moment(maxDate).format("DD/MM/YYYY"),
          locale: {
            format: "DD/MM/YYYY"
          }
        })
        .on("apply.daterangepicker", (event, picker) => {
          const selectedDate = picker.startDate.format("DD/MM/YYYY");

          window.jQuery(`#${keyElement}`).val(selectedDate);

          field.onChange.call(this, event);

          this.setState({
            selectedDate: selectedDate
          });
        })
        .on("change", event => {
          const selectedDateIsValid = moment(
            event.target.value,
            "DD/MM/YYYY",
            true
          ).isValid();

          if (selectedDateIsValid) {
            const selectedDate = event.target.value;
            const selectedDateFormat = moment(selectedDate, "DD/MM/YYYY");
            const minDateFormat = moment(
              moment(minDate).format("DD/MM/YYYY"),
              "DD/MM/YYYY"
            );
            const maxDateFormat = moment(
              moment(maxDate).format("DD/MM/YYYY"),
              "DD/MM/YYYY"
            );
            const dateInRage = selectedDateFormat.isBetween(
              minDateFormat,
              maxDateFormat,
              null,
              "[]"
            );

            if (dateInRage) {
              field.onChange.call(this, event);

              this.setState({
                selectedDate: selectedDate
              });
            } else {
              window
                .jQuery(`#${keyElement}`)
                .val(selectedDate || this.state.selectedDate || datas[keyElement]);
                if (selectedDate) {
                  this.setState({
                    selectedDate
                  })
                  field.onChange.call(this, event);
                }
            }
          } else {
            window
              .jQuery(`#${keyElement}`)
              .val(this.state.selectedDate || datas[keyElement]);
          }
        });

      if (datas[keyElement]) {
        this.setRangeDateWhenClickBackButton(keyElement, datas[keyElement]);
      }
    });
  };

  setRangeDateWhenClickBackButton = (id, date) => {
    if (
      window.jQuery(`#${id}`) &&
      window.jQuery(`#${id}`).data("daterangepicker")
    ) {
      window.jQuery(`#${id}`).val(date);
      window
        .jQuery(`#${id}`)
        .data("daterangepicker")
        .setStartDate(date);
      window
        .jQuery(`#${id}`)
        .data("daterangepicker")
        .setEndDate(date);
    }
  };

  render() {
    const { field, datas, lang, t } = this.props;
    const keyElement = getKeyElementField(field);
    return field.canEdit ? (
      <Main className={field.classInput ? field.classInput : ""}>
        <input
          id={keyElement}
          type="text"
          name={keyElement}
          className={`datepicker form-control ${
            datas[`${keyElement}-className`]
              ? datas[`${keyElement}-className`]
              : ""
          }`}
          disabled={field.disabled}
          placeholder={
            field.placeholder ? t(`${lang}:${field.placeholder}`) : ""
          }
          style={field.styleInput}
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
            <label htmlFor={keyElement}>{`${t(`${lang}:${field.title}`)} ${
              field.required && field.canEdit ? "*" : ""
            }`}</label>
          )}
      </Main>
    ) : (
      <DetailField field={field} datas={datas} />
    );
  }
}

export default withTranslation(["debit-create"])(DateField);

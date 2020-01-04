import React, { Component } from "react";
import {
  asyncContainer,
  Typeahead
} from "../../libs/react-bootstrap-typeahead";

const AsyncTypeahead = asyncContainer(Typeahead);

/**
 * Component for render auto complete field
 *
 * @param [inputProps] is a object detail in input field (required)
 * @param [placeholder] is a placeholder field
 * @param [labelKey] is a field name (required)
 * @param [minLength] is length start for search value (required)
 * @param [isLoading] is loading animation when search (required)
 * @param [inputValue] is default value input
 * @param [options] is a store data from query (required)
 * @param [handleAutoCompleteChange] is a event when change the value in input
 * @param [handleSearch] is a event for query data
 * @param [classInputHint] is a css class for input hint
 * @param [datas] is a data of field from model
 */
class AutoCompleteField extends Component {
  componentDidMount() {
    const { classInputHint } = this.props;

    // Edit input hint style for call this component from model
    if (classInputHint) {
      const elementInputHint = document.getElementsByClassName(
        "rbt-input-hint"
      );

      if (elementInputHint.length > 0) {
        elementInputHint[0].classList.add("auto-complete-rbt-input-hint");
      }
    }
  }

  render() {
    const {
      inputProps,
      placeholder,
      labelKey,
      minLength,
      isLoading,
      inputValue,
      options,
      handleAutoCompleteChange,
      handleSearch,
      datas,
      disabled,
      delay
    } = this.props;

    return (
      <span className="form-label-group">
        <AsyncTypeahead
          inputProps={inputProps}
          placeholder={placeholder}
          defaultInputValue={
            inputValue
              ? inputValue
              : datas && datas[inputProps.name]
              ? datas[inputProps.name]
              : ""
          }
          isLoading={
            datas && datas[`${inputProps.name}IsLoading`]
              ? datas[`${inputProps.name}IsLoading`]
              : isLoading
          }
          labelKey={labelKey}
          minLength={minLength}
          useCache={false}
          onChange={selected => handleAutoCompleteChange(selected[0])}
          onSearch={query => handleSearch(query)}
          options={
            datas && datas[`${inputProps.name}Options`]
              ? datas[`${inputProps.name}Options`]
              : options
          }
          disabled={disabled}
          delay={delay !== undefined && delay !== null ? delay : 200}
        />
      </span>
    );
  }
}

export default AutoCompleteField;

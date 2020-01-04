import numeral from "numeral";
import moment from "moment-timezone";

import responseConfig from "../configs/response.config.json";

/**
 * Class to format response for data table and export excel.
 *  @type class
 */
class ResponseService {
  /**
   * Function to set value.
   *  @type function
   *  @param {object} record is a record data in row of table
   *  @param {string} fields is a field name
   *    (i.e. externalId, customisedFields.xxx, debitNoteItems[].externalId.xxx)
   *  @param {array} value is a new value for change
   *    [
   *      {
   *        "value": "1",
   *        "display": "test1"
   *      },
   *      {
   *        "value": "2",
   *        "display": "test2"
   *      }
   *    ]
   */
  setValue = (record, fields, value) => {
    const splitField = fields.split(".");
    const field = splitField[0];

    if (field.indexOf("[]") !== -1) {
      const splitArrayField = field.split("[]");
      const newList = record[splitArrayField[0]];
      const newField = splitField.slice(1, splitField.lenght);

      newList.forEach(item => this.setValue(item, newField.join("."), value));

      return;
    }

    // Remove first index
    splitField.splice(0, 1);

    if (splitField.length > 0) {
      return this.setValue(record[field], splitField.join("."), value);
    }

    const newValue = value.find(key => key.value === record[field]);

    record[field] = newValue ? newValue.display : record[field];
  };

  /**
   * Function to get value.
   *  @type function
   *  @param {object} record is a record data in row of table
   *  @param {string} fields is a field name
   *    (i.e. externalId, customisedFields.xxx, debitNoteItems[].externalId.xxx)
   *  @returns {*} The data of field
   *  @default ""
   */
  getValue = (record, fields) => {
    if (record === undefined || record === null) return "";

    const splitField = fields.split(".");
    const field = splitField[0];

    if (field.indexOf("[]") !== -1) {
      const splitArrayField = field.split("[]");
      const newList = record[splitArrayField[0]];
      const newField = splitField.slice(1, splitField.lenght);
      const items = newList.map(item =>
        this.getValue(item, newField.join("."))
      );

      return items.toString();
    }

    // Remove first index
    splitField.splice(0, 1);

    if (splitField.length > 0) {
      return this.getValue(record[field], splitField.join("."));
    }

    return record[field] || "";
  };

  /**
   * Function to get response config from json file.
   *  @type function
   *  @param {string} group is a group name
   *    (i.e. externalId, customisedFields.xxx, debitNoteItems[].externalId.xxx)
   *  @returns {object} The response config
   *  @default null
   */
  getResponseConfig = group => {
    return responseConfig[group] || null;
  };

  /**
   * Function to check and set as default data when data from api not return.
   *  @type function
   *  @param {object} response is a response data
   *  @param {object} columns is a table columns from off-chain
   *  @returns {object} The response data
   *  @default {}
   */
  setDefaultDataByColumnWhenDataIsNull = (response, columns) => {
    return response.map(res => {
      const result = {
        ...res
      };

      columns.map(column => {
        result[column.field] = res[column.field] ? res[column.field] : "";
      });

      return result;
    });
  };

  /**
   * Function to set value by response config json file.
   *  @type function
   *  @param {object} response is a response data
   *  @param {string} group is a name of data type for set value
   *    (i.e. credit, debit)
   */
  setValueByResponseConfigFile = (response, group) => {
    const config = this.getResponseConfig(group);

    if (!config) return;

    response.forEach(res => {
      config.fields.forEach(item => {
        const field = Object.keys(item)[0];

        this.setValue(res, field, item[field]);
      });
    });
  };

  /**
   * Function to set value by response config json file per field.
   *  @type function
   *  @param {string} field is a name of field
   *  @param {*} data is a data of field
   *  @param {string} group is a name of data type for set value
   *    (i.e. credit, debit)
   *  @returns {object} New data
   *  @default {*} Old data
   */
  setValueByResponseConfigFilePerField = (field, data, group) => {
    const config = this.getResponseConfig(group);

    if (!config) return;

    const findField = config.fields.find(fieldName => fieldName === field);
    const findValue = findField.find(value => value.value === data);

    return findValue ? findValue.display : data;
  };

  /**
   * Function to set format by type base on config in column.
   *  @type function
   *  @param {object} response is a response data
   *  @param {object} columns is a table columns from off-chain
   *  @returns {object} The response data
   *  @default {} The old response data
   */
  setValueByTypeBaseOnConfigInColumn = (response, columns) => {
    return response.map(res => {
      let resData = {
        ...res
      };

      columns.map(column => {
        const { type, templateName, field } = column;

        if (type === "number") {
          const value = this.getValue(res, field);
          const pattern = column.pattern || "#,###.00";

          res[field] = numeral(value).format(pattern);
        } else if (type === "date" || templateName === "dueDate") {
          const value = this.getValue(res, field);

          res[field] =
            value === "" || value === "-"
              ? value
              : moment(value).format(column.pattern);
        } else {
          const value = this.getValue(res, field);

          res[field] = value;
        }

        resData = { ...resData, [field]: res[field] };
      });

      return resData;
    });
  };
}

export default ResponseService;

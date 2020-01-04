import numeral from "numeral/numeral";
import BigNumber from "bignumber.js";
import { AMOUNT_MAX_LENGTH } from "~/configs/constant";
import _ from "lodash";
/**
 * Set object
 */
export const setObject = (object = {}, setDefault = {}) => {
  return Object.keys(object).reduce((p, c) => {
    if (object[c]) p[c] = decodeURIComponent(object[c]);
    return p;
  }, setDefault);
};

export const toAmount = (amount = "") => {
  return numeral(String(amount))._value || 0;
};

export const toBigNumber = (amount = "") => {
  return new BigNumber(toAmount(amount));
};

export const mapActionHistory = actionHistories => {
  return actionHistories.map(actionHistory => {
    let actionName = "";
    let actionBy = "";

    switch (actionHistory.actionName) {
      case "TrilateralMatch":
        actionName = "3 Way Matching Result";
        break;
      case "BuyerApprove":
      case "BuyerApprovePrice":
        actionName = "Manual Approval";
        break;
      case "BuyerReject":
      case "BuyerRejectPrice":
        actionName = "Request to Resubmit";
        break;
      case "BuyerClarify":
        actionName = "Clarify";
        break;
      case "AuthorityPartialApprove":
        actionName = "Partial DOA Approval";
        break;
      case "AuthorityFinalApprove":
        actionName = "Final DOA Approval";
        break;
      case "AuthorityReject":
        actionName = "Request Clarification";
        break;
      case "AuthorityRejectToSeller":
        actionName = "Request to Resubmit";
        break;
      default:
        actionName = actionHistory.actionName;
        break;
    }

    switch (actionHistory.actionBy) {
      case "SYSTEM":
        switch (actionHistory.documentType) {
          case "debitnote":
            actionBy = "Debit Note";
            break;
          case "invoice":
            actionBy = "3 Way Matching";
            break;
        }
        break;
      default:
        actionBy = actionHistory.commonName || actionHistory.actionBy;
        break;
    }

    return {
      ...actionHistory,
      actionName,
      actionBy
    };
  });
};

export const strReplace = (text, search, replace) => {
  return _.replace(String(text), new RegExp(search, "g"), replace);
};

export const isValidAmount = (
  amount = "",
  maxLangth = AMOUNT_MAX_LENGTH,
  decimal = 2
) => {
  amount = toBigNumber(amount).toFixed(decimal);
  if (
    isNaN(amount) == false &&
    String(amount).replace(".", "").length <= maxLangth
  ) {
    return true;
  }
  return false;
};

export const setConfigPermissionToArray = configPermission => {
  let permission = {};
  configPermission.forEach(value => {
    if (_.has(value, "level") && _.has(value, "field")) {
      permission[value.level] = {
        ...permission[value.level],
        ...{ [value.field]: value }
      };
    }
  });

  return permission;
};

export const getKeyElementField = field => {
  return field.key || field.id || field.selector || field.data;
};

export const isValueEmpty = (value, canZero = false) => {
  return (
    _.isUndefined(value) ||
    _.isNaN(value) ||
    _.isNull(value) ||
    ((_.isString(value) || _.isArray(value) || _.isObject(value)) &&
      _.isEmpty(value)) ||
    (!_.isNaN(parseFloat(value)) && !canZero && !parseFloat(value))
  );
};

export const checkValue = (value, defaultValue = null) => {
  return value !== undefined && value !== null && value !== "" && value !== "-"
    ? value
    : defaultValue;
};

export const setValueDefault = (data, permissions) => {
  if (!_.isEmpty(permissions)) {
    _.forEach(data, (value, field) => {
      const permission = _.find(permissions, { field: field });
      let valueDefault = null;
      if (permission && _.has(permission, "defaultValue")) {
        valueDefault = permission.defaultValue;
      } else if (_.has(permissions, `${field}.defaultValue`)) {
        valueDefault = permissions[field]["defaultValue"];
      }

      if (
        valueDefault !== null &&
        (!_.has(data, field) ||
          _.isUndefined(value) ||
          _.isNaN(value) ||
          _.isNull(value))
      ) {
        data[field] = valueDefault;
      }
    });
  }

  return data;
};

export const isValueNumber = value => {
  return (
    !isNaN(value) &&
    !isNaN(parseFloat(value)) &&
    _.isNumber(parseFloat(value)) &&
    (String(numeral(String(value))._value).split(".")[0] || "").length ===
      (String(numeral(String(value))._input).split(".")[0] || "").length
  );
};

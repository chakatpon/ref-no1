import { isValidAmount } from "~/helpers/app";
import _ from "lodash";

export const checkValidAmount = (state, rules) => {
  let output = { status: true, rule: {} };

  _.forEach(rules, (rule, field) => {
    if (_.has(state, field)) {
      if (isValidAmount(state[field], rule.maxLength) === false) {
        output = { status: false, rule: rule };
        return;
      }
    }
  });

  return output;
};

import ConnectionService from "./ConnectionService";
import { has } from "lodash";

const ERROR_CODE_LIST = [400, 401, 403, 404, 500];

class StandardService extends ConnectionService {
  constructor() {
    super("standard");
  }

  /**
   * Function to format reponse data.
   *  @type function
   *  @param {object} response is a response data
   *  @returns {object} response data:
   *  {
   *    status: boolean,
   *    message: string,
   *    data: *
   *  }
   *  @default ""
   *  {
   *    status: false,
   *    message: ""
   *  }
   *  @override
   */
  fetchResponse = (response = {}) => {
    const result = {
      status: false,
      message: ""
    };

    if (
      (response.statusCode !== undefined &&
        ERROR_CODE_LIST.includes(response.statusCode)) ||
      (response.status !== undefined &&
        ERROR_CODE_LIST.includes(response.status)) ||
      (response.error !== undefined && response.error !== "")
    ) {
      switch (true) {
        case has(response, "message"):
          result.message = response.message;
          break;
        case has(response, "error_description"):
          result.message = response.error_description;
          break;
        default:
          result.message = response;
      }
    } else {
      result.status = true;
      result.data = has(response, "data") ? response.data : response;
    }

    return result;
  };
}

export default StandardService;

import cookie from "js-cookie";
import { isEmpty } from "lodash";

import CurlService from "./CurlService";
import apiConfig from "../configs/curlApi.config.json";

const SERVER_LIST = ["corda", "offchain", "standard"];

/**
 * Class to get data from curl class.
 *  @type class
 */
class ConnectionService extends CurlService {
  constructor(server) {
    super();

    this.server = server;
  }

  /**
   * Function to get token.
   *  @type function
   *  @returns {string|null} The token data from cookie
   *  @default null
   */
  getToken = () => {
    return cookie.get("aToken");
  };

  /**
   * Function to get api config from json file.
   *  @type function
   *  @param {string} group is a group api name
   *    (i.e. credit, debit)
   *  @param {string} action is a action api name
   *    (i.e. getCreditNotes, getDebitNotes)
   *  @returns {object} The config object
   *  @default {}
   */
  getApiConfig = (group = "", action = "") => {
    let config = {};

    if (
      apiConfig[this.server] &&
      apiConfig[this.server][group] &&
      apiConfig[this.server][group][action]
    ) {
      config = {
        url: apiConfig[this.server][group]["url"],
        ...apiConfig[this.server][group][action]
      };
    }

    return config;
  };

  fetchResponse = (response = {}) => {
    return response;
  };

  /**
   * Function to get api url config from json file.
   *  @type function
   *  @param {string} group is a group api name
   *    (i.e. credit, debit)
   *  @param {string} action is a action api name
   *    (i.e. getCreditNotes, getDebitNotes)
   *  @param {object} requestParams is a request parameter for query api
   *  @param {object} pathParams is a path parameter for query api
   *  @returns {string} The url
   *  @default ""
   */
  getUrl = ({
    group = "",
    action = "",
    requestParams = {},
    pathParams = {}
  }) => {
    const apiConfig = this.getApiConfig(group, action);
    let url = "";

    if (!isEmpty(apiConfig)) {
      const options = {
        ...apiConfig,
        requestParams: requestParams,
        pathParams: pathParams,
        url: `/${this.server}${apiConfig.url}`
      };

      url = this.prepareUrl(options);
    }

    return url;
  };

  searchStringInArray = (array, string) => {
    return array.some(value => string.includes(value));
  };

  /**
   * Function to get data from api.
   *  @type function
   *  @param {string} group is a group api name
   *    (i.e. credit, debit)
   *  @param {string} action is a action api name
   *    (i.e. getCreditNotes, getDebitNotes)
   *  @param {object} requestParams is a request parameter for query api
   *  @param {object} pathParams is a path parameter for query api
   *  @param {object} body is a data for POST, PUT, GET to api
   *  @param {string} url is a url of api
   *  @param {object} options is a option for api
   *    (i.e. method, headers)
   *  @returns {function} The result from function fetchResponse
   *  @default {function} The result from function fetchResponse
   */
  callApi = async ({
    group = "",
    action = "",
    requestParams = {},
    pathParams = {},
    body = {},
    url = "",
    options = {}
  }) => {
    let response = {
      error: true,
      message: ""
    };

    const token = this.getToken();

    if (!token) {
      // Redirect to home page, when token not found
      this.redirect();

      response.message = "token not found";

      return this.fetchResponse(response);
    }

    const apiConfig = this.getApiConfig(group, action);
    let newOptions = {
      token: token,
      requestParams: requestParams,
      pathParams: pathParams,
      body: body
    };

    if (url) {
      newOptions = {
        ...newOptions,
        ...options,
        url: this.searchStringInArray(SERVER_LIST, url)
          ? url
          : `/${this.server}${url}`
      };
    } else if (!isEmpty(apiConfig)) {
      newOptions = {
        ...newOptions,
        ...apiConfig,
        url: `/${this.server}${apiConfig.url}`
      };
    } else {
      response.message = "url or api config not found";

      return this.fetchResponse(response);
    }

    response = await this.curl(newOptions);

    return this.fetchResponse(response);
  };
}

export default ConnectionService;

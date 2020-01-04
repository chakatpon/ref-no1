import Router from "next/router";
import { stringify } from "query-string";
import { has, isEmpty, isObject } from "lodash";

const TIMEOUT = 60; // seconds

const fetchWithTimeout = (url, options, timeout = 20) => {
  return Promise.race([
    fetch(url, options),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("request timeout")), timeout * 1000)
    )
  ]);
};

/**
 * Class to curl data from server.
 *  @type class
 */
class CurlService {
  /**
   * Function to redirect to home page.
   *  @type function
   *  @returns {null}
   */
  redirect = () => {
    Router.push("/");
  };

  /**
   * Function to check unauthorized.
   *  @type function
   *  @param {integer} status is a response status code
   *  @returns {boolean} The result check
   *  @default false
   */
  isUnauthorized = status => {
    let result = false;

    if (status === 401) result = true;

    return result;
  };

  /**
   * Function to curl from server.
   *  @type function
   *  @param {object} options is a option for api
   *    (i.e. url, uri, method, headers, token, requestParams, pathParams, body)
   *  @returns {object} The response data
   *  @default {}
   */
  curl = async options => {
    try {
      const resultUrl = this.prepareUrl(options);
      const resultOptions = this.prepareOptions(options);
      const response = await fetchWithTimeout(
        resultUrl,
        resultOptions,
        TIMEOUT
      );
      const result = await response.json();

      const isUnauthorized = this.isUnauthorized(result.headerStatusCode);

      if (isUnauthorized) {
        this.redirect();
      }

      return result;
    } catch (e) {
      return {
        statusCode: 500,
        message: e.message
      };
    }
  };

  /**
   * Function to prepare options.
   *  @type function
   *  @param {object} options is a option for api
   *    (i.e. method, token, headers, body)
   *  @returns {object} The result options
   *  @default {}
   */
  prepareOptions = options => {
    const resultOptions = {
      method: options.method,
      headers: {
        Authorization: `Bearer ${options.token}`,
        ...options.headers
      }
    };

    switch (options.method) {
      case "POST":
      case "PUT":
        if (has(options, "body") && isObject(options.body)) {
          resultOptions.body =
            options.body instanceof FormData
              ? options.body
              : JSON.stringify(options.body);
        }
        break;
    }

    return resultOptions;
  };

  /**
   * Function to prepare url.
   *  @type function
   *  @param {object} options is a option for api
   *    (i.e. url, uri, requestParams, pathParams )
   *  @returns {string} The result url
   *  @default ""
   */
  prepareUrl = options => {
    let url = options.url || "";
    let uri = options.uri || "";

    if (uri.indexOf(":") !== -1 && !isEmpty(options.pathParams)) {
      for (let pathVariable in options.pathParams) {
        uri = uri.replace(`:${pathVariable}`, options.pathParams[pathVariable]);
      }
    }

    if (uri !== "") uri = `/${uri}`;

    if (url.indexOf("?") === -1) url = `${url}${uri}?`;

    if (isEmpty(options.requestParams)) return url;

    if (url[url.length - 1] !== "?") url = `${url}&`;

    url = `${url}${stringify(options.requestParams)}`;

    return url;
  };
}

export default CurlService;

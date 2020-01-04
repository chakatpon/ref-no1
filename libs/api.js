import React, { Component } from "react";
import localStorage from "local-storage";
var Cookies = require("js-cookie");
var apiconfig = require("../configs/api.config.json");
var env = require("../b2p.config.json");
import axios from "axios";
const queryString = require("query-string");
class api {
  constructor(domain) {
    this.config = { group: "default" };
    this.apisetting = {};
    this.token = Cookies.get("aToken");
    this.domain =
      process.env.APP_DOMAIN || domain || apiconfig.APP_DOMAIN || "";
  }
  setToken(token) {
    this.token = token;
    return this;
  }
  getToken() {
    return this.token;
  }
  group(group) {
    if (!apiconfig[group]) {
      throw new Error(`API group ${group} is not exists`);
      return false;
    }
    this.apisetting = apiconfig[group];
    this.config.group = group;
    return this;
  }
  url(action, params, options) {
    const act = action.split(".");
    let setting = this.apisetting;
    let q = "";
    act.map(a => {
      setting = setting[a];
    });

    if (!setting) {
      throw new Error(
        `API action ${action} is not exists in group "${this.config.group}"`
      );
      return false;
    }
    const { authorization, endpoint, method } = setting;
    options = { method, ...options };
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json"
    };
    if (authorization === true) {
      headers["Authorization"] = "Bearer " + this.getToken();
    }

    let url = `${endpoint}`;
    if (url.indexOf(":") > -1 && params) {
      for (let x in params) {
        url = url.replace(`:${x}`, params[x]);
      }
    } else {
      if (params) {
        q = queryString.stringify(params);
        q = q.replace(/\[\]/g, "");
        url = `${url}?${q}`;
      }
    }
    if (url.indexOf("/") === 0) {
    }
    url = `${this.domain}${url}`;
    return url;
  }
  call(action, params, options) {
    try {
      let q = "";
      const act = action.split(".");
      let setting = this.apisetting;
      act.map(a => {
        setting = setting[a];
      });

      if (!setting) {
        throw new Error(
          `API action ${action} is not exists in group "${this.config.group}"`
        );
        return false;
      }
      const { authorization, endpoint, method } = setting;
      options = { method, ...options };
      let headers = {
        Accept: "application/json",
        "Content-Type": "application/json"
      };
      if (options.headers) {
        headers = { ...headers, ...options };
      } else {
        options.headers = headers;
      }
      if (authorization === true) {
        headers["Authorization"] = "Bearer " + this.getToken();
      }
      let httpTimeout = 40;
      if (method != "GET" && method != "get") {
        httpTimeout = 300;
      }
      let url = `${endpoint}`;
      if (url.indexOf(":") > -1 && params) {
        for (let x in params) {
          url = url.replace(`:${x}`, params[x]);
        }
      } else {
        q = queryString.stringify(params);
        if (q != "") {
          url = `${url}?${q}`;
        }
      }
      if (url.indexOf("/") === 0) {
      }
      url = `${this.domain}${url}`;
      return axios({
        url,
        timeout: httpTimeout * 1000,
        ...options
      })
        .then(res => {
          return res.data;
        })
        .catch(function(err) {
          return Promise.reject(err);
        });
    } catch (err) {
      return Promise.reject(err);
    }
  }
  buildList = async (col, data) => {
    return data.map(d => {
      return col.map(c => {
        return d[c] || "";
      });
    });
  };
}

export default api;

import React, { Component } from "react";
import ReactDOM from "react-dom";
import Layout from "../components/Layout";
import withAuth from "../libs/withAuth";
import Router from "next/router";
import List from "../components/List";
import ApiService from "../libs/ApiService";
import api from "../libs/api";
import ColumnList from "../libs/column";
import ModalAlert from "../components/modalAlert";
import { i18n, withTranslation } from "~/i18n";

const axios = require("axios");
const queryString = require("query-string");

class RemoteComponent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      menukey: "remote"
    };
  }

  componentWillUnmount() {
    this.state = [];
    $(".modal-backdrop").remove();
    $("body").unbind("click");
    if (!$) {
      return;
    }
    if ($.fn.dataTable.isDataTable(this.el)) {
      $(this.el)
        .DataTable()
        .destroy();
    }
  }

  async componentDidMount() {
    // $(".fixedHeader-floating").remove();
    await this.loadRemoteComponent(
      // "https://codepen.io/tonytonyjan/pen/kXvamy.babel"
      // "https://codepen.io/tonytonyjan/pen/QEawag.js"
      // "https://pmm-bkchn-sit.scg.com/static/scg/document-tracking-scg.js"
      // "http://localhost:3000/static/scg/document-tracking-scg.js"
      this.props.customUrl
    ).then(REMOTE => {
      ReactDOM.render(
        <REMOTE {...this.props} {...this.state} />,
        document.getElementById("realcontent")
      );
    });
  }

  async loadRemoteComponent(url) {
    return fetch(url)
      .then(res => res.text())
      .then(source => {
        var exports = {};
        function require(name) {
          switch (name) {
            case "react":
              return React;
            case "withAuth":
              return withAuth;
            case "List":
              return List;
            case "ApiService":
              return ApiService;
            case "api":
              return api;
            case "ColumnList":
              return ColumnList;
            case "ModalAlert":
              return ModalAlert;
            case "queryString":
              return queryString;
            case "next/router":
              return Router;
            case "axios":
              return axios;

            default:
              throw `You can't use modules other than "react" in remote component.`;
          }
        }
        const transformedSource = Babel.transform(source, {
          presets: ["react", "es2015", "stage-2"]
        }).code;
        eval(transformedSource);
        return exports.__esModule ? exports.default : exports;
      });
  }

  render() {
    return (
      <Layout {...this.props} {...this.state}>
        <div id="realcontent" />
      </Layout>
    );
  }
}

export default withAuth(withTranslation()(RemoteComponent));

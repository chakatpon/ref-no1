import React, { Component } from "react";
import Head from "next/head";
import Router from "next/router";
import moment from "moment";
import { isMobile } from "react-device-detect";

import withAuth from "../libs/withAuth";
import ColumnList from "../libs/column";
import Layout from "../components/Layout";
import List from "../components/List";
import CordaService from "../services/CordaService";
import OffchainService from "../services/OffchainService";
import ResponseService from "../services/ResponseService";
import { REQUEST_AUTH } from "../configs/authorise.config";
import { REQUEST_ROUTES } from "../configs/routes.config";
import statusColor from "../configs/color.rq.json";
import {
  SYSTEM_FAILED,
  EXPORT_LIMIT_EXCEEDS,
  EXPORT_NO_RECORDS
} from "../configs/errorMessage.config";
import ModalWarning from "../components/ModalWarning";
import ModalMessage from "~/components/common/SweetAlert";
import Excel from "../components/Exports/Excel";
import exportLimit from "../configs/export.limit.json";
import api from "../libs/api";
import { withTranslation } from "~/i18n";
import GA from "~/libs/ga";

const lang = "request-list";

class RequestList extends Component {
  constructor(props) {
    super(props);
    this.apis = new api(this.props.domain).group("rq");
    this.cordaService = new CordaService();
    this.offchainService = new OffchainService();
    this.responseService = new ResponseService();
    this.handleClickExternalId = this.handleClickExternalId.bind(this);
    this.columnList = new ColumnList();
    this.state = {
      title: "Request",
      GATitle: "Request",
      menukey: "rq",
      dataTableUrl: this.cordaService.getUrl({
        group: "request",
        action: "getRequests"
      }),
      breadcrumb: [],
      columnList: [],
      model: [],
      searchItems: [],
      saveColumnUrl: this.offchainService.getUrl({
        group: "model",
        action: "requestSaveModel"
      }),
      errorMessage: ""
    };
  }

  componentDidMount() {
    try {
      // permisions from offchain
      const { permisions } = this.props;

      if (!permisions.includes(REQUEST_AUTH.VIEW)) {
        Router.push("/dashboard");
      }

      this._columnRender();
    } catch (err) {
      console.error(err);
    }
  }

  handleClickExternalId = (href, a) => {
    Router.push(a.data("href"));
  };

  renderCreateRequestButton = () => {
    $(".btn-wrap.create").html(
      `<a class="btn ml-10 d-none d-md-block d-lg-block d-xl-block  linkto" href="${REQUEST_ROUTES.CREATE}">Create Request</a>`
    );
  };

  handleCreateRequestButtonClick = () => {
    $("a.linkto").on("click", e => {
      const anchor = $(e.target);
      const href = anchor.attr("href");

      Router.push(href);
      e.preventDefault();
    });
  };

  renderExportRequestButton = () => {
    $(".btn-wrap.export").html(
      '<a href="javascript:void(0);" class="ml-10 d-none d-md-block d-lg-block d-xl-block ExportReporttoExcel" ><i class="icon-additional icon-export"></i></a>'
    );
    $(".btn-toggle-export").css("display", "inline-block");
  };

  getRequests = async params => {
    return await this.cordaService.callApi({
      group: "request",
      action: "getRequests",
      requestParams: params
    });
  };

  handleExportRequestButtonClick = () => {
    const { GATitle } = this.state;
    $(".ExportReporttoExcel").on("click", async () => {
      const { model, excelParams, recordsTotal } = this.state;
      const { limit } = exportLimit;

      GA.event({
        category: GATitle,
        action: "Export Request (Request)",
        label: moment().format()
      });

      if (recordsTotal > limit) {
        const errorMessagePattern = EXPORT_LIMIT_EXCEEDS.replace("%m", limit);

        ModalMessage({
          title: "Alert",
          message: errorMessagePattern,
          buttons: [
            {
              label: "OK",
              attribute: {
                onClick: () => {}
              }
            }
          ]
        });

        GA.event({
          category: GATitle,
          action: "Export Request (Failed)",
          label: moment().format()
        });

        return;
      }

      if (recordsTotal === 0) {
        ModalMessage({
          title: "Alert",
          message: EXPORT_NO_RECORDS,
          buttons: [
            {
              label: "OK",
              attribute: {
                onClick: () => {}
              }
            }
          ]
        });

        GA.event({
          category: GATitle,
          action: "Export Request (Failed)",
          label: moment().format()
        });

        return;
      }

      const { table } = model;
      const fileName = `${table.export.name}.xlsx`;
      const columns = table.columns;
      const params = {
        ...excelParams,
        page: 1,
        pageSize: limit
      };

      const sheets = [
        {
          name: "Request",
          columns: columns
        }
      ];

      const datas = [];
      const requestResponse = await this.getRequests(params);
      const { status, message, data } = requestResponse;

      if (status) {
        // Set as default data when data from api not return
        let response = this.responseService.setDefaultDataByColumnWhenDataIsNull(
          data.rows,
          columns
        );

        // Format value by type base on config in column
        response = this.responseService.setValueByTypeBaseOnConfigInColumn(
          response,
          columns
        );

        datas.push(response);

        this.setState(
          {
            excelProps: {
              sheets: sheets,
              datas: datas,
              fileName: fileName
            }
          },
          () => {
            document.getElementById("exportExcelButton").click();
          }
        );

        GA.event({
          category: GATitle,
          action: "Export Request (Success)",
          label: moment().format()
        });
      } else {
        const errorMessagePattern = SYSTEM_FAILED.replace("%m", "export excel");

        this.setState({
          errorMessage: `${errorMessagePattern} ${message}`
        });

        window.jQuery("#configWarning").modal("toggle");
      }
    });
  };

  renderButton = () => {
    const { permisions } = this.props;

    $(".btn-wrap.col-display").html(
      '<a href="javascript:void(0);" class="ml-3 d-none d-md-block d-lg-block d-xl-block" data-toggle="modal" data-target="#openColumnDisplay"><i class="icon-additional icon-columndisplay"></i></i></a>'
    );

    if (permisions.includes(REQUEST_AUTH.CREATE)) {
      this.renderCreateRequestButton();
    }

    if (permisions.includes(REQUEST_AUTH.EXPORT)) {
      this.renderExportRequestButton();
      this.handleExportRequestButtonClick();
    }
  };

  _columnRender = async () => {
    const { t } = this.props;
    this.setState({ showPage: false });

    this.columnList.setCustomFormat("externalId", {
      className: "dtClickAction",
      render: (data, type, row) => {
        if (type === "sort" || type === "type") {
          return data;
        }

        const link = `${REQUEST_ROUTES.DETAIL}?linearId=${row.linearId}`;

        if (isMobile || (data.lenght >= 10 && data.lenght <= 20)) {
          let firstLine = data.substring(0, 10);
          let secondLine = data.substring(8, data.lenght);
          return `<a href="${link}" data-href="${link}" class="link list-link">${firstLine}${"<br/>"}${secondLine}</a>`;
        } else if (isMobile || data.lenght > 20) {
          let firstLine = data.substring(0, 10);
          let secondLine = data.substring(10, 20);
          let thirdLine = data.substring(20, data.lenght);
          return `<a href="${link}" data-href="${link}" class="link list-link">${firstLine}${"<br/>"}${secondLine}${"<br/>"}${thirdLine}</a>`;
        } else {
          return `<a href="${link}" data-href="${link}" class="link list-link">${data}</a>`;
        }
      }
    });

    this.columnList.setCustomFormat("status", {
      className: "dtClickAction",
      render: function(data, type, row) {
        if (type === "sort" || type === "type") {
          return data;
        }

        if (data == "" || data == undefined) {
          return data;
        }

        return `<strong style="color: ${
          statusColor[row.status]
        };,margin-right: 15px;">${row.status}</strong>`;
      }
    });

    let model = {};

    if (isMobile) {
      const data = await this.apis.call("model.mget");
      model = {
        data: data,
        message: "",
        status: true
      };
    } else {
      model = await this.offchainService.callApi({
        group: "model",
        action: "requestGetModel"
      });
    }

    for (let i in model.data.table.columns) {
      model.data.table.columns[i].searchKey =
        model.data.table.columns[i].header;
      console.log("searchKey : ", model.data.table.columns[i].searchKey);
      model.data.table.columns[i].header = await t(
        model.data.table.columns[i].header.replace(/[.]/g, "")
      );
    }

    if (model.status) {
      const columns = this.columnList.initColumns(model.data);

      this.setState({ columnList: columns, model: model.data });
      this.setState({ searchItems: model.data.form.sections[0].fields });
      this.setState({ showPage: true });
    }
  };

  render() {
    const { title, showPage, excelProps, errorMessage } = this.state;

    return (
      <Layout {...this.props} {...this.state}>
        <Head>
          <title>{title}</title>
        </Head>
        {showPage ? (
          <List
            {...this.props}
            {...this.state}
            dtClickAction={this.handleClickExternalId}
            dtButton={() => this.renderButton()}
            columnRender={() => this._columnRender()}
            _this={this}
            showPage="false"
            showSearchbox="true"
            apiService={this.cordaService}
            lang={lang}
          />
        ) : (
          <div>Loading...</div>
        )}
        {excelProps && excelProps.datas.length > 0 && (
          <Excel
            sheets={excelProps.sheets}
            datas={excelProps.datas}
            fileName={excelProps.fileName}
          />
        )}
        <ModalWarning onClick={() => {}} label="Error" message={errorMessage} />
      </Layout>
    );
  }
}

export default withAuth(withTranslation("request-list")(RequestList));

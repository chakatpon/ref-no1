import React, { Component } from "react";
import Head from "next/head";
import Router from "next/router";
import moment from "moment";
import { isMobile } from "react-device-detect";
import api from "../libs/api";
import withAuth from "../libs/withAuth";
import CordaService from "../services/CordaService";
import OffchainService from "../services/OffchainService";
import ResponseService from "../services/ResponseService";
import ColumnList from "../libs/column";
import Layout from "../components/Layout";
import List from "../components/List";
import Excel from "../components/Exports/Excel";
import ModalWarning from "../components/ModalWarning";
import ModalMessage from "~/components/common/SweetAlert";
import { DEBIT_AUTH } from "../configs/authorise.config";
import { DEBIT_ROUTES } from "../configs/routes.config";
import statusColor from "../configs/color.dn.json";
import { i18n, withTranslation } from "~/i18n";
import exportLimit from "../configs/export.limit.json";
import GA from "~/libs/ga";
import {
  SYSTEM_FAILED,
  EXPORT_LIMIT_EXCEEDS,
  EXPORT_NO_RECORDS
} from "../configs/errorMessage.config";

const lang = "dn-list";

class DNList extends Component {
  constructor(props) {
    super(props);
    this.cordaService = new CordaService();
    this.offchainService = new OffchainService();
    this.responseService = new ResponseService();
    this.apis = new api().group("dn");
    this.columnList = new ColumnList();
    this.handleClickExternalId = this.handleClickExternalId.bind(this);
    this.renderButton = this.renderButton.bind(this);
    this._columnRender = this._columnRender.bind(this);
    this.state = {
      title: "Debit Note",
      GATitle: "Debit Note",
      menukey: "dn",
      dataTableUrl: this.cordaService.getUrl({
        group: "debit",
        action: "getDebitNotes",
        requestParams: {
          role: this.props.user.organisationUnit,
          linearIds: this.props.url.query.linearIds
        }
      }),
      breadcrumb: [],
      columnList: [],
      model: [],
      searchItems: [],
      saveColumnUrl: this.offchainService.getUrl({
        group: "model",
        action: "debitSaveModel"
      }),
      errorMessage: ""
    };
  }

  componentDidMount() {
    try {
      const { permisions } = this.props;

      if (!permisions.includes(DEBIT_AUTH.VIEW)) {
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

  renderCreateDebitButton = () => {
    $(".btn-wrap.create").html(
      `<a class="btn ml-10 d-none d-sm-block d-md-block d-lg-block d-xl-block linkto" href="${DEBIT_ROUTES.CREATE}">Create DN</a>`
    );
  };

  handleCreateDebitButtonClick = () => {
    $("a.linkto").on("click", e => {
      const anchor = $(e.target);
      const href = anchor.attr("href");

      Router.push(href);
      e.preventDefault();
    });
  };

  renderExportDebitButton = () => {
    $(".btn-wrap.export").html(
      '<a href="javascript:void(0);" class="ml-3 d-none d-sm-block d-md-block d-lg-block d-xl-block ExportReporttoExcel"><i class="icon-additional icon-export"></i></a>'
    );
    $(".btn-toggle-export").css("display", "inline-block");
  };

  getDebitNote = async params => {
    return await this.cordaService.callApi({
      group: "debit",
      action: "getDebitNotes",
      requestParams: params
    });
  };

  handleExportDebitButtonClick = () => {
    $(".ExportReporttoExcel").on("click", async () => {
      const { model, excelParams, recordsTotal, GATitle } = this.state;
      const { limit } = exportLimit;

      GA.event({
        category: GATitle,
        action: "Export DN list (Request)",
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
          action: "Export DN list (Failed)",
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
          action: "Export DN list (Failed)",
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
          name: "Debit note",
          columns: columns
        }
      ];

      const datas = [];
      const debitNoteResponse = await this.getDebitNote(params);
      const { status, message, data } = debitNoteResponse;

      if (status) {
        // Set as default data when data from api not return
        let response = this.responseService.setDefaultDataByColumnWhenDataIsNull(
          data.rows,
          columns
        );

        // Custom data by response config file
        this.responseService.setValueByResponseConfigFile(response, "debit");

        // Format value by type base on config in column
        response = this.responseService.setValueByTypeBaseOnConfigInColumn(
          response,
          columns
        );

        // Custom data by callback response
        response = this.callBackResponse(response, columns);

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
          action: "Export DN list (Success)",
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

  renderButton() {
    const { permisions, t } = this.props;

    $(".btn-wrap.col-display").html(
      '<a href="javascript:void(0);" class="ml-10 d-none d-sm-block d-md-block d-lg-block d-xl-block" data-toggle="modal" data-target="#openColumnDisplay"><i class="icon-additional icon-columndisplay"></i></i></a>'
    );

    if (permisions.includes(DEBIT_AUTH.CREATE)) {
      this.renderCreateDebitButton();
      this.handleCreateDebitButtonClick();
    }

    if (permisions.includes(DEBIT_AUTH.EXPORT)) {
      this.renderExportDebitButton();
      this.handleExportDebitButtonClick();
    }
  }

  _columnRender = async () => {
    const { permisions, t } = this.props;

    this.setState({ showPage: false });

    this.columnList.setCustomFormat("externalId", {
      className: "dtClickAction",
      render: (data, type, row) => {
        if (type === "sort" || type === "type") {
          return data;
        }

        const link = `${DEBIT_ROUTES.DETAIL}?linearId=${row.linearId}`;

        if (permisions.includes(DEBIT_AUTH.VIEW_DETAIL)) {
          if (isMobile || (data.lenght >= 10 && data.lenght <= 20)) {
            let firstLine = data.substring(0, 10);
            let secondLine = data.substring(10, data.lenght);
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
        return data;
      }
    });

    this.columnList.setCustomFormat("status", {
      className: "dtClickAction",
      render: (data, type, row) => {
        if (type === "sort" || type === "type") {
          return data;
        }

        if (data === "" || data === undefined) {
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
      await console.log("--- IT'S MOBILE MODEL ---", model);
    } else {
      model = await this.offchainService.callApi({
        group: "model",
        action: "debitGetModel"
      });
    }

    // const model = await this.offchainService.callApi({
    //   group: "model",
    //   action: "debitGetModel"
    // });
    console.log("debit model : ", model);
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

  callBackResponse = (response, columns) => {
    return response.map(res => {
      let resData = {
        ...res
      };

      columns.map(column => {
        const { field } = column;

        if (field === "sendToBank") {
          let result = "No";
          let value = this.responseService.getValue(res, "paymentItemLinearId");

          if (value !== "") {
            result = "Yes";
          }

          res[field] = result;
        }

        if (field === "sendToCMS") {
          let result = "No";
          let value = this.responseService.getValue(
            res,
            "customisedFields.CMS"
          );

          if (value !== "") {
            result = "Yes";
          }

          res[field] = result;
        }

        if (field === "dueDate") {
          const dueDate = this.responseService.getValue(res, "dueDate");
          const initialDueDate = this.responseService.getValue(
            res,
            "initialDueDate"
          );

          let result = "";

          if (dueDate !== initialDueDate) {
            result = dueDate;
          }

          res[field] = result;
        }

        resData = { ...resData, [field]: res[field] };
      });

      return resData;
    });
  };

  render() {
    const { t } = this.props;
    const { title, showPage, excelProps, errorMessage } = this.state;

    return (
      <Layout {...this.props} {...this.state}>
        <Head>
          <title>{t(title)}</title>
        </Head>
        {showPage ? (
          <List
            {...this.props}
            {...this.state}
            title={t(title)}
            dtClickAction={this.handleClickExternalId}
            dtButton={this.renderButton}
            columnRender={this._columnRender}
            _this={this}
            showPage="false"
            showSearchbox="true"
            apiService={this.cordaService}
            configResponseGroup="debit"
            callBackResponse={this.callBackResponse}
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

export default withAuth(withTranslation(["dn-list"])(DNList));

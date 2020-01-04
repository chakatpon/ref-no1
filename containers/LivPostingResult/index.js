import React, { PureComponent, Fragment } from "react";
import ReactNotification from "react-notifications-component";
import _ from "lodash";
import Router from "next/router";
import moment from "moment";
import io from "socket.io-client";
import CordaService from "~/services/CordaService";
import ResponseService from "~/services/ResponseService";
import OffchainService from "~/services/OffchainService";
import ColumnList from "~/libs/column";
import List from "~/components/List";
import Excel from "~/components/Exports/Excel";
import ModalMessage from "~/components/common/SweetAlert";
import api from "../../libs/api";
import { isMobile } from "react-device-detect";
import { withTranslation } from "~/i18n";
import {
  MONITOR_LIV_AUTH,
  INVOICE_AUTH,
  DEBIT_AUTH,
  CREDIT_AUTH
} from "~/configs/authorise.config";
import {
  DEBIT_ROUTES,
  INVOICE_ROUTES,
  CREDIT_ROUTES
} from "~/configs/routes.config";
import exportLimit from "~/configs/export.limit.json";
import {
  SYSTEM_FAILED,
  EXPORT_LIMIT_EXCEEDS,
  EXPORT_NO_RECORDS
} from "~/configs/errorMessage.config";
import GA from "~/libs/ga";

const lang = "liv-list";

class Index extends PureComponent {
  constructor(props) {
    super(props);
    this.cordaService = new CordaService();
    this.offchainService = new OffchainService();
    this.responseService = new ResponseService();
    this.columnList = new ColumnList();
    this.addNotification = this.addNotification.bind(this);
    this.notificationDOMRef = React.createRef();
    this.socket = {};
    const { filter = "invoice" } = this.props.url.query;
    this.state = {
      title: "LIV Posting Result",
      GATitle: "LIV",
      menukey: "liv", // Use for edit column display
      filter: filter,
      configApi: {},
      dataTableUrl: "",
      saveColumnUrl: "",
      model: [],
      breadcrumb: [],
      columnList: [],
      searchItems: [],
      showPage: false,
      selectedCheckboxIds: [],
      isAllowRepost: false,
      dataListTable: []
    };
  }

  init = async () => {
    const configApi = this.getConfigApi();
    this.setMobileApiConfig();

    this.setState(
      {
        configApi: configApi,
        dataTableUrl: this.cordaService.getUrl(configApi.getList),
        saveColumnUrl: this.offchainService.getUrl(configApi.saveModel)
      },
      () => {
        this._columnRender();
      }
    );
  };

  componentWillMount() {
    this.init();
  }

  componentDidMount() {
    const { GATitle } = this.state;
    const { token: accessToken } = this.props;
    this.socket = io.connect("/liv-repost");
    this.socket
      .on("connect", () => {
        console.log("connect");
      })
      .on("queue", queue => {
        queue.map(q => {
          console.log("q", q);
        });
      });

    this.socket.on("queue", queueArray => {
      GA.event({
        category: GATitle,
        action: "Logistic inv verification Report list (Request)",
        label: `${GATitle} | ${moment().format()}`
      });

      queueArray.map(queue => {
        $(`.btn-select-checkbox[id=${queue.linearId}]`)
          .prop("disabled", true)
          .parent()
          .addClass("loading-checkbox");
      });
    });

    this.socket.on("success", (response, processItem) => {
      const { selectedCheckboxIds } = this.state;

      $(`.btn-select-checkbox[id=${processItem.linearId}]`)
        .prop("disabled", true)
        .parent()
        .removeClass("loading-checkbox")
        .addClass("success-checkbox")
        .prop("disabled", true);

      if (processItem.accessToken === accessToken) {
        this.addNotification(
          "repostsuccess",
          `Repost for ${
            _.has(response, "data.0.externalId")
              ? response.data[0].externalId
              : ""
          } is completed.`
        );

        GA.event({
          category: GATitle,
          action: "Logistic inv verification Report list (Success)",
          label: `${GATitle}| ${
            response.data[0].externalId
          } | ${moment().format()}`
        });
      }
      const selectedCheckboxIdsNew = _.remove(selectedCheckboxIds, linearId => {
        return linearId !== processItem.linearId;
      });
      this.setState({
        selectedCheckboxIds: selectedCheckboxIdsNew
      });
    });

    this.socket.on("error", (response, errorItem) => {
      const { dataListTable } = this.state;
      let errorDetail = "";
      if (
        response.error == "api_error" &&
        typeof response.error_message == "object"
      ) {
        errorDetail = response.error_message.message || "";
      }
      const row = _.find(dataListTable, { linearId: errorItem.linearId });
      const externalIdText = _.has(row, "externalId") ? row.externalId : "";

      $(`.btn-select-checkbox[id=${errorItem.linearId}]`)
        .prop("disabled", false)
        .parent()
        .removeClass("loading-checkbox");

      if (errorItem.accessToken === accessToken) {
        this.addNotification(
          "repostfailed",
          `Repost for ${externalIdText} is failed. ${errorDetail}`
        );

        GA.event({
          category: GATitle,
          action: "Logistic inv verification Report list (Failed)",
          label: `${GATitle}| ${externalIdText} | ${moment().format()}`
        });
      }
    });

    this.checkAllowRepost();
  }

  componentWillUnmount() {
    this.socket.disconnect();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.filter !== this.state.filter) {
      this.init();
    }
    if (prevState.selectedCheckboxIds !== this.state.selectedCheckboxIds) {
      this.checkAllowRepost();
    }
  }

  checkAllowRepost = () => {
    let { selectedCheckboxIds } = this.state;
    this.setState({ isAllowRepost: !_.isEmpty(selectedCheckboxIds) }, () =>
      this.renderButton()
    );
  };

  getConfigApi = () => {
    const { filter } = this.state;
    let configApi = {};
    switch (filter) {
      case "invoice":
        configApi = {
          getModel: {
            group: "model",
            action: "livInvoiceGetModel"
          },
          saveModel: {
            group: "model",
            action: "livInvoiceSaveModel"
          },
          getList: {
            group: "invoice",
            action: "getInvoices",
            requestParams: {
              postingStatusNotIn: "PENDING",
              returnInvoiceItems: true
            }
          }
        };
        break;
      case "debitNote":
        configApi = {
          getModel: {
            group: "model",
            action: "livDebitNoteGetModel"
          },
          saveModel: {
            group: "model",
            action: "livDebitNoteSaveModel"
          },
          getList: {
            group: "debit",
            action: "getDebitNotes",
            requestParams: {
              postingStatusNotIn: "PENDING"
            }
          }
        };
        break;
      case "creditNote":
        configApi = {
          getModel: {
            group: "model",
            action: "livCreditNoteGetModel"
          },
          saveModel: {
            group: "model",
            action: "livCreditNoteSaveModel"
          },
          getList: {
            group: "credit",
            action: "getCreditNotes",
            requestParams: {
              postingStatusNotIn: "PENDING",
              returnInvoiceItems: true
            }
          }
        };
        break;
      default:
        configApi = {};
        break;
    }
    return configApi;
  };

  setMobileApiConfig = () => {
    const { filter } = this.state;

    switch (filter) {
      case "invoice":
        this.apis = new api(this.props.domain).group("liv-inv");
        break;
      case "debitNote":
        this.apis = new api(this.props.domain).group("liv-dn");
        break;
      case "creditNote":
        this.apis = new api(this.props.domain).group("liv-cn");
        break;
      default:
        this.apis = new api(this.props.domain).group("liv-inv");
        break;
    }
  };

  renderButton = () => {
    const { permissions, url, t } = this.props;
    const { filter, isAllowRepost, GATitle } = this.state;
    const url_page = "/liv-posting-result";
    let btnFilter =
      `<a data-page="invoice" ${
        filter === "invoice"
          ? "class='active' style='pointer-events: none;'"
          : ""
      } href="${url_page}?filter=invoice">${t("Invoice")}</a>
    ` +
      `<a data-page="creditNote" ${
        filter === "creditNote"
          ? "class='active' style='pointer-events: none;'"
          : ""
      } href="${url_page}?filter=creditNote">${t("Credit Note")}</a>
    ` +
      `<a data-page="debitNote" ${
        filter === "debitNote"
          ? "class='active' style='pointer-events: none;'"
          : ""
      } href="${url_page}?filter=debitNote">${t("Debit Note")}</a>
    `;

    $(".btn-wrap.filter")
      .html(
        `<strong class="mr-3">${t("Filter")}:</strong>
      ${btnFilter}
      `
      )
      .addClass("d-flex justify-content-center");
    if (permissions.includes(MONITOR_LIV_AUTH.REPOST)) {
      $(".btn-wrap.create").html(
        `<a id="btnRepost" class="btn ml-10 d-none d-sm-inline-block d-md-inline-block d-lg-inline-block d-xl-inline-block ${
          isAllowRepost ? "" : "disabled"
        }" href="javascript:void(0);">Repost</a>`
      );
      $("#btnRepost").click(() => {
        this.repost();
      });
    }

    $(".btn-wrap.col-display").html(
      '<a href="javascript:void(0);" class="ml-10 d-none d-sm-inline-block d-md-inline-block d-lg-inline-block d-xl-inline-block " data-toggle="modal" data-target="#openColumnDisplay"><i class="icon-additional icon-columndisplay"></i></i></a>'
    );

    if (permissions.includes(MONITOR_LIV_AUTH.EXPORT)) {
      $(".btn-wrap.export").html(
        '<a class="ml-10 d-none d-sm-inline-block d-md-inline-block d-lg-inline-block d-xl-inline-block ExportReporttoExcel" href="javascript:;"><i class="icon-additional icon-export"></i></a>'
      );

      $(".ExportReporttoExcel").on("click", e => {
        e.preventDefault();

        GA.event({
          category: GATitle,
          action: "Logistic inv verification Export list (Request)",
          label: `${GATitle} | ${moment().format()}`
        });

        const { recordsTotal } = this.state;
        const { limit } = exportLimit;

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
            action: "Logistic inv verification Export list (Failed)",
            label: `${GATitle} | ${moment().format()}`
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
            action: "Logistic inv verification Export list (Failed)",
            label: moment().format()
          });

          return;
        }

        this.exportDataList();
      });
    }
    $("[data-page]").click(e => {
      e.preventDefault();
      var el = e.target || e.srcElement;
      if (el instanceof HTMLAnchorElement) {
        const dataPage = el.getAttribute("data-page");
        if (filter !== dataPage) {
          Router.push(el.getAttribute("href"));
          this.setState({
            filter: dataPage,
            showPage: false
          });
        }
      }
    });
  };

  exportDataList = async () => {
    const { model, excelParams, GATitle } = this.state;
    const { limit } = exportLimit;
    const { table } = model;
    const fileName = `${table.export.name}.xlsx`;
    const columns = table.columns;
    const params = {
      ...excelParams,
      page: 1,
      pageSize: limit,
      selectFields: selectedField
    };
    const sheets = [
      {
        name: `${table.export.name}`,
        columns: columns
      }
    ];
    const datas = [];
    const response = await this.getDataList(params);
    const { status, message, data } = response;
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
        action: "Logistic inv verification Export list (Success)",
        label: moment().format()
      });
    } else {
      const errorMessagePattern = SYSTEM_FAILED.replace("%m", "export excel");
      window.jQuery("#configWarning").modal("toggle");
      ModalMessage({
        title: "Error",
        closeOnClickOutside: false,
        message: (
          <div>
            ${errorMessagePattern} ${message}
          </div>
        )
      });

      GA.event({
        category: GATitle,
        action: "Logistic inv verification Export list (Failed)",
        label: moment().format()
      });
    }
  };

  getDataList = async params => {
    const { configApi } = this.state;

    return await this.cordaService.callApi({
      ...configApi.getList,
      ...{
        requestParams: params
      }
    });
  };

  repost = () => {
    const { selectedCheckboxIds, dataListTable } = this.state;
    const requestForRepost = [];

    selectedCheckboxIds.map(linearId => {
      const row = _.find(dataListTable, { linearId: linearId });
      if (
        row &&
        _.has(row, "customisedFields.LIV.repost_url") &&
        _.has(row, "customisedFields.LIV.repost_method")
      ) {
        requestForRepost.push({
          linearId: row.linearId,
          url: row.customisedFields.LIV.repost_url,
          method: row.customisedFields.LIV.repost_method
        });
      }
    });
    if (requestForRepost)
      this.socket.emit("rePost", this.props.token, requestForRepost);
  };

  callBackResponse = (response, columns) => {
    this.setState({ dataListTable: response });
    return response;
  };

  _columnRender = async () => {
    // Force reload data table when edit column display
    this.setState({ showPage: false });

    const { permissions, t } = this.props;
    const { configApi, filter } = this.state;
    const auth = {
      invoice: INVOICE_AUTH,
      creditNote: CREDIT_AUTH,
      debitNote: DEBIT_AUTH
    };
    const route = {
      invoice: INVOICE_ROUTES,
      creditNote: CREDIT_ROUTES,
      debitNote: DEBIT_ROUTES
    };

    if (permissions.includes(MONITOR_LIV_AUTH.REPOST)) {
      this.columnList.setCustomFormat("linearId", (data, type, row) => {
        return `<div class="checkbox"><input type="checkbox" id="${
          row.linearId
        }" ${
          row.postingStatus !== "FAILED" ? "disabled" : ""
        } class="btn-select-checkbox"></div>`;
      });
    }

    this.columnList.setCustomFormat("externalId", {
      className: "dtClickAction",
      render: (data, type, row) => {
        if (type === "sort" || type === "type") {
          return data;
        }

        const link = `${route[filter]["DETAIL"]}?linearId=${row.linearId}&ref=liv`;
        let result = data;

        if (permissions.includes(auth[filter]["VIEW_DETAIL"])) {
          result = `<a href="${link}" data-href="${link}" class="link list-link">${data}</a>`;

          if (isMobile || (data.lenght >= 10 && data.lenght <= 20)) {
            let firstLine = data.substring(0, 10);
            let secondLine = data.substring(10, data.lenght);

            result = `<a href="${link}" data-href="${link}" class="link list-link">${firstLine}${"<br/>"}${secondLine}</a>`;
          } else if (isMobile || data.lenght > 20) {
            let firstLine = data.substring(0, 10);
            let secondLine = data.substring(10, 20);
            let thirdLine = data.substring(20, data.lenght);
            result = `<a href="${link}" data-href="${link}" class="link list-link">${firstLine}${"<br/>"}${secondLine}${"<br/>"}${thirdLine}</a>`;
          }
        }

        return result;
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
      model = await this.offchainService.callApi(configApi.getModel);
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
      const modelNew = this.setModel(model.data);
      const columns = this.columnList.initColumns(modelNew);

      this.setState({
        columnList: columns,
        model: modelNew,
        searchItems: modelNew.form.sections[0].fields,
        showPage: true
      });
    }
  };

  setModel = model => {
    const { permissions } = this.props;
    const { table } = model;
    if (
      _.has(table, "checkBoxCol") &&
      table.checkBoxCol === true &&
      permissions.includes(MONITOR_LIV_AUTH.REPOST)
    ) {
      let checkboxColumn = {
        active: false,
        defaultOrder: 0,
        field: "linearId",
        header: `<div class="checkbox"><input type="checkbox" class="dt-checkboxes" /></div>`,
        sort: false,
        columnOrder: false
      };
      model.table.columns.unshift(checkboxColumn);
    }

    return model;
  };
  updateSelectedCheckboxIds = data => {
    this.setState({ selectedCheckboxIds: data }, () => this.checkAllowRepost());
  };

  addNotification(type, message) {
    this.notificationDOMRef.current.addNotification({
      message,
      type,
      insert: "top",
      container: "top-right",
      animationIn: ["animated", "fadeIn"],
      animationOut: ["animated", "fadeOut"],
      dismiss: { duration: 5000 },
      dismissable: { click: true },
      breakpoint: 300
    });
  }

  handleClickExternalId = (href, a) => {
    Router.push(a.data("href"));
  };

  render() {
    const { excelProps } = this.state;
    const { t } = this.props;
    return (
      <Fragment>
        <ReactNotification
          ref={this.notificationDOMRef}
          types={[
            {
              htmlClasses: ["notification-success"],
              name: "repostsuccess"
            },
            {
              htmlClasses: ["notification-failed"],
              name: "repostfailed"
            }
          ]}
        />
        {this.state.showPage ? (
          <List
            {...this.props}
            {...this.state}
            dtClickAction={(a, b) => this.handleClickExternalId(a, b)}
            dtButton={() => this.renderButton()}
            columnRender={() => this._columnRender()}
            _this={this}
            showPage="false"
            showSearchbox="true"
            apiService={this.cordaService}
            configResponseGroup="request"
            updateSelectedCheckboxIds={this.updateSelectedCheckboxIds}
            callBackResponse={this.callBackResponse}
            title={t(this.state.title)}
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
      </Fragment>
    );
  }
}
export default withTranslation("liv-list")(Index);

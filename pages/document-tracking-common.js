import React, { Component } from "react";
import Router from "next/router";
import moment from "moment";
import Layout from "../components/Layout";
import List from "../components/List";
import withAuth from "../libs/withAuth";
import api from "../libs/api";
import ColumnList from "../libs/column";
import ModalAlert from "../components/modalAlert";
import "../static/jquery.numberformatter";
import GA from "../libs/ga";
const axios = require("axios");
const queryString = require("query-string");
const lang = "document-tracking";

class DocumentTracking extends Component {
  constructor(props) {
    super(props);
    this.group = "tracking";
    this.apis = new api().group(this.group);
    this.columnList = new ColumnList();
    this.handleClickExternalId = this.handleClickExternalId.bind(this);
    this.buttonPermisions = this.buttonPermisions.bind(this);
    this._columnRender = this._columnRender.bind(this);
    this.toggleEdit = this.toggleEdit.bind(this);
    this.toggleModal = this.toggleModal.bind(this);
    this.notSave = this.notSave.bind(this);
    this.save = this.save.bind(this);
    this._renderCheckbox = this._renderCheckbox.bind(this);
    this.onAfterDraw = this.onAfterDraw.bind(this);
    this.onAfterLoad = this.onAfterLoad.bind(this);
    this.columnPermision = this.columnPermision.bind(this);
    this.state = {
      title: "Document Tracking",
      GATitle: "Document Tracking",
      menukey: this.group,
      breadcrumb: [],
      columnList: [],
      model: [],
      searchItems: [],
      saveColumnUrl: this.apis.url("model.save"),
      edit: false,
      saveModalTitle: "Save Changes",
      isSaveModalVisible: false,
      isTextOnly: true,
      saveModalMsg: "Do you want to save changes before leaving this page?",
      buttonAlert: [
        {
          label: "Cancel",
          attribute: {
            className: "btn btn--transparent btn-wide",
            onClick: this.toggleModal
          }
        },

        {
          label: "No",
          attribute: {
            className: "btn btn--transparent btn-wide",
            onClick: this.notSave
          }
        },

        {
          label: "Yes",
          attribute: {
            className: "btn btn-purple btn-wide",
            onClick: this.save
          }
        }
      ]
    };
  }

  async componentDidMount() {
    this._mounted = true;
    try {
      var _this = this;
      const { permisions } = this.props;
      if (!permisions.includes("Document-Tracking-List")) {
        Router.push("/dashboard");
      }

      this._columnRender(this.model);
    } catch (err) {
      console.error(err);
    }
  }

  handleClickExternalId = (href, a) => {
    Router.push(a.data("href") || href);
  };

  _renderCheckbox = docType => (data, type, row) => {
    if (this.state.edit) {
      if (true == data || "true" == data) {
        return `<input class="updateCheckbox" docType="${docType}" linearId="${row.linearId}" type="checkbox" checked>`;
      }
      return `<input class="updateCheckbox" docType="${docType}" linearId="${row.linearId}" type="checkbox">`;
    } else if (true == data || "true" == data)
      return `<i class="fa fa-check fa-lg"></i>`;
  };
  renderCheckbox = docType => {
    return {
      className: "dtClickAction dt-body-center",
      render: this._renderCheckbox(docType)
    };
  };
  notSave = e => {
    this.toggleModal(e);
    this.toggleEdit();
  };

  save = () => {
    const { GATitle } = this.state;

    GA.event({
      category: GATitle,
      action: "Save edit Document Tracking (Request)",
      label: `${GATitle} | ${moment().format()}`
    });

    let url = "/standard/api/documents";
    if (this.model.save && this.model.save.url) {
      url = this.model.save.url;
    }
    axios
      .put(`/api-proxy?endpoint=${url}`, this.state.dataToEdit)
      .then(res => {
        if (res.statusCode != 500) {
          GA.event({
            category: GATitle,
            action: "Save edit Document Tracking (Success)",
            label: `${GATitle} | ${moment().format()}`
          });

          this.toggleModal();
          this.toggleEdit();
        }
      })
      .catch(err => {
        GA.event({
          category: GATitle,
          action: "Save edit Document Tracking (Failed)",
          label: `${GATitle} | ${moment().format()}`
        });
      });
  };

  onAfterLoad(e, s, d) {
    if (d) {
      this.setState((state, props) => ({ data: d.data, dataToEdit: [] }));
    }
  }

  onAfterDraw() {
    var _this = this;
    $(".updateCheckbox").on("click", function(e) {
      let linearId = $(this).attr("linearId");
      let docType = $(this)
        .attr("docType")
        .replace(",", "\\.");
      let value = $(this).prop("checked");
      let row = _this.state.dataToEdit.find(r => r.linearId == linearId);
      if (!row) {
        row = _this.state.data.find(r => r.linearId == linearId);
        delete row.document;
      }
      if (row) {
        row[docType] = value;
        _this.setState((state, props) => {
          let unchangeData = state.dataToEdit.filter(
            r => r.linearId !== row.linearId
          );
          return {
            dataToEdit: [...unchangeData, row]
          };
        });
      }
    });
  }

  toggleModal = (e, changeEdit) => {
    if (this._mounted) {
      this.setState((state, props) => ({
        isSaveModalVisible: !state.isSaveModalVisible
      }));
    }
  };
  toggleEdit = () => {
    if (this._mounted) {
      this.setState(
        (state, props) => ({
          edit: !state.edit
        }),
        () => {
          this.buttonPermisions();
        }
      );
    }
  };
  _columnRender = async () => {
    this.model = await this.apis.call("model.get");
    this.setState({ showPage: false });
    var _this = this;
    this.columnList.setCustomFormat("documentNo", {
      className: "dtClickAction dt-body-left",
      render: function(data, type, row) {
        let q = { linearId: row.linearId, ..._this.props.url.query };
        let param = queryString.stringify(q);
        let columnContent;
        switch (row.state) {
          case "Invoice":
            columnContent = _this.columnPermision(
              data,
              "invoice-detail",
              param,
              "Invoice-Detail"
            );
            break;
          case "CreditNote":
            columnContent = _this.columnPermision(
              data,
              "credit-note-detail",
              param,
              "CN-Detail"
            );
            break;
          case "Payment":
            param = queryString.stringify({
              ...q,
              comeFrom: "Document Tracking",
              comeFromUrl: "/document-tracking"
            });
            columnContent = _this.columnPermision(
              data,
              "payment-posting-detail",
              param,
              "MONITOR-Payment-Detail"
            );
            break;
          default:
            break;
        }
        return columnContent;
      }
    });
    if (this.model.table.checkboxColumns) {
      this.model.table.checkboxColumns.forEach(checkbox => {
        this.columnList.setCustomFormat(
          checkbox,
          this.renderCheckbox(checkbox)
        );
      });
    }
    const columns = this.columnList.initColumns(this.model);
    let container = this.model.table.container;
    let url = this.model.search.url;
    this.setState({
      dataTableUrl: `/datatable-proxy?container=${container}&endpoint=${url}`,
      columnList: columns,
      model: this.model,
      searchItems: this.model.form.sections[0].fields
    });
    this.setState({ showPage: true });
  };

  columnPermision(data, page, param, permisionName) {
    const { permisions } = this.props;
    var columnContent;
    if (permisions.includes(permisionName)) {
      columnContent = `<a href="/${page}?${param}" >${data}</a>`;
    } else {
      columnContent = data;
    }
    return columnContent;
  }

  buttonPermisions() {
    const { GATitle } = this.state;
    const { permisions } = this.props;
    var _this = this;
    var exportFilename = this.state.model.table.export.name;
    const container = this.model.table.container;
    const searchUrl = this.model.search.url;
    const columns = $.param({ columns: this.model.table.columns });

    if (!this.state.edit) {
      if (permisions.includes("Document-Tracking-Edit")) {
        $(".btn-wrap.create").html(
          '<button class="btn btn-purple btn-wide editTracking">Edit</button>'
        );
        $(".editTracking").on("click", this.toggleEdit);
      }
      $(".btn-wrap.col-display").html(
        '<a href="javascript:void(0);" class="ml-10" data-toggle="modal" data-target="#openColumnDisplay"><i class="icon-additional icon-columndisplay"></i></i></a>'
      );
      $(".btn-wrap.export").html(
        '<a href="javascript:void(0);" class="ml-3 ExportReporttoExcel"><i class="icon-additional icon-export"></i></a>'
      );
      $(".ExportReporttoExcel").on("click", function() {
        GA.event({
          category: GATitle,
          action: "Document Tracking Export List (Request)",
          label: moment().format()
        });
        let searchInput = window.localStorage.getItem(
          `searchInput-${_this.state.menukey}`
        );
        let exportUrl = `/excel-export/${exportFilename}.xlsx?${columns}&container=${container}&endpoint=${searchUrl}`;

        if (searchInput) {
          searchInput = JSON.parse(searchInput);
          exportUrl = exportUrl + "&" + queryString.stringify(searchInput);
        }
        window.open(exportUrl);
        GA.event({
          category: GATitle,
          action: "Document Tracking Export List (Success)",
          label: moment().format()
        });
      });
      // $(".datatable").off("draw.dt");
    } else {
      $(".ExportReporttoExcel").off("click");
      $(".btn-wrap.export").html("");
      if (permisions.includes("Document-Tracking-Edit")) {
        $(".editTracking").off("click");
      }
      $(".btn-wrap.col-display").html("");
      $(".btn-wrap.create").html(
        '<button class="btn btn--transparent btn-wide ml-10 cancelEdit">Cancel</button>' +
          '<button class="btn btn-purple btn-wide ml-10 saveEdit">Save</button>'
      );
      $(".cancelEdit").on("click", this.toggleEdit);
      $(".saveEdit").on("click", this.toggleModal);
    }
  }

  componentWillUnmount() {
    this._mounted = false;
  }

  render() {
    var _this = this;
    const {
      saveModalTitle,
      isSaveModalVisible,
      saveModalMsg,
      isTextOnly,
      buttonAlert
    } = this.state;
    return (
      <div>
        <Layout {...this.props} {...this.state}>
          {this.state.showPage ? (
            <div>
              <List
                {...this.props}
                {...this.state}
                dtClickAction={this.handleClickExternalId}
                dtButton={this.buttonPermisions}
                columnRender={this._columnRender}
                _this={this}
                showPage="false"
                showSearchbox="true"
                refresh={this.state.edit}
                onAfterDraw={this.onAfterDraw}
                onAfterLoad={this.onAfterLoad}
                forceOldAPI={true}
                lang={lang}
              />
            </div>
          ) : (
            <div>Loading...</div>
          )}
        </Layout>
        <ModalAlert
          title={saveModalTitle}
          visible={isSaveModalVisible}
          button={buttonAlert}
          isTextOnly={isTextOnly}
        >
          {saveModalMsg}
        </ModalAlert>
      </div>
    );
  }
}

export default withAuth(DocumentTracking);

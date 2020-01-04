import React from "react";
import List from "List";
import Router from "next/router";
import ColumnList from "ColumnList";
import ModalAlert from "ModalAlert";
const queryString = require("queryString");
const axios = require("axios");

class DocumentTracking extends React.Component {
  constructor(props) {
    super(props);
    this.host = "https://p2p-scgchem-sit.digitalventures.co.th";
    this.model = {
      name: "tracking-scg",
      GATitle: "Document tracking",
      title: "Document tracking",
      table: {
        name: "tracking-scg",
        header: "",
        paging: true,
        container: "rows",
        create: true,
        createPermission: "PO-Upload",
        exportPermission: "PO-Export",
        search: true,
        manualExport: false,
        sortable: true,
        hideAction: false,
        columns: [
          {
            columnIndex: 1,
            defaultOrder: 1,
            header: "Company Name",
            field: "companyName",
            editable: false,
            sort: true,
            hidden: false,
            export: true
          },
          {
            columnIndex: 2,
            defaultOrder: 2,
            header: "Vendor Name",
            field: "vendorName",
            editable: false,
            sort: true,
            hidden: false,
            export: true
          },
          {
            columnIndex: 3,
            defaultOrder: 3,
            requiredColumn: true,
            header: "Document Type",
            field: "state",
            editable: false,
            sort: true,
            hidden: false,
            export: true
          },
          {
            columnIndex: 4,
            defaultOrder: 4,
            requiredColumn: true,
            header: "Document No.",
            field: "documentNo",
            editable: false,
            sort: true,
            hidden: false,
            export: true
          },
          {
            columnIndex: 5,
            defaultOrder: 5,
            requiredColumn: false,
            header: "Document Date",
            field: "documentDate",
            type: "date",
            pattern: "dd/MM/yyyy",
            editable: false,
            sort: true,
            hidden: false,
            export: true
          },
          {
            columnIndex: 6,
            defaultOrder: 6,
            header: "Document Amount",
            field: "total",
            type: "number",
            pattern: "#,###.00",
            editable: false,
            sort: true,
            hidden: false,
            export: true
          },
          {
            columnIndex: 7,
            defaultOrder: 7,
            header: "Invoice Payable Amount",
            field: "totalPayable",
            type: "number",
            pattern: "#,###.00",
            editable: false,
            sort: true,
            hidden: false,
            export: true
          },
          {
            columnIndex: 8,
            defaultOrder: 8,
            header: "Document Completion",
            field: "completion",
            editable: false,
            sort: false,
            hidden: false,
            export: true
          },
          {
            columnIndex: 9,
            defaultOrder: 9,
            header: "Original Tax Invoice / CN",
            field: "Invoice",
            editable: false,
            sort: false,
            hidden: false,
            export: true
          },
          {
            columnIndex: 10,
            defaultOrder: 10,
            header: "Original Receipt",
            field: "Receipt",
            editable: false,
            sort: false,
            hidden: false,
            export: true
          },
          {
            columnIndex: 11,
            defaultOrder: 11,
            header: "Original Tax Inv / Receipt",
            field: "Invoice/Receipt",
            editable: false,
            sort: false,
            hidden: false,
            export: true
          },
          {
            columnIndex: 12,
            defaultOrder: 12,
            header: "Other Doc",
            field: "Other Doc",
            editable: false,
            sort: false,
            hidden: false,
            export: true
          },
          {
            columnIndex: 13,
            defaultOrder: 13,
            header: "FI Doc (LIV)",
            field: "accountNo",
            editable: false,
            sort: false,
            hidden: false,
            export: true
          }
        ],
        hideColumn: true,
        pageSizeOptions: [10, 25, 50, 100],
        export: {
          name: "Tracking",
          url: "/customs/api/documents"
        },
        checkboxColumns: [
          "completion",
          "Invoice",
          "Receipt",
          "Credit Note",
          "Delivery Note",
          "Invoice/Receipt",
          "Other Doc"
        ]
      },
      form: {
        name: "tracking-scg",
        size: "medium",
        autoClose: true,
        clearOnClose: false,
        sections: [
          {
            fields: [
              {
                key: "companyName",
                title: "Company Name",
                controlType: "textbox",
                required: false
              },
              {
                key: "vendorName",
                title: "Vendor Name",
                controlType: "textbox",
                required: false
              },
              {
                key: "documentNo",
                title: "Document No",
                controlType: "textbox",
                required: false
              },
              {
                key: "documentDate",
                title: "Document Date",
                controlType: "dropdown",
                type: "date",
                required: false
              },
              {
                key: "paymentDate",
                title: "Invoice Payment Date",
                controlType: "date",
                required: false
              },
              {
                key: "completion",
                title: "Document Completion",
                controlType: "dropdown",
                type: "option",
                options: [
                  {
                    text: "Yes",
                    value: "true"
                  },
                  {
                    text: "No",
                    value: "false"
                  }
                ],
                required: false
              }
            ]
          }
        ],
        buttons: [],
        header: {
          add: "Search"
        }
      },
      search: {
        url: "/customs/api/documents"
      }
    };
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
    this.state = {
      title: "Document Tracking",
      menukey: "tracking-scg",
      saveColumnUrl: "",
      dataTableUrl:
        "/datatable-proxy?container=" +
        (this.model.table.container ? this.model.table.container : "") +
        "&endpoint=" +
        this.host +
        this.model.search.url,
      breadcrumb: [],
      columnList: [],
      model: this.model,
      searchItems: [],
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

  componentDidMount() {
    try {
      this._columnRender(this.model);
    } catch (err) {
      console.error(err);
    }
  }

  handleClickExternalId(href, a) {
    Router.push(a.data("href") || href);
  }

  _renderCheckbox(docType) {
    return (data, type, row) => {
      if (this.state.edit) {
        if (true == data || "true" == data) {
          return `<input class="updateCheckbox" docType="${docType}" linearId="${row.linearId}" type="checkbox" checked>`;
        }
        return `<input class="updateCheckbox" docType="${docType}" linearId="${row.linearId}" type="checkbox">`;
      } else if (true == data || "true" == data)
        return `<i class="fa fa-check fa-lg"></i>`;
    };
  }

  renderCheckbox(docType) {
    return {
      className: "dtClickAction dt-body-center",
      render: this._renderCheckbox(docType)
    };
  }

  notSave() {
    this.toggleModal();
    setTimeout(this.toggleEdit, 500);
  }

  save() {
    console.log("Saving data ", this.state.dataToEdit);
    axios
      .put(
        `/api-proxy?endpoint=${this.host}/customs/api/documents`,
        this.state.dataToEdit
      )
      .then(res => {
        if (res.statusCode != 500) {
          this.toggleModal();
          setTimeout(this.toggleEdit, 500);
        } else {
          //console.log(res.message);
        }
      });
  }

  toggleModal() {
    this.setState((state, props) => ({
      isSaveModalVisible: !state.isSaveModalVisible
    }));
  }

  toggleEdit() {
    this.setState(
      (state, props) => ({
        edit: !state.edit
      }),
      () => {
        this.buttonPermisions();
      }
    );
  }

  _columnRender() {
    // this.model = tableModel;
    this.setState({ showPage: false });
    var _this = this;

    this.columnList.setCustomFormat("documentNo", {
      className: "dtClickAction dt-body-left",
      render: function(data, type, row) {
        let q = { linearId: row.linearId };
        let param = queryString.stringify(q);
        let page = "invoice-detail";
        switch (row.state) {
          case "Invoice":
            page = "invoice-detail";
            break;
          case "Credit Note":
            page = "credit-note-detail";
            break;
          case "Payment":
            page = "payment-posting-detail";
            break;
          default:
            break;
        }
        return `<a href="/${page}?${param}">${data}</a>`;
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
    this.setState({
      columnList: columns,
      // model: this.model,
      searchItems: this.model.form.sections[0].fields
    });
    this.setState({ showPage: true });
  }

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
        console.log("Editing", row);
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

  buttonPermisions() {
    const { permisions } = this.props;
    var _this = this;
    var exportFilename = this.state.model.table.export.name;
    const container = this.model.table.container;
    const searchUrl = this.host + this.model.search.url;
    const columns = $.param({ columns: this.model.table.columns });
    console.log("Columns: ", this.model.table.columns);
    console.log("Columns string: ", columns);
    if (!this.state.edit) {
      if (permisions.includes("Document-Tracking-Edit")) {
        $(".btn-wrap.create").html(
          '<button class="btn btn-purple btn-wide editTracking">Edit</button>'
        );
        $(".editTracking").on("click", this.toggleEdit);
      }
      $(".btn-wrap.export").html(
        '<a class="btn btn--transparent ml-10 ExportReporttoExcel" href="javascript:;"><i class="icon icon-export"></i> Export</a>'
      );
      $(".ExportReporttoExcel").on("click", function() {
        let searchInput = window.localStorage.getItem(
          `searchInput-${_this.state.menukey}`
        );
        let exportUrl = `/excel-export/${exportFilename}.xlsx?${columns}&container=${container}&endpoint=${searchUrl}`;

        if (searchInput) {
          searchInput = JSON.parse(searchInput);
          exportUrl = exportUrl + "&" + queryString.stringify(searchInput);
        }
        window.open(exportUrl);
      });
      $(".datatable").off("draw.dt");
    } else {
      $(".ExportReporttoExcel").off("click");
      $(".btn-wrap.export").html("");
      // if (permisions.includes("Document-Tracking-Edit")) {
      $(".editTracking").off("click");
      // }
      $(".btn-wrap.col-display").html("");
      $(".btn-wrap.create").html(
        '<button class="btn btn--transparent btn-wide ml-10 cancelEdit">Cancel</button>' +
          '<button class="btn btn-purple btn-wide ml-10 saveEdit">Save</button>'
      );
      $(".cancelEdit").on("click", this.toggleEdit);
      $(".saveEdit").on("click", this.toggleModal);
    }
  }

  componentWillUnmount() {}

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
        <link
          rel="stylesheet"
          type="text/css"
          href="https://pmm-bkchn-sit.scg.com/static/scg/style.css"
        />
        {this.state.showPage ? (
          <div>
            <List
              {...this.props}
              {...this.state}
              dtButton={this.buttonPermisions}
              columnRender={this._columnRender}
              dtClickAction={this.handleClickExternalId}
              _this={this}
              showPage="false"
              showSearchbox="true"
              refresh={this.state.edit}
              onAfterDraw={this.onAfterDraw}
              onAfterLoad={this.onAfterLoad}
            />
            <ModalAlert
              title={saveModalTitle}
              visible={isSaveModalVisible}
              button={buttonAlert}
              isTextOnly={isTextOnly}
            >
              {saveModalMsg}
            </ModalAlert>
          </div>
        ) : (
          <div>Loading...</div>
        )}
      </div>
    );
  }
}

export default DocumentTracking;

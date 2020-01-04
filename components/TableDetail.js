import React, { Component, Fragment } from "react";
import DataTable from "datatables.net-bs4";
import "datatables.net-buttons";
import "datatables.net-colreorder";
import ColumnModal from "../components/column-modal";
import { i18n, withTranslation } from "~/i18n";
class TableDetail extends Component {
  constructor(props) {
    super(props);
    this.state = { ...this.props };
  }
  componentDidMount() {
    let model = this.props.model;
    this.reRenderDataTable(model);
  }
  async componentWillReceiveProps(nextProps) {
    // You don't have to do this check first, but it can help prevent an unneeded render
    if (nextProps.columns !== this.state.columns) {
      await this.setState({ columns: nextProps.columns });
    }
    // if (nextProps.results !== this.state.results) {
    await this.setState({ results: nextProps.results });
    let model = this.props.model;
    this.reRenderDataTable(model);
    // }
  }
  async reRenderDataTable(model) {
    if (!$) {
      return;
    }
    if ($.fn.dataTable.isDataTable(this.el)) {
      $(this.el)
        .DataTable()
        .destroy();
      $(this.el)
        .find("thead")
        .remove();
      $(this.el)
        .find("tbody")
        .remove();
    }
    $.fn.dataTable.ext.errMode = "none";
    $(`#openColumnDisplay_${this.props.id} .btn-save-column`).unbind("click");
    //const { columns, results, apis, AcolumnList } = this.state;
    let { columns, results, apis, AcolumnList, createdRow } = this.state;
    if (!createdRow) {
      createdRow = () => {};
    }

    // let model = await apis.call("model.get");
    // let model = this.props.model;
    let searchKeys = columns.map(column => {
      return column.searchKey;
    });
    columns = AcolumnList.initColumns(model);
    console.log("column after : ", columns);
    columns.map((column, index) => {
      column.searchKey = searchKeys[index];
    });

    if (columns.length > 0) {
      let dts = $(this.el)
        .DataTable({
          dom:
            '<<"d-none d-sm-flex flex-wrap row justify-content-between align-items-center h-0"<"col-12 col-lg-4 pr-lg-0 d-none d-lg-flex align-items-center justify-content-center justify-content-lg-start"lp><"col-12 col-lg-8 d-none d-sm-flex flex-wrap justify-content-center justify-content-lg-end"<"btn-wrap upload"><"btn-wrap create"><"btn-wrap col-display"><"btn-wrap export">>><"table--responsive"t><"row"<"col-12 row-bottom d-flex d-lg-none"p>>>',

          responsive: false,
          ordering: false,
          paging: false,
          fixedHeader: true,
          fixedColumns: false,
          autoWidth: true,
          stateSave: false,
          colReorder: false,
          scrollX: false,
          processing: true,
          width: "100%",
          columns: columns,
          data: results,
          createdRow,

          scrollCollapse: false
        })
        .on("error", function(e, settings, techNote, message) {
          console.warn("An error has been reported by DataTables: ", message);
        });
      this.columnSorting(dts, columns);
    }
  }
  async forceReload() {
    const { apis } = this.state;
    const { t, lang } = this.props;

    let model = await apis.call("model.get");

    for (let i in model.table.columns) {
      model.table.columns[i].searchKey = model.table.columns[i].header;
      model.table.columns[i].header = await t(
        `${lang}:${model.table.columns[i].header.replace(".", "")}`
      );
    }

    this.reRenderDataTable(model);
  }
  reSorting = () => {
    return Sortable.create(document.getElementById("currentColumn"), {
      group: "column",
      animation: 150,
      onAdd: function(evt) {},
      onUpdate: function(evt) {},
      onRemove: function(evt) {},
      onStart: function(evt) {},
      onEnd: function(evt) {}
    });
  };
  componentWillUnmount() {
    $(".modal-backdrop").remove();
    $("body").unbind("click");
    $(`#openColumnDisplay_${this.props.id} .btn-save-column`).unbind("click");
    if (!$) {
      return;
    }
    if ($.fn.dataTable.isDataTable(this.el)) {
      $(this.el)
        .DataTable()
        .destroy();
    }
  }
  columnSorting(dts, columns) {
    $(`#openColumnDisplay_${this.props.id} button`).unbind("click");
    $(`#openColumnDisplay_${this.props.id} .btn-save-column`).unbind("click");

    var _this = this;
    const { id: menukey, apis } = this.props;
    let saveColumnUrl = apis.url("model.save");
    let columnListDefault = [];
    columns
      .filter(r => r.defaultOrder)
      .map(r => {
        columnListDefault.splice(r.defaultOrder - 1, 0, r);
      });

    var sort = this.reSorting();
    this.sort = sort;
    let currentColumn = $(`.column-display-${menukey} #currentColumn`).html();
    let allColumn = $(`.column-display-${menukey} #allColumn`).html();
    _this.setState({ currentColumn, allColumn });
    $(`#openColumnDisplay_${this.props.id} .btn-save-column`).on(
      "click",
      function() {
        var a = sort.toArray();

        if (a.length < 1) {
          alert("ไม่สามารถบันทึก Column ว่างได้");
          return false;
        }
        var cols = [];
        var b = [];
        for (var aa in a) {
          let idx = dts.column(columns[a[aa]].name).indexes();
          cols.push(columns[a[aa]].searchKey.replace("%", "%25"));
        }
        // $(`.column-display-${menukey} #currentColumn`)
        //   .find(".li")
        //   .each(function(e) {
        //     cols.push(
        //       $(this)
        //         .data("name")
        //         .replace("%", "%25")
        //     );
        //   });
        $(`.column-display-${menukey} #currentColumn`)
          .find(".li")
          .each(function(e) {
            b.push($(this).data("id"));
          });
        $(`.column-display-${menukey} #allColumn`)
          .find(".li")
          .each(function(e) {
            b.push($(this).data("id"));
          });
        console.log("cols", cols);
        console.log("cols.join()", cols.join());
        $.post(saveColumnUrl + "?colSeq=" + cols.join())
          .done(function(res) {
            if (res.status == 200) {
              _this.setState({ blocking: false });
            } else {
              alert("บันทึกการตั้งค่า Column ผิดพลาดจากระบบ");
            }
            _this.forceReload();
          })
          .fail(function(err) {
            alert("ไม่สามารถบันทึกการตั้งค่า Column ได้");
          });
      }
    );

    //=============================================
    //    Add/Remove column datatable display
    //=============================================
    // add all column to current list

    $(`#openColumnDisplay_${this.props.id} button.add-all`).on(
      "click",
      function() {
        $(this)
          .removeClass("add")
          .addClass("disabled");

        var element = $(`.column-display-${menukey} #allColumn`).each(
          function() {
            var li_element = $(this).html();
            $(`.column-display-${menukey} #currentColumn`).append(li_element);
          }
        );
        $(`.column-display-${menukey} #allColumn`)
          .find(".li")
          .remove();
        $(`.column-display-${menukey} #currentColumn`)
          .find(".li button")
          .removeClass("add")
          .addClass("remove");
      }
    );

    // remove all column to current list
    $(`#openColumnDisplay_${this.props.id} button.remove-all`).on(
      "click",
      function() {
        // $(this).removeClass('remove').addClass('disabled');
        $(`.column-display-${menukey} #currentColumn li`).each(function() {
          var li_element = $(this);
          if (li_element.length == 1) {
            $(`.column-display-${menukey} #allColumn`).append(
              '<li data-id="' +
                li_element.data("id") +
                '" class="' +
                li_element.attr("class") +
                '" id="' +
                li_element.attr("id") +
                '" data-name="' +
                li_element.attr("data-name") +
                '">' +
                li_element.html() +
                "</li>"
            );
            $(this).remove();
          }
        });
        columnListDefault.map(function(r) {
          var li_element = $(
            `.column-display-${menukey} #allColumn li#${r.data}`
          );
          if (li_element.length == 1) {
            $(`.column-display-${menukey} #currentColumn`).append(
              '<li data-id="' +
                li_element.data("id") +
                '" class="' +
                li_element.attr("class") +
                '" id="' +
                li_element.attr("id") +
                '" data-name="' +
                li_element.attr("data-name") +
                '">' +
                li_element.html() +
                "</li>"
            );
            li_element.remove();
          }
        });
        $(`.column-display-${menukey} #currentColumn`)
          .find(".li button")
          .removeClass("add")
          .addClass("remove");
        $(`.column-display-${menukey} #allColumn`)
          .find(".li button")
          .removeClass("remove")
          .addClass("add");
        //ddd
      }
    );

    // add column current list
    $(`#openColumnDisplay_${this.props.id} #allColumn button`).on(
      "click",
      function() {
        $(this)
          .removeClass("add")
          .addClass("remove");
        var element = $(this).parents(".li");
        var target = $(`.column-display-${menukey} #currentColumn`);

        target.append(
          '<li data-id="' +
            element.data("id") +
            '" class="' +
            element.attr("class") +
            '" id="' +
            element.attr("id") +
            '" data-name="' +
            element.attr("data-name") +
            '">' +
            element.html() +
            "</li>"
        );
        $(this)
          .parents(".li")
          .remove();
      }
    );

    // remove column current list
    $(
      `#openColumnDisplay_${this.props.id} #currentColumn .li:not(".fixed") button`
    ).on("click", function() {
      var element = $(this).parents(".li");
      var ul = element.parents("ul");
      if (ul === undefined) {
        return false;
      }
      if (ul.find("li").length < 2) {
        alert("คุณไม่สามารถลบ Column ทั้งหมดได้");
        return false;
      }
      $(this)
        .removeClass("remove")
        .addClass("add");
      var target = $(`.column-display-${menukey} #allColumn`);
      target.append(
        '<li data-id="' +
          element.data("id") +
          '" class="' +
          element.attr("class") +
          '" id="' +
          element.attr("id") +
          '" data-name="' +
          element.attr("data-name") +
          '">' +
          element.html() +
          "</li>"
      );
      $(this)
        .parents(".li")
        .remove();
    });
  }

  QtyCheck = (row, column) => {
    const { t, lang } = this.props;

    if (column.field.indexOf("quantity") != -1) {
      const quantity = column.field.split(".")[0];
      const subProperty = column.field.split(".")[1];

      return (
        <React.Fragment>
          <div className="col-6 px-0 pt-3 text-right">
            {`${lang}:${column.header}`}
            {": "}
          </div>
          <div className="col-6 pt-3 text-right word-wrap">
            {row[quantity][subProperty]}
          </div>
        </React.Fragment>
      );
    } else {
    }
  };

  render() {
    var {
      collapseHeader,
      btnOpt: button,
      disabledUnderLine,
      btnColumnDisplay,
      columns,
      results,
      t,
      lang
    } = this.props;
    if (!collapseHeader) {
      collapseHeader = ["Title"];
    }
    if (!button) {
      button = [];
    }
    return (
      <Fragment>
        <div className="row box">
          <div className="col-12">
            <div className="row">
              <div className="col-6 border-bottom">
                <h3 className="f-22 py-2">{this.props.collapseHeader}</h3>
              </div>
              <div className={`col-6 text-right border-bottom gray-1`}>
                {btnColumnDisplay ? (
                  <button
                    className="btn btn--transparent btn-wide mr-2 mb-15 d-none d-lg-inline-block"
                    data-toggle="modal"
                    data-target={`#openColumnDisplay_${this.props.id}`}
                  >
                    {t("Column Display")}
                  </button>
                ) : (
                  ""
                )}
                {button.map(b => {
                  return (
                    <button
                      className={b.attr.className}
                      onClick={b.attr.onClick}
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <div id={this.props.id} className=" multi-collapse w-100 ">
            <div className="card card-body noborder">
              {/* Desktop Version - Start */}
              <div className="d-none d-lg-inline-block">
                <div className="table_wrapper table-responsive">
                  <table
                    className="table table-detail dataTable"
                    ref={el => (this.el = el)}
                  />
                </div>
              </div>
              {/* Desktop Version - End */}

              {/* Mobile Version - Start */}
              <div className="d-inline-block d-lg-none">
                <table className="table dataTable mobile_dataTable">
                  <thead>
                    <tr>
                      <th className="text-center">
                        {this.props.mobileModel
                          ? t(
                              `${lang}:${this.props.mobileModel.table.columns[0].header}`
                            )
                          : ""}
                      </th>
                      <th className="text-center">
                        {this.props.mobileModel
                          ? t(
                              `${lang}:${this.props.mobileModel.table.columns[1].header}`
                            )
                          : ""}
                      </th>
                      <th className="text-center">{t(`${lang}:More`)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Loop here - Start */}
                    {results.map((row, i) => {
                      return (
                        <React.Fragment>
                          <tr>
                            <td className="text-center">
                              {this.props.mobileModel
                                ? row[
                                    this.props.mobileModel.table.columns[0]
                                      .field
                                  ]
                                : ""}
                            </td>
                            <td className="text-center uppercase">
                              {this.props.mobileModel
                                ? row[
                                    this.props.mobileModel.table.columns[1]
                                      .field
                                  ]
                                : ""}
                            </td>
                            <td>
                              <a
                                href={`#itemInfo-detail-${i}`}
                                data-toggle="collapse"
                                role="button"
                                aria-expanded="false"
                                area-controls={`#itemInfo-detail-${i}`}
                                className="d-flex w-100 purple btnTableToggle"
                              >
                                <strong className="textOnHide">
                                  <i className="fa fa-ellipsis-h purple mx-auto" />
                                </strong>
                                <strong className="textOnShow">
                                  <i className="fa fa-times purple mx-auto" />
                                </strong>
                              </a>
                            </td>
                          </tr>
                          <tr
                            id={`itemInfo-detail-${i}`}
                            className="collapse multi-collapse"
                          >
                            <td colSpan="3">
                              <div className="d-flex flex-wrap w-100">
                                {this.props.mobileModel
                                  ? this.props.mobileModel.table.columns.map(
                                      (column, j) => {
                                        if (j >= 2) {
                                          if (
                                            column.field.indexOf("quantity") !=
                                            -1
                                          ) {
                                            const quantity = column.field.split(
                                              "."
                                            )[0];
                                            const subProperty = column.field.split(
                                              "."
                                            )[1];

                                            return (
                                              <React.Fragment>
                                                <div className="col-6 px-0 pt-3 text-right">
                                                  {t(
                                                    `${lang}:${column.header}`
                                                  )}
                                                  {": "}
                                                </div>
                                                <div className="col-6 pt-3 text-right word-wrap">
                                                  {row[quantity][subProperty]}
                                                </div>
                                              </React.Fragment>
                                            );
                                          } else {
                                            return (
                                              <React.Fragment>
                                                <div className="col-6 px-0 pt-3 text-right">
                                                  {t(
                                                    `${lang}:${column.header}`
                                                  )}
                                                  {": "}
                                                </div>
                                                <div className="col-6 pt-3 text-right uppercase word-wrap">
                                                  {column.type == "date"
                                                    ? moment(
                                                        row[column.field]
                                                      ).format(column.pattern)
                                                    : row[`${column.field}`]}
                                                </div>
                                              </React.Fragment>
                                            );
                                          }
                                        }
                                      }
                                    )
                                  : ""}
                              </div>
                            </td>
                          </tr>
                        </React.Fragment>
                      );
                    })}

                    {/* Loop here - End */}
                  </tbody>
                </table>
              </div>
              {/* Mobile Version - End */}
            </div>
          </div>
        </div>
        <ColumnModal
          title="Column List"
          modalId={`openColumnDisplay_${this.props.id}`}
          columnList={columns}
          menukey={this.props.id}
          {...this.props}
          {...this.state}
        />
      </Fragment>
    );
  }
}

export default withTranslation(["detail", "po-detail", "common", "menu"])(
  TableDetail
);

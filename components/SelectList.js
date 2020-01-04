import React, { Component, Fragment } from "react";
import SearchBox from "./SearchBox";
import DataTable from "datatables.net-bs4";
const queryString = require("query-string");
import "datatables.net-buttons";
import { i18n, withTranslation } from "~/i18n";
// import  'datatables.net-buttons-bs4'
// import 'datatables.net-buttons/js/buttons.colVis.min'
// import 'datatables.net-buttons/js/dataTables.buttons.min'
// import 'datatables.net-buttons/js/buttons.flash.min'
import "datatables.net-buttons/js/buttons.html5.min";
import "datatables.net-colreorder";
import "datatables.net-fixedheader";
import dTable from "../libs/dt";
import ColumnModal from "../components/column-modal";
import BlockUi from "react-block-ui";
import { Loader, Types } from "react-loaders";
import Link from "next/link";
import Router from "next/router";
import { PageHeader } from "../components/page";
class SelectList extends Component {
  constructor(props) {
    super(props);
    this.hideBlocking = this.hideBlocking.bind(this);
    this.forceReload = this.forceReload.bind(this);
    this.cancelAction = this.cancelAction.bind(this);
    this.updateResults = this.updateResults.bind(this);
    this.columnRender;
    this.state = {
      blocking: false,
      ...this.props,
      enableApproveButton: false,
      searchResult: {}
    };
  }
  updateResults(res) {
    if (res.data === undefined) {
      res = {
        recordsTotal: 0,
        recordsFiltered: 0,
        data: [],
        columns: []
      };
    }
    if (typeof this.props.updateResults == "function") {
      this.props.updateResults(res);
    }
    this.setState({ searchResult: res });
  }
  reloadDataTable = () => {
    const { t } = this.props;
    $(".btn-search").html(
      `<i class="fa fa-spinner fa-spin" /> ${t("Searching")}`
    );
    $(".btn-search").prop("disabled", true);
    $(".btn-search").css("cursor", "not-allowed");
    let { dataTableUrl } = this.props;
    let searchInput = localStorage.getItem(`searchInput-${this.state.menukey}`);
    let isSearch = false;
    var splittedUrl = dataTableUrl.split("/");
    if (this.state.itemFilter && this.state.itemFilter === "invoices") {
      splittedUrl[splittedUrl.length - 1] = "liv/invoices";
    } else if (this.state.itemFilter === "creditnotes") {
      splittedUrl[splittedUrl.length - 1] = "liv/creditnotes";
    } else {
      splittedUrl[splittedUrl.length - 1] = "liv/debitnotes";
    }
    dataTableUrl = `${splittedUrl.join("/")}`;

    if (searchInput) {
      searchInput = JSON.parse(searchInput);
      if (dataTableUrl.indexOf(dataTableUrl) > -1) {
        let q = queryString.stringify(searchInput, null, null, {
          encodeURIComponent: uri => uri
        });
        if (q != "") {
          if (dataTableUrl.indexOf("?") < 0) {
            dataTableUrl = `${dataTableUrl}?${q}`;
          } else {
            dataTableUrl = `${dataTableUrl}&${q}`;
          }
        }
      }
    } else {
      searchInput = {};
    }
    this.dts.ajax.url(dataTableUrl).load();
  };
  updateItemFilter = itemFilter => {
    this.props.updateViewing(itemFilter);
  };
  forceReload = async () => {
    let { columnRender } = this.props;
    if (typeof columnRender == "function") {
      columnRender();
    }
  };
  hideBlocking = () => {
    const { t } = this.props;
    $(".btn-search").html(`<i class="icon icon-search" /> ${t("Search")}`);
    $(".btn-search").prop("disabled", false);
    $(".btn-search").css("cursor", "pointer");
    // this.setState({ blocking: false });
  };

  reRenderDatatable = () => {
    let { dataTableUrl, columnList, model, fixHeader } = this.props;
    const _this = this;
    if (fixHeader === undefined) {
      fixHeader = true;
    }
    let searchInput = localStorage.getItem(`searchInput-${this.state.menukey}`);
    let isSearch = false;
    var splittedUrl = dataTableUrl.split("/");
    if (this.state.itemFilter && this.state.itemFilter === "invoices") {
      splittedUrl[splittedUrl.length - 1] = "liv/invoices";
    } else if (this.state.itemFilter === "creditnotes") {
      splittedUrl[splittedUrl.length - 1] = "liv/creditnotes";
    } else if (this.state.itemFilter === "debitnotes") {
      splittedUrl[splittedUrl.length - 1] = "liv/debitnotes";
    }
    dataTableUrl = `${splittedUrl.join("/")}`;
    if (searchInput) {
      searchInput = JSON.parse(searchInput);
      if (dataTableUrl.indexOf(dataTableUrl) > -1) {
        let q = queryString.stringify(searchInput, null, null, {
          encodeURIComponent: uri => uri
        });
        if (q != "") {
          if (dataTableUrl.indexOf("?") < 0) {
            dataTableUrl = `${dataTableUrl}?${q}`;
          } else {
            dataTableUrl = `${dataTableUrl}&${q}`;
          }
        }
      }
    } else {
      searchInput = {};
    }
    return new dTable(
      this,
      _this,
      model,
      columnList,
      dataTableUrl,
      _this.props
    );
  };
  componentDidMount() {
    const {
      title,
      breadcrumb,
      showSearchbox,
      dataTableUrl,
      columnList,
      model,
      dtClickAction,
      dtButton,
      saveColumnUrl,
      menukey,
      t,
      lang
    } = this.props;
    const columnDisplayText = t(`${lang}:Column Display`);
    const exportText = t(`${lang}:Export`);

    if (typeof dtClickAction == "function") {
      this.dtClickAction = dtClickAction;
    }

    const _this = this;

    $.fn.dataTable.ext.errMode = "log";
    //var dts = new dTable(this, _this, model, columnList, dataTableUrl);
    var dts = this.reRenderDatatable();
    dts
      .on("init preDraw", function() {})
      .on("preXhr", function() {
        // _this.setState({ blocking: true });
      })
      .on("xhr.dt", function(e, settings, json, xhr) {
        // $(".searchRewsultLength").text(json.recordsTotal);
        if (_this.updateResults) {
          _this.updateResults(json);
        }
        if (json && json.recordsTotal) {
          $(".searchRewsultLength").text(json.recordsTotal);
        }
        _this.hideBlocking();
      })
      .on("draw", function(e, settings, json, xhr) {
        $(".btn-wrap.filter").html(
          '<strong class="mr-3">Filter:</strong><a id="selectInvoice" href="javascript:void(0);">Invoice</a><a id="selectCN" href="javascript:void(0);">Credit Note</a>' +
            '<a id="selectDN" href="javascript:void(0);">Debit Note</a>'
        );
        if (_this.state.itemFilter === "creditnotes") {
          $("#selectInvoice").removeClass("active");
          $("#selectDN").removeClass("active");
          $("#selectCN").addClass("active");
        } else if (_this.state.itemFilter === "debitnotes") {
          $("#selectInvoice").removeClass("active");
          $("#selectCN").removeClass("active");
          $("#selectDN").addClass("active");
        } else {
          $("#selectInvoice").addClass("active");
          $("#selectDN").removeClass("active");
          $("#selectCN").removeClass("active");
        }

        $("#selectInvoice").on("click", () => {
          _this.updateItemFilter("invoices");
        });
        $("#selectDN").on("click", () => {
          _this.updateItemFilter("debitnotes");
        });
        $("#selectCN").on("click", () => {
          _this.updateItemFilter("creditnotes");
        });

        $(".datatable tbody tr td:nth-child(1)").each(function(i) {
          let seq = settings._iDisplayStart + i + 1;
          let html = $(this).html();
          $(this).html(`${html}<div class="row-number">${seq}</div>`);
        });
        $(".datatable tbody tr td:nth-child(n+1)").each(function(i) {
          let html = $(this).html();
          let text = $(this).text();

          if ($(this).hasClass("list-display-popover")) {
            //let title = "";
            var idx = dts.cell($(this)).index().column;
            var title = dts.columns(idx).header();
            //var title = table.columns(i - 1).header();
            console.log($(title).text());
            // if (columnList[i - 1]) {
            //   title = columnList[i].title;
            // }

            $(this).attr("data-toggle", "popover");
            $(this).attr("title", $(title).text());
            $(this).attr("data-content", text);
          }

          $(this).html(`${html}`);
        });
        try {
          makePopover(columnDisplayText, exportText);
        } catch (err) {
          console.warn(err.message);
        }
        dts.cells(".dtClickAction").every(function __triggerAction() {
          const cell = this;
          const anchor = $(cell.node()).find("a");
          const href = anchor.attr("href");
          anchor.click(function __actionOnClick(event) {
            event.preventDefault();
            if (_this.dtClickAction) {
              _this.dtClickAction(href, anchor);
            }
          });
        });
      });

    if (typeof dtButton == "function") {
      dtButton();
    }
    if (typeof saveColumnUrl == "string") {
      this.columnSorting(dts, columnList, _this, saveColumnUrl);
    }

    $(function() {
      //$('[data-toggle="tooltip"]').popover();
    });
  }
  reSorting = () => {
    console.log("reSorting");
    return Sortable.create(document.getElementById("currentColumn"), {
      group: "column",
      animation: 150,
      onAdd: function(evt) {
        console.log("onAdd.currentColumn:", evt.item);
      },
      onUpdate: function(evt) {
        console.log("onUpdate.currentColumn:", evt.item);
      },
      onRemove: function(evt) {
        console.log("onRemove.currentColumn:", evt.item);
      },
      onStart: function(evt) {
        console.log("onStart.allColumn:", evt.item);
      },
      onEnd: function(evt) {
        console.log("onEnd.allColumn:", evt.item);
      }
    });
  };
  columnSorting = (dts, columns, _this, saveColumnUrl) => {
    console.log("column sorting...");
    var _this = this;
    const { menukey } = this.props;

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
    $(".btn-save-column").on("click", function() {
      var a = sort.toArray();
      if (a.length < 1) {
        alert("ไม่สามารถบันทึก Column ว่างได้");
        return false;
      }
      localStorage.removeItem("B2PTable_" + btoa(_this.props.url));
      var cols = [];
      var b = [];
      for (var aa in a) {
        if (columns[a[aa]] != undefined) {
          let idx = dts.column(columns[a[aa]].name).indexes();
          cols.push(columns[a[aa]].title);
        }
      }
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
      dts.columns().visible(false);
      dts.columns(a).visible(true, false);

      //dts.colReorder.reset();
      //dts.colReorder.order(b);

      $(_this.el).css("width", "100%");
      //dts.columns.adjust().draw();
      // _this.setState({ blocking: true });
      $.post(saveColumnUrl + "?colSeq=" + cols.join())
        .done(function(res) {
          if (res.status == 200) {
            // _this.setState({ blocking: false });
          } else {
            alert("บันทึกการตั้งค่า Column ผิดพลาดจากระบบ");
            console.log(res);
          }
          _this.forceReload();
        })
        .fail(function(err) {
          alert("ไม่สามารถบันทึกการตั้งค่า Column ได้");
          console.log(err);
        });
    });

    //=============================================
    //    Add/Remove column datatable display
    //=============================================
    // add all column to current list
    $("body").on("click", "button.add-all", function() {
      $(this)
        .removeClass("add")
        .addClass("disabled");

      var element = $(`.column-display-${menukey} #allColumn`).each(function() {
        var li_element = $(this).html();
        $(`.column-display-${menukey} #currentColumn`).append(li_element);
      });
      $(`.column-display-${menukey} #allColumn`)
        .find(".li")
        .remove();
      $(`.column-display-${menukey} #currentColumn`)
        .find(".li button")
        .removeClass("add")
        .addClass("remove");
    });

    // remove all column to current list
    $("body").on("click", "button.remove-all", function() {
      // $(this).removeClass('remove').addClass('disabled');
      $(`.column-display-${menukey} #currentColumn li`).each(function() {
        var li_element = $(this);
        if (li_element) {
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
        }
        $(this).remove();
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
        }

        li_element.remove();
      });
      // var element = $("#currentColumn").each(function() {
      //   var li_element = $(this).html();
      //   $("#allColumn").append(li_element);
      //   $("#allColumn")
      //     .find(".li.default")
      //     .remove();
      // });
      // $("#currentColumn")
      //   .find('.li')
      //   .remove();
      $(`.column-display-${menukey} #currentColumn`)
        .find(".li button")
        .removeClass("add")
        .addClass("remove");
      $(`.column-display-${menukey} #allColumn`)
        .find(".li button")
        .removeClass("remove")
        .addClass("add");
    });

    // add column current list
    $("body").on(
      "click",
      `.column-display-${menukey} #allColumn button`,
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
    $("body").on(
      "click",
      `.column-display-${menukey} #currentColumn .li:not(".fixed") button`,
      function() {
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
      }
    );
    $(window).on("scroll", function() {
      let fix = $(".fixedHeader-floating");
      if (fix.length > 0) {
        $(".fixedHeader-floating").css("width", $(".table__wrapper").width());
        $(".fixedHeader-floating").scrollLeft(
          $(".dataTables_scrollBody").scrollLeft()
        );
      }
    });

    $(".dataTables_scrollBody").scroll(function() {
      $(".fixedHeader-floating").scrollLeft($(this).scrollLeft());
      $(".fixedHeader-floating").css("width", $(".table__wrapper").width());
    });
    this.dts = dts;
  };
  cancelAction = () => {
    const { menukey } = this.props;
    let currentColumn = this.state.currentColumn;
    let allColumn = this.state.allColumn;
    $(`.column-display-${menukey} #currentColumn`).html(currentColumn);
    $(`.column-display-${menukey} #allColumn`).html(allColumn);
  };
  componentWillUnmount() {
    $("body").unbind("click");
    $(window).unbind("scroll");
    $(".dataTables_scrollBody").unbind("scroll");
    $(".fixedHeader-floating").remove();
  }
  render() {
    const { title, breadcrumbs, showSearchbox, columnList } = this.props;
    return (
      <Fragment>
        <PageHeader title={title} breadcrumbs={breadcrumbs} {...this.props} />
        <section className="box box--width-header pb-0 pb-lg-3">
          {/* Search Box - Start */}
          {showSearchbox == true || showSearchbox == "true" ? (
            <SearchBox
              {...this.props}
              {...this.state}
              reloadDataTable={this.reloadDataTable}
            />
          ) : (
            <div className="box__header box__header-blank">
              <div className="page__header d-sm-none" />
            </div>
          )}

          {/* Search Box - End */}
          <BlockUi
            tag="div"
            blocking={this.state.blocking}
            loader={
              <Loader active type="ball-spin-fade-loader" color="#af3694" />
            }
          >
            <div className="box__inner box__inner--table">
              <div className="table__wrapper">
                <table className="table datatable" ref={el => (this.el = el)} />
              </div>
            </div>
          </BlockUi>
        </section>
        <ColumnModal
          title="Column List"
          columnList={columnList}
          cancelAction={this.cancelAction}
          {...this.props}
          {...this.state}
        />
      </Fragment>
    );
  }
}

export default withTranslation(["search-box", "detail"])(SelectList);

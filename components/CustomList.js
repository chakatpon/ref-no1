import React, { Component, Fragment } from "react";
import SearchBox from "./SearchBox";
import DataTable from "datatables.net-bs4";
import { isMobile } from "react-device-detect";
const queryString = require("query-string");
import "datatables.net-buttons";
// import  'datatables.net-buttons-bs4'
// import 'datatables.net-buttons/js/buttons.colVis.min'
// import 'datatables.net-buttons/js/dataTables.buttons.min'
// import 'datatables.net-buttons/js/buttons.flash.min'
import "datatables.net-buttons/js/buttons.html5.min";
import "datatables.net-colreorder";
import "datatables.net-fixedheader";
import "jquery-datatables-checkboxes";
import { i18n, withTranslation } from "~/i18n";
import dTable from "../libs/dt";
import dTableCheckbox from "../libs/dtCheckbox";
import ColumnModal from "../components/column-modal";
import BlockUi from "react-block-ui";
import { Loader, Types } from "react-loaders";
import Link from "next/link";
import Router from "next/router";
import { PageHeader } from "../components/page";
import { COMMON_CONSTANT } from "../context/common-context";
import CordaService from "../services/CordaService";
import OffchainService from "../services/OffchainService";
import StandardService from "../services/StandardService";

class CustomList extends Component {
  constructor(props) {
    super(props);
    this.cordaService = new CordaService();
    this.offchainService = new OffchainService();
    this.standardService = new StandardService();
    this.hideBlocking = this.hideBlocking.bind(this);
    this.forceReload = this.forceReload.bind(this);
    this.cancelAction = this.cancelAction.bind(this);
    this.updateResults = this.updateResults.bind(this);
    this.columnRender;
    this.state = {
      blocking: false,
      ...this.props,
      itemFilter: "all",
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
  reloadDataTable = (url = null) => {
    const { t } = this.props;
    $(".btn-search").html(
      `<i class="fa fa-spinner fa-spin" /> ${t("Searching")}`
    );
    $(".btn-search").prop("disabled", true);
    $(".btn-search").css("cursor", "not-allowed");

    let { dataTableUrl, columnList, model, fixHeader } = this.props;
    const _this = this;
    _this.props.updateSelectedCheckboxIds([]);
    if (fixHeader === undefined) {
      fixHeader = true;
    }
    let searchInputs = localStorage.getItem(
      `searchInput-${this.state.menukey}`
    );
    let isSearch = false;
    if (this.state.currentAuth) {
      if (dataTableUrl.indexOf("?") > -1) {
        dataTableUrl = `${dataTableUrl}&currentAuthority=true`;
      } else {
        dataTableUrl = `${dataTableUrl}?currentAuthority=true`;
      }
    }
    let searchInput = {};
    // let searchQuery = Router.query;
    // if (_.size(searchQuery) > 0) {
    //   model.form.sections[0].fields.map((searchItem, i) => {
    //     if (searchQuery[searchItem.key] !== undefined) {
    //       searchInput[searchItem.key] = searchQuery[searchItem.key];
    //     }
    //   });
    // }
    if (_.size(searchInput) < 1 && searchInputs) {
      searchInputs = JSON.parse(searchInputs);
      model.form.sections[0].fields.map((searchItem, i) => {
        if (searchInputs[searchItem.key] !== undefined) {
          searchInput[searchItem.key] = searchInputs[searchItem.key];
        }
      });
    }
    if (searchInput) {
      if (dataTableUrl.indexOf(dataTableUrl) > -1) {
        let q = queryString.stringify(searchInput, null, null, {
          encodeURIComponent: uri => uri
        });
        if (q != "") {
          dataTableUrl = `${dataTableUrl}&${q}`;
        }
      }
    } else {
      searchInput = {};
    }
    switch (this.state.itemFilter) {
      case "matched":
        dataTableUrl = `${dataTableUrl}&matchedFlag=true`;
        break;
      case "unmatched":
        dataTableUrl = `${dataTableUrl}&matchedFlag=false`;
        break;
      default:
        break;
    }
    this.dts.ajax.url(dataTableUrl).load();
  };
  updateItemFilter = itemFilter => {
    console.log("updataItemFilter ");
    this.setState({ itemFilter });
    this.reloadDataTable();
  };
  forceReload = async () => {
    console.log("forceReload ");
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
    console.log("rerenderDataTable : ");
    let { dataTableUrl, columnList, model, fixHeader } = this.props;
    const _this = this;
    _this.props.updateSelectedCheckboxIds([]);
    if (fixHeader === undefined) {
      fixHeader = true;
    }
    let searchInputs = localStorage.getItem(
      `searchInput-${this.state.menukey}`
    );
    let isSearch = false;
    if (this.state.currentAuth) {
      if (dataTableUrl.indexOf("?") > -1) {
        dataTableUrl = `${dataTableUrl}&currentAuthority=true`;
      } else {
        dataTableUrl = `${dataTableUrl}?currentAuthority=true`;
      }
    }
    let searchQuery = Router.query;

    let searchInput = {};
    if (_.size(searchQuery) > 0) {
      model.form.sections[0].fields.map((searchItem, i) => {
        if (searchQuery[searchItem.key] !== undefined) {
          searchInput[searchItem.key] = searchQuery[searchItem.key];
        }
      });
    }
    if (_.size(searchInput) < 1 && searchInputs) {
      searchInputs = JSON.parse(searchInputs);
      console.log(searchInputs);
      model.form.sections[0].fields.map((searchItem, i) => {
        if (searchInputs[searchItem.key] !== undefined) {
          searchInput[searchItem.key] = searchInputs[searchItem.key];
        }
      });
    }
    if (searchInput) {
      if (dataTableUrl.indexOf(dataTableUrl) > -1) {
        let q = queryString.stringify(searchInput, null, null, {
          encodeURIComponent: uri => uri
        });
        if (q != "") {
          dataTableUrl = `${dataTableUrl}&${q}`;
        }
      }
    } else {
      searchInput = {};
    }
    switch (this.state.itemFilter) {
      case "matched":
        dataTableUrl = `${dataTableUrl}&matchedFlag=true`;
        break;
      case "unmatched":
        dataTableUrl = `${dataTableUrl}&matchedFlag=false`;
        break;
      default:
        break;
    }

    return new dTableCheckbox(
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
      permissions,
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
    _this.props.updateSelectedCheckboxIds([]);
    dts
      .on("init preDraw", function() {})
      .on("preXhr", function() {
        // _this.setState({ blocking: true });
      })
      .on("xhr.dt", function(e, settings, json, xhr) {
        // $(".searchRewsultLength").text(json.recordsTotal);
        if (json && json.recordsTotal) {
          $(".searchRewsultLength").text(json.recordsTotal);
        }
        if (_this.updateResults) {
          _this.updateResults(json);
        }
        _this.hideBlocking();
      })
      .on("draw", function(e, settings, json, xhr) {
        $("input:checkbox").attr("disabled", true);
        $(".btn-wrap.filter").html(
          '<strong class="mr-3">Filter:</strong><a id="filterAll" href="javascript:void(0);"><strong class="purple">All</strong></a><a id="filterUnmatched" href="javascript:void(0);"><strong class="purple">Unmatched</strong></a><a id="filterMatched" href="javascript:void(0);" class="active"><strong class="purple">Matched</strong></a>'
        );
        $(".btn-wrap.create").html(
          '<a id="btnApprove" class="btn ml-10 disabled" href="javascript:;"">Approve</a>'
        );
        $("thead input[type=checkbox]").prop("checked", false);
        if (_this.state.itemFilter === "unmatched") {
          if (permissions.includes("DOA-Mass-Approval-Unmatched")) {
            $("input:checkbox").attr("disabled", false);
          }
          $("#filterUnmatched").addClass("active");
          $("#filterMatched").removeClass("active");
          $("#filterAll").removeClass("active");
          window.localStorage.setItem(`searchInput-doa-filter`, "unmatched");
        } else if (_this.state.itemFilter === "matched") {
          if (permissions.includes("DOA-Mass-Approval-Matched")) {
            $("input:checkbox").attr("disabled", false);
          }
          $("#filterUnmatched").removeClass("active");
          $("#filterMatched").addClass("active");
          $("#filterAll").removeClass("active");
          window.localStorage.setItem(`searchInput-doa-filter`, "matched");
        } else {
          if (permissions.includes("DOA-Mass-Approval-All")) {
            $("input:checkbox").attr("disabled", false);
          }
          $("#filterUnmatched").removeClass("active");
          $("#filterMatched").removeClass("active");
          $("#filterAll").addClass("active");
          window.localStorage.setItem(`searchInput-doa-filter`, "all");
        }
        $("#btnApprove").on("click", () => _this.props.handleApprove());
        $("#filterAll").on("click", () => _this.updateItemFilter("all"));
        $("#filterUnmatched").on("click", () =>
          _this.updateItemFilter("unmatched")
        );
        $("#filterMatched").on("click", () =>
          _this.updateItemFilter("matched")
        );
        $(".datatable tbody tr td:nth-child(1)").each(function(i) {
          let seq = settings._iDisplayStart + i + 1;
          let html = $(this).html();
          let data = dts.row(i).data();
          $(this).html(`${html}<div class="row-number">${seq}</div>`);
          if (data) {
            $(this).attr("id", data.linearId);
          }
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
        let selectedCheckboxIds = _this.props.selectedCheckboxIds || [];
        let successCheckboxIds = _this.props.successCheckboxIds || [];
        $("thead input[type=checkbox]").on("click", function(e) {
          const checkboxesAmount = $("tbody input[type=checkbox]").length;
          if (selectedCheckboxIds.length > 0) {
            selectedCheckboxIds.length = 0;
            $(".rowSelected").removeClass("rowSelected");
            $("#btnApprove").addClass("disabled");
          } else {
            // select all checkboxes ids
            const allCheckboxElements = $("tbody input[type=checkbox]");
            for (let i = 0; i < allCheckboxElements.length; i++) {
              const id = allCheckboxElements[i].parentNode.id;
              selectedCheckboxIds.push(id);
            }
            $("tbody tr").addClass("rowSelected");
            $("#btnApprove").removeClass("disabled");
          }
          const filterOutSuccessCheckboxIds = selectedCheckboxIds.filter(
            item => successCheckboxIds.indexOf(item) === -1
          );
          _this.props.updateSelectedCheckboxIds(filterOutSuccessCheckboxIds);
        });
        $("tbody input[type=checkbox]").on("click", function(e) {
          if (_this.props.selectedCheckboxIds.length === 0) {
            selectedCheckboxIds.length = 0;
          }
          const selectedCheckboxId = e.target.parentNode.id;
          const index = selectedCheckboxIds.indexOf(selectedCheckboxId);
          if (index > -1) {
            selectedCheckboxIds.splice(index, 1);
            $(e.target.parentNode.parentNode).removeClass("rowSelected");
          } else {
            selectedCheckboxIds.push(selectedCheckboxId);
            $(e.target.parentNode.parentNode).addClass("rowSelected");
          }
          if (selectedCheckboxIds.length > 0) {
            $("#btnApprove").removeClass("disabled");
          } else {
            $("#btnApprove").addClass("disabled");
          }
          _this.props.updateSelectedCheckboxIds(selectedCheckboxIds);
        });

        // $("tbody input[type=checkbox]").each(function(index) {
        //   $(this).prop("checked", true);
        // });

        $(".dt-checkboxes-cell").each(function(index) {
          console.log("_this props : ", _this.props);
          console.log("this is checkbox : ", $(this).attr("id"));
          console.log("Parent node : ", $(this).parent("tr"));
          console.log("$(this) : ", $(this));

          if (_this.props.selectedCheckboxIds.length === 0) {
            selectedCheckboxIds.length = 0;
          }
          const idChecker = selectedCheckboxIds.indexOf($(this).attr("id"));
          if (idChecker > -1) {
            $(this)
              .children()
              .prop("checked", true);
          } else {
            $(this)
              .children()
              .prop("checked", false);
          }
          if (selectedCheckboxIds.length > 0) {
            $("#btnApprove").removeClass("disabled");
          } else {
            $("#btnApprove").addClass("disabled");
          }
          _this.props.updateSelectedCheckboxIds(selectedCheckboxIds);
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
        "onAdd.currentColumn:", evt.item;
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
    $(".btn-save-column").on("click", async function() {
      var a = sort.toArray();
      if (a.length < 1) {
        alert("ไม่สามารถบันทึก Column ว่างได้");
        return false;
      }
      localStorage.removeItem("B2PTable_" + btoa(_this.props.url));
      var cols = [];
      var b = [];
      for (var aa in a) {
        let idx = dts.column(columns[a[aa]].name).indexes();
        cols.push(columns[a[aa]].title);
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

      $(_this.el).css("width", "100%");

      let apiService = null;

      if (saveColumnUrl.indexOf("corda") !== -1) {
        apiService = _this.cordaService;
      } else if (saveColumnUrl.indexOf("offchain") !== -1) {
        apiService = _this.offchainService;
      } else if (saveColumnUrl.indexOf("standard") !== -1) {
        apiService = _this.standardService;
      }

      if (apiService) {
        const response = await apiService.callApi({
          url: saveColumnUrl,
          options: { method: "POST" },
          requestParams: { colSeq: cols.join() }
        });

        if (!response.status) {
          alert(response.message);
        }

        _this.forceReload();
      } else {
        $.post(saveColumnUrl + "?colSeq=" + cols.join())
          .done(function(res) {
            if (res.status == 200) {
            } else {
              alert("บันทึกการตั้งค่า Column ผิดพลาดจากระบบ");
            }
            _this.forceReload();
          })
          .fail(function(err) {
            alert("ไม่สามารถบันทึกการตั้งค่า Column ได้");
          });
      }
    });

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

    $("body").on("click", "button.remove-all", function() {
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
          `.column-display-${menukey} #allColumn li#${r.data.replace(
            COMMON_CONSTANT.REGEX_ID_HTML,
            "_"
          )}`
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
    });

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

export default withTranslation(["detail"])(CustomList);

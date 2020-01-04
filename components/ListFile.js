import React, { Component, Fragment } from "react";
import SearchBox from "./SearchBox";
import DataTable from "datatables.net-bs4";
const queryString = require("query-string");
import "datatables.net-buttons";
// import  'datatables.net-buttons-bs4'
// import 'datatables.net-buttons/js/buttons.colVis.min'
// import 'datatables.net-buttons/js/dataTables.buttons.min'
// import 'datatables.net-buttons/js/buttons.flash.min'
import "datatables.net-buttons/js/buttons.html5.min";
import "datatables.net-colreorder";
import "datatables.net-fixedheader";
import dTable from "../libs/dt";
import ColumnModal from "./column-modal";
import BlockUi from "react-block-ui";
import { Loader, Types } from "react-loaders";
import Link from "next/link";
import Router from "next/router";
import { COMMON_CONSTANT } from "../context/common-context";

class List extends Component {
  constructor(props) {
    super(props);
    this.hideBlocking = this.hideBlocking.bind(this);
    this.forceReload = this.forceReload.bind(this);
    this.cancelAction = this.cancelAction.bind(this);
    this.columnRender;
    this.state = {
      blocking: false,
      ...this.props
    };
  }
  reloadDataTable = url => {
    this.dts.ajax.url(url).load();
  };
  forceReload = async () => {
    let { columnRender } = this.props;

    if (typeof columnRender == "function") {
      columnRender();
    }
  };
  hideBlocking = () => {
    this.setState({ blocking: false });
  };

  reRenderDatatable = () => {
    let { dataTableUrl, columnList, model, fixHeader } = this.props;
    const _this = this;
    if (fixHeader === undefined) {
      fixHeader = true;
    }
    let searchInputs = localStorage.getItem(
      `searchInput-${this.state.menukey}`
    );
    let searchQuery = Router.query;
    let isSearch = false;

    let searchInput = {};

    if (_.size(searchQuery) > 0) {
      searchInput = searchQuery;
      // model.form.sections[0].fields.map((searchItem, i) => {
      //   if (searchQuery[searchItem.key] !== undefined) {
      //     searchInput[searchItem.key] = searchQuery[searchItem.key];
      //   }
      // });
    }
    if (_.size(searchInput) < 1 && searchInputs) {
      searchInputs = JSON.parse(searchInputs);
      searchInput = searchInputs;
      // console.log(searchInputs);
      // model.form.sections[0].fields.map((searchItem, i) => {
      //   if (searchInputs[searchItem.key] !== undefined) {
      //     searchInput[searchItem.key] = searchInputs[searchItem.key];
      //   }
      // });
    }

    if (searchInput) {
      //searchInput = JSON.parse(searchInput);
      // if (dataTableUrl.indexOf(dataTableUrl) > -1) {
      //   let q = queryString.stringify(searchInput);
      //   if (q != "") {
      //     dataTableUrl = `${dataTableUrl}?${q}`;
      //   }
      // }
    } else {
      searchInput = {};
    }
    return new dTable(this, _this, model, columnList, dataTableUrl);
  };

  componentWillReceiveProps(props) {
    if (this.props.dataTableUrl !== props.dataTableUrl) {
      this.reloadDataTable(props.dataTableUrl);
    }
  }
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
      menukey
    } = this.props;
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
        _this.setState({ blocking: true });
      })
      .on("xhr.dt", function(e, settings, json, xhr) {
        if (json && json.recordsTotal) {
          $(".searchRewsultLength").text(json.recordsTotal);
        }

        _this.hideBlocking();
      })
      .on("draw", function(e, settings, json, xhr) {
        $(".datatable tbody tr td:nth-child(n+1)").each(function(i) {
          let html = $(this).html();
          let text = $(this).text();

          //if (text.length > 20) {
          $(this).attr("data-toggle", "tooltip");
          $(this).attr("data-title", text);
          $(this).html(`${html}`);
          //}
        });
        $(".datatable tbody tr td:nth-child(1)").each(function(i) {
          let seq = settings._iDisplayStart + i + 1;
          let html = $(this).html();
          $(this).html(`${html}<div class="row-number">${seq}</div>`);
        });
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
        {/* header - Start */}
        <div className="page__header">
          <div className="row align-items-center justify-content-between justify-content-lg-start m-0">
            <div className="col-2 col-md-1 p-0 d-lg-none" />
            <div className="text-center text-lg-left">
              <h2 className="list">{title}</h2>
            </div>
            <div className="col-2 col-md-1 p-0 text-right">
              <div
                id="btn-toggle-search"
                className="btn-toggle-search d-sm-none"
              >
                <i className="icon icon-search" />
              </div>
            </div>
          </div>
        </div>
        {/* header - End */}
        {/* breadcrumb - Start */}
        {breadcrumbs ? (
          <div className="page__breadcrumb">
            <nav aria-label="breadcrumb">
              <ol className="breadcrumb">
                {breadcrumbs.map((breadcrumb, i) => {
                  if (breadcrumb.url != undefined && breadcrumb.url != "") {
                    return (
                      <li
                        key={i}
                        className={`breadcrumb-item${
                          breadcrumb.active ? " active" : ""
                        }`}
                      >
                        <Link href={`${breadcrumb.url}`}>
                          <a href={`${breadcrumb.url}`}>{breadcrumb.title}</a>
                        </Link>
                      </li>
                    );
                  } else {
                    return (
                      <li
                        key={i}
                        className={`breadcrumb-item${
                          breadcrumb.active ? " active" : ""
                        }`}
                      >
                        {breadcrumb.title}
                      </li>
                    );
                  }
                })}

                {/* <li class="breadcrumb-item active" aria-current="page">Invoice No. : NEGRESIT-001</li> */}
              </ol>
            </nav>
          </div>
        ) : (
          ""
        )}
        {/* breadcrumb - End */}
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

export default List;

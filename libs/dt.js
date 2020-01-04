const queryString = require("query-string");
import { isMobile } from "react-device-detect";
const dTable = (e, _this, res, columns, ajaxUrl, _props, translateLabel) => {
  let aaSorting = [];
  //console.log(columns);
  let desktopcolumnDefs = [];
  let autoWidth = !isMobile;
  if (isMobile) {
    columns.push({
      title: "More",
      className: "control",
      orderable: false
    });

    for (let x in columns) {
      // if (x < 3) {
      //   columns[x].width = (window.width - 50) / 3;
      // }
      columns[x].width = ($(_this.el).width() / 100) * 27 - 40;
      columns[x].displayMode = 3;
      columns[x].orderable = false;
    }
  } else {
    for (let x in columns) {
      if (columns[x].fixWidth) {
        autoWidth = false;
        desktopcolumnDefs.push({
          responsivePriority: x + 1,
          targets: x,
          width: columns[x].width
        });
      }
    }
  }
  if (res.table.sortable == true) {
    if (res.table.sortField) {
      let sortDir = "asc";
      if (res.table.sortOrder) {
        switch (res.table.sortOrder) {
          case "asc":
          case 1:
            sortDir = "asc";
            break;
          case "desc":
          case -1:
            sortDir = "desc";
            break;
        }
      }
      for (let x in res.table.columns) {
        if (
          res.table.columns[x].field == res.table.sortField &&
          res.table.columns[x].sort == true &&
          res.table.columns[x].hidden == false
        ) {
          aaSorting.push([parseInt(x) + 1, sortDir]);
        }
      }
    }
  }
  if ($.fn.dataTable.isDataTable(_this.el)) {
    $(_this.el)
      .DataTable()
      .destroy();
  }
  if (isMobile) {
    $(_this.el).addClass("mobile");
  } else {
    $(_this.el).addClass("desktop");
  }
  if (autoWidth == false) {
    $(_this.el).addClass("fixwidth");
  }
  console.log("location", window.location.href);
  return $(_this.el)
    .DataTable({
      dom:
        '<<"d-none d-sm-flex flex-wrap row justify-content-between align-items-center mb-3"<"col-12 col-lg-6 pr-lg-0 d-none d-lg-flex align-items-center justify-content-center justify-content-lg-start"lp><"col-12 col-lg-6 d-none d-sm-flex flex-wrap justify-content-center justify-content-lg-end align-items-center"<"btn-wrap filter"><"btn-wrap upload"><"btn-wrap create"><"btn-wrap col-display"><"btn-wrap export">>><"table--responsive"t><"row"<"col-12 row-bottom d-flex d-lg-none"p>>>',
      language: {
        lengthMenu: translateLabel
          ? `${translateLabel.show} _MENU_ ${translateLabel.perPage}`
          : "Show _MENU_ Per Page",
        paginate: {
          previous: "<i class='icon icon-arrow_small_left'></i> Previous",
          next: "Next <i class='icon icon-arrow_small_right'></i>",
          decimal: ",",
          thousands: "."
        }
      },
      responsive: isMobile
        ? {
            details: {
              type: "column",
              target: "td:last-child",
              orderable: false
            }
          }
        : false,
      columnDefs: isMobile
        ? [
            {
              responsivePriority: 1,
              targets: 0,
              width: ($(_this.el).width() / 100) * 30 - 10
            },
            {
              responsivePriority: 2,
              targets: 1,
              width: ($(_this.el).width() / 100) * 30 - 10
            },
            {
              responsivePriority: 3,
              targets: 2,
              width: ($(_this.el).width() / 100) * 30 - 10
            },
            {
              responsivePriority: 4,
              targets: -1,
              width: ($(_this.el).width() / 100) * 10
            }
          ]
        : desktopcolumnDefs,
      buttons: ["copyHtml5", "excelHtml5", "pdfHtml5", "csvHtml5"],
      aaSorting,
      aLengthMenu: res.table.pageSizeOptions,
      paging: res.table.paging,
      search: res.table.search,
      ordering: res.table.sortable,
      fixedHeader: !isMobile,
      fixedColumns: false,
      autoWidth: autoWidth,
      stateSave: true,
      stateDuration: -1,
      stateSaveCallback: function(settings, data) {
        var splitUrl = settings.ajax.url.split("api/");
        var storageKey = splitUrl[1];
        console.log("save splitUrl : ", splitUrl);
        delete data.columns;

        localStorage.setItem(
          "B2PTable_" + btoa(storageKey),
          JSON.stringify(data)
        );
      },
      stateLoadCallback: function(settings, callback) {
        var splitUrl = settings.ajax.url.split("api/");
        var storageKey = splitUrl[1];
        console.log("load splitUrl : ", splitUrl);
        return JSON.parse(localStorage.getItem("B2PTable_" + btoa(storageKey)));
      },
      colReorder: false,
      scrollX: !isMobile,
      data: [],
      width: "100%",
      columns,
      //ajax: ajaxUrl,
      ajax: {
        url: ajaxUrl,
        method: "GET",
        data: function(data) {
          if (data.order.length > 0) {
            data.orderBy = data.columns[data.order[0].column].name;
            data.orderDir = data.order[0].dir;
          }

          delete data.columns;
          delete data.order;
          delete data.search;
        }
      },
      serverSide: true,
      processing: true,
      scrollCollapse: !isMobile
    })
    .on("xhr.dt", function(e, settings, json, xhr) {
      var api = new $.fn.dataTable.Api(settings);
      var data = api.ajax.params();
      var url = api.ajax.url().split("?");
      if (url.length == 2) {
        let q = queryString.parse(url[1]);
        for (let x in q) {
          data[x] = q[x];
        }
      }
      let srcQuery = data;
      delete srcQuery.start;
      delete srcQuery.length;
      delete srcQuery.draw;
      // if (srcQuery.order.length > 0) {
      //     srcQuery.orderBy = srcQuery.columns[srcQuery.order[0].column].name;
      //     srcQuery.orderDir = srcQuery.order[0].dir;
      // }

      delete srcQuery.columns;
      delete srcQuery.order;
      delete srcQuery.search;
      if (_props && _props._this) {
        _props._this.setState({
          currentDataTableUrl: queryString.stringify(srcQuery)
        });
        _props._this.setState({ currentDataTableData: srcQuery });
      }

      // if (json && json.data) {
      //   if (json.data.length == 0 && json.recordsTotal > 0) {
      //     console.log("json.recordsTotal", json.data.length);
      //     $(_this.el)
      //       .dataTable()
      //       .fnPageChange("first");
      //   }
      // }
    })
    .on("preXhr.dt", function(e, settings, data) {
      // _this.setState({ blocking: true });
    })
    .on("error", function(e, settings, techNote, message) {
      console.warn("An error has been reported by DataTables: ", message);
    });
};
export default dTable;

export const dLocalTable = (e, _this, res, columns, dData) => {
  if ($.fn.dataTable.isDataTable(_this.el)) {
    $(_this.el)
      .DataTable()
      .destroy();
  }
  return $(_this.el)
    .DataTable({
      dom:
        '<<"d-none d-sm-flex flex-wrap row justify-content-between align-items-center mb-3"<"col-12 col-lg-4 pr-lg-0 d-none d-lg-flex align-items-center justify-content-center justify-content-lg-start"lp><"col-12 col-lg-8 d-none d-sm-flex flex-wrap justify-content-center justify-content-lg-end align-items-center"<"btn-wrap upload"><"btn-wrap create"><"btn-wrap col-display"><"btn-wrap export">>><"table--responsive"t><"row"<"col-12 row-bottom d-flex d-lg-none"p>>>',
      language: {
        lengthMenu: "Show _MENU_ Per Page",
        paginate: {
          previous: "<i class='icon icon-arrow_small_left'></i> Previous",
          next: "Next <i class='icon icon-arrow_small_right'></i>",
          decimal: ",",
          thousands: "."
        }
      },
      responsive: {
        details: {
          type: "column",
          target: "td:last-child"
        }
      },
      buttons: ["copyHtml5", "excelHtml5", "pdfHtml5", "csvHtml5"],
      aLengthMenu: res.table.pageSizeOptions,
      paging: res.table.paging,
      search: res.table.search,
      fixedHeader: false,
      fixedColumns: false,
      autoWidth: false,
      stateSave: false,
      colReorder: false,
      scrollX: true,
      data: dData,
      width: "100%",
      columns,
      serverSide: true,
      processing: true,
      scrollCollapse: true
    })
    .on("error", function(e, settings, techNote, message) {
      console.warn("An error has been reported by DataTables: ", message);
    });
};

import { log } from "util";

import cookie from "js-cookie";
import queryString from "query-string";
import { isMobile } from "react-device-detect";

import ResponseService from "../services/ResponseService";
import { SYSTEM_FAILED } from "../configs/errorMessage.config";

const responseService = new ResponseService();

const getToken = () => {
  return cookie.get("aToken");
};

const dTableCheckbox = (
  e,
  _this,
  res,
  columns,
  ajaxUrl,
  _props,
  externalField = {}
) => {
  console.log("- res from checkboxDt : ", res);
  if (isMobile) {
    var checkboxColumn = {
      title: "Linear ID",
      data: "linearId",
      width: 0,
      orderable: true,
      columnOrder: false,
      name: "linearId",
      visible: true,
      defaultOrder: 1,
      className: "dt-body-center"
    };
    columns.shift(checkboxColumn);
  } else {
    if (columns[0].title !== "Linear ID") {
      var checkboxColumn = {
        title: "Linear ID",
        data: "linearId",
        width: 0,
        orderable: true,
        columnOrder: false,
        name: "linearId",
        visible: true,
        defaultOrder: 1,
        className: "dt-body-center"
      };
      columns.unshift(checkboxColumn);
    }

    // if (isMobile) {
    //   columns.shift(checkboxColumn);
    // } else {
    //   columns.unshift(checkboxColumn);
    // }
  }

  let aaSorting = [];
  if (isMobile) {
    columns.push({
      title: "More",
      className: "control",
      orderable: false,
      width: "10%"
    });
    for (let x in columns) {
      // if (x < 3) {
      //   columns[x].width = (window.width - 50) / 3;
      // }
      columns[x].width = (window.width / 100) * 30;
      columns[x].displayMode = 3;
      columns[x].orderable = false;
    }
  } else {
    for (let x in columns) {
      if (x < 3) {
        columns[x].width = (window.width - 50) / 3;
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
  return $(_this.el)
    .DataTable({
      dom:
        '<<"d-none d-sm-flex flex-wrap row justify-content-between align-items-center mb-3"<"col-12 col-lg-5 pr-lg-0 d-none d-lg-flex align-items-center justify-content-center justify-content-lg-start"lp><"col-12 col-lg-7 d-none d-sm-flex flex-wrap justify-content-center justify-content-lg-end align-items-center"<"btn-wrap filter"><"btn-wrap upload"><"btn-wrap create"><"btn-wrap col-display"><"btn-wrap export">>><"table--responsive no-table-fix"t><"row"<"col-12 row-bottom d-flex d-lg-none"p>>>',
      language: {
        lengthMenu: "Show _MENU_ Per Page",
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
              width: ($(_this.el).width() / 100) * 27 - 60
            },
            {
              responsivePriority: 2,
              targets: 1,
              width: ($(_this.el).width() / 100) * 27 - 60
            },
            {
              responsivePriority: 3,
              targets: 2,
              width: ($(_this.el).width() / 100) * 27 - 60
            },
            {
              responsivePriority: 4,
              targets: -1,
              width: ($(_this.el).width() / 100) * 10
            }
          ]
        : [],
      buttons: ["copyHtml5", "excelHtml5", "pdfHtml5", "csvHtml5"],
      aLengthMenu: res.table.pageSizeOptions,
      paging: res.table.paging,
      search: res.table.search,
      fixedHeader: !isMobile,
      fixedColumns: false,
      autoWidth: !isMobile,
      stateSave: true,
      colReorder: false,
      scrollX: !isMobile,
      data: [],
      width: "100%",
      columns,
      ajax: {
        url: ajaxUrl,
        method: "GET",
        beforeSend: request => {
          const token = getToken();

          request.setRequestHeader("Authorization", `Bearer ${token}`);
        },
        data: data => {
          const { columns, length, order, start } = data;

          data.page = parseInt(start) / parseInt(length) + 1;
          data.pageSize = length;

          if (order.length > 0) {
            data.sortField = columns[order[0].column].name;
            data.sortOrder = order[0].dir === "asc" ? 1 : -1;
          } else {
            data.sortField = columns[0].name;
            data.sortOrder = 1;
          }

          // Remove params not use
          const removeQueryList = [
            "columns",
            "length",
            "order",
            "start",
            "search",
            "draw",
            "_"
          ];

          removeQueryList.forEach(key => {
            delete data[key];
          });
        },
        dataFilter: data => {
          const result = {
            recordsTotal: 0,
            recordsFiltered: 0,
            data: []
          };

          // Set data base on data table format
          if (data) {
            const jsonData = JSON.parse(data);
            let response = {};

            if (_props.apiService) {
              response = _props.apiService.fetchResponse(jsonData);
            }

            if (response.status) {
              result.recordsTotal = response.data.totalRecords;
              result.recordsFiltered = response.data.totalRecords;
              result.data = response.data.rows;
            } else {
              const errorMessagePattern = SYSTEM_FAILED.replace(
                "%m",
                "get data"
              );

              alert(`${errorMessagePattern} ${response.message}`);
            }
          }

          return JSON.stringify(result);
        }
      },
      serverSide: true,
      processing: true,
      scrollCollapse: !isMobile,
      columnDefs: [
        {
          targets: 0,
          data: externalField || externalId,
          // checkboxes: {
          //   selectRow: true
          // }
          // ,
          checkboxes: isMobile
            ? false
            : {
                selectRow: true
              }
        }
      ],
      select: {
        style: "multi"
      },
      aaSorting
      //order: [[1, "asc"]]
    })
    .on("xhr.dt", function(e, settings, json, xhr) {
      const api = new $.fn.dataTable.Api(settings);
      const excelParams = api.ajax.params();
      const url = api.ajax.url().split("?");
      const columns = _props.model.table.columns;

      // Prepare param for export excel
      if (url.length === 2) {
        const query = queryString.parse(url[1]);

        for (let key in query) {
          excelParams[key] = query[key];
        }
      }

      delete excelParams.page;
      delete excelParams.pageSize;

      if (!json || !json.data) return;

      // Set as default data when data from api not return
      json.data = responseService.setDefaultDataByColumnWhenDataIsNull(
        json.data,
        columns
      );

      // Custom data by response config file
      if (_props.configResponseGroup) {
        responseService.setValueByResponseConfigFile(
          json.data,
          _props.configResponseGroup
        );
      }

      // Custom data by callback response
      if (
        _props.callBackResponse &&
        typeof _props.callBackResponse === "function"
      ) {
        json.data = _props.callBackResponse(json.data, columns);
      }

      // Set params for export excel
      if (_props._this) {
        _props._this.setState({
          excelParams: excelParams,
          tableData: json.data
        });
      }
    })
    .on("error", function(e, settings, techNote, message) {
      console.warn("An error has been reported by DataTables: ", message);
    });
};
export default dTableCheckbox;

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

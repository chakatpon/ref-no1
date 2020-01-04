import queryString from "query-string";
import cookie from "js-cookie";
import { isMobile } from "react-device-detect";

import ResponseService from "../services/ResponseService";
import { SYSTEM_FAILED } from "../configs/errorMessage.config";
import _ from "lodash";

const responseService = new ResponseService();

const getToken = () => {
  return cookie.get("aToken");
};

const dTableNew = (e, model, columns, url, props, translateLabel) => {
  const aaSorting = [];

  if ($.fn.dataTable.isDataTable(e.el)) {
    $(e.el)
      .DataTable()
      .destroy();
  }

  if (isMobile) {
    columns.push({
      title: "More",
      className: "control",
      orderable: false,
      width: "10%"
    });

    for (let x in columns) {
      columns[x].width = (window.width / 100) * 30;
      columns[x].displayMode = 3;
      columns[x].orderable = false;
    }
  } else {
    for (let x in columns) {
      columns[x].width = (window.width / 100) * 13;

      if (x < 3) {
        columns[x].width = (window.width / 50) * 3;
      }
    }
  }

  if (model.table.sortable === true) {
    if (model.table.sortField) {
      let sortDir = "asc";
      if (model.table.sortOrder) {
        switch (model.table.sortOrder) {
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

      for (let x in model.table.columns) {
        if (
          model.table.columns[x].field === model.table.sortField &&
          model.table.columns[x].sort === true &&
          model.table.columns[x].hidden === false
        ) {
          aaSorting.push([parseInt(x) + 1, sortDir]);
        }
      }
    }
  }
  if (isMobile) {
    $(e.el).addClass("mobile");
  } else {
    $(e.el).addClass("desktop");
  }
  return $(e.el)
    .DataTable({
      dom:
        '<<" d-sm-flex flex-wrap row justify-content-center align-items-center mb-md-3 mb-lg-3 mb-lx-3"<"col-12 d-none col-lg-6 pr-lg-0 d-lg-flex align-items-center justify-content-center justify-content-lg-start"lp><"col-12 col-lg-6 d-sm-flex flex-wrap justify-content-center justify-content-lg-end align-items-center"<"btn-wrap filter"><"btn-wrap upload"><"btn-wrap create"><"btn-wrap col-display"><"btn-wrap export">>><"table--responsive no-table-fix"t><"row"<"col-12 row-bottom d-flex d-lg-none"p>>>',
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
              width: (window.width / 100) * 30
            },
            {
              responsivePriority: 2,
              targets: 1,
              width: (window.width / 100) * 30
            },
            {
              responsivePriority: 3,
              targets: 2,
              width: (window.width / 100) * 30
            },
            {
              responsivePriority: 4,
              targets: -1,
              width: (window.width / 100) * 10
            }
          ]
        : [],
      buttons: ["copyHtml5", "excelHtml5", "pdfHtml5", "csvHtml5"],
      aLengthMenu: model.table.pageSizeOptions,
      paging: model.table.paging,
      search: model.table.search,
      fixedHeader: !isMobile,
      fixedColumns: false,
      autoWidth: !isMobile,
      stateSave: true,
      stateDuration: -1,
      stateSaveCallback: (settings, data) => {
        delete data.columns;
        localStorage.setItem(
          "B2PTable_" + btoa(window.location.href),
          JSON.stringify(data)
        );
      },
      stateLoadCallback: settings => {
        return JSON.parse(
          localStorage.getItem("B2PTable_" + btoa(window.location.href))
        );
      },
      colReorder: false,
      scrollX: !isMobile,
      data: [],
      width: "100%",
      columns,
      ajax: {
        url: url,
        type: "GET",
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
            const defaultSortFieldList = [
              "externalId",
              "documentNo",
              "documentNumber"
            ];
            const sortField = columns.find(
              column => defaultSortFieldList.indexOf(column.name) !== -1
            );

            data.sortField = "";

            if (sortField) {
              data.sortField = sortField.name;
            }

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

            if (props.apiService) {
              response = props.apiService.fetchResponse(jsonData);
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
      select: {
        style: "multi"
      },
      aaSorting
    })
    .on("xhr.dt", (e, settings, json, xhr) => {
      const api = new $.fn.dataTable.Api(settings);
      const excelParams = api.ajax.params();
      const url = api.ajax.url().split("?");
      const columns = props.model.table.columns;

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

      // Set params for export excel
      if (props._this) {
        props._this.setState({
          excelParams: excelParams,
          recordsTotal: json.recordsTotal
        });
      }

      // Set as default data when data from api not return
      json.data = responseService.setDefaultDataByColumnWhenDataIsNull(
        json.data,
        columns
      );

      // Custom data by response config file
      if (props.configResponseGroup) {
        responseService.setValueByResponseConfigFile(
          json.data,
          props.configResponseGroup
        );
      }

      // Custom data by callback response
      if (
        props.callBackResponse &&
        typeof props.callBackResponse === "function"
      ) {
        json.data = props.callBackResponse(json.data, columns);
      }
    })
    .on("error", (e, settings, techNote, message) => {
      console.warn("An error has been reported by DataTables: ", message);
    });
};

export default dTableNew;

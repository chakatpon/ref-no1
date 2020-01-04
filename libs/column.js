import "jquery";
import _ from "lodash";
import numeral from "numeral/numeral";
import { i18n } from "~/i18n";
import { checkValue } from "~/helpers/app";
export default class ColumnList {
  customFormat = {};

  setCustomFormat(column, callback) {
    this.customFormat[column] = callback;
  }
  initColumns(res) {
    try {
      let lang = "en";
      if (i18n && i18n.language !== undefined) {
        console.log("language", i18n.language);
        lang = i18n.language;
      }

      let columns = [];
      const templates = {};

      if (typeof res != undefined) {
        if (res.form.sections && res.form.sections[0] != undefined) {
          for (let x in res.form.sections[0].fields) {
            let r = res.form.sections[0].fields[x];
            templates[r.key] = r;
          }
        }
        let defaultOrderLength = 0;
        for (let x in res.table.columns) {
          let col = res.table.columns[x];
          if (col.defaultOrder > -1) {
            defaultOrderLength++;
          }
        }
        for (let x in res.table.columns) {
          let col = res.table.columns[x];
          if (col.defaultOrder > -1) {
            if (!col.width) {
              col["width"] = 1190 / defaultOrderLength;
            }
          }
        }
        for (let x in res.table.columns) {
          let col = res.table.columns[x];
          let hidden = false;
          if (col.defaultOrder > -1) {
            hidden = false;
          } else if (col.hidden) {
            hidden = col.hidden;
          }
          hidden = col.hidden;
          let colWidth = col.width || 0;
          let fixWidth = false;
          if (lang == "th" && col.widthTh !== undefined) {
            colWidth = col.widthTh;
            fixWidth = true;
          } else if (lang == "en" && col.widthEn !== undefined) {
            colWidth = col.widthEn;
            fixWidth = true;
          }

          let colopt = {
            title: col.header,
            searchKey: col.searchKey,
            data: col.field,
            requiredColumn: col.requiredColumn || false,
            width: colWidth,
            fixWidth: fixWidth,
            orderable: col.sort ? col.sort : false,
            name: col.sortField ? col.sortField : col.field,
            visible: !hidden,
            defaultOrder: col.defaultOrder,
            displayMode: col.displayMode || 0,
            className: "dt-body-center",
            columnOrder: _.has(col, "columnOrder") ? col.columnOrder : true
          };
          //Check format columns

          if (typeof this.customFormat[col.field] == "function") {
            colopt["render"] = this.customFormat[col.field];
          } else if (typeof this.customFormat[col.field] == "object") {
            colopt = { ...colopt, ...this.customFormat[col.field] };
          } else if (col.type == "date" || col.templateName == "dueDate") {
            colopt["render"] = function(data, type, row) {
              if (
                type === "sort" ||
                type === "type" ||
                data == "" ||
                data == null
              ) {
                return data;
              }

              return checkValue(data) !== null && moment(data).isValid()
                ? moment(data).format(col.pattern)
                : data;
            };
          } else if (col.type == "number") {
            colopt["className"] = "dt-body-right";
            colopt["render"] = function(data, type, row) {
              if (type === "sort" || type === "type") {
                return data;
              }
              if (data === undefined) {
                return "";
              }
              if (data === "") {
                return "";
              }
              let fm = col.pattern || "#,###.00";
              //fm = fm.replace(/#/g, "0");
              return numeral(data).format(fm);
            };
          } else if (col.type == "color") {
            colopt["render"] = function(data, type, row) {
              if (type === "sort" || type === "type" || data == "") {
                return data;
              }
              if (typeof col.colorMap != undefined) {
                let color = col.colorMap[data];
                if (color != undefined) {
                  return (
                    '<span className="status" style="color:' +
                    color +
                    '">' +
                    data +
                    "</span>"
                  );
                }
                return data;
              }
              return data;
            };
          } else {
            colopt["render"] = function(data, type, row) {
              if (data == "" || data == undefined || data == null) {
                data = "";
              }
              return data;
            };
          }

          switch (col.displayMode) {
            case 0:
            case undefined:
              colopt["className"] =
                colopt["className"] + " list-display-normal";
              break;
            case 1:
              colopt["className"] =
                colopt["className"] +
                " list-display-singleline list-display-hidden-over";
              break;
            case 2:
              colopt["className"] =
                colopt["className"] +
                " list-display-singleline list-display-hidden-over list-display-popover";
              break;
            case 3:
              colopt["className"] =
                colopt["className"] + " list-display-multiline";
              break;
          }
          columns.push(colopt);
        }
      }

      return columns;
    } catch (err) {
      return [];
    }
  }
}

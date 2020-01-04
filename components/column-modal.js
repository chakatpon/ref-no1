import React, { Component } from "react";
import Link from "next/link";
import { activePath } from "../libs/activePath";
import classnames from "classnames";
import { COMMON_CONSTANT } from "../context/common-context";
import { i18n, withTranslation } from "~/i18n";

class ColumnModal extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  __hasDefaultColumn(col) {
    if (col.defaultOrder) {
      if (col.requiredColumn == true) {
        return "li fixed";
      } else {
        return "li default";
      }
    } else {
      if (col.requiredColumn == true) {
        return "li fixed";
      } else {
        return "li";
      }
    }
  }
  cancelAction = () => {
    let { cancelAction } = this.props;
    if (typeof cancelAction == "function") {
      cancelAction();
    }
  };
  render() {
    const { t } = this.props;
    var style1 = {
      height: "60vh"
    };
    let { modalId, title, columnList, menukey } = this.props;
    if (menukey == undefined) {
      menukey = "";
    }

    return (
      <div>
        <div
          className="modal fade"
          id={modalId ? modalId : `openColumnDisplay`}
          test="dddddd"
          tabIndex="-1"
          role="dialog"
          aria-hidden="true"
        >
          <div className="modal-dialog modal-lg" role="document">
            <div className="modal-content bg-lightgray mb-3">
              <div className="modal-header">
                <h5 className="modal-title">{t("Column Lists")}</h5>
                <button
                  onClick={this.cancelAction}
                  type="button"
                  className="close"
                  data-dismiss="modal"
                  aria-label="Close"
                >
                  <span aria-hidden="true">&times;</span>
                </button>
              </div>
              <div className={`modal-body column-display-${menukey}`}>
                <div className="row justify-content-center" style={style1}>
                  <div className="col w-45 h-100 pr-0">
                    <div data-force="30" className="lists h-100">
                      <div className="lists__header justify-content-between">
                        <span>{t("Choose Column Display")}</span>
                        <button className="list-btn add-all green">
                          {t("All")} <i className="fa fa-plus" />
                        </button>
                      </div>
                      <ul id="allColumn" className="lists__sortlist">
                        {columnList.map((column, i) => {
                          if (
                            column.visible == false &&
                            column != undefined &&
                            column.columnOrder != false
                          ) {
                            if (column.default) {
                              return (
                                <li
                                  className={this.__hasDefaultColumn(column)}
                                  data-id={i}
                                  id={column.data.replace(
                                    COMMON_CONSTANT.REGEX_ID_HTML,
                                    "_"
                                  )}
                                  data-name={column.title}
                                  key={i}
                                >
                                  <span>{t(column.title)}</span>
                                  <button className="list-btn fixed">
                                    <i className="fa fa-plus" />
                                  </button>
                                </li>
                              );
                            } else {
                              return (
                                <li
                                  className={this.__hasDefaultColumn(column)}
                                  data-id={i}
                                  id={column.data.replace(
                                    COMMON_CONSTANT.REGEX_ID_HTML,
                                    "_"
                                  )}
                                  data-name={column.title}
                                  key={i}
                                >
                                  <span>{t(column.title)}</span>
                                  <button className="list-btn add">
                                    <i className="fa fa-plus" />
                                  </button>
                                </li>
                              );
                            }
                          }
                        })}
                      </ul>
                    </div>
                  </div>
                  <div className="col w-10 p-0 h-100 column-display" />
                  <div className="col w-45 h-100 pl-0">
                    <div data-force="18" className="lists h-100">
                      <div className="lists__header justify-content-between">
                        <span>{t("Current Column Display")}</span>
                      </div>
                      <ul
                        id="currentColumn"
                        className="lists__sortlist sortable"
                      >
                        {columnList.map((column, i) => {
                          if (
                            column.visible == true &&
                            column != undefined &&
                            column.columnOrder != false
                          ) {
                            return (
                              <li
                                className={this.__hasDefaultColumn(column)}
                                data-id={i}
                                id={column.data.replace(
                                  COMMON_CONSTANT.REGEX_ID_HTML,
                                  "_"
                                )}
                                data-name={column.title}
                                key={i}
                              >
                                <span>{t(column.title)}</span>
                                <button className="list-btn remove">
                                  <i className="fa fa-plus" />
                                </button>
                              </li>
                            );
                          }
                        })}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer justify-content-center">
                <button
                  type="button"
                  className="btn btn--transparent btn-wide remove-all"
                >
                  {t("Reset Default")}
                </button>
                <button
                  type="button"
                  className="btn btn--transparent btn-wide"
                  data-dismiss="modal"
                  onClick={this.cancelAction}
                >
                  {t("Cancel")}
                </button>
                <button
                  type="button"
                  className="btn btn-primary btn-save-column btn-wide"
                  data-dismiss="modal"
                >
                  {t("Save")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
export default withTranslation([
  "detail",
  "po-detail",
  "gr-detail",
  "common",
  "menu"
])(ColumnModal);

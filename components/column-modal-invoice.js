import React, { Component } from "react";
import Link from "next/link";
import { activePath } from "../libs/activePath";
import classnames from "classnames";
import { i18n, withTranslation } from "~/i18n";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";
class ColumnModal extends Component {
  constructor(props) {
    super(props);
    this.state = {
      columnList: []
    };
  }

  componentWillReceiveProps(props) {
    this.setState({
      columnList: [...props.columnList]
    });
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
    this.setState({
      columnList: [...this.props.columnList]
    });
  };

  removeColumn = (column, index) => {
    const { columnList } = this.state;
    const newColumnList = columnList.map(item => ({ ...item }));
    newColumnList[index].hidden = true;
    this.setState({
      columnList: newColumnList
    });
  };
  addColumn = (column, index) => {
    const { columnList } = this.state;
    const newColumnList = columnList.map(item => ({ ...item }));
    newColumnList[index].hidden = false;
    this.setState({
      columnList: newColumnList
    });
  };

  addAll = () => {
    const { columnList } = this.state;
    this.setState({
      columnList: columnList.map(column => ({ ...column, hidden: false }))
    });
  };

  onSetDefault = () => {
    let { columnList } = this.state;
    columnList = columnList.map(column => ({
      ...column,
      hidden: !column.defaultOrder
    }));
    columnList = columnList.sort((a, b) => a.defaultOrder - b.defaultOrder);
    this.setState({
      columnList
    });
  };

  onDragEnd = item => {
    const { columnList } = this.state;
    if (item.destination) {
      const dragableIndex = item.source.index;
      const dropableIndex = item.destination.index;
      const newColumnId = item.destination.droppableId;
      const oldColumnId = item.source.droppableId;

      let leftArray = columnList.filter(column => column.hidden);
      let rightArray = columnList.filter(column => !column.hidden);
      let newItem;

      if (newColumnId === oldColumnId && oldColumnId === "droppableRight") {
        newItem = rightArray.splice(dragableIndex, 1);
        rightArray.splice(dropableIndex, 0, ...newItem);
      }
      this.setState({
        columnList: [...rightArray, ...leftArray]
      });
    }
  };

  onSave = () => {
    const { columnList } = this.state;
    this.props.onSave(columnList);
  };

  getStyle = (style, snapshot, id) => {
    if (!snapshot.isDropAnimating) {
      return {
        ...style,
        left: "none"
      };
    }
    const { moveTo, curve, duration } = snapshot.dropAnimation;
    const translate = `translate(${moveTo.x}px, ${moveTo.y - 25}px)`;
    return {
      ...style,
      transform: `${translate}`,
      left: "none",
      transition: `all ${curve} ${duration + 1}s`
    };
  };

  render() {
    const { t } = this.props;
    var style1 = {
      height: "60vh"
    };
    let { modalId, title, menukey } = this.props;
    const { columnList } = this.state;
    if (menukey == undefined) {
      menukey = "3wm";
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
          data-backdrop="static"
          data-keyboard="false"
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
              <DragDropContext onDragEnd={this.onDragEnd}>
                <div className={`modal-body column-display-${menukey}`}>
                  <div className="row justify-content-center" style={style1}>
                    <div className="col w-45 h-100 pr-0">
                      <div data-force="30" className="lists h-100">
                        <div className="lists__header justify-content-between">
                          <span>{t("Choose Column Display")}</span>
                          <button
                            className="list-btn add-all green"
                            onClick={this.addAll}
                          >
                            All <i className="fa fa-plus" />
                          </button>
                        </div>
                        <ul id="allColumn" className="lists__sortlist">
                          {columnList.map((column, i) => {
                            if (
                              !column.hidden == false &&
                              column != undefined
                            ) {
                              if (column.default) {
                                return (
                                  <li
                                    className={this.__hasDefaultColumn(column)}
                                    data-id={i}
                                    // id={column.data.replace(/\./g, "_")}
                                    data-name={column.header}
                                    key={i}
                                  >
                                    <span>{column.header}</span>
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
                                    // id={column.data.replace(/\./g, "_")}
                                    data-name={column.header}
                                    key={i}
                                  >
                                    <span>{column.header}</span>
                                    <button
                                      className="list-btn add"
                                      onClick={e => this.addColumn(column, i)}
                                    >
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
                        <Droppable droppableId="droppableRight">
                          {(provided, snapshot) => (
                            <ul
                              id="currentColumn"
                              className="lists__sortlist sortable"
                              ref={provided.innerRef}
                            >
                              {columnList.map((column, i) => {
                                if (
                                  !column.hidden == true &&
                                  column != undefined
                                ) {
                                  return (
                                    <Draggable
                                      key={i}
                                      draggableId={"drag" + column.header}
                                      index={i}
                                    >
                                      {(provided, snapshot) => (
                                        <li
                                          ref={provided.innerRef}
                                          {...provided.draggableProps}
                                          {...provided.dragHandleProps}
                                          className={this.__hasDefaultColumn(
                                            column
                                          )}
                                          data-id={i}
                                          data-name={column.header}
                                          key={i}
                                          style={this.getStyle(
                                            provided.draggableProps.style,
                                            snapshot
                                          )}
                                        >
                                          <span>{column.header}</span>
                                          {column.requiredColumn ? (
                                            <button className="list-btn remove">
                                              <i className="fa fa-plus" />
                                            </button>
                                          ) : (
                                            <button
                                              className="list-btn remove"
                                              onClick={e =>
                                                this.removeColumn(column, i)
                                              }
                                            >
                                              <i className="fa fa-plus" />
                                            </button>
                                          )}
                                        </li>
                                      )}
                                    </Draggable>
                                  );
                                }
                              })}
                            </ul>
                          )}
                        </Droppable>
                      </div>
                    </div>
                  </div>
                </div>
              </DragDropContext>
              <div className="modal-footer justify-content-center">
                <button
                  type="button"
                  className="btn btn--transparent btn-wide remove-all"
                  onClick={this.onSetDefault}
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
                  onClick={this.onSave}
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
export default withTranslation(["detail", "invoice-detail", "common", "menu"])(
  ColumnModal
);

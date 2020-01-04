import React, { Component, Fragment } from "react";
import Modal from "react-bootstrap4-modal";
import Router from "next/router";
export const BTN_ACTION_CLOSE = [
  {
    label: "Close",
    attribute: {
      className: "btn btn--transparent btn-wide",
      onClick: () => {}
    }
  }
];
export const BTN_ACTION_BACK = [
  {
    label: "Back",
    attribute: {
      className: "btn btn--transparent btn-wide",
      onClick: () => {
        Router.back();
      }
    }
  }
];
export const BTN_ACTION_OK = [
  {
    label: "OK",
    attribute: {
      className: "btn btn--transparent btn-wide",
      onClick: () => {}
    }
  }
];
class ModalAlert extends Component {
  render() {
    const {
      children,
      button,
      title,
      visible,
      onClickBackdrop,
      isTextOnly,
      isHeaderCenter,
      hideHeader,
      hideFooter,
      modalSize,
      footer
    } = this.props;
    if (isTextOnly) {
      return (
        <Fragment>
          {typeof window != "undefined" ? (
            <Modal visible={visible}>
              <div className={`modal-header ${hideHeader ? "d-none" : ""}`}>
                <h5
                  className={`modal-title w-100 ${
                    isHeaderCenter ? "text-center" : ""
                  }`}
                >
                  {title}
                </h5>
              </div>
              <div className="modal-body text-center">
                <div className="text">{children}</div>
              </div>
              <div
                className={`modal-footer justify-content-center ${
                  hideFooter ? "d-none" : ""
                }`}
              >
                {typeof button == "object"
                  ? button.map((btn, i) => {
                      btn.attribute = btn.attribute || [];
                      btn.label = btn.label || "LABEL";
                      return (
                        <button key={i} {...btn.attribute}>
                          {btn.label}
                        </button>
                      );
                    })
                  : ""}
              </div>
            </Modal>
          ) : (
            ""
          )}
        </Fragment>
      );
    } else {
      return (
        <Fragment>
          {typeof window != "undefined" ? (
            <Modal visible={visible} dialogClassName={`${modalSize}`}>
              <div className={`modal-header ${hideHeader ? "d-none" : ""}`}>
                <h5
                  className={`modal-title w-100 ${
                    isHeaderCenter ? "text-center" : ""
                  }`}
                >
                  {title}
                </h5>
              </div>
              <div className="modal-body">{children}</div>
              <div
                className={`modal-footer justify-content-center ${
                  hideFooter ? "d-none" : ""
                }`}
              >
                {footer}
                {typeof button == "object"
                  ? button.map((btn, i) => {
                      btn.attribute = btn.attribute || [];
                      btn.label = btn.label || "LABEL";
                      return (
                        <button
                          key={i}
                          {...btn.attribute}
                          style={
                            (btn.attribute.disabled && {
                              backgroundImage: "none",
                              backgroundColor: "#a9abad"
                            }) ||
                            {}
                          }
                        >
                          {btn.label}
                        </button>
                      );
                    })
                  : ""}
              </div>
            </Modal>
          ) : (
            ""
          )}
        </Fragment>
      );
    }
  }
}

export default ModalAlert;

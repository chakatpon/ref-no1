import React, { Component, Fragment } from "react";
import Modal from "react-bootstrap4-modal";
import BlockUi from "react-block-ui";
import DatePicker from "react-datepicker";
import { withTranslation } from "~/i18n";
class ModalDelivery extends Component {
  constructor(props) {
    super(props);
    this.handleDateChange = this.handleDateChange.bind(this);
    this.handleHourChange = this.handleHourChange.bind(this);
    this.handleMinuteChange = this.handleMinuteChange.bind(this);
    this.handleReasonChange = this.handleReasonChange.bind(this);
    this.state = {
      ...this.props,
      startDate: undefined,
      hour: "",
      minute: "",
      reason: ""
    };
    this.handleDateChange = this.handleDateChange.bind(this);
  }
  handleDateChange(date) {
    $("#proposeDeliveryDateLabel").addClass("action-label-input");
    this.setState({ startDate: date });
    this.props.setProposeDate(date);
  }
  handleHourChange(event) {
    this.props.setProposeTime(event.target.value, "hour");
  }
  handleMinuteChange(event) {
    this.props.setProposeTime(event.target.value, "minute");
  }
  handleReasonChange(text) {
    this.props.setProposeReason(text);
  }
  formatCurrency = (amount, digit) => {
    return Intl.NumberFormat("th-TH", {
      useGrouping: true,
      minimumFractionDigits: digit,
      maximumFractionDigits: digit
    }).format(amount);
  };
  clearModalInputs = () => {
    $("#proposeDeliveryDate").val("");
    $("#hour").val("");
    $("#min").val("");
    $("#reason").val("");
    this.setState({ startDate: "" });
  };
  componentWillReceiveProps(nextProps) {
    if (nextProps.visible === false) {
      this.clearModalInputs();
    }
  }
  render() {
    const { type, visible, data, button, t } = this.props;
    const _this = this;
    console.log("data", data);
    if (type === "proposeDetail") {
      return (
        <BlockUi>
          <Fragment>
            {typeof window != "undefined" ? (
              <Modal visible={visible}>
                <div className="modal-header">
                  <h3 id="myModalLabel">
                    {t("Detail")} ({t("PO No")} {data && data.poNumber})
                  </h3>
                </div>
                <div className="modal-body d-flex flex-wrap noborder">
                  <div className="col-12 d-flex flex-wrap">
                    <div className="col border-bottom border-1px border-gray">
                      <p className="lightgray mb-0">{t("Item No")}</p>
                      <p className="mb-2">{data && data.poItemNo}</p>
                    </div>
                    <div className="col border-bottom border-1px border-gray">
                      <p className="lightgray mb-0">{t("QTY")}</p>
                      <p className="mb-2">
                        {data &&
                          this.formatCurrency(data.quantity.remaining, 3)}
                      </p>
                    </div>
                    <div className="col border-bottom border-1px border-gray">
                      <p className="lightgray mb-0">{t("Unit")}</p>
                      <p className="mb-2">{data && data.unitDescription}</p>
                    </div>
                  </div>
                  <div className="col-12 d-flex flex-wrap mt-3">
                    <div className="col-12 px-0 d-flex flex-wrap">
                      <div className="col-5 text-right">
                        {t("Material No")} :{" "}
                      </div>
                      <div className="col-7">{data && data.materialNumber}</div>
                    </div>
                    <div className="col-12 px-0 d-flex flex-wrap">
                      <div className="col-5 text-right">
                        {t("Material Description")} :{" "}
                      </div>
                      <div className="col-7">
                        {data && data.materialDescription}
                      </div>
                    </div>
                    <div className="col-12 px-0 d-flex flex-wrap">
                      <div className="col-5 text-right">{t("Site")} : </div>
                      <div className="col-7">{data && data.site}</div>
                    </div>
                    <div className="col-12 px-0 d-flex flex-wrap">
                      <div className="col-5 text-right">
                        {t("Site Description")} :{" "}
                      </div>
                      <div className="col-7">
                        {data && data.siteDescription}
                      </div>
                    </div>
                  </div>
                  <div className="col-12 d-flex flex-wrap mt-3">
                    <div className="col-12 px-0 d-flex flex-wrap">
                      <div className="col-5 text-right">
                        {t("Original Delivery Date")} :{" "}
                      </div>
                      <div className="col-7">
                        {data && data.initialDeliveryDate
                          ? moment(data.initialDeliveryDate).format(
                              "DD/MM/YYYY HH:mm"
                            )
                          : "-"}
                      </div>
                    </div>
                    <div className="col-12 px-0 d-flex flex-wrap">
                      <div className="col-5 text-right">
                        {t("Proposed Delivery Date")} :{" "}
                      </div>
                      <div className="col-7">
                        {data && data.proposedRevisedDeliveryDate
                          ? moment(data.proposedRevisedDeliveryDate).format(
                              "DD/MM/YYYY HH:mm"
                            )
                          : "-"}
                      </div>
                    </div>
                    <div className="col-12 px-0 d-flex flex-wrap">
                      <div className="col-5 text-right">
                        {t("Effective Delivery Date")} :{" "}
                      </div>
                      <div className="col-7">
                        {data && data.expectedDeliveryDate
                          ? moment(data.expectedDeliveryDate).format(
                              "DD/MM/YYYY HH:mm"
                            )
                          : "-"}
                      </div>
                    </div>
                    {data && data.revisedReason ? (
                      <div className="col-12 pb-3 border-bottom border-1px border-lightgray">
                        <p>
                          {t("Reason")}: {data && data.revisedReason}
                        </p>
                      </div>
                    ) : (
                      ""
                    )}
                  </div>
                </div>
                <div className="modal-footer justify-content-center">
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
        </BlockUi>
      );
    } else if (type === "confirmDetail") {
      return (
        <BlockUi>
          <Fragment>
            {typeof window != "undefined" ? (
              <Modal visible={visible}>
                <div className="modal-header">
                  <h3 id="myModalLabel">
                    {t("Detail")} ({t("PO No")} {data && data.poNumber})
                  </h3>
                </div>
                <div className="modal-body d-flex flex-wrap noborder">
                  <div className="col-12 d-flex flex-wrap">
                    <div className="col border-bottom border-1px border-gray">
                      <p className="lightgray mb-0">{t("Item No")}</p>
                      <p className="mb-2">{data && data.poItemNo}</p>
                    </div>
                    <div className="col border-bottom border-1px border-gray">
                      <p className="lightgray mb-0">{t("QTY")}</p>
                      <p className="mb-2">
                        {data &&
                          this.formatCurrency(data.quantity.remaining, 3)}
                      </p>
                    </div>
                    <div className="col border-bottom border-1px border-gray">
                      <p className="lightgray mb-0">{t("Unit")}</p>
                      <p className="mb-2">{data && data.unitDescription}</p>
                    </div>
                  </div>

                  <div className="col-12 d-flex flex-wrap mt-3">
                    <div className="col-12 px-0 d-flex flex-wrap">
                      <div className="col-5 text-right">
                        {t("Material No")} :{" "}
                      </div>
                      <div className="col-7">{data && data.materialNumber}</div>
                    </div>
                    <div className="col-12 px-0 d-flex flex-wrap">
                      <div className="col-5 text-right">
                        {t("Material Description")} :{" "}
                      </div>
                      <div className="col-7">
                        {data && data.materialDescription}
                      </div>
                    </div>
                    <div className="col-12 px-0 d-flex flex-wrap">
                      <div className="col-5 text-right">{t("Site")} : </div>
                      <div className="col-7">{data && data.site}</div>
                    </div>
                    <div className="col-12 px-0 d-flex flex-wrap">
                      <div className="col-5 text-right">
                        {t("Site Description")} :{" "}
                      </div>
                      <div className="col-7">
                        {data && data.siteDescription}
                      </div>
                    </div>
                  </div>

                  <div className="col-12 d-flex flex-wrap mt-3">
                    <div className="col-12 px-0 d-flex flex-wrap">
                      <div className="col-5 text-right">
                        {t("Original Delivery Date")} :{" "}
                      </div>
                      <div className="col-7">
                        {data &&
                          moment(data.initialDeliveryDate).format(
                            "DD/MM/YYYY HH:mm"
                          )}
                      </div>
                    </div>
                    <div className="col-12 px-0 d-flex flex-wrap">
                      <div className="col-5 text-right">
                        {t("Proposed Delivery Date")} :{" "}
                      </div>
                      <div className="col-7">
                        {data && data.proposedRevisedDeliveryDate
                          ? moment(data.proposedRevisedDeliveryDate).format(
                              "DD/MM/YYYY HH:mm"
                            )
                          : "-"}
                      </div>
                    </div>
                    <div className="col-12 px-0 d-flex flex-wrap">
                      <div className="col-5 text-right">
                        {t("Effective Delivery Date")} :{" "}
                      </div>
                      <div className="col-7">
                        {data && data.expectedDeliveryDate
                          ? moment(data.expectedDeliveryDate).format(
                              "DD/MM/YYYY HH:mm"
                            )
                          : "-"}
                      </div>
                    </div>
                  </div>

                  {data && data.revisedReason ? (
                    <div className="col-12 pb-3 border-bottom border-1px border-lightgray">
                      <p>
                        {t("Reason")}: {data && data.revisedReason}
                      </p>
                    </div>
                  ) : (
                    ""
                  )}
                </div>
                <div className="modal-footer justify-content-center noborder">
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
        </BlockUi>
      );
    } else if (type === "propose") {
      return (
        <BlockUi>
          <Fragment>
            {typeof window != "undefined" ? (
              <Modal visible={visible}>
                <div className="modal-header">
                  <h3 id="myModalLabel">
                    {t("Propose")} ({t("PO No")} {data && data.poNumber})
                  </h3>
                </div>
                <div className="modal-body d-flex flex-wrap noborder">
                  <div className="col-12 d-flex flex-wrap px-0 px-lg-3">
                    <div className="col border-bottom border-1px border-gray">
                      <p className="lightgray mb-0">{t("Item No")}</p>
                      <p className="mb-2">{data && data.poItemNo}</p>
                    </div>
                    <div className="col border-bottom border-1px border-gray">
                      <p className="lightgray mb-0">{t("QTY")}</p>
                      <p className="mb-2">
                        {data &&
                          this.formatCurrency(data.quantity.remaining, 3)}
                      </p>
                    </div>
                    <div className="col border-bottom border-1px border-gray">
                      <p className="lightgray mb-0">{t("Unit")}</p>
                      <p className="mb-2">{data && data.unitDescription}</p>
                    </div>
                  </div>

                  <div className="col-12 d-flex flex-wrap mt-3 px-0 px-lg-3">
                    <div className="col-12 px-0 d-flex flex-wrap">
                      <div className="col-6 col-lg-5 text-right pl-0 pl-lg-3 pr-1 pr-lg-3">
                        {t("Material No")} :{" "}
                      </div>
                      <div className="col-6 col-lg-7 pl-2 pl-lg-3">
                        {data && data.materialNumber}
                      </div>
                    </div>
                    <div className="col-12 px-0 d-flex flex-wrap">
                      <div className="col-6 col-lg-5 text-right pl-0 pl-lg-3 pr-1 pr-lg-3">
                        {t("Material Description")} :{" "}
                      </div>
                      <div className="col-6 col-lg-7 pl-2 pl-lg-3 word-wrap">
                        {data && data.materialDescription}
                      </div>
                    </div>
                    <div className="col-12 px-0 d-flex flex-wrap">
                      <div className="col-6 col-lg-5 text-right pl-0 pl-lg-3 pr-1 pr-lg-3">
                        {t("Site")} :{" "}
                      </div>
                      <div className="col-6 col-lg-7 pl-2 pl-lg-3">
                        {data && data.site}
                      </div>
                    </div>
                    <div className="col-12 px-0 d-flex flex-wrap">
                      <div className="col-6 col-lg-5 text-right pl-0 pl-lg-3 pr-1 pr-lg-3">
                        {t("Site Description")} :{" "}
                      </div>
                      <div className="col-6 col-lg-7 pl-2 pl-lg-3">
                        {data && data.siteDescription}
                      </div>
                    </div>
                  </div>

                  <div className="col-12 d-flex flex-wrap px-0 px-lg-3">
                    <div className="col-12 px-0 d-flex flex-wrap">
                      <div className="col-6 col-lg-5 text-right pl-0 pl-lg-3 pr-1 pr-lg-3">
                        {t("Original Delivery Date")} :{" "}
                      </div>
                      <div className="col-6 col-lg-7 pl-2 pl-lg-3">
                        {data &&
                          moment(data.initialDeliveryDate).format(
                            "DD/MM/YYYY HH:mm"
                          )}
                      </div>
                    </div>
                    <div className="col-12 px-0 d-flex flex-wrap pb-2">
                      <div className="col-6 col-lg-5 text-right pl-0 pl-lg-3 pr-1 pr-lg-3">
                        {t("Effective Delivery Date")} :{" "}
                      </div>
                      <div className="col-6 col-lg-7 pl-2 pl-lg-3">
                        {data && data.expectedDeliveryDate
                          ? moment(data.expectedDeliveryDate).format(
                              "DD/MM/YYYY HH:mm"
                            )
                          : "-"}
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-lg-6 px-0 pr-lg-1 pb-3 pb-lg-1">
                    <div className="form-group mb-0">
                      <div className="form-label-group fix-w100">
                        <DatePicker
                          selected={this.state.startDate}
                          value={this.state.startDate}
                          onChange={this.handleDateChange}
                          showMonthDropdown
                          showYearDropdown
                          dateFormat="dd/MM/yyyy"
                          minDate={new Date()}
                          id="proposeDeliveryDate"
                          className="form-control"
                        />
                        <label
                          htmlFor="proposeDeliveryDate"
                          id="proposeDeliveryDateLabel"
                        >
                          {t("Proposed Delivery Date")}
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 col-lg-6 d-flex flex-wrap px-0 pl-lg-1 pb-3 pb-lg-2">
                    <div className="form-group col-6 px-0 mb-0 d-flex">
                      <div className="form-label-group col-12 px-0 align-self-stretch">
                        <select
                          id="hour"
                          name="hour"
                          className="custom-select input-search"
                          onChange={this.handleHourChange}
                        >
                          <option value="" selected disabled>
                            {t("Hour")}
                          </option>
                          <option value="00">00</option>
                          <option value="01">01</option>
                          <option value="02">02</option>
                          <option value="03">03</option>
                          <option value="04">04</option>
                          <option value="05">05</option>
                          <option value="06">06</option>
                          <option value="07">07</option>
                          <option value="08">08</option>
                          <option value="09">09</option>
                          <option value="10">10</option>
                          <option value="11">11</option>
                          <option value="12">12</option>
                          <option value="13">13</option>
                          <option value="14">14</option>
                          <option value="15">15</option>
                          <option value="16">16</option>
                          <option value="17">17</option>
                          <option value="18">18</option>
                          <option value="19">19</option>
                          <option value="20">20</option>
                          <option value="21">21</option>
                          <option value="22">22</option>
                          <option value="23">23</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group col-6 px-0 mb-0 d-flex">
                      <div className="form-label-group col-12 px-0 align-self-stretch">
                        <select
                          id="min"
                          name="min"
                          className="custom-select input-search"
                          onChange={this.handleMinuteChange}
                        >
                          <option value="" selected disabled>
                            {t("Min")}
                          </option>
                          <option value="00">00</option>
                          <option value="30">30</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="col-12 mt-1 text-center px-0 px-lg-3">
                    <div className="form-group">
                      <div className="form-label-group">
                        <textarea
                          name="reason"
                          id="reason"
                          placeholder={`${t("Reason")} *`}
                          className="form-control"
                          onChange={e => {
                            if (e.target.value === "") {
                              $(".proposeButton").addClass("btn-disabled");
                              _this.props.setProposeButtonDisabled(true);
                            } else {
                              $(".proposeButton").removeClass("btn-disabled");
                              $(".proposeButton").removeAttr("style");
                              _this.props.setProposeButtonDisabled(false);
                            }
                          }}
                          onBlur={e => {
                            this.handleReasonChange(e.target.value);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-footer justify-content-center noborder">
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
        </BlockUi>
      );
    } else if (type === "confirm") {
      return (
        <BlockUi>
          <Fragment>
            {typeof window != "undefined" ? (
              <Modal visible={visible}>
                <div className="modal-header">
                  <h3 id="myModalLabel">
                    {t("Confirm")} ({t("PO No")} {data && data.poNumber})
                  </h3>
                </div>
                <div className="modal-body d-flex flex-wrap noborder">
                  <div className="col-12 d-flex flex-wrap">
                    <div className="col border-bottom border-1px border-gray">
                      <p className="lightgray mb-0">{t("Item No")}</p>
                      <p className="mb-2">{data && data.poItemNo}</p>
                    </div>
                    <div className="col border-bottom border-1px border-gray">
                      <p className="lightgray mb-0">{t("QTY")}</p>
                      <p className="mb-2">
                        {data &&
                          this.formatCurrency(data.quantity.remaining, 3)}
                      </p>
                    </div>
                    <div className="col border-bottom border-1px border-gray">
                      <p className="lightgray mb-0">{t("Unit")}</p>
                      <p className="mb-2">{data && data.unitDescription}</p>
                    </div>
                  </div>

                  <div className="col-12 d-flex flex-wrap mt-3">
                    <div className="col-12 px-0 d-flex flex-wrap">
                      <div className="col-5 text-right">
                        {t("Material No")} :{" "}
                      </div>
                      <div className="col-7">{data && data.materialNumber}</div>
                    </div>
                    <div className="col-12 px-0 d-flex flex-wrap">
                      <div className="col-5 text-right">
                        {t("Material Description")} :{" "}
                      </div>
                      <div className="col-7">
                        {data && data.materialDescription}
                      </div>
                    </div>
                    <div className="col-12 px-0 d-flex flex-wrap">
                      <div className="col-5 text-right">{t("Site")} : </div>
                      <div className="col-7">{data && data.site}</div>
                    </div>
                    <div className="col-12 px-0 d-flex flex-wrap">
                      <div className="col-5 text-right">
                        {t("Site Description")} :{" "}
                      </div>
                      <div className="col-7">
                        {data && data.siteDescription}
                      </div>
                    </div>
                  </div>

                  <div className="col-12 d-flex flex-wrap mt-3">
                    <div className="col-12 px-0 d-flex flex-wrap">
                      <div className="col-5 text-right">
                        {t("Original Delivery Date")} :{" "}
                      </div>
                      <div className="col-7">
                        {data &&
                          moment(data.initialDeliveryDate).format(
                            "DD/MM/YYYY HH:mm"
                          )}
                      </div>
                    </div>
                    <div className="col-12 px-0 d-flex flex-wrap">
                      <div className="col-5 text-right">
                        {t("Proposed Delivery Date")} :{" "}
                      </div>
                      <div className="col-7">
                        <strong>
                          {data &&
                            moment(data.proposedRevisedDeliveryDate).format(
                              "DD/MM/YYYY HH:mm"
                            )}
                        </strong>
                      </div>
                    </div>
                    <div className="col-12 px-0 d-flex flex-wrap">
                      <div className="col-5 text-right">
                        {t("Effective Delivery Date")} :{" "}
                      </div>
                      <div className="col-7">
                        {data && data.expectedDeliveryDate
                          ? moment(data.expectedDeliveryDate).format(
                              "DD/MM/YYYY HH:mm"
                            )
                          : "-"}
                      </div>
                    </div>
                  </div>

                  <div className="col-12 pb-3 border-bottom border-1px border-lightgray">
                    <p>
                      {t("Reason")}: {data && data.revisedReason}
                    </p>
                  </div>

                  <div className="col-12 mt-3 text-center">
                    <p>
                      Do you want to confirm proposed delivery date
                      <br />
                      on{" "}
                      {data &&
                        moment(data.proposedRevisedDeliveryDate).format(
                          "DD/MM/YYYY HH:mm"
                        )}
                      ?
                    </p>
                  </div>
                </div>
                <div className="modal-footer justify-content-center noborder">
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
        </BlockUi>
      );
    } else {
      return "";
    }
  }
}

export default withTranslation(["po-delivery-list"])(ModalDelivery);

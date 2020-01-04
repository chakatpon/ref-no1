import React from "react";
import Router from "next/router";
import moment from "moment";
import api from "../../libs/api";
import PendingPopover from "./pendingPopover";
import { withTranslation } from "~/i18n";

import BlockUi from "react-block-ui";
class GoodReceivedPendingInvoices extends React.Component {
  constructor(props) {
    super(props);
    this.apis = new api(this.props.domain).group("dashboard");
    this.state = {
      loading: false,
      outOfDateArray: [],
      automergeStatistic: {}
    };
  }

  goToGR = outOfDate => {
    const postingDateFrom = moment()
      .subtract(outOfDate.endDate, "day")
      .startOf("day")
      .format("DD/MM/YYYY");
    const postingDateTo = moment()
      .subtract(outOfDate.startDate, "day")
      .startOf("day")
      .format("DD/MM/YYYY");
    window.localStorage.setItem(
      "searchInput-gr",
      JSON.stringify({
        postingDateFrom,
        postingDateTo,
        hasSiblingLinearId: false,
        movementClass: "NORMAL"
      })
    );
    Router.push("/good-receives");
  };

  async componentDidMount() {
    this.setState({
      loading: true
    });
    try {
      const grPendingConfig = await this.apis.call("grPendingConfig", {
        configOption: "PERIOD_GR_PENDING_INVOICE"
      });
      const grPending = await this.apis.call("grPending", {
        movementClass: "NORMAL",
        groupBy: "daysWithoutInvoice"
      });
      if (!grPending.data) {
        grPending.data = [];
      }
      if (grPendingConfig.length > 0) {
        const config = grPendingConfig[0];
        const dayValue = config.value.split(",");

        let outOfDateArray = dayValue.map((value, index) => {
          let obj = {};
          let dataPending = grPending.data.filter(data => data.key === value);
          if (dataPending.length) {
            obj.countTotal = dataPending[0].countTotal;
            obj.dataValue =
              dataPending[0].amountTotal && dataPending[0].amountTotal.quantity
                ? dataPending[0].amountTotal.quantity *
                  dataPending[0].amountTotal.displayTokenSize
                : 0;
          } else {
            obj.countTotal = 0;
            obj.dataValue = 0;
          }
          if (index === 0) {
            obj = {
              ...obj,
              key: value,
              value: `0 - ${value}`,
              startDate: 0,
              endDate: parseInt(value)
            };
          } else if (index === dayValue.length - 1) {
            const startDate = parseInt(dayValue[index - 1]);
            const endDate = parseInt(dayValue[index]);
            obj = {
              ...obj,
              key: value,
              value: `> ${startDate}`,
              startDate: startDate + 1,
              endDate
            };
          } else {
            const startDate = parseInt(dayValue[index - 1]);
            obj = {
              ...obj,
              key: value,
              value: `${startDate + 1} - ${value}`,
              startDate: startDate + 1,
              endDate: parseInt(value)
            };
          }
          return obj;
        });
        this.setState({
          outOfDateArray
        });
      }
    } catch (e) {
      console.log("error", e);
    }
    this.setState({
      loading: false
    });
  }

  formatNumber = number => {
    return Intl.NumberFormat("th-TH").format(number);
  };

  formatCurrency = number => {
    if (number > 1000000) {
      return (number / 1000000).toFixed(2) + " M";
    } else if (number > 1000) {
      return (number / 1000).toFixed(2) + " K";
    } else {
      return number;
    }
  };

  render() {
    const { t } = this.props;
    return (
      <BlockUi blocking={this.state.loading}>
        <div className="box__header box__header--shadow px-0 py-0">
          <div className="d-flex flex-wrap justify-content-between pt-2">
            <div className="col">
              <h5 className="gray-1">{t("Goods Receipt Pending Invoice")}</h5>
            </div>
          </div>
        </div>

        <div className="box__inner px-3">
          <div className="graph d-flex flex-wrap">
            <div className="header col-12 col-lg-2">
              <p className="small c-lightgray text-sm-center text-md-center text-lg-left">
                {t("QTY")}
              </p>
              <p className="d-none d-lg-block">&nbsp;</p>
              <p className="small c-lightgray d-none d-lg-block">
                {t("Without INV")}
                <br />
                {t("(Day)")}
              </p>
            </div>

            {/* <!-- Graph slot - Start --> */}
            {this.state.outOfDateArray.map(outOfDate => {
              return (
                <div
                  className="col px-0"
                  key={outOfDate.value}
                  onClick={() => this.goToGR(outOfDate)}
                >
                  <p className="text-center mb-0">
                    <strong>{this.formatCurrency(outOfDate.countTotal)}</strong>
                  </p>
                  {/* <a
                                        href="javascript:void(0);"
                                        className="graph-item"
                                        data-toggle="tooltip"
                                        data-placement="top"
                                        title={this.formatNumber(outOfDate.dataValue)}
                                    >
                                        &nbsp;
              </a> */}
                  <PendingPopover
                    value={this.formatNumber(outOfDate.dataValue)}
                    hideTooltip={true}
                  />
                  <p className="small c-lightgray text-center">
                    {outOfDate.value}
                  </p>
                </div>
              );
            })}
            {/* <!-- Graph slot - End --> */}

            <div className="footer col-12 d-block d-lg-none">
              <p className="small c-lightgray text-center">
                {t("Without INV (Day)")}
              </p>
            </div>

            {/* <!-- Graph Background - Start --> */}
            <div className="graph-background">&nbsp;</div>
            {/* <!-- Graph Background - End --> */}
          </div>
        </div>
      </BlockUi>
    );
  }
}

export default withTranslation(["dashboard", "common", "menu"])(GoodReceivedPendingInvoices);

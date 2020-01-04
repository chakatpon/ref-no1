import React from "react";
import api from "../../libs/api";
import SelectDatePopover, { dateCalculator } from "./selectDatePopover";
import moment from "moment";
import BlockUi from "react-block-ui";
import { withTranslation } from "~/i18n";
import StatisticPopover from "./statisticPopover";
class DashboardStatistic extends React.Component {
  constructor(props) {
    super(props);
    this.apis = new api(this.props.domain).group("dashboard");
    this.NAME = "dashboardStatisticDate";
    const { t } = this.props;
    this.state = {
      invoiceStatistic: {
        unit: "Of Invoices"
      },
      automergeStatistic: {
        unit: "Of Auto Matched"
      },
      umatchStatistic: {
        unit: "Of Unmatched"
      },
      poStatistic: {
        unit: "Of Purchase Orders"
      },
      grStatistic: {
        unit: "Of Goods Receipt"
      },
      loading: false,
      date: {
        name: "Today",
        value: {
          from: moment()
            .startOf("day")
            .format("DD/MM/YYYY"),
          to: moment()
            .endOf("day")
            .format("DD/MM/YYYY")
        },
        check: true
      }
    };
  }
  async componentDidMount() {
    let date = localStorage.getItem(this.NAME);
    date = JSON.parse(date);
    if (date) {
      let dateList = new dateCalculator();
      let newDate = dateList.filter(r => date.name == r.name);
      if (newDate.length == 1) {
        date = newDate[0];
      }
      await this.setState({
        date
      });
    }
    await this.fetchData();
  }

  fetchData = async () => {
    this.setState({
      loading: true
    });
    try {
      const invoiceStatistic = await this.apis.call("invoiceStatistic", {
        currency: "THB",
        invoiceEntryDateFrom: this.state.date.value.from,
        invoiceEntryDateTo: this.state.date.value.to
      });
      const automergeStatistic = await this.apis.call("automergeStatistic", {
        currency: "THB",
        invoiceEntryDateFrom: this.state.date.value.from,
        invoiceEntryDateTo: this.state.date.value.to,
        isAutoMatched: true,
        groupBy: "matchingStatus"
      });
      const umatchStatistic = await this.apis.call("umatchStatistic", {
        currency: "THB",
        invoiceEntryDateFrom: this.state.date.value.from,
        invoiceEntryDateTo: this.state.date.value.to,
        isAutoMatched: false
      });
      const poStatistic = await this.apis.call("poStatistic", {
        currency: "THB",
        entryDateFrom: this.state.date.value.from,
        entryDateTo: this.state.date.value.to
      });
      const grStatistic = await this.apis.call("grStatistic", {
        currency: "THB",
        postingDateFrom: this.state.date.value.from,
        postingDateTo: this.state.date.value.to
      });

      this.setState({
        invoiceStatistic: {
          ...invoiceStatistic,
          unit: this.state.invoiceStatistic.unit
        },
        automergeStatistic: {
          ...automergeStatistic,
          unit: this.state.automergeStatistic.unit
        },
        umatchStatistic: {
          ...umatchStatistic,
          unit: this.state.umatchStatistic.unit
        },
        poStatistic: {
          ...poStatistic,
          unit: this.state.poStatistic.unit
        },
        grStatistic: {
          ...grStatistic,
          unit: this.state.grStatistic.unit
        }
      });
    } catch (e) {
      console.log(e);
    }
    this.setState({
      loading: false
    });
  };

  onChange = item => {
    window.localStorage.setItem(this.NAME, JSON.stringify(item));

    this.setState(
      {
        date: item
      },
      () => this.fetchData()
    );
  };
  formatNumber = number => {
    return Intl.NumberFormat("th-TH").format(number);
  };

  sumValue = data => {
    return data.amountTotal && data.amountTotal.quantity
      ? data.amountTotal.quantity * data.amountTotal.displayTokenSize
      : 0;
  };
  render() {
    const { t } = this.props;
    return (
      <BlockUi blocking={this.state.loading}>
        <section className="box box--width-header col-12">
          <div className="box__header">
            <div className="d-flex flex-wrap justify-content-between pt-3 pt-lg-2">
              <div className="col">
                <h5 className="gray-1">{t("Statistics")}</h5>
              </div>
              <div className="col d-flex justify-content-end">
                <SelectDatePopover
                  date={this.state.date}
                  onChange={this.onChange}
                />
              </div>
            </div>
          </div>
          <div className="box__inner p-0">
            <div className="d-flex flex-wrap">
              <StatisticPopover
                unit={this.state.invoiceStatistic.unit}
                countTotal={this.state.invoiceStatistic.countTotal}
                value={this.sumValue(this.state.invoiceStatistic)}
                token={
                  this.state.invoiceStatistic.amountTotal &&
                  this.state.invoiceStatistic.amountTotal.token
                }
              />
              <StatisticPopover
                unit={this.state.automergeStatistic.unit}
                countTotal={this.state.automergeStatistic.countTotal}
                value={this.sumValue(this.state.automergeStatistic)}
                token={
                  this.state.automergeStatistic.amountTotal &&
                  this.state.automergeStatistic.amountTotal.token
                }
              />
              <StatisticPopover
                unit={this.state.umatchStatistic.unit}
                countTotal={this.state.umatchStatistic.countTotal}
                value={this.sumValue(this.state.umatchStatistic)}
                token={
                  this.state.umatchStatistic.amountTotal &&
                  this.state.umatchStatistic.amountTotal.token
                }
              />
              <StatisticPopover
                unit={this.state.poStatistic.unit}
                countTotal={this.state.poStatistic.countTotal}
                value={this.sumValue(this.state.poStatistic)}
                token={
                  this.state.poStatistic.amountTotal &&
                  this.state.poStatistic.amountTotal.token
                }
              />
              <StatisticPopover
                unit={this.state.grStatistic.unit}
                countTotal={this.state.grStatistic.countTotal}
                value={this.sumValue(this.state.grStatistic)}
                token={
                  this.state.grStatistic.amountTotal &&
                  this.state.grStatistic.amountTotal.token
                }
                hideTooltip={true}
              />
            </div>
          </div>
        </section>
      </BlockUi>
    );
  }
}
export default withTranslation(["dashboard", "common", "menu"])(
  DashboardStatistic
);

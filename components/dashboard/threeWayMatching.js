import React from "react";
import Router from "next/router";
import moment from "moment";
import BlockUi from "react-block-ui";
import { withTranslation } from "~/i18n";

import api from "../../libs/api";
import colorMaps from "../../configs/color.3wm.json";
import SelectDatePopover, { dateCalculator } from "./selectDatePopover";
import ThreeWayPopover from "./threeWayPopover";

class ThreeWayMatching extends React.Component {
  apis = new api(this.props.domain).group("dashboard");
  threeWayApi = new api(this.props.domain).group("threeWayMatching");
  NAME = "threeWayMatchingDate";

  state = {
    colorMap: {},
    threeWayData: {},
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
      const threeWayData = await this.apis.call("threeWayMatching", {
        currency: "THB",
        groupBy: "matchingStatus",
        invoiceEntryDateFrom: this.state.date.value.from,
        invoiceEntryDateTo: this.state.date.value.to
      });
      const threeWayModel = await this.threeWayApi.call("model.get");
      const [matchingData] = threeWayModel.table.columns.filter(
        row => row.field === "matchingStatus"
      );
      this.setState({
        threeWayData
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

  goTo3wmList = itemDetail => {
    window.localStorage.setItem(
      "searchInput-3wm",
      JSON.stringify({
        invoiceEntryDateFrom: this.state.date.value.from,
        invoiceEntryDateTo: this.state.date.value.to,
        matchingStatus: itemDetail.key
      })
    );
    Router.push("/3-way-matching-list");
  };

  renderItem() {
    let items = [];
    const { t } = this.props;
    for (let key in colorMaps) {
      let [itemDetail] = this.state.threeWayData.data
        ? this.state.threeWayData.data.filter(
            threeWayData => threeWayData.key === key
          )
        : [];
      itemDetail = itemDetail || { key, countTotal: 0 };
      const totalPercent = (
        (itemDetail.countTotal / this.state.threeWayData.countTotal || 0) * 100
      ).toFixed(2);
      const itemValue =
        itemDetail.amountTotal && itemDetail.amountTotal.quantity
          ? itemDetail.amountTotal.quantity *
            itemDetail.amountTotal.displayTokenSize
          : 0;
      items.push(
        <div
          className="item col-12 p-0 progress-box"
          key={key}
          onClick={e => this.goTo3wmList(itemDetail)}
        >
          <div className="info col-12 px-0 d-flex flex-wrap">
            <div className="col-6 col-md-8 pt-1 pr-0 pr-md-3">
              <p className="mb-0">{t(key)}</p>
            </div>
            <div className="col-3 col-md-2 text-right">
              <p className="mb-0 pt-1">
                <strong>{itemDetail.countTotal}</strong>
              </p>
            </div>
            <div className="col-3 col-md-2 pl-0 pl-md-3 text-center">
              <p className="mb-0 pt-1">
                <strong>{totalPercent}%</strong>
              </p>
            </div>
          </div>
          <ThreeWayPopover
            color={colorMaps[key]}
            totalPercent={totalPercent}
            value={itemValue}
          />
        </div>
      );
    }
    return items;
  }

  render() {
    const { t } = this.props;
    return (
      <BlockUi blocking={this.state.loading}>
        <div className="box__header box__header--shadow px-0 py-0">
          <div className="d-flex flex-wrap justify-content-between pt-2">
            <div className="col-8">
              <h5 className="gray-1">{t("3 Way Matching")}</h5>
            </div>
            <div className="col d-flex justify-content-end">
              <SelectDatePopover
                date={this.state.date}
                onChange={this.onChange}
              />
            </div>
          </div>
        </div>

        <div className="box__inner pt-0 pt-md-3 px-3">
          <h5 className="purple pb-2">
            <span>
              {t("Total")}
              {": "}
              {this.state.threeWayData.countTotal} {t("invoices1")}
            </span>
          </h5>
          {this.renderItem()}
        </div>
      </BlockUi>
    );
  }
}

export default withTranslation(["dashboard", "common", "menu"])(
  ThreeWayMatching
);

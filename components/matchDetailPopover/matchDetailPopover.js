import React from "react";

import Popover, { ArrowContainer } from "react-tiny-popover";
import "./matchDetailPopover";
import api from "../../libs/api";
export default class MatchDetailPopover extends React.Component {
  constructor(props) {
    super(props);

    this.apis = new api().group("thresholdPopup");
  }
  state = {
    isPopoverOpen: false,
    message: ""
  };

  async componentDidMount() {
    let configOption = "";
    let message = "";
    let configDetail;
    switch (this.props.type) {
      case "PO_GR_DATE":
        configOption = "GOODS_RECEIVED_AGAINST_PURCHASE_MAX_THRESHOLD";
        configDetail = await this.getConfigDate(configOption);
        message = `Date tolerance: ${
          configDetail[0] ? configDetail[0].value : 0
        } days from effective delivery date`;
        break;
      case "INVOICE_GR_DATE":
        configOption = "GOODS_RECEIVED_AGAINST_PURCHASE_MAX_THRESHOLD";
        configDetail = await this.getConfigDate(configOption);
        message = `Date tolerance: ${
          configDetail[0] ? configDetail[0].value : 0
        } days from effective delivery date`;
        break;
      case "UNIT":
        break;
      case "PURCHASE_QUANTITY":
        message = "Matched within PO quantity tolerance";
        break;
      case "QUANTITY":
        configOption = "MIN_QUANTITY_THRESHOLD";
        configDetail = await this.getConfig(configOption);
        let min = configDetail[0] ? configDetail[0].value : 0;
        configOption = "MAX_QUANTITY_THRESHOLD";
        configDetail = await this.getConfig(configOption);
        let max = configDetail[0] ? configDetail[0].value : 0;

        min = min - 100;
        max = max - 100;
        message = `Qty tolerance: from ${min}% to ${max}% of Invoice Qty`;
        break;
      case "UNIT_PRICE":
        configOption = "minUnitPriceThreshold";
        configDetail = await this.getConfig(configOption);
        let minValue = configDetail[0] ? configDetail[0].value : 0;
        configOption = "maxUnitPriceThreshold";
        configDetail = await this.getConfig(configOption);
        let maxValue = configDetail[0] ? configDetail[0].value : 0;
        message = `Unit Price Tolerance: From ${minValue}% To ${maxValue}% of expected Unit Price`;
        break;
      default:
        configOption = "";
        break;
    }

    this.setState({
      message
    });
  }

  getConfig = configOption => {
    return this.apis.call("getConfig", {
      companyTaxId: this.props.companyTaxNumber,
      counterPartyTaxId: this.props.vendorTaxNumber,
      configOption
    });
  };

  getConfigDate = configOption => {
    return this.apis.call("getConfigDate", {
      configOption
    });
  };

  render() {
    const { isPopoverOpen, message } = this.state;
    return (
      <Popover
        isOpen={isPopoverOpen}
        position={"top"} // preferred position
        onClickOutside={() => this.setState({ isPopoverOpen: !isPopoverOpen })}
        contentLocation={({
          targetRect,
          popoverRect,
          position,
          align,
          nudgedLeft,
          nudgedTop
        }) => {
          const offset = $(`#text-${this.props.type}`).offset();
          return {
            left: targetRect.left - 20,
            top: offset.top - 46
          };
        }}
        content={({ position, targetRect, popoverRect }) => (
          <ArrowContainer // if you'd like an arrow, you can import the ArrowContainer!
            position={position}
            targetRect={targetRect}
            popoverRect={popoverRect}
            arrowColor={"white"}
            arrowSize={10}
          >
            <div
              style={{
                backgroundColor: "white",
                boxShadow: "0px 0px 30px gray",
                paddingTop: "10px",
                paddingBottom: "10px",
                paddingLeft: "10px",
                paddingRight: "10px"
              }}
            >
              {message}
            </div>
          </ArrowContainer>
        )}
      >
        <div
          onClick={() => this.setState({ isPopoverOpen: !isPopoverOpen })}
          style={{ marginLeft: "5px", marginRight: "5px" }}
          id={`text-${this.props.type}`}
        >
          <i
            className="fa fa-info-circle"
            style={{
              WebkitTextStroke: "0px",
              color: "#ff981c",
              fontSize: "18px"
            }}
          />
        </div>
      </Popover>
    );
  }
}

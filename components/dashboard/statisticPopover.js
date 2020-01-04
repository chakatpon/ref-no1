import React from "react";

import Popover, { ArrowContainer } from "react-tiny-popover";
import { withTranslation } from "~/i18n";
class MatchDetailSearch extends React.Component {
  state = {
    isPopoverOpen: false,
    text: ""
  };

  onChange = e => {
    this.setState({
      text: e.target.value
    });
  };

  formatCurrency = number => {
    if (number > 1000000) {
      return (number / 1000000).toFixed(2) + " M";
    } else if (number > 1000) {
      return (number / 1000).toFixed(2) + " K";
    } else {
      return Intl.NumberFormat("th-TH").format(number);
    }
  };

  formatNumber = number => {
    return Intl.NumberFormat("th-TH").format(number);
  };

  render() {
    const { isPopoverOpen } = this.state;
    const { hideTooltip, t } = this.props;
    return (
      <Popover
        isOpen={isPopoverOpen && !hideTooltip}
        position={["bottom"]}
        padding={3}
        onClickOutside={() => this.setState({ isPopoverOpen: false })}
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
                boxShadow: "0px 0px 30px rgb(175, 183, 196)",
                paddingTop: "10px",
                paddingBottom: "10px",
                paddingLeft: "20px",
                paddingRight: "20px",
                borderRadius: "10px"
              }}
            >
              {this.formatNumber(this.props.value)}
            </div>
          </ArrowContainer>
        )}
      >
        <div
          className="col-12 my-1 col-sm-6 my-sm-3 col-lg my-lg-0"
          onMouseEnter={() => this.setState({ isPopoverOpen: true })}
          onMouseLeave={() => this.setState({ isPopoverOpen: false })}
        >
          <div className="bg-dv-gray rounded py-2 d-flex flex-wrap align-items-center">
            <h1 className="purple mb-0 col-4 col-lg-12 text-center text-shadow">
              {this.formatNumber(
                this.props.countTotal ? this.props.countTotal : 0
              )}
            </h1>
            <p className="mb-0 col-8 col-lg-12 text-xs-left text-lg-center">
              {t(this.props.unit)}
            </p>
          </div>
        </div>
      </Popover>
    );
  }
}
export default withTranslation(["dashboard", "common", "menu"])(
  MatchDetailSearch
);

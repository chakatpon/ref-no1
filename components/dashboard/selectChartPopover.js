import React from "react";

import Popover, { ArrowContainer } from "react-tiny-popover";
import { withTranslation } from "~/i18n";
class MatchDetailSearch extends React.Component {
  state = {
    isPopoverOpen: false,
    text: ""
  };

  clickCheck = (e, index) => {
    const { chartShow } = this.props;
    chartShow[index].show = !chartShow[index].show;
    this.props.onFilter(chartShow);
  };

  renderItem() {
    const { t } = this.props;
    if (this.props.chartShow.length === 0) return <p> No filter Data </p>;
    return this.props.chartShow.map((item, index) => {
      let itemStatus;
      if (item.matchedStatus === "matched") {
        itemStatus = <span style={{ color: "#7CEC00" }}> Matched </span>;
      } else if (item.matchedStatus === "matchedWithThreshold") {
        itemStatus = (
          <span style={{ color: "#ff981c" }}> Matched Within Threshold </span>
        );
      } else {
        itemStatus = <span style={{ color: "red" }}> Unmatched </span>;
      }
      return (
        <div className="widgets-choice" key={item.draggableId}>
          <div className="d-flex">
            <div>
              <input
                type={"checkbox"}
                checked={item.show}
                className="checkbox-search col"
                onClick={e => this.clickCheck(e, index)}
              />
            </div>
            <span className="px-0">{t(item.name)}</span>
          </div>
        </div>
      );
    });
  }

  onChange = e => {
    this.setState({
      text: e.target.value
    });
  };

  render() {
    const { isPopoverOpen } = this.state;
    const { t } = this.props;
    return (
      <Popover
        isOpen={isPopoverOpen}
        position={["bottom"]}
        padding={3}
        align={"end"}
        onClickOutside={() => this.setState({ isPopoverOpen: false })}
        content={({ position, targetRect, popoverRect }) => (
          <ArrowContainer // if you'd like an arrow, you can import the ArrowContainer!
            position={position}
            targetRect={targetRect}
            popoverRect={popoverRect}
            align={"end"}
            arrowColor={"white"}
            arrowSize={10}
          >
            <div
              style={{
                backgroundColor: "white",
                boxShadow: "0px 0px 30px rgb(175, 183, 196)",
                paddingTop: "10px",
                paddingBottom: "10px",
                paddingLeft: "10px",
                paddingRight: "10px",
                borderRadius: "10px"
              }}
            >
              {this.props.chartShow.length ? (
                this.renderItem()
              ) : (
                  <p> No filter Data </p>
                )}
            </div>
          </ArrowContainer>
        )}
      >
        <button
          type="button"
          name="btnManageWidget"
          id="btnManageWidget"
          className="btn btn-wide d-inline-flex"
          onClick={() => this.setState({ isPopoverOpen: !isPopoverOpen })}
        >
          {t("Add / Remove Widgets")}
        </button>
      </Popover>
    );
  }
}
export default withTranslation(["dashboard", "common", "menu"])(
  MatchDetailSearch
);

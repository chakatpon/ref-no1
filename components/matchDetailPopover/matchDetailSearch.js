import React from "react";

import Popover, { ArrowContainer } from "react-tiny-popover";

export default class MatchDetailSearch extends React.Component {
  state = {
    isPopoverOpen: false,
    text: ""
  };

  clickCheck = (e, index) => {
    const { matchingDetail } = this.props;
    const filterdText = matchingDetail.filter(item => {
      return item.invoiceItems.invNo.startsWith(this.state.text);
    });
    const changeItem = filterdText[index];
    const newMatchingDetail = matchingDetail.map(item => {
      if (changeItem.invoiceItems.invNo === item.invoiceItems.invNo) {
        return { ...changeItem, checked: !changeItem.checked };
      }
      return item;
    });
    this.props.onFilter(newMatchingDetail);
  };

  renderItem() {
    if (this.props.matchingDetail.length === 0) return <p> No filter Data </p>;
    return this.props.matchingDetail
      .filter(item => {
        return item.invoiceItems.invNo.startsWith(this.state.text);
      })
      .map((item, index) => {
        let itemStatus;
        if (item.itemProperties.matchedStatus === "matched") {
          itemStatus = <span style={{ color: "#7CEC00" }}> Matched </span>;
        } else if (
          item.itemProperties.matchedStatus === "matchedWithThreshold"
        ) {
          itemStatus = (
            <span style={{ color: "#ff981c" }}> Matched Within Threshold </span>
          );
        } else {
          itemStatus = <span style={{ color: "red" }}> Unmatched </span>;
        }
        return (
          <div key={item.itemId}>
            <div className="d-flex">
              <div className="col px-0">
                <input
                  type={"checkbox"}
                  checked={item.checked}
                  className="checkbox-search col"
                  onClick={e => this.clickCheck(e, index)}
                />
              </div>
              <span className="col-12 px-0">
                {`${item.itemProperties.invoiceItemId} - `}
                {itemStatus}
              </span>
              {/* <span className="col-3 px-0">{`${
                item.itemProperties.invoiceItemId
              }`}</span>
              <span className="col-1 px-1">-</span>
              <span className="col-7 px-1">{itemStatus}</span> */}
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
    return (
      <Popover
        isOpen={isPopoverOpen}
        position={"bottom"} // preferred position
        contentLocation={({
          targetRect,
          popoverRect,
          position,
          align,
          nudgedLeft,
          nudgedTop
        }) => {
          const offset = $("#search-threeway-matching").offset();
          return {
            left: targetRect.left,
            top: offset.top + 46
          };
        }}
        onClickOutside={() => this.setState({ isPopoverOpen: !isPopoverOpen })}
        align={"end"}
        content={({ position, targetRect, popoverRect }) => (
          <ArrowContainer // if you'd like an arrow, you can import the ArrowContainer!
            position={position}
            targetRect={targetRect}
            popoverRect={popoverRect}
            arrowColor={"white"}
            arrowSize={10}
            arrowStyle={{ left: "20.578px" }}
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
              {this.props.matchingDetail.length ? (
                this.renderItem()
              ) : (
                <p> No filter Data </p>
              )}
            </div>
          </ArrowContainer>
        )}
      >
        <div
          id="search-threeway-matching"
          onClick={() => this.setState({ isPopoverOpen: !isPopoverOpen })}
          style={{ marginLeft: "5px", marginRight: "5px", width: "100%" }}
        >
          <i
            className="fa fa-search"
            style={{
              "-webkit-text-stroke": "0px",
              fontSize: "18px"
            }}
            // onClick={() => this.setState({ isPopoverOpen: !isPopoverOpen })}
          />
          <input
            type="text"
            name="search"
            id="search"
            autoComplete="new-password"
            placeholder="Search Item No"
            autoComplete="off"
            onChange={this.onChange}
            value={this.state.text}
            // onClick={() => this.setState({ isPopoverOpen: !isPopoverOpen })}
          />
        </div>
      </Popover>
    );
  }
}

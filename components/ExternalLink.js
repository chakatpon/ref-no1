import React, { Component } from "react";
import Link from "next/link";

class ExternalLink extends Component {
  constructor(props) {
    super(props);
    this.state = {
      itemList: []
    };
  }
  componentDidMount() {
    this.prepareData();
  }
  componentWillReceiveProps(nextProps) {
    this.prepareData();
  }
  prepareData = () => {
    const {
      value,
      type,
      lengthToShow,
      textAtTheEnd,
      moreExternalLink,
      menuKey,
      queryStringKey
    } = this.props;
    const loop = parseInt(lengthToShow);
    let linearIdArr = [];

    if (type == "link") {
      if (typeof value == "object") {
        if (value.length > loop) {
          let moreObj = {};
          let arr = value.map((item, i) => {
            linearIdArr.push(item.linearId);
            if (i < loop) {
              return item;
            }
          });
          arr = arr.filter(item => item != undefined);

          if (queryStringKey === "linearIds") {
            moreObj = {
              name: textAtTheEnd,
              href: `${moreExternalLink}${linearIdArr.toString()}`
            };
          } else {
            moreObj = {
              name: textAtTheEnd,
              href: moreExternalLink
            };
          }

          arr.push(moreObj);
          this.setState({
            itemList: arr
          });

          this.deleteAllLocalStorangeSearch(menuKey);
        } else {
          this.setState({
            itemList: value
          });
        }
      }
    }
  };

  deleteAllLocalStorangeSearch = menuKey => {
    let searchInput = localStorage.getItem(`searchInput-${menuKey}`);
    if (searchInput) {
      localStorage.removeItem(`searchInput-${menuKey}`);
    }
  };

  render() {
    const { value, label, type } = this.props;
    const { itemList } = this.state;
    if (type == "link") {
      if (typeof value == "object") {
        if (value.length > 0) {
          return (
            <div className="row">
              <p className="col-6 text-right px-0">{label || ""} :</p>
              <p className="col-6">
                {itemList.map((item, i) => {
                  return (
                    <span>
                      <Link href={item.href || ""} key={i}>
                        <a className="purple font-bold underline">
                          {item.name || "-"}
                        </a>
                      </Link>
                      {i < itemList.length - 1 ? ", " : " "}
                    </span>
                  );
                })}
              </p>
            </div>
          );
        } else {
          return (
            <div className="row">
              <p className="col-6 text-right px-0">{label || ""} :</p>
              <p className="col-6">-</p>
            </div>
          );
        }
      } else if (value === "-" || value === "" || value === undefined) {
        return (
          <div className="row">
            <p className="col-6 text-right px-0">{label || ""} :</p>
            <p className="col-6">-</p>
          </div>
        );
      } else {
        return (
          <div className="row">
            <p className="col-6 text-right px-0">{label || ""} :</p>
            <p className="col-6">
              <Link href={value.href || ""}>
                <a className="purple font-bold underline">
                  {value.name || "-"}
                </a>
              </Link>
            </p>
          </div>
        );
      }
    }
  }
}

export default ExternalLink;

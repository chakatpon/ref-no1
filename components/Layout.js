import Header from "./Header";
import Menu from "./Menu";

import $ from "jquery";
import React from "react";
import { withRouter } from "next/router";
import classnames from "classnames";
import replace from "lodash/replace";

class Layout extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isExpandedSideNavBar: false
    };
    this.timeo;
  }
  componentWillUnmount() {
    this.state = {};
  }
  componentDidMount() {
    this.handleHide(this.props.hideNavBar);
    window.addEventListener("resize", this.resize.bind(this));
    this.resize();
  }

  resize() {
    this.setState({ isExpandedSideNavBar: window.innerWidth <= 992 });
  }
  _toggleExpandedSideNavBar = bool => {
    if (this.timeo) {
      clearTimeout(this.timeo);
    }
    if (bool != "toggle") {
      if (window.innerWidth <= 992) {
        return;
      }
    }
    if (bool == "toggle") {
      bool = !this.state.isExpandedSideNavBar;
      this.setState({
        isExpandedSideNavBar: bool
      });
    } else {
      if (bool == true) {
        this.setState({
          isExpandedSideNavBar: bool
        });
      } else {
        this.timeo = setTimeout(() => {
          this.setState({
            isExpandedSideNavBar: bool
          });
        }, 100);
      }
    }
  };

  handleHide(boolean) {
    if (boolean) {
      $(".page").css("width", "100%");
      $("nav.side-navbar, .sidenav-header-toggle").hide();
    }
  }

  render() {
    const { children } = this.props;
    const { isExpandedSideNavBar } = this.state;
    const classPage = classnames("page", { active: !isExpandedSideNavBar });
    const active_section = replace(this.props.router.pathname, "/", "");
    return (
      <div>
        <Menu
          {...this.props}
          id={active_section}
          toggleExpandedSideNavBar={this._toggleExpandedSideNavBar}
          isExpandedSideNavBar={isExpandedSideNavBar}
        />
        <div className={classPage}>{children}</div>
      </div>
    );
  }
}

export default withRouter(Layout);

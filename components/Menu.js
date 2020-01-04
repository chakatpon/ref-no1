import React, { Component } from "react";
import Link from "next/link";
import { activePath } from "../libs/activePath";
import classnames from "classnames";
import loadjs from "loadjs";
import $ from "jquery";
import menuItems from "../configs/menuItems";
import ApiService from "../libs/ApiService";
import localStorage from "local-storage";
import StandardService from "~/services/StandardService";
import { i18n, withTranslation } from "~/i18n";
class Menu extends Component {
  constructor(props) {
    super(props);
    const { token, user, authority, permisions } = this.props;
    this.api = new ApiService();
    this.state = {
      UserAuthority: permisions,
      hideMenu: true,
      menuItems: menuItems,
      menus: []
    };
  }
  standardService = new StandardService();
  async getMoreMenuItem() {
    try {
      const { status, message, data } = await this.standardService.callApi({
        group: "moremenu",
        action: "getmoremenu"
      });
      if (data.rows && data.rows.length > 0) {
        data.rows.sort((a, b) => (a.sequence > b.sequence ? 1 : -1));
        let subMenu = [];
        data.rows.forEach((row, index) => {
          subMenu.push({
            link: row.url,
            icon: "icon-additional icon-more",
            label: row.displayName,
            menukey: row.sequence,
            onMobile: false,
            authority: ["More-Menu"]
          });
        });
        let menuItem = {
          link: "more",
          icon: "icon-additional icon-more",
          label: "More",
          menukey: "moremenu",
          onMobile: false,
          authority: ["More-Menu"],
          subMenu: subMenu
        };
        this.setState({ menuItems: [...this.state.menuItems, menuItem] });
      }
    } catch (e) {
      console.error(e);
    }
  }
  clearStorage = menukey => {
    localStorage.remove(`searchInput-${menukey}`);
  };

  componentDidMount() {
    this.getMoreMenuItem();
  }

  render() {
    const { id, title, t } = this.props;
    const { token, user, authority, permisions } = this.props;
    const { menuItems } = this.state;
    const { isExpandedSideNavBar, toggleExpandedSideNavBar } = this.props;
    const classSideNavBar = classnames("side-navbar", {
      showMenu: !isExpandedSideNavBar
    });
    const menuGenerator = (menuItem, i) => {
      let testPerm = [];

      if (typeof menuItem.authority == "object") {
        testPerm = menuItem.authority.filter(r => permisions.includes(r));
      }

      if (typeof menuItem.authority == "object" && testPerm.length > 0) {
        if (menuItem.subMenu && menuItem.subMenu.length > 0) {
          if (menuItem.onMobile) {
            return (
              <li key={`menu-${i}}`}>
                <a
                  // href={`javascript:void(0);`}
                  // aria-expanded="false"
                  // data-toggle="collapse"
                  className={classnames("nav-link", {
                    active:
                      activePath(id, menuItem.link, { strict: true }) ||
                      activePath(id, menuItem.link + "-detail", {
                        strict: true
                      })
                  })}
                >
                  <span>
                    <i className={`${menuItem.icon}`} />
                  </span>
                  {t(menuItem.label)}
                  <i className="fa fa-chevron-right ml-auto" />
                </a>
                <ul id={`menu-${i}Dropdown`} className="list-unstyled ">
                  {menuItem.subMenu.map((subMenuItem, j) => {
                    let testSubPerm = [];
                    if (typeof subMenuItem.authority == "object") {
                      testSubPerm = subMenuItem.authority.filter(r =>
                        permisions.includes(r)
                      );
                    }
                    if (
                      typeof menuItem.authority == "object" &&
                      testSubPerm.length > 0
                    ) {
                      if (subMenuItem.onMobile) {
                        return (
                          <li key={`submenu-${i}-${j}}`}>
                            <Link href={`${subMenuItem.link}`}>
                              <a
                                onClick={() =>
                                  this.clearStorage(subMenuItem.menukey || "")
                                }
                                className={classnames("nav-link", {
                                  active:
                                    activePath(id, subMenuItem.link, {
                                      strict: true
                                    }) ||
                                    activePath(
                                      id,
                                      subMenuItem.link + "-detail",
                                      {
                                        strict: true
                                      }
                                    )
                                })}
                              >
                                <span>
                                  <i className={`${subMenuItem.icon}`} />
                                </span>
                                {t(subMenuItem.label)}
                              </a>
                            </Link>
                          </li>
                        );
                      } else {
                        return (
                          <li key={`submenu-${i}-${j}}`}>
                            <Link href={`${subMenuItem.link}`}>
                              <a
                                onClick={() =>
                                  this.clearStorage(subMenuItem.menukey || "")
                                }
                                className={classnames(
                                  "nav-link d-none d-md-inline-block d-lg-inline-block d-xl-inline-block",
                                  {
                                    active:
                                      activePath(id, subMenuItem.link, {
                                        strict: true
                                      }) ||
                                      activePath(
                                        id,
                                        subMenuItem.link + "-detail",
                                        {
                                          strict: true
                                        }
                                      )
                                  }
                                )}
                              >
                                <span>
                                  <i className={`${subMenuItem.icon}`} />
                                </span>
                                {t(subMenuItem.label)}
                              </a>
                            </Link>
                          </li>
                        );
                      }
                    }
                  })}
                </ul>
              </li>
            );
          } else {
            return (
              <li key={`menu-${i}}`}>
                <a
                  // href={`javascript:void(0);`}
                  // aria-expanded="false"
                  // data-toggle="collapse"
                  className={classnames(
                    "nav-link d-none d-md-inline-block d-lg-inline-block d-xl-inline-block",
                    {
                      active:
                        activePath(id, menuItem.link, { strict: true }) ||
                        activePath(id, menuItem.link + "-detail", {
                          strict: true
                        })
                    }
                  )}
                >
                  <span>
                    <i className={`${menuItem.icon}`} />
                  </span>
                  {t(menuItem.label)}
                  <i className="fa fa-chevron-right ml-auto" />
                </a>
                <ul id={`menu-${i}Dropdown`} className="list-unstyled ">
                  {menuItem.subMenu.map((subMenuItem, j) => {
                    let testSubPerm = [];
                    if (typeof subMenuItem.authority == "object") {
                      testSubPerm = subMenuItem.authority.filter(r =>
                        permisions.includes(r)
                      );
                    }
                    if (
                      typeof menuItem.authority == "object" &&
                      testSubPerm.length > 0
                    ) {
                      if (subMenuItem.onMobile) {
                        return (
                          <li key={`submenu-${i}-${j}}`}>
                            <Link href={`${subMenuItem.link}`}>
                              <a
                                onClick={() =>
                                  this.clearStorage(subMenuItem.menukey || "")
                                }
                                className={classnames("nav-link", {
                                  active:
                                    activePath(id, subMenuItem.link, {
                                      strict: true
                                    }) ||
                                    activePath(
                                      id,
                                      subMenuItem.link + "-detail",
                                      {
                                        strict: true
                                      }
                                    )
                                })}
                              >
                                <span>
                                  <i className={`${subMenuItem.icon}`} />
                                </span>
                                {t(subMenuItem.label)}
                              </a>
                            </Link>
                          </li>
                        );
                      } else {
                        return (
                          <li key={`submenu-${i}-${j}}`}>
                            <Link href={`${subMenuItem.link}`}>
                              <a
                                onClick={() =>
                                  this.clearStorage(subMenuItem.menukey || "")
                                }
                                className={classnames(
                                  "nav-link d-none d-md-inline-block d-lg-inline-block d-xl-inline-block",
                                  {
                                    active:
                                      activePath(id, subMenuItem.link, {
                                        strict: true
                                      }) ||
                                      activePath(
                                        id,
                                        subMenuItem.link + "-detail",
                                        {
                                          strict: true
                                        }
                                      )
                                  }
                                )}
                              >
                                <span>
                                  <i className={`${subMenuItem.icon}`} />
                                </span>
                                {t(subMenuItem.label)}
                              </a>
                            </Link>
                          </li>
                        );
                      }
                    }
                  })}
                </ul>
              </li>
            );
          }
        } else {
          if (menuItem.onMobile) {
            return (
              <li key={`menu-${i}}`}>
                <Link href={`/${menuItem.link}`}>
                  <a
                    onClick={() => this.clearStorage(menuItem.menukey || "")}
                    className={classnames("nav-link", {
                      active:
                        activePath(id, menuItem.link, { strict: true }) ||
                        activePath(id, menuItem.link + "-detail", {
                          strict: true
                        })
                    })}
                  >
                    <span>
                      <i className={`${menuItem.icon}`} />
                    </span>
                    {t(menuItem.label)}
                  </a>
                </Link>
              </li>
            );
          } else {
            return (
              <li key={`menu-${i}}`}>
                <Link href={`/${menuItem.link}`}>
                  <a
                    onClick={() => this.clearStorage(menuItem.menukey || "")}
                    className={classnames(
                      "nav-link d-none d-md-inline-block d-lg-inline-block d-xl-inline-block",
                      {
                        active:
                          activePath(id, menuItem.link, { strict: true }) ||
                          activePath(id, menuItem.link + "-detail", {
                            strict: true
                          })
                      }
                    )}
                  >
                    <span>
                      <i className={`${menuItem.icon}`} />
                    </span>
                    {t(menuItem.label)}
                  </a>
                </Link>
              </li>
            );
          }
        }
      } else if (menuItem.authority == "" || menuItem.authority == []) {
        if (menuItem.onMobile) {
          return (
            <li key={`menu-${i}}`}>
              <Link href={`/${menuItem.link}`}>
                <a
                  onClick={() => this.clearStorage(menuItem.menukey || "")}
                  className={classnames("nav-link", {
                    active:
                      activePath(id, menuItem.link, { strict: true }) ||
                      activePath(id, menuItem.link + "-detail", {
                        strict: true
                      })
                  })}
                >
                  <span>
                    <i className={`${menuItem.icon}`} />
                  </span>
                  {t(menuItem.label)}
                </a>
              </Link>
            </li>
          );
        } else {
          return (
            <li key={`menu-${i}}`}>
              <Link href={`/${menuItem.link}`}>
                <a
                  onClick={() => this.clearStorage(menuItem.menukey || "")}
                  className={classnames(
                    "nav-link d-none d-md-inline-block d-lg-inline-block d-xl-inline-block",
                    {
                      active:
                        activePath(id, menuItem.link, { strict: true }) ||
                        activePath(id, menuItem.link + "-detail", {
                          strict: true
                        })
                    }
                  )}
                >
                  <span>
                    <i className={`${menuItem.icon}`} />
                  </span>
                  {t(menuItem.label)}
                </a>
              </Link>
            </li>
          );
        }
      } else {
        // console.warn(
        //   menuItem.label,
        //   "is not have permission of",
        //   menuItem.authority
        // );
      }
    };

    return (
      <div>
        <nav className={classSideNavBar}>
          <div className="side-navbar-wrapper h-100">
            <div className="main-menu">
              <ul id="side-main-menu" className="side-menu list-unstyled">
                <div className="side-main-menu-wrapper">
                  <li>
                    <Link href="dashboard">
                      <a
                        className={classnames("nav-link", {
                          active: activePath(id, "dashboard", {
                            strict: true
                          })
                        })}
                      >
                        <span className="d-inline-block mr-2">
                          <div className="logo-wrap">
                            <img src="/static/img/logo/logo_nav.png" />
                          </div>
                        </span>
                        {t("Dashboard")}
                      </a>
                    </Link>
                  </li>
                  {menuItems.map((menuItem, i) => menuGenerator(menuItem, i))}
                </div>
              </ul>
            </div>
          </div>
        </nav>
        <div className="sidenav-header-toggle">
          <div className="row justify-content-start m-0">
            <div className="col-2 p-0">
              <div id="toggle-btn-open" className="toggle-btn-open">
                <div
                  className="hamburger"
                  onClick={() => toggleExpandedSideNavBar("toggle")}
                >
                  <div />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
Menu.getInitialProps = async () => ({
  namespacesRequired: ["menu", "common"]
});
export default withTranslation("menu")(Menu);

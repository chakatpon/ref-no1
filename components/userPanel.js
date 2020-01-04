import React, { Component, Fragment } from "react";
import Link from "next/link";
import { i18n, withTranslation } from "~/i18n";
import GA from "~/libs/ga";
class UserPanel extends Component {
  render() {
    const { t } = this.props;
    return (
      <Fragment>
        <div id="control-panel" className="ml-auto d-flex">
          {/* Desktop Version - Start */}
          <div className="d-none d-lg-flex">
            {/* <a
            href="javascript:void(0);"
            id="btnNoti"
            data-toggle="tooltip"
            data-placement="bottom"
            title="Notifications"
            >
                <i className="icon icon-icon_noti" />
            </a> */}

            {this.props.appenv.MULTILANG_CONFIG &&
            this.props.appenv.MULTILANG_CONFIG.length > 1 ? (
              <a
                href="#multilang-control-panel"
                id="btnMultilang"
                data-toggle="collapse"
                role="button"
                aria-expanded="false"
                aria-controls="multilang-control-panel"
                style={{
                  margin: "0px"
                }}
              >
                <span className="uppercase">{i18n.language}</span>
                <i className="fa fa-chevron-down" />
                <i className="fa fa-chevron-up" />
              </a>
            ) : null}

            {/* multilang Control Panel - Start */}
            <div
              id="multilang-control-panel"
              className="collapse multi-collapse"
              style={{
                zIndex: 500000,
                right: "16.5rem"
              }}
            >
              <ul>
                {this.props.appenv.MULTILANG_CONFIG &&
                this.props.appenv.MULTILANG_CONFIG.length > 1
                  ? this.props.appenv.MULTILANG_CONFIG.map((language, i) => {
                      return (
                        <li
                          key={i}
                          style={{
                            cursor: "pointer"
                          }}
                          onClick={() => {
                            if (i18n.options.allLanguages.includes(language)) {
                              i18n.changeLanguage(language);
                              setTimeout(function() {
                                window.location.reload();
                              }, 500);
                              GA.event({
                                category: "Language Swticher",
                                action: "Switch Language",
                                label: `language ${language}`
                              });
                            }
                          }}
                        >
                          <span>{t(`common:${language}`)}</span>
                        </li>
                      );
                    })
                  : null}
              </ul>
            </div>
            {/* multilang Control Panel - End */}
            {this.props.user.legalName.split(",")[1] === " O=SCG1" ||
            this.props.user.legalName.split(",")[1] === " O=SCGPA" ||
            this.props.user.legalName.split(",")[1] === " O=SUPPLIER1" ? (
              <a
                href={this.props.appenv.SUPPORT_SCG_URL}
                id="btnCallcenter"
                target="_blank"
                data-toggle="popover"
                data-placement="bottom"
                data-content="myRequests"
                onClick={() => {
                  GA.event({
                    category: "myRequests",
                    action: "Link to myRequests"
                  });
                }}
              >
                <i className="icon icon-icon_callcenter" />
              </a>
            ) : (
              ""
            )}
            <a
              href={this.props.appenv.SUPPORT_URL}
              id="btnHelp"
              target="_blank"
              data-toggle="popover"
              data-placement="bottom"
              data-content="Help"
              onClick={() => {
                GA.event({
                  category: "Help",
                  action: "Link to Help"
                });
              }}
            >
              <i className="icon icon-icon_help" />
            </a>
            <a
              href="#desktop-control-panel"
              id="btnUser"
              data-toggle="collapse"
              role="button"
              aria-expanded="false"
              aria-controls="desktop-control-panel"
            >
              <i className="icon icon-icon-user-profile" />{" "}
              {this.props.authority.userAuthentication.name}
              <i className="fa fa-chevron-down" />
              <i className="fa fa-chevron-up" />
            </a>

            {/* Desktop Control Panel - Start */}
            <div
              id="desktop-control-panel"
              className="collapse multi-collapse"
              style={{
                right: "2rem"
              }}
            >
              <ul>
                <li>
                  <a
                    href="logout"
                    onClick={() => {
                      GA.event({
                        category: "Logout",
                        action: "Logout"
                      });
                    }}
                  >
                    {t("detail:Logout")}
                  </a>
                </li>
              </ul>
            </div>
            {/* Desktop Control Panel - End */}
          </div>
          {/* Desktop Version - End */}

          {/* Mobile Version - Start */}
          <div className="d-flex d-lg-none">
            <a href="javascript:void(0);" id="btnSearch">
              <i className="icon icon-search" />
            </a>
            <a
              href="#mobile-control-panel"
              id="btnControlPanel"
              data-toggle="collapse"
              role="button"
              aria-expanded="false"
              aria-controls="mobile-control-panel"
            >
              <i className="fa fa-ellipsis-h" />
            </a>

            {/* Mobile Control Panel - Start */}
            <div id="mobile-control-panel" className="collapse multi-collapse">
              <ul>
                {this.props.user.legalName.split(",")[1] === " O=SCG1" ||
                this.props.user.legalName.split(",")[1] === " O=SCGPA" ||
                this.props.user.legalName.split(",")[1] === " O=SUPPLIER1" ? (
                  <li>
                    <a
                      href={this.props.appenv.SUPPORT_URL}
                      onClick={() => {
                        GA.event({
                          category: "Help",
                          action: "Link to Help"
                        });
                      }}
                    >
                      Help
                    </a>
                  </li>
                ) : (
                  ""
                )}
                <li>
                  <a
                    href={this.props.appenv.SUPPORT_SCG_URL}
                    onClick={() => {
                      GA.event({
                        category: "myRequests",
                        action: "Link to myRequests"
                      });
                    }}
                    target="_blank"
                  >
                    MyRequest
                  </a>
                </li>
                {/* <li>
                  <a href="javascript:void(0);">My Account</a>
                </li>
                <li>
                  <a href="javascript:void(0);">Setting</a>
                </li> */}
                <li>
                  <Link href="logout">
                    <a
                      href="logout"
                      onClick={() => {
                        GA.event({
                          category: "Logout",
                          action: "Logout"
                        });
                      }}
                    >
                      Logout
                    </a>
                  </Link>
                </li>
              </ul>
            </div>
            {/* Mobile Control Panel - End */}
          </div>
          {/* Mobile Version - End */}
        </div>
      </Fragment>
    );
  }
}
export default withTranslation(["dashboard", "common", "menu", "detail"])(
  UserPanel
);

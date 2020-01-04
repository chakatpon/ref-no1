import Link from "next/link";

import React, { Component, Fragment, useState } from "react";
import ApiService from "../libs/ApiService";
import Autocomplete from "react-autocomplete";
import "datatables.net-buttons";
import "datatables.net-buttons/js/buttons.html5.min";
import "datatables.net-colreorder";
import moment from "moment";
import api from "../libs/api";
import ModalAlert from "./modalAlert";
import { i18n, withTranslation } from "~/i18n";
import GA from "~/libs/ga";

export function PageHeader(props) {
  let breadcrumbs = [];
  const [modalOpen, setModalOpen] = useState(false);
  const [language, setLanguage] = useState(i18n.language);
  const { t, lang } = props;

  if (props.breadcrumbs != undefined) {
    breadcrumbs = props.breadcrumbs;
  }

  return (
    <div>
      <div className="page__header d-flex flex-wrap">
        <h2 className="col-6">{props.title}</h2>
        <div id="control-panel" className="ml-auto d-flex">
          {/* Desktop Version - Start */}
          <div className="d-none d-lg-flex">
            {props.appenv.MULTILANG_CONFIG &&
            props.appenv.MULTILANG_CONFIG.length > 1 ? (
              <a
                href="#multilang-control-panel"
                id="btnMultilang"
                data-toggle="collapse"
                role="button"
                aria-expanded="false"
                aria-controls="multilang-control-panel"
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
            >
              <ul>
                {props.appenv.MULTILANG_CONFIG &&
                props.appenv.MULTILANG_CONFIG.length > 1
                  ? props.appenv.MULTILANG_CONFIG.map((language, i) => {
                      return (
                        <li
                          key={i}
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

            {props.user.legalName.split(",")[1] === " O=SCG1" ||
            props.user.legalName.split(",")[1] === " O=SCGPA" ||
            props.user.legalName.split(",")[1] === " O=SUPPLIER1" ? (
              <a
                href={props.appenv.SUPPORT_SCG_URL}
                id="btnCallcenter"
                data-toggle="popover"
                data-placement="bottom"
                data-content="myRequests"
                target="_blank"
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
              href={props.appenv.SUPPORT_URL}
              id="btnHelp"
              target="_blank"
              data-toggle="popover"
              data-placement="bottom"
              data-content={t(`${lang}:Help`)}
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
              {props.authority.userAuthentication.name}
              <i className="fa fa-chevron-down" />
              <i className="fa fa-chevron-up" />
            </a>

            {/* Desktop Control Panel - Start */}
            <div id="desktop-control-panel" className="collapse multi-collapse">
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
                    {t(`${lang}:Logout`)}
                  </a>
                </li>
              </ul>
            </div>
            {/* Desktop Control Panel - End */}
          </div>
          {/* Desktop Version - End */}

          {/* Mobile Version - Start */}
          <div className="d-flex d-lg-none">
            {props.permisions.includes("Invoice-Export")
              ? ""
              : // <a href="javascript:void(0);" id="btnExport">
                //   <i className="icon icon-export" />
                // </a>
                ""}
            <a href="javascript:void(0);" id="btnSearch">
              <i className="icon icon-search" />
            </a>
            {/* <a
                                    href="javascript:void(0);"
                                    id="btnNoti"
                                    data-toggle="tooltip"
                                    data-placement="bottom"
                                    title="Notifications"
                                >
                                    <i class="icon icon-icon_noti" />
                                </a> */}
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
                <li className="border-bottom pb-1 mb-3">
                  {props.authority.userAuthentication.name}
                </li>
                <li>
                  <a
                    href={props.appenv.SUPPORT_URL}
                    onClick={() => {
                      GA.event({
                        category: "Help",
                        action: "Link to Help"
                      });
                    }}
                    target="_blank"
                  >
                    Help
                  </a>
                </li>
                {props.user.legalName.split(",")[1] === " O=SCG1" ||
                props.user.legalName.split(",")[1] === " O=SCGPA" ||
                props.user.legalName.split(",")[1] === " O=SUPPLIER1" ? (
                  <li>
                    <a
                      href={props.appenv.SUPPORT_SCG_URL}
                      onClick={() => {
                        GA.event({
                          category: "myRequests",
                          action: "Link to myRequests"
                        });
                      }}
                      target="_blank"
                    >
                      myRequests
                    </a>
                  </li>
                ) : null}

                {props.appenv.MULTILANG_CONFIG &&
                props.appenv.MULTILANG_CONFIG.length > 1 ? (
                  <li
                    onClick={() => {
                      setModalOpen(true);
                    }}
                    style={{
                      cursor: "pointer"
                    }}
                  >
                    <span>
                      Language:{" "}
                      <span className="ml-auto uppercase">{i18n.language}</span>
                    </span>
                  </li>
                ) : null}

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
                    {t(`${lang}:Logout`)}
                  </a>
                </li>
              </ul>
            </div>
            {/* Mobile Control Panel - End */}
          </div>
          {/* Mobile Version - End */}
        </div>
        {/* Panel Control - End */}
      </div>

      <div className="page__breadcrumb d-none d-sm-inline-block">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb">
            {breadcrumbs.map((breadcrumb, i) => {
              if (breadcrumb.url != undefined && breadcrumb.url != "") {
                return (
                  <li
                    key={i}
                    className={`breadcrumb-item${
                      breadcrumb.active ? " active" : ""
                    }`}
                  >
                    <Link href={`${breadcrumb.url}`}>
                      <a href={`${breadcrumb.url}`}>{breadcrumb.title}</a>
                    </Link>
                  </li>
                );
              } else {
                return (
                  <li
                    key={i}
                    className={`breadcrumb-item${
                      breadcrumb.active ? " active" : ""
                    }`}
                  >
                    {breadcrumb.title}
                  </li>
                );
              }
            })}
          </ol>
        </nav>
      </div>
      {/* <div className="page__space d-inline-block d-sm-none">&nbsp;</div> */}
      <ModalAlert
        title="Language"
        visible={modalOpen}
        button={[
          {
            label: "Close",
            attribute: {
              className: "btn btn--transparent",
              onClick: () => {
                setModalOpen(false);
              }
            }
          },
          {
            label: "Save",
            attribute: {
              className: "btn btn-wide",
              onClick: () => {
                i18n.changeLanguage(language);
                setModalOpen(false);
                setTimeout(function() {
                  window.location.reload();
                }, 500);
                GA.event({
                  category: "Language Swticher",
                  action: "Switch Language",
                  label: `language ${language}`
                });
              }
            }
          }
        ]}
      >
        <div className="col-12 mt-auto form-group  border-grey">
          <p className="font-bold my-3"></p>

          {props.appenv.MULTILANG_CONFIG &&
          props.appenv.MULTILANG_CONFIG.length > 1
            ? props.appenv.MULTILANG_CONFIG.map((lang, i) => {
                return (
                  <div className="custom-control custom-radio border-bottom border-1px mt-2 pb-2">
                    <input
                      type="radio"
                      className="custom-control-input"
                      name="language"
                      id={`${lang}_language`}
                      value={lang}
                      defaultChecked={language == lang}
                      onChange={() => {
                        setLanguage(lang);
                      }}
                    />
                    <label
                      className="custom-control-label"
                      htmlFor={`${lang}_language`}
                    >
                      {t(`common:${lang}`)}
                    </label>
                  </div>
                );
              })
            : null}
        </div>
      </ModalAlert>
    </div>
  );
}
export const DVButton = props => {
  return (
    <button
      onClick={props.onClick}
      name={props.name}
      className={`btn mr-2 ${
        props.transparent == "true" ? " btn--transparent" : " btn-wide"
      }`}
    >
      {props.label}
    </button>
  );
};
export const CollapseItem = props => {
  return (
    <div className="row">
      <p
        className={`col-${props.colLabel || 4} col-lg-${props.colLabel ||
          6} text-right pl-0`}
      >
        {props.label || ""} :
      </p>
      <p
        className={`col-${props.colLabel ? 12 - props.colLabel : 8} col-lg-${
          props.colLabel ? 12 - props.colLabel : 6
        } text-left`}
      >
        {props.children}
      </p>
    </div>
  );
};
export const CollapseItemAttachment = props => {
  const { config, previewMode, t } = props;
  if (previewMode) {
    return (
      <div className="row">
        <p
          className={`col-${props.colLabel || 4} col-lg-${props.colLabel ||
            6} text-right pl-0`}
          style={{ fontSize: "14px" }}
        >
          {props.label || ""}
          {props.config.required == true ? "*" : ""} :
        </p>
        <p
          className={`col-${props.colLabel ? 12 - props.colLabel : 8} col-lg-${
            props.colLabel ? 12 - props.colLabel : 6
          } `}
          style={{ fontSize: "14px" }}
        >
          {props.attachments.map((r, i) => {
            return <div>{r.attachmentName}</div>;
          })}
        </p>
      </div>
    );
  } else {
    return (
      <div className="row">
        <div
          className={`col-${props.colLabel || 4} col-lg-${props.colLabel ||
            6} text-right pl-0`}
          style={{ fontSize: "14px" }}
        >
          {props.label || ""}
          {props.config.required == true ? "*" : ""} :
        </div>
        <div
          className={`col-${props.colLabel ? 12 - props.colLabel : 8} col-lg-${
            props.colLabel ? 12 - props.colLabel : 6
          } `}
          style={{ fontSize: "14px" }}
        >
          {props.config &&
          props.config.actions &&
          props.config.actions.includes("Add") ? (
            <Fragment>
              <div className="nopadding form-group d-inline-flex custom-fileUpload">
                <input
                  type="text"
                  name={props.id}
                  disabled="disabled"
                  className="form-control"
                />
                <div className="upload-btn-wrapper">
                  <button
                    type="button"
                    className="btn btn--transparent btnUpload"
                  >
                    {t("Browse")}
                  </button>
                  <input
                    accept={props.config.formats}
                    type="file"
                    id={`${props.id}_file`}
                    name={`${props.id}_file`}
                    onChange={e => {
                      props.onChange(e, props);
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>
            </Fragment>
          ) : (
            <Fragment>
              <div className="nopadding form-group d-inline-flex custom-fileUpload">
                <input
                  type="text"
                  name={props.id}
                  disabled="disabled"
                  className="form-control"
                />
                <div className="upload-btn-wrapper">
                  <button
                    type="button"
                    disabled="disabled"
                    className="btn btn--transparent btnUpload"
                  >
                    {t("Browse")}
                  </button>
                  <input disabled="disabled" type="file" />
                </div>
              </div>
            </Fragment>
          )}

          {props.config.format ? (
            <div className="col-12 nopadding">
              <small>
                {t("File Type")}: {props.config.format}
                {props.config.requiredString
                  ? `, ${t("Required")}: ${props.config.requiredString} ${t(
                      "files"
                    )}`
                  : ``}
              </small>
            </div>
          ) : (
            ""
          )}
          <p>&nbsp;</p>
          <ul id={`${props.id}_list`} className="uploadedList col-12 px-0">
            {props.attachments.map((r, i) => {
              if (r.attachmentHash != "" && r.attachmentHash !== undefined) {
                return (
                  <li>
                    <a
                      href={`/download/${r.attachmentHash}/${r.attachmentName}?filename=${r.attachmentName}&owner=${r.owner}`}
                      target="_blank"
                      className="gray-1"
                    >
                      {r.attachmentName}
                    </a>

                    {props.config &&
                    props.config.actions &&
                    props.config.actions.includes("Remove") ? (
                      <a
                        href="javascript:void(0);"
                        id={`${props.id}_list_${i}`}
                        onClick={e => {
                          props.onRemove(e, i, r, props);
                        }}
                      >
                        <i className="fa fa-times purple" />
                      </a>
                    ) : (
                      ""
                    )}
                  </li>
                );
              } else {
                return (
                  <li>
                    <a className="gray-1">{r.attachmentName}</a>

                    {props.config &&
                    props.config.actions &&
                    props.config.actions.includes("Remove") ? (
                      <a
                        href="javascript:void(0);"
                        id={`${props.id}_list_${i}`}
                        onClick={e => {
                          props.onRemove(e, i, r, props);
                        }}
                      >
                        <i className="fa fa-times purple" />
                      </a>
                    ) : (
                      ""
                    )}
                  </li>
                );
              }
            })}
          </ul>
        </div>
      </div>
    );
  }
};
export const CollapseItemCurrency = props => {
  let val = props.value;
  if (props.value == NaN || props.value == null) {
    val = "";
  }
  return (
    <div className="row">
      <p
        className={`col-${props.colLabel || 4} col-lg-${props.colLabel ||
          6} text-right px-0`}
      >
        {props.label || ""} :
      </p>
      <p
        className={`col-${props.colLabel ? 12 - props.colLabel : 8} col-lg-${
          props.colLabel ? 12 - props.colLabel : 6
        } text-right`}
      >
        {val != ""
          ? Intl.NumberFormat("th-TH", {
              useGrouping: true,
              maximumFractionDigits: 2,
              minimumFractionDigits: 2
            }).format(val)
          : "-"}{" "}
        {props.currency != "" && val != "" ? props.currency : ""}
      </p>
    </div>
  );
};

export const CollapseItemCheckbox = props => {
  if (props.canEdit == true) {
    return (
      <div className="row">
        <p
          className={`col-${props.colLabel || 4} col-lg-${props.colLabel ||
            6} text-right px-0`}
        >
          {props.label || ""} :
        </p>
        <div
          className={`col-${
            props.colLabel ? 12 - props.colLabel : 6
          } text-left d-inline-flex form-group`}
        >
          {props.items.map((itm, i) => {
            return (
              <div key={i} className="custom-control custom-radio">
                <input
                  type="radio"
                  className="custom-control-input"
                  name={`${props.id}`}
                  id={`${props.id}_${i}`}
                  value={itm.value}
                  checked={props.value === itm.value}
                  onChange={e => {
                    props.onChange(e);
                  }}
                />
                <label
                  className="custom-control-label"
                  htmlFor={`${props.id}_${i}`}
                >
                  {itm.label}
                </label>
              </div>
            );
          })}
        </div>
      </div>
    );
  } else {
    return (
      <div className="row">
        <p
          className={`col-${props.colLabel || 4} col-lg-${props.colLabel ||
            6} text-right px-0`}
        >
          {props.label || ""} :
        </p>
        <p
          className={`col-${
            props.colLabel ? 12 - props.colLabel : 6
          } text-left`}
        >
          {props.items.map(itm => {
            if (props.value === itm.value) {
              return itm.label;
            }
          })}
        </p>
      </div>
    );
  }
};
export const CollapseItemText = props => {
  const { t } = props;
  if (props.viewtype == "currency") {
    return (
      <div className="row">
        <p
          className={`col-${props.colLabel || 4} col-lg-${props.colLabel ||
            6} text-right px-0`}
        >
          {props.label || ""} :
        </p>
        <p
          className={`col-${
            props.colLabel ? 12 - props.colLabel : 6
          } d-flex flex-wrap px-0`}
          id={props.id || ""}
        >
          <span className="col-12 col-lg-6 text-right px-0">
            {props.value.padStart(16, " ") || "-"} {props.currencyUnit || ""}
          </span>
          {props.label == "Retention Amount" ? (
            <a
              href="javascript:void(0);"
              className="ml-10"
              data-placement="bottom"
              data-content={t(
                "This is an estimated amount and may be subjected to change as per agreement upon buyer and seller"
              )}
              data-toggle="popover"
            >
              <i
                className="fa fa-info-circle"
                style={{
                  WebkitTextStroke: "0px",
                  fontSize: "20px"
                }}
              />
            </a>
          ) : (
            ""
          )}
        </p>
      </div>
    );
  }
  return (
    <div className="row">
      <p
        className={`col-${props.colLabel || 4} col-lg-${props.colLabel ||
          6} text-right px-0`}
      >
        {props.label || ""} :
      </p>
      <p
        className={`col-${props.colLabel ? 12 - props.colLabel : 8} col-lg-${
          props.colLabel ? 12 - props.colLabel : 6
        } text-left`}
        id={props.id || ""}
      >
        {props.value || "-"}
        {props.label == "Retention Amount" ||
        props.label == "มูลค่าประกันงาน" ? (
          <a
            href="javascript:void(0);"
            className="ml-10"
            data-placement="bottom"
            data-content={t(
              "This is an estimated amount and may be subjected to change as per agreement upon buyer and seller"
            )}
            data-toggle="popover"
          >
            <i
              className="fa fa-info-circle"
              style={{
                WebkitTextStroke: "0px",
                fontSize: "20px"
              }}
            />
          </a>
        ) : (
          ""
        )}
      </p>
    </div>
  );
};
export class CollapseItemInvDrillDown extends React.Component {
  constructor(props) {
    super(props);
    this.apis = new api(this.props.domain).group("invoice");
    this.state = {
      invoiceList: [],
      lastValue: [],
      processingValue: []
    };
  }
  componentDidMount() {
    this.getInvoice();
  }
  componentWillReceiveProps(nextProps) {
    this.getInvoice();
  }
  getInvoice = async () => {
    const { label, href, moreHref, value } = this.props;
    if (value && typeof value == "object") {
      value.map(async (r, i) => {
        if (!this.state.lastValue.filter(s => s.name == r.name).length) {
          this.setState({ lastValue: [...this.state.lastValue, r] });
        }
      });
    }

    //let invoiceList = [];

    if (this.state.lastValue && typeof this.state.lastValue == "object") {
      this.state.lastValue.map(async (r, i) => {
        if (typeof r == "object") {
          const { name: n, href: h } = r;
          //this.setState({ lastValue: [...this.state.lastValue, r] });
          if (
            !this.state.invoiceList.filter(d => d.name == n).length &&
            !this.state.processingValue.filter(d => d.name == n).length
          ) {
            this.setState({
              processingValue: [...this.state.processingValue, r]
            });

            if (moreHref) {
              if (i < 4) {
                let inv = await this.checkInvoice(n);
                if (inv) {
                  let hh = h.replace("$linearId", inv);
                  let newInv = {
                    name: n,
                    href: hh
                  };
                  this.setState({
                    invoiceList: [...this.state.invoiceList, newInv]
                  });
                }
              }
            }
          }
        }
      });
    }
  };
  checkInvoice = async invoiceNumber => {
    try {
      let apis = new api(this.props.domain).group("invoice");
      let invoice = await apis.call("list", {
        invoiceNumber,
        role: this.props.user.organisationUnit,
        bypass: true
      });
      if (invoice && invoice.data.length == 1) {
        const { linearId } = invoice.data[0];
        return linearId;
      }
      return "";
    } catch (err) {
      console.log(err);
      return "";
    }
  };
  render() {
    const { label, href, moreHref, value } = this.props;

    if (typeof value == "object") {
      return (
        <div className="row">
          <p className="col-6 text-right px-0">{label || ""} :</p>
          <p className="col-6">
            {this.state.invoiceList.map((r, i) => {
              if (typeof r == "object") {
                const { name: n, href: h } = r;
                if (moreHref) {
                  if (i < 3) {
                    return (
                      <span>
                        <Link href={h || ""}>
                          <a key={n} className="purple font-bold underline">
                            {n || "-"}
                          </a>
                        </Link>
                        {i < value.length - 1 ? ", " : " "}
                      </span>
                    );
                  } else if (i == 3) {
                    return (
                      <span>
                        <Link href={moreHref || "#"}>
                          <a className="purple font-bold underline">See All</a>
                        </Link>
                      </span>
                    );
                  }
                } else {
                  return (
                    <span>
                      <Link href={h || ""}>
                        <a className="purple font-bold underline">{n || "-"}</a>
                      </Link>
                      {i < value.length - 1 ? ", " : " "}
                    </span>
                  );
                }
              } else {
                return (
                  <span>
                    <Link href={h || ""}>
                      <a className="purple font-bold underline">{r || "-"}</a>
                    </Link>
                    {i < value.length - 1 ? ", " : " "}
                  </span>
                );
              }
            })}
          </p>
        </div>
      );
    } else if (value === "-" || value === "" || value === "undefined") {
      return (
        <div className="row">
          <p className="col-6 text-right">{label || ""} :</p>
          <p className="col-6">-</p>
        </div>
      );
    } else {
      return (
        <div className="row">
          <p className="col-6 text-right">{label || ""} :</p>
          <p className="col-6">
            <Link href={href || ""}>
              <a className="purple font-bold underline">{value || "-"}</a>
            </Link>
          </p>
        </div>
      );
    }
  }
}
export class CollapseItemLink extends React.Component {
  render() {
    const { label, href, moreHref, value } = this.props;
    if (typeof value == "object") {
      return (
        <div className="row">
          <p className="col-6 text-right">{label || ""} :</p>
          <p className="col-6">
            {value.map((r, i) => {
              if (typeof r == "object") {
                const { name: n, href: h } = r;
                if (moreHref) {
                  if (i < 3) {
                    return (
                      <span>
                        <Link href={h || ""}>
                          <a className="purple font-bold underline">
                            {n || "-"}
                          </a>
                        </Link>
                        {i < value.length - 1 ? ", " : " "}
                      </span>
                    );
                  } else if (i == 3) {
                    return (
                      <span>
                        <Link href={moreHref || "#"}>
                          <a className="purple font-bold underline">See All</a>
                        </Link>
                      </span>
                    );
                  }
                } else {
                  return (
                    <span>
                      <Link href={h || ""}>
                        <a className="purple font-bold underline">{n || "-"}</a>
                      </Link>
                      {i < value.length - 1 ? ", " : " "}
                    </span>
                  );
                }
              } else {
                return (
                  <span>
                    <Link href={h || ""}>
                      <a className="purple font-bold underline">{r || "-"}</a>
                    </Link>
                    {i < value.length - 1 ? ", " : " "}
                  </span>
                );
              }
            })}
          </p>
        </div>
      );
    } else if (value === "-" || value === "" || value === "undefined") {
      return (
        <div className="row">
          <p className="col-6 text-right">{label || ""} :</p>
          <p className="col-6">-</p>
        </div>
      );
    } else {
      return (
        <div className="row">
          <p className="col-6 text-right">{label || ""} :</p>
          <p className="col-6">
            <Link href={href || ""}>
              <a className="purple font-bold underline">{value || "-"}</a>
            </Link>
          </p>
        </div>
      );
    }
  }
}
export class CollapseItemExternalLink extends React.Component {
  render() {
    const { label, href, value, colLabel } = this.props;
    if (typeof value == "object") {
      return (
        <div className="row">
          <p className={`col-${colLabel || 6} text-right`}>{label || ""} :</p>
          <p className={`col-${colLabel ? 12 - colLabel : 6}`}>
            {value.map((r, i) => {
              let { name: n, href: h } = r;
              if (h) {
                h = h.replace(/%/g, "");
              }
              if (typeof r == "object") {
                return (
                  <span key={i.toString()}>
                    {n || "-"}&nbsp;
                    <a
                      href={h || ""}
                      target="_blank"
                      className="purple font-bold underline"
                    >
                      Download
                    </a>
                    {i < value.length - 1 ? [<br />] : " "}
                  </span>
                );
              } else {
                return (
                  <span key={i.toString()}>
                    {r || "-"}&nbsp;
                    <a
                      href={h || ""}
                      target="_blank"
                      className="purple font-bold underline"
                    >
                      Download
                    </a>
                    {i < value.length - 1 ? [<br />] : " "}
                  </span>
                );
              }
            })}
          </p>
        </div>
      );
    } else if (value === "-") {
      return (
        <div className="row">
          <p
            className={`col-${colLabel || 4} col-lg-${colLabel ||
              6} text-right`}
          >
            {label || ""} :
          </p>
          <p className={`col-${colLabel ? 12 - colLabel : 6}`}>-</p>
        </div>
      );
    } else {
      return (
        <div className="row">
          <p
            className={`col-${colLabel || 4} col-lg-${colLabel ||
              6} text-right`}
          >
            {label || ""} :
          </p>
          <p className={`col-${colLabel ? 12 - colLabel : 6}`}>
            <Link href={href || ""}>
              <a className="purple font-bold underline">{value || "-"}</a>
            </Link>
          </p>
        </div>
      );
    }
  }
}
export class CollapseHistoryExternalLink extends React.Component {
  render() {
    const { href, value } = this.props;
    if (typeof value == "object") {
      return (
        <div className="text-left">
          {value.map((r, i) => {
            let { name: n, href: h } = r;
            if (h) {
              h = h.replace(/%/g, "");
            }
            if (typeof r == "object") {
              return (
                <span key={i.toString()}>
                  {n || "-"}&nbsp;
                  <a
                    href={h || ""}
                    target="_blank"
                    className="purple font-bold underline"
                  >
                    Download
                  </a>
                  {i < value.length - 1 ? [<br />] : " "}
                </span>
              );
            } else {
              return (
                <span key={i.toString()}>
                  {r || "-"}&nbsp;
                  <a
                    href={h || ""}
                    target="_blank"
                    className="purple font-bold underline"
                  >
                    Download
                  </a>
                  {i < value.length - 1 ? [<br />] : " "}
                </span>
              );
            }
          })}
        </div>
      );
    } else if (value === "-") {
      return (
        <div className="row">
          <p className="col-5 text-right" />
          <p className="col-7">-</p>
        </div>
      );
    } else {
      return (
        <div className="row">
          <p className="col-5 text-right" />
          <p className="col-7">
            <Link href={href || ""}>
              <a className="purple font-bold underline">{value || "-"}</a>
            </Link>
          </p>
        </div>
      );
    }
  }
}
export const CollapseItemLink2 = props => {
  return (
    <div className="row">
      <p className="col-6 text-right px-0">{props.label || ""} :</p>
      <p className="col-6">
        {props.value ? (
          <Link href={props.href || ""}>
            <a className="purple font-bold underline">{props.value || "-"}</a>
          </Link>
        ) : (
          "-"
        )}
      </p>
    </div>
  );
};

export class CollapseItemDatatable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isExpandedSideNavBar: false
    };
  }
  componentDidMount() {
    var _this = this;
    $.fn.dataTable.ext.errMode = "log";
    $(this.el).DataTable({
      language: {
        lengthMenu: "Display _MENU_ Per Page"
      },
      fixedHeader: true,
      stateSave: false,
      paging: false,
      bLengthChange: true,
      searching: false,
      info: false,
      ordering: true
    });
  }
  render() {
    const { column = [], items = [] } = this.props;
    let columns2 = [];
    return (
      <div className="table_wrapper">
        <table className="table table-2 datatable" ref={el => (this.el = el)}>
          <thead>
            <tr>
              {column.map((col, i) => {
                if (col.hidden == false) {
                  columns2.push(col.field);
                  return <th>{col.header}</th>;
                }
              })}
            </tr>
          </thead>
          <tbody>
            {items.map((itm, i) => {
              return [
                <tr>
                  {columns2.map(col => {
                    return <td>{itm[col]}</td>;
                  }, itm)}
                </tr>
              ];
            })}
          </tbody>
        </table>
      </div>
    );
  }
}
export class Collapse extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isExpandedSideNavBar: false
    };
  }
  render() {
    const { children } = this.props;
    var { collapseHeader, button, disabledUnderLine } = this.props;
    if (!collapseHeader) {
      collapseHeader = ["Title"];
    }
    if (!button) {
      button = [];
    }
    return (
      <div className={`row box ${this.props.className}`}>
        <a
          href={`#${this.props.id}`}
          data-toggle="collapse"
          role="button"
          aria-expanded={this.props.expanded || "false"}
          area-controls={`#${this.props.id}`}
          className="d-flex w-100 btnToggle"
        >
          {collapseHeader.map((title, i) => {
            let col = 12 / collapseHeader.length;
            if (i + 1 == collapseHeader.length) {
              return (
                <Fragment>
                  <div key={i.toString()} className={`col-${col}`}>
                    <div className="row">
                      <div
                        className={`${
                          button.length < 1 ? "col-12" : "col-8 col-lg-6"
                        } ${disabledUnderLine ? "" : "border-bottom"} gray-1`}
                      >
                        <h3>{title}</h3>
                      </div>
                      {button.length > 0 ? (
                        <div
                          className={`col-4 col-lg-6 text-right ${
                            disabledUnderLine ? "" : "border-bottom"
                          } gray-1`}
                        >
                          {button.map(b => {
                            return (
                              <button
                                className="btn btn--transparent btn-wide mr-2 mb-15"
                                data-toggle="modal"
                                data-target="#openColumnDisplay"
                              >
                                {b.label}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        ""
                      )}
                    </div>
                    {button.length < 1 ? (
                      <span>
                        <i
                          className="fa fa-chevron-up gray-1"
                          aria-hidden="true"
                        />
                        <i
                          className="fa fa-chevron-down gray-1"
                          aria-hidden="true"
                        />
                      </span>
                    ) : (
                      ""
                    )}
                  </div>
                </Fragment>
              );
            } else {
              return (
                <div className={`col-${col} border-bottom`}>
                  <h3 className="gray-1">{title}</h3>
                </div>
              );
            }
          })}
        </a>
        <div
          id={this.props.id}
          className={`collapse multi-collapse w-100 ${
            this.props.expanded == "true" ? "show" : ""
          }`}
        >
          <div className="card card-body noborder">{children}</div>
        </div>
      </div>
    );
  }
}
export class CollapseNoExpand extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isExpandedSideNavBar: false
    };
  }
  render() {
    const { children } = this.props;
    var { collapseHeader, id } = this.props;
    return (
      <div className={`row box ${this.props.className}`}>
        <div className="col-12">
          <div className="row">
            <div className="col-12 border-bottom">
              <h3>{collapseHeader}</h3>
            </div>
          </div>
        </div>
        <div id={id} className=" multi-collapse w-100 ">
          <div className=" card-body noborder">{children}</div>
        </div>
      </div>
    );
  }
}

export class CollapseNoExpandWithButton extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isExpandedSideNavBar: false
    };
  }

  render() {
    const { children } = this.props;
    var { collapseHeader, button } = this.props;
    if (!button) {
      button = [];
    }
    return (
      <div className="row box">
        <div className="col-12">
          <div className="row">
            <div className="col-6 border-bottom">
              <h3>{this.props.collapseHeader}</h3>
            </div>
            <div className={`col-6 text-right border-bottom gray-1`}>
              {button.map(b => {
                if (b.role === "columnDisplay") {
                  return (
                    <button
                      className={b.attr.className}
                      data-toggle={b.attr.dataToggle}
                      data-target={b.attr.dataTarget}
                    >
                      {b.label}
                    </button>
                  );
                } else {
                  return (
                    <button
                      className={b.attr.className}
                      onClick={b.attr.onClick}
                    >
                      {b.label}
                    </button>
                  );
                }
              })}
            </div>
          </div>
        </div>
        <div id={this.props.id} className=" multi-collapse w-100 ">
          <div className="card card-body noborder">{children}</div>
        </div>
      </div>
    );
  }
}
export class SuggestionText extends React.Component {
  constructor(props) {
    super(props);
    this.apiurl = this.props.apiurl;
    this.api = new ApiService();
    this.searchApi = this.searchApi.bind(this);
    this.requestTimer = null;
    this.state = {
      value: "",
      items: []
    };
  }
  componentDidMount() {
    var _this = this;
    var context = this.context;
  }
  searchApi(value) {
    var apiUrl = this.apiurl;
    var api = this.api;
    var id = this.props.id;
    var _this = this;
    return setTimeout(function() {
      if (apiUrl != undefined) {
        api
          .getApi(apiUrl + value)
          .then(resapi => {
            let r = [];
            for (let x = 1; x < resapi.data.length; x++) {
              if (typeof resapi.data[x] == "string") {
                r.push({
                  abbr: resapi[x],
                  name: resapi[x]
                });
              } else {
                r.push({
                  abbr: resapi.data[x].externalId,
                  name: resapi.data[x].externalId
                });
              }
            }
          })
          .catch(err => {
            console.warn(err.message);
          });
      }
    }, 500);
  }
  render() {
    let value = this.props.value;
    return (
      <Autocomplete
        inputProps={{
          type: "text",
          id: this.props.id,
          className: this.props.className,
          placeholder: this.props.placeholder
        }}
        getItemValue={item => item.label}
        items={this.state.items}
        renderItem={(item, isHighlighted) => (
          <div style={{ background: isHighlighted ? "lightgray" : "white" }}>
            {item.label}
          </div>
        )}
        value={this.state.value}
        onChange={(event, value) => {
          this.setState({ value });
          clearTimeout(this.requestTimer);
          this.requestTimer = this.searchApi(value);
        }}
        onSelect={value => this.setState({ value })}
      />
    );
  }
}

export class Option extends React.Component {
  constructor(props) {
    super(props);

    this.api = new ApiService();
    this.handleChange = this.handleChange.bind(this);
    let defaultValue = props.defaultValue || "";
    this.state = {
      optionList: [],
      value: defaultValue
    };
  }
  async componentDidMount() {
    var _this = this;
    this.defaultValue = this.props.defaultValue || "";
    this.setState({ value: this.defaultValue });
    var context = this.context;
    let apiUrl = this.props.apiurl;

    if (this.props.apiService && apiUrl) {
      const response = await this.props.apiService.callApi({
        url: apiUrl,
        options: { method: "GET" }
      });

      if (response.status) {
        const data = response.data.rows ? response.data.rows : response.data;
        const optionList = [];

        for (let i = 0; i < data.length; i++) {
          if (typeof data[i] == "string") {
            optionList.push({
              name: data[i],
              value: data[i]
            });
          } else {
            optionList.push(data[i]);
          }
        }

        this.setState({ optionList: optionList });
      }
    } else if (apiUrl != undefined) {
      this.api
        .getApi(apiUrl)
        .then(resapi => {
          let r = [];
          for (let x = 0; x < resapi.length; x++) {
            if (typeof resapi[x] == "string") {
              r.push({
                name: resapi[x],
                value: resapi[x]
              });
            } else {
              r.push(resapi[x]);
            }
          }
          this.setState({ optionList: r });
        })
        .catch(err => {
          console.warn(err.message);
        });
    }
  }
  handleChange = event => {
    this.setState({ value: event.target.value });
  };
  componentDidUpdate(prevProps) {
    if (this.props.defaultValue !== prevProps.defaultValue) {
      this.setState({ value: this.props.defaultValue });
      this.defaultValue = this.props.defaultValue || "";
    }
  }
  render() {
    let options = this.props.options || this.state.optionList;
    let id = this.props.id;
    let title = this.props.title;
    let { t } = this.props;
    let defaultValue = this.props.defaultValue || "";
    let optionItems;
    if (options != undefined) {
      optionItems = options.map((opt, i) => {
        return (
          <option key={i} value={opt.value}>
            {t ? t(opt.name.replace(/[.]/g, "")) : opt.name}
          </option>
        );
      });
    }

    return (
      <select
        className="custom-select input-search"
        id={id}
        placeholder={title}
        value={this.state.value}
        onChange={this.handleChange}
      >
        <option value="">{t ? t(title.replace(/[.]/g, "")) : title}</option>

        {optionItems}
      </select>
    );
  }
}
export class DateText extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }
  componentDidMount() {
    var _this = this;
    var context = this.context;

    $("input.datepicker").daterangepicker({
      singleDatePicker: true,
      showDropdowns: true,
      autoApply: true,
      locale: {
        format: "DD/MM/YYYY"
      }
    });
  }
  render() {
    const { name, canEdit, value, label, onChange } = this.props;
    return (
      <div className="row">
        <p className="col-5 text-right">{label} :</p>
        {canEdit === false ? (
          <p className="col-7">
            <strong className="purple">
              {moment(value).format("DD/MM/YYYY")}{" "}
              <i className="fa fa-calendar" />
            </strong>
          </p>
        ) : (
          <p
            style={{ cursor: "pointer" }}
            className="col-6"
            data-toggle="modal"
            data-target={`#${name}`}
          >
            <strong className="purple">
              {moment(value).format("DD/MM/YYYY")}{" "}
              <i className="fa fa-calendar" />
            </strong>
          </p>
        )}
        <div
          id={`${name}`}
          className="modal hide fade"
          tabIndex={-1}
          role="dialog"
          aria-labelledby={`revise${name}`}
          aria-hidden="true"
        >
          <div className="modal-dialog modal-sm" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="text-center w-100">Revise {label}</h3>
              </div>
              <div className="modal-body">
                <div className="form-label-group">
                  <input
                    type="text"
                    id={`Revise ${label}`}
                    className="form-control datepicker"
                    name={name}
                    placeholder={`Revise ${label}`}
                    defaultValue={moment(value).format("DD/MM/YYYY")}
                    ref={c => (this.datepacker = c)}
                  />

                  <label htmlFor={name}>{`Revise ${label}`}</label>
                </div>
              </div>
              <div className="modal-footer justify-content-center">
                <button
                  type="button"
                  name="btnCloseModal"
                  id="btnCloseModal"
                  className="btn btn-wide btn--transparent"
                  data-dismiss="modal"
                  aria-hidden="true"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  name="btnConfirmCancel"
                  id="btnConfirmCancel"
                  className="btn btn-wide"
                  data-dismiss="modal"
                  onClick={e => onChange(this.datepacker.value)}
                >
                  Change
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
export class CollapseItemRevised extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hiddenBtnChange: false
    };
  }
  bindOnClick = async value => {
    const { onChange } = this.props;
    try {
      this.setState({ hiddenBtnChange: true });
      const res = await onChange(value);
    } catch (err) {
      this.setState({ hiddenBtnChange: false });
    }
  };
  render() {
    const { name, label, remark, value, onChange } = this.props;

    return (
      <div className="row">
        <p className="col-5 text-right">{label || ""} :</p>
        <p className="col-7">
          <Link href="#">
            <a
              id={name}
              className={`purple font-bold underline ${name}`}
              data-toggle="modal"
              data-target={`#modal${name}`}
            >
              {value !== undefined
                ? [
                    value,
                    " ",
                    <svg
                      width="14px"
                      height="14px"
                      viewBox="0 0 14 14"
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      xmlnsXlink="http://www.w3.org/1999/xlink"
                    >
                      <g
                        id="GR"
                        stroke="none"
                        strokeWidth={1}
                        fill="none"
                        fillRule="evenodd"
                      >
                        <g
                          id="GR_detail"
                          transform="translate(-1073.000000, -709.000000)"
                          fill="#AF3694"
                        >
                          <g
                            id="02_gr_information"
                            transform="translate(167.000000, 480.000000)"
                          >
                            <g
                              id="tb_revised_delivery_date"
                              transform="translate(778.000000, 221.000000)"
                            >
                              <path
                                d="M136.705228,10.3363467 L139.553335,13.1987652 L132.344588,20.4418251 L129.498721,17.5809467 L136.705228,10.3363467 Z M141.714475,9.64616016 L140.444657,8.36969931 C140.208957,8.1328935 139.888489,8 139.554357,8 C139.220225,8 138.899757,8.1328963 138.664058,8.37024533 L137.44783,9.59256594 L140.295378,12.4544244 L141.714531,11.0280454 L141.714531,11.0285928 C142.095156,10.646307 142.095156,10.0283214 141.714531,9.64603555 L141.714475,9.64616016 Z M128.007889,21.6034949 C127.98328,21.7128745 128.017185,21.8277282 128.09648,21.9064815 C128.176322,21.9852347 128.291161,22.0169545 128.399995,21.9912508 L131.573456,21.2179428 L128.727589,18.3560846 L128.007889,21.6034949 Z"
                                id="Fill-1-Copy"
                              />
                            </g>
                          </g>
                        </g>
                      </g>
                    </svg>
                  ]
                : "-"}
            </a>
          </Link>
        </p>
        <div
          id={`modal${name}`}
          className="modal hide fade"
          tabIndex={-1}
          role="dialog"
          aria-labelledby={name}
          aria-hidden="true"
        >
          <div className="modal-dialog modal-sm" role="document">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="text-center w-100">{label}</h3>
              </div>
              <div className="modal-body">
                <div className="form-label-group">
                  <input
                    type="text"
                    id="invoice_no"
                    className="form-control"
                    placeholder={label}
                    defaultValue={value}
                    ref={c => (this.reviseval = c)}
                    required
                    autofocus
                  />
                  <label htmlFor="invoice_no">{label}</label>
                </div>
                {remark != "" ? (
                  <p className="message c-red">{remark}</p>
                ) : (
                  <span />
                )}
              </div>
              <div className="modal-footer justify-content-center">
                <button
                  type="button"
                  name="btnCloseModal"
                  id="btnCloseModal"
                  className="btn btn-wide btn--transparent"
                  data-dismiss="modal"
                  aria-hidden="true"
                >
                  Cancel
                </button>
                {typeof onChange == "function" ? (
                  <button
                    type="button"
                    name="btnConfirmCancel"
                    id="btnConfirmCancel"
                    className="btn btn-wide"
                    onClick={e => this.bindOnClick(this.reviseval.value)}
                  >
                    Change
                  </button>
                ) : (
                  <span />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export class inputAutoComplete extends Component {
  render() {
    return <div />;
  }
}

export class ModalDefault extends Component {
  render() {
    const { id, header, children, button, isOnlyText } = this.props;

    return (
      <div id={id} className="modal fade" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h3 id="myModalLabel">{header}</h3>
            </div>
            {isOnlyText ? (
              <div className="modal-body text-center">
                <div className="text">
                  <span>{children}</span>
                </div>
              </div>
            ) : (
              <div className="modal-body d-flex">
                <div className="container-fluid">{children}</div>
              </div>
            )}

            <div className="modal-footer justify-content-center">
              {button.map(b => {
                if (b.role === "cancel") {
                  return (
                    <input
                      type={b.type}
                      name={b.name}
                      id={b.id}
                      className={b.className}
                      data-dismiss="modal"
                      aria-hidden="true"
                      onClick={b.onClick}
                      value={b.label}
                    />
                  );
                } else {
                  return (
                    <input
                      type={b.type}
                      name={b.name}
                      id={b.id}
                      className={b.className}
                      data-dismiss="modal"
                      aria-hidden="true"
                      onClick={b.onClick}
                      value={b.label}
                    />
                  );
                }
              })}
            </div>
          </div>
        </div>
      </div>
    );
  }
}

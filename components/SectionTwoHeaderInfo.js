import _ from "lodash";

import Fields from "./Fields";
import { withTranslation } from "~/i18n";

/**
 * Component for render section two header information
 *
 * @param [id] is a id of component (required)
 * @param [id2] is a second id of second component (required)
 * @param [classColumnWidth] is a css class
 * @param [datas] is a data of field (required)
 * @param [modelOne] is a model field in column one (required)
 * @param [modelTwo] is a model field in column two (required)
 */
const SectionTwoHeaderInfo = ({
  id,
  id2,
  classColumnWidth = "w-100",
  datas,
  modelOne,
  modelTwo,
  collapse = true,
  t
}) => (
  <React.Fragment>
    {/* Desktop Version - Start */}
    <div className="d-none d-lg-flex flex-wrap box">
      <a
        href={`#${collapse ? id : ""}`}
        data-toggle="collapse"
        role="button"
        aria-expanded={true}
        area-controls={id}
        className={`d-flex ${classColumnWidth} btnToggle`}
      >
        <div className="col-6 border-bottom">
          <h3 className="gray-1">{t(`${modelOne.lang}:${modelOne.header}`)}</h3>
        </div>
        <div className="col-6">
          <div className="row">
            <div className="col-6 border-bottom gray-1">
              <h3>{t(`${modelTwo.lang}:${modelTwo.header}`)}</h3>
            </div>
            <div className="col-6 text-right border-bottom gray-1" />
          </div>
          {collapse && (
            <span>
              <i className="fa fa-chevron-up gray-1" aria-hidden={true} />
              <i className="fa fa-chevron-down gray-1" aria-hidden={true} />
            </span>
          )}
        </div>
      </a>
      <div
        id={id}
        className={`collapse multi-collapse ${classColumnWidth} show`}
      >
        <div className="card card-body noborder">
          <div className="row">
            <div className="col-6">
              <Fields model={modelOne} datas={datas} classField="row" />
            </div>
            <div className="col-6">
              <Fields model={modelTwo} datas={datas} classField="row" />
            </div>
          </div>
        </div>
      </div>
    </div>
    {/* Desktop Version - End */}

    {/* Mobile Version - Start */}
    <div className="d-flex d-lg-none flex-wrap box">
      {/* Model One - Start */}
      <a
        href={`#${collapse ? id : ""}`}
        data-toggle="collapse"
        role="button"
        aria-expanded={true}
        area-controls={id}
        className={`d-flex ${classColumnWidth} btnToggle`}
      >
        <div className="col-12">
          <div className="row">
            <div className="col-12 border-bottom gray-1">
              <h3>{modelOne.header}</h3>
            </div>
            {/* <div className="col-6 text-right border-bottom gray-1" /> */}
          </div>
          {collapse && (
            <span>
              <i className="fa fa-chevron-up gray-1" aria-hidden={true} />
              <i className="fa fa-chevron-down gray-1" aria-hidden={true} />
            </span>
          )}
        </div>
      </a>
      <div
        id={id}
        className={`collapse multi-collapse ${classColumnWidth} show`}
      >
        <div className="card card-body noborder">
          <div className="d-flex flex-wrap px-0">
            <div className="col-12">
              <Fields model={modelOne} datas={datas} classField="row" />
            </div>
          </div>
        </div>
      </div>
      {/* Model One - End */}
    </div>

    <div className="d-flex d-lg-none flex-wrap box">
      {/* Model Two - Start */}
      <a
        href={`#${collapse ? id2 : ""}`}
        data-toggle="collapse"
        role="button"
        aria-expanded={true}
        area-controls={id2}
        className={`d-flex ${classColumnWidth} btnToggle`}
      >
        <div className="col-12">
          <div className="row">
            <div className="col-12 border-bottom gray-1">
              <h3>{modelTwo.header}</h3>
            </div>
            {/* <div className="col-6 text-right border-bottom gray-1" /> */}
          </div>
          {collapse && (
            <span>
              <i className="fa fa-chevron-up gray-1" aria-hidden={true} />
              <i className="fa fa-chevron-down gray-1" aria-hidden={true} />
            </span>
          )}
        </div>
      </a>
      <div
        id={id2}
        className={`collapse multi-collapse ${classColumnWidth} show`}
      >
        <div className="card card-body noborder">
          <div className="d-flex flex-wrap px-0">
            <div className="col-12">
              <Fields model={modelTwo} datas={datas} classField="row" />
            </div>
          </div>
        </div>
      </div>
      {/* Model Two - End */}
    </div>
    {/* Mobile Version - End */}
  </React.Fragment>
);

export default withTranslation([
  "debit-detail",
  "request-detail",
  "detail",
  "request-edit",
  "request-create"
])(SectionTwoHeaderInfo);

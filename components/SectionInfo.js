import _ from "lodash";

import Fields from "./Fields";
import { withTranslation } from "~/i18n";

/**
 * Component for render section information
 *
 * @param [id] is a id of component (required)
 * @param [classColumnWidth] is a css class
 * @param [datas] is a data of field (required)
 * @param [header] is a title of header (required)
 * @param [modelOne] is a model field in column one (required)
 * @param [modelTwo] is a model field in column two (required)
 */
const SectionInfo = ({
  id,
  classColumnWidth = "w-100",
  datas,
  header,
  modelOne,
  modelTwo,
  t
}) => (
  <div className="d-flex flex-wrap box">
    <a
      href={`#${id}`}
      data-toggle="collapse"
      role="button"
      aria-expanded={true}
      area-controls={id}
      className={`d-flex ${classColumnWidth} btnToggle`}
    >
      <div className="col-12">
        <div className="row">
          <div className="col-12 border-bottom gray-1">
            <h3>{t(`${modelOne.lang}:${header}`)}</h3>
          </div>
          {/* <div className="col-6 text-right border-bottom gray-1" /> */}
        </div>
        <span>
          <i className="fa fa-chevron-up gray-1" aria-hidden={true} />
          <i className="fa fa-chevron-down gray-1" aria-hidden={true} />
        </span>
      </div>
    </a>
    <div id={id} className={`collapse multi-collapse ${classColumnWidth} show`}>
      <div className="card card-body noborder">
        <div className="d-flex flex-wrap d-lg-row">
          <div className="col-12 col-lg-6 px-0 ">
            <Fields
              model={modelOne}
              datas={datas}
              classField="d-flex flex-wrap"
            />
          </div>
          <div className="col-12 col-lg-6 px-0 mt-3 mt-lg-0">
            <Fields
              model={modelTwo}
              datas={datas}
              classField="d-flex flex-wrap"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);

export default withTranslation([
  "debit-detail",
  "request-detail",
  "detail",
  "request-edit"
])(SectionInfo);

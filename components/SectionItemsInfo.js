import { Fragment } from "react";

import HeaderDataTable from "../components/DataTables/HeaderDataTable";
import { withTranslation } from "~/i18n";

/**
 * Component for render section item table information
 *
 * @param [id] is a id of component (required)
 * @param [model] is a model field of table (required)
 * @param [tableListIndex] is a index list of table (required when moreTable = true)
 * @param [datas] is a data of field (required)
 * @param [renderRowsTable] is a generate row of data include tag <tr> (required)
 * @param [header] is a title of header (required)
 * @param [childHeaderFirst] is a first title of sub header
 * @param [childHeaderLast] is a last title of sub header
 * @param [classTable] is a style of component HeaderDataTable
 * @param [moreTable] is a flag for render more table
 */
const SectionItemsInfo = ({
  id = "",
  model = [],
  tableListIndex = [],
  datas = [],
  renderRowsTable,
  header = "",
  childHeaderFirst = "",
  childHeaderLast = "",
  classTable = "",
  moreTable = false,
  t,
  lang = ""
}) => (
  <Fragment>
    <div className="box__header">
      <div className="row justify-content-between align-items-center">
        <div className="col">
          <h4 className="mb-0">{t(`${lang}:${header}`)}</h4>
        </div>
      </div>
    </div>
    {moreTable ? (
      tableListIndex &&
      tableListIndex.map((listIndex, index) => (
        <div key={listIndex + index} className="box__inner">
          <div className="row box">
            <a
              href={`#${id}${listIndex}`}
              data-toggle="collapse"
              role="button"
              aria-expanded="true"
              area-controls={id + listIndex}
              className="d-flex w-100 btnToggle"
            >
              <div className="col-12">
                <div className="row">
                  <div className="col-6 border-bottom gray-1">
                    <h3>{`${t(
                      `${lang}:${childHeaderFirst}`
                    )}  ${listIndex}  ${childHeaderLast}`}</h3>
                  </div>
                  <div className="col-6 text-right border-bottom gray-1" />
                </div>
                <span>
                  <i className="fa fa-chevron-up gray-1" aria-hidden="true" />
                  <i className="fa fa-chevron-down gray-1" aria-hidden="true" />
                </span>
              </div>
            </a>
            <div
              id={id + listIndex}
              className={`collapse multi-collapse w-100 show`}
            >
              <div className="table_wrapper">
                <HeaderDataTable
                  model={model}
                  classTable={classTable}
                  rowDatas={renderRowsTable(datas[listIndex])}
                  lang={lang}
                />
              </div>
            </div>
          </div>
        </div>
      ))
    ) : (
      <div className="table_wrapper">
        <div className="box__inner">
          <HeaderDataTable
            model={model}
            classTable={classTable}
            rowDatas={renderRowsTable(datas)}
            lang={lang}
          />
        </div>
      </div>
    )}
  </Fragment>
);

export default withTranslation([
  "debit-create",
  "request-detail",
  "request-create"
])(SectionItemsInfo);

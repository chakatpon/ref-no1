import { isEmpty } from "lodash";
import styled from "styled-components";
import { withTranslation } from "~/i18n";

const Table = styled.table`
  text-align: center;
`;

/**
 * Component for render table
 *
 * @param [model] is a model field of table (required)
 * @param [refs] is a reference of jQuery datatable (required when use jQuery datatable)
 * @param [rowDatas] is a generate row of data include tag <tr> (required when not use jQuery datatable and refs is null)
 * @param [classTable] is a style of component HeaderDataTable
 */
const HeaderDataTable = ({
  model = [],
  refs = null,
  rowDatas = [],
  classTable = "",
  t,
  lang = ""
}) => (
  <Table className={`table dataTable ${classTable}`} ref={refs}>
    <thead className="bg-lightgrey">
      <tr>
        {model.map((column, index) => (
          <th
            id={`header-${column.data + index}`}
            key={`header-${column.data + index}`}
          >
            {column.data === "selected" ? (
              <input id="selectAll" type="checkbox" />
            ) : (
              t(`${lang}:${column.header.replace(/[.]/g, "")}`)
            )}
          </th>
        ))}
      </tr>
    </thead>
    {refs === null && <tbody>{rowDatas}</tbody>}
  </Table>
);

export default withTranslation(["request-detail", "debit-create"])(
  HeaderDataTable
);

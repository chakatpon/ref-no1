import Workbook from "react-excel-workbook";

const isTrue = value => value == "true" || value == true;

const filteredColumns = columns => {
  return columns.filter(column => {
    if (
      column.hidden !== null &&
      !isTrue(column.hidden) &&
      isTrue(column.export)
    ) {
      return true;
    } else {
      return false;
    }
  });
};

/**
 * Component export excel file.
 *  @type function
 *  @param {array} sheets is a page of document
 *    [
 *      {
 *        name: "Sheet 1",
 *        columns: [] // column for sheet 1
 *      },
 *      {
 *        name: "Sheet 2",
 *        columns: [] // column for sheet 2
 *      },
 *      {
 *        ...sheet xxx
 *      }
 *    ]
 *  @param {array} datas is a data of document
 *    [
 *      ...data for sheet 1,
 *      ...data for sheet 2,
 *      ...data for sheet xxx
 *    ]
 *  @param {string} fileName is a file name of document
 *    (i.e. xxx.xlsx)
 */
const Excel = ({ sheets = [], datas = [], fileName = "" }) => {
  return (
    <Workbook
      filename={fileName}
      element={<button id="exportExcelButton" style={{ display: "none" }} />}
    >
      {sheets.map((sheet, sheetIndex) => {
        const columns = filteredColumns(sheet.columns);
        return (
          <Workbook.Sheet
            key={sheet.name + sheetIndex}
            data={datas[sheetIndex]}
            name={sheet.name}
          >
            {columns.map((column, columnIndex) => (
              <Workbook.Column
                key={column.header + columnIndex}
                label={column.header}
                value={column.field}
              />
            ))}
          </Workbook.Sheet>
        );
      })}
    </Workbook>
  );
};

export default Excel;

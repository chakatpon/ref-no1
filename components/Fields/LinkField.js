import { Fragment } from "react";
import Link from "next/link";
import _ from "lodash";
/**
 * Component for render detail field
 *
 * @param [field] is a field, we need property
 * {
 *    condition: is condition for display value
 *    defaultValue: is value for display when condition is true
 * }
 * @param [datas] is a data of field (required)
 */
const LinkField = ({ field, datas }) => (
  <Fragment>
    <div style={field.styleInput}>
      {_.has(datas, field.key) &&
      datas[field.key]["title"] &&
      datas[field.key]["title"] !== "-" ? (
        <Link
          href={
            _.has(datas, field.key) && _.has(datas[field.key], "href")
              ? datas[field.key]["href"]
              : ""
          }
        >
          <a>
            {_.has(datas, field.key) && _.has(datas[field.key], "title")
              ? datas[field.key]["title"]
              : field.defaultValue || ""}
          </a>
        </Link>
      ) : (
        field.defaultValue || ""
      )}
    </div>
  </Fragment>
);

export default LinkField;

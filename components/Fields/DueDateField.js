import { Fragment } from "react";
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
const DueDateField = ({ field, datas }) => {
  return (
    <Fragment>
      {_.has(datas, field.key) && datas[field.key] ? (
        _.has(field, "canEdit") && field.canEdit ? (
          <a
            href="#"
            onClick={event => {
              event.preventDefault();
              _.has(field, "onClick") ? field.onClick.call(this, event) : {};
            }}
          >
            {datas[field.key]} &nbsp;
            <svg
              width="15px"
              height="16px"
              viewBox="0 0 19 20"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              xmlnsXlink="http://www.w3.org/1999/xlink"
            >
              <g
                id="Invoice"
                stroke="none"
                strokeWidth={1}
                fill="none"
                fillRule="evenodd"
              >
                <g
                  id="02_Invoice_Detail_Default"
                  transform="translate(-1064.000000, -584.000000)"
                  fill="#AF3694"
                >
                  <g
                    id="02_payment_information"
                    transform="translate(166.000000, 480.000000)"
                  >
                    <g
                      id="tb_revised_payment_due_date"
                      transform="translate(801.000000, 102.000000)"
                    >
                      <path
                        d="M106,19.9404 L112.07,13.8794 L114.12,15.8794 L108.06,22.0004 L106,22.0004 L106,19.9404 Z M115.7,14.3494 L114.7,15.3494 L112.65,13.3504 L113.65,12.3504 C113.85,12.1404 114.19,12.1294 114.42,12.3504 L115.7,13.6294 C115.89,13.8304 115.89,14.1504 115.7,14.3494 Z M113,4.0004 L112,4.0004 L112,2.0004 L110,2.0004 L110,4.0004 L102,4.0004 L102,2.0004 L100,2.0004 L100,4.0004 L99,4.0004 C97.896,4.0004 97,4.8954 97,6.0004 L97,20.0004 C97,21.1044 97.896,22.0004 99,22.0004 L104,22.0004 L104,20.0004 L99,20.0004 L99,9.0004 L113,9.0004 L113,10.0004 L115,10.0004 L115,6.0004 C115,4.8954 114.104,4.0004 113,4.0004 Z"
                        id="Fill-1"
                      />
                    </g>
                  </g>
                </g>
              </g>
            </svg>
          </a>
        ) : (
          datas[field.key]
        )
      ) : (
        <span>-</span>
      )}
    </Fragment>
  );
};

export default DueDateField;

export const DEBIT_AUTH = {
  CREATE: "DN-Create",
  CANCEL: "DN-Cancel",
  EDIT: "DN-Edit",
  VIEW: "DN-List",
  VIEW_DETAIL: "DN-Detail",
  EXPORT: "DN-Export",
  APPROVE: "DN-Approval",
  REVISE_DUE_DATE: "DN-Edit-PaymentDueDate"
};

export const REQUEST_AUTH = {
  CREATE: "Request-Create",
  EXPORT: "Request-Export",
  SEND: "Request-Send",
  VIEW: "Request-Detail",
  APPROVE: "Request-Approval",
  EDIT: "Request-Edit",
  CANCEL: "Request-Cancel"
};

export const DOA_AUTH = {
  VIEW: "DOA-List",
  VIEW_DETAIL: "DOA-Detail",
  APPROVE: "DOA-Approval"
};

export const MONITOR_LIV_AUTH = {
  VIEW: "MONITOR-LIV-List",
  REPOST: "MONITOR-LIV-Repost",
  EXPORT: "MONITOR-LIV-Export"
};

export const INVOICE_AUTH = {
  EDIT: "Invoice-Edit",
  HOLD: "Invoice-Hold",
  UNHOLD: "Invoice-Unhold",
  CREATE: "Invoice-Create",
  APPROVE_DOA: "DOA-Approval",
  APPROVE_3WM: "3WM-Approval",
  REJECT_INVOICE_AFTER_DOA: "Invoice-Reject-After-DOA",
  EDIT_DUE_DATE: "Invoice-Edit-PaymentDueDate",
  VIEW: "Invoice-List",
  VIEW_DETAIL: "Invoice-Detail",
  VIEW_DOA: "DOA-List",
  VIEW_DOA_DETAIL: "DOA-Detail",
  VIEW_MATCHMAKER: "3WM-List",
  VIEW_MATCHMAKER_DETAIL: "3WM-Detail",
  CANCEL: "Invoice-Cancel",
  TAG_UNTAG_GOODS_RECEIVED: "Invoice-Tag-Goods-Received"
};

export const CREDIT_AUTH = {
  CREATE: "CN-Create",
  VIEW: "CN-List",
  VIEW_2WM_MATCHMAKER: "2WM-List",
  VIEW_2WM_MATCHMAKER_DETAIL: "2WM-Detail",
  VIEW_DETAIL: "CN-Detail",
  APPROVE_2WM_QUANTITY: "2WM-Approval",
  APPROVE_PRICE: "CN-Subsequent-Approval",
  REJECT_2WM_QUANTITY: "2WM-Approval",
  REJECT_PRICE: "CN-Subsequent-Approval",
  EDIT_QUANTITY: "CN-Edit",
  EDIT_PRICE: "CN-Edit",
  TAG_UNTAG_GOODS_RECEIVED: "CN-Tag-Goods-Received"
};

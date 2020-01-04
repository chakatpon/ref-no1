import { DEBIT_ATTACHMENT_TYPE } from "../../../configs/attachmentType.config";

const { DEBIT_NOTE, RECEIPT, OTHERS } = DEBIT_ATTACHMENT_TYPE;

export const MODEL_ATTACHMENT = [
  {
    attachments: [
      {
        name: "Debit Note",
        type: DEBIT_NOTE
      }
    ]
  },
  {
    attachments: [
      {
        name: "Receipt",
        type: RECEIPT
      },
      {
        name: "Others",
        type: OTHERS
      }
    ]
  }
];

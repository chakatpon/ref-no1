const menuItems = [
  {
    link: "purchase-order",
    icon: "icon icon-PO",
    label: "Purchase Order",
    menukey: "po",
    onMobile: true,
    authority: ["PO-List", "PO-Delivery-List"],
    subMenu: [
      {
        link: "purchase-order",
        icon: "icon icon-PO",
        label: "PO List",
        menukey: "po",
        onMobile: true,
        authority: ["PO-List"]
      },
      {
        link: "po-delivery-schedule",
        icon: "icon-additional icon-PO_Deliv_Schedule",
        label: "PO Delivery Schedule",
        menukey: "pods",
        onMobile: true,
        authority: ["PO-Delivery-List"]
      }
    ]
  },
  {
    link: "good-receives",
    icon: "icon icon-GR",
    label: "Goods Receipt",
    menukey: "gr",
    onMobile: true,
    authority: ["GR-List"],
    subMenu: []
  },
  {
    link: "invoice",
    icon: "icon icon-INV",
    label: "Invoice",
    menukey: "inv",
    onMobile: true,
    authority: ["Invoice-List"],
    subMenu: []
  },
  {
    link: "credit-note",
    icon: "icon icon-CN",
    label: "Credit Note",
    menukey: "cn",
    onMobile: true,
    authority: ["CN-List"],
    subMenu: []
  },
  {
    link: "debit-note",
    icon: "icon icon-DN",
    label: "Debit Note",
    menukey: "dn",
    onMobile: true,
    authority: ["DN-List"],
    subMenu: []
  },
  {
    link: "request-list",
    icon: "icon-additional icon-request",
    label: "Request",
    menukey: "rq",
    onMobile: false,
    authority: ["Request-List"],
    subMenu: []
  },
  {
    link: "3-way-matching-list",
    icon: "icon icon-3wm",
    label: "3 Way Matching",
    menukey: "3wm",
    onMobile: true,
    authority: ["3WM-List"],
    subMenu: []
  },
  {
    link: "2-way-matching-list",
    icon: "icon icon-2wm",
    label: "2 Way Matching",
    menukey: "2wm",
    onMobile: true,
    authority: ["2WM-List"],
    subMenu: []
  },
  {
    link: "waiting-doa-approval",
    icon: "icon icon-DOA",
    label: "Waiting DOA Approval",
    menukey: "doa",
    onMobile: true,
    authority: ["DOA-List"],
    subMenu: []
  },
  {
    link: "liv-posting-result",
    icon: "icon icon-mon",
    label: "Monitoring",
    menukey: "mon",
    onMobile: true,
    authority: [
      "MONITOR-LIV-List",
      "MONITOR-FileUpload",
      "MONITOR-Payment-List",
      "Document-Tracking-List"
    ],
    subMenu: [
      {
        link: "upload-invoice-monitoring",
        icon: "icon icon-invupmon",
        label: "Upload Invoice Monitoring",
        menukey: "ium",
        onMobile: true,
        authority: ["MONITOR-FileUpload"]
      },
      {
        link: "liv-posting-result",
        icon: "icon icon-liv-posting",
        label: "LIV Posting Result",
        menukey: "liv",
        onMobile: true,
        authority: ["MONITOR-LIV-List"]
      },
      {
        link: "payment-posting",
        icon: "icon icon-liv-posting",
        label: "Payment Posting",
        menukey: "ppt",
        onMobile: true,
        authority: ["MONITOR-Payment-List"]
      },
      {
        link: "document-tracking",
        icon: "icon icon-liv-posting",
        label: "Document Tracking",
        menukey: "tracking",
        onMobile: false,
        authority: ["Document-Tracking-List"]
      }
    ]
  }
];
export default menuItems;

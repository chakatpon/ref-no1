import ContentGenerator from "./ContentGenerator";

export const CREATE_INVOICE_STEP1 = [
  {
    selector: ".input-search-group",
    content: ({ goTo, inDOM }) => (
      <div>ค้นหาเอกสารอ้างอิงเพื่อสร้างใบกำกับภาษี เช่น เลขที่ใบสั่งซื้อ</div>
    ),
    action: node => {
      node.focus();
    },
    position: [100, 60],
    arrowPosition: "top"
  },

  {
    selector: ".btnPanel",
    content: ({ goTo, inDOM }) => (
      <div>
        คลิก
        <span
          style={{
            marginLeft: "5px",
            marginRight: "5px"
          }}
        >
          <button type="button" class="btn btn-wide">
            <i className="icon icon-search"></i>
            <ContentGenerator className="pl-2" content="Search" />
          </button>
        </span>
        เพื่อค้นหาเอกสาร
      </div>
    ),
    action: node => {
      node.focus();
    }
  },
  {
    selector: ".table-responsive",

    content: ({ goTo, inDOM }) => (
      <div>
        คลิกเครื่องหมาย
        <span className="mx-1">
          <i
            className="icon-add"
            style={{
              fontSize: "12px",
              color: "#af3694",
              borderRadius: "50%",
              padding: "5px",
              border: "1px solid #af3694"
            }}
          ></i>
        </span>
        <br />
        เพื่อเพิ่มเอกสารอ้างอิงเพื่อสร้างใบกำกับภาษี
      </div>
    ),
    action: node => {
      node.focus();
    },
    arrowPosition: "top"
  },
  {
    selector: "#selectPO-panel",
    content: ({ goTo, inDOM }) => <div>เอกสารที่ท่านเลือกจะแสดงที่นี่</div>,
    action: node => {
      node.focus();
    }
  },
  {
    selector: ".input-search-group",

    content: ({ goTo, inDOM }) => (
      <div>
        สามารถค้นหาเอกสารอ้างอิงเพิ่มเติมได้
        โดยเอกสารที่อ้างอิงจะต้องมีเงื่อนไขการชำระเงิน (Credit/Payment Term),
        อัตราภาษี (Tax Rate) และบริษัทผู้ซื้อเดียวกัน สำหรับ 1 ใบกำกับภาษี
      </div>
    ),
    action: node => {
      node.focus();
    },
    position: [500, 30],
    arrowPosition: "top"
  },
  {
    selector: ".addBtnPanel",
    content: ({ goTo, inDOM }) => (
      <div>
        คลิก
        <span
          style={{
            marginLeft: "5px",
            marginRight: "5px"
          }}
        >
          <button type="button" class="btn btn-wide">
            <ContentGenerator content="Next" />
          </button>
        </span>
        เพื่อดำเนินการต่อ
      </div>
    ),
    action: node => {
      node.focus();
    }
  }
];
export const CREATE_INVOICE_STEP2 = [
  {
    selector: ".table",
    content: ({ goTo, inDOM }) => <div>ตรวจสอบรายการจากเอกสารที่ท่านเลือก</div>,
    action: node => {}
  },
  {
    selector: ".checkbox-header",
    content: ({ goTo, inDOM }) => {
      return (
        <div>
          หากต้องการเลือกทั้งหมด
          <br />
          คลิกที่นี่
          <span
            style={{
              marginLeft: "5px"
            }}
          >
            <input type="checkbox" checked={false} />
          </span>
          <span
            style={{
              verticalAlign: "top",
              marginLeft: "5px",
              marginRight: "5px",
              color: "#b83193"
            }}
          >
            <i className="icon icon-arrow_small_right"></i>
          </span>
          <span>
            <input type="checkbox" checked={true} />
          </span>
        </div>
      );
    },
    action: node => {}
  },
  {
    selector: ".documentItems",
    content: "หากต้องการเลือกทั้งหมดคลิกที่นี่",
    content: ({ goTo, inDOM }) => (
      <div>
        เลือกรายการที่ต้องการออกใบกำกับภาษี
        <br />
        โดยการคลิกที่นี่
        <span
          style={{
            marginLeft: "5px"
          }}
        >
          <input type="checkbox" checked={false} />
        </span>
        <span
          style={{
            verticalAlign: "top",
            marginLeft: "5px",
            marginRight: "5px",
            color: "#b83193"
          }}
        >
          <i className="icon icon-arrow_small_right"></i>
        </span>
        <span>
          <input type="checkbox" checked={true} />
        </span>
      </div>
    ),
    action: node => {}
  },
  {
    selector: ".documentItems",
    content: "หากต้องการเลือกทั้งหมดคลิกที่นี่",
    content: ({ goTo, inDOM }) => (
      <div>
        จากรายการที่เลือก ระบุจํานวนที่ต้องการออกใบกำกับภาษี เช่น
        <br />
        <span>
          <input
            disabled
            type="text"
            className="tour-form-control"
            value="0.000"
            style={{
              width: "100px",
              borderRadius: "3px",
              color: "red"
            }}
          />
        </span>
        <span
          style={{
            verticalAlign: "middle",
            marginLeft: "5px",
            marginRight: "5px",
            color: "#b83193"
          }}
        >
          <i className="icon icon-arrow_small_right"></i>
        </span>
        <span>
          <input
            disabled
            type="text"
            className="tour-form-control"
            value="100.000"
            style={{
              width: "100px",
              borderRadius: "3px"
            }}
          />
        </span>
      </div>
    ),
    action: node => {}
  },
  {
    selector: ".addBtnPanel",
    content: ({ goTo, inDOM }) => (
      <div>
        คลิก
        <span
          style={{
            marginLeft: "5px",
            marginRight: "5px"
          }}
        >
          <button type="button" class="btn btn-wide">
            <ContentGenerator content="Next" />
          </button>
        </span>
        เพื่อดำเนินการต่อ
      </div>
    ),
    action: node => {
      if (typeof node.focus !== undefined) {
        node.focus();
      }
    }
  }
];
export const CREATE_INVOICE_STEP3 = [
  {
    selector: "#invoice_no",
    content: ({ goTo, inDOM }) => (
      <div>
        ระบุเลขที่ใบกำกับภาษีให้ตรงกับเอกสารต้นฉบับซึ่ง{" "}
        <span
          style={{
            color: "#FF0000",
            textDecoration: "underline"
          }}
        >
          ไม่
        </span>{" "}
        สามารถใช้ซ้ำได้
      </div>
    ),
    action: node => {}
  },
  {
    selector: "#invoice_date",
    content: ({ goTo, inDOM }) => (
      <div>ระบุวันที่ออกใบกำกับภาษี ให้ตรงกับเอกสารต้นฉบับ</div>
    ),
    action: node => {}
  },
  {
    selector: "#receipt_no",
    content: ({ goTo, inDOM }) => (
      <div>
        ระบุเลขที่ใบเสร็จรับเงิน
        <div
          style={{
            color: "#FF0000"
          }}
        >
          *กรณียังไม่มีใบเสร็จรับเงิน สามารถระบุภายหลังได้
        </div>
      </div>
    ),
    action: node => {}
  },
  {
    selector: "#invoice_financing",
    content: ({ goTo, inDOM }) => (
      <div>
        สมาชิก
        <span
          style={{
            color: "#442488"
          }}
        >
          {" "}
          Invoice Financing{" "}
        </span>
        สามารถแสดงความประสงค์เพื่อนำ Invoice มาขายลดได้กับ
        <span
          style={{
            color: "#442488"
          }}
        >
          {" "}
          SCB*{" "}
        </span>
        ได้
      </div>
    ),
    action: node => {}
  },
  {
    selector: "#box-1",
    content: ({ goTo, inDOM }) => (
      <div>
        คลิก
        <span
          style={{
            marginLeft: "5px",
            marginRight: "5px"
          }}
        >
          <button type="button" class="btn btn--transparent tour-btnUpload">
            <ContentGenerator content="Browse Files" />
          </button>
        </span>
        เพื่อแนบเอกสารใบกำกับภาษี โดยขนาดไฟล์ไม่เกิน 3MB และรองรับสกุลไฟล์ JPEG,
        PDF, TIF
      </div>
    ),
    action: node => {}
  },
  {
    selector: "#box-2",
    content: ({ goTo, inDOM }) => (
      <div>
        คลิก
        <span
          style={{
            marginLeft: "5px",
            marginRight: "5px"
          }}
        >
          <button type="button" class="btn btn--transparent tour-btnUpload">
            <ContentGenerator content="Browse Files" />
          </button>
        </span>
        เพื่อแนบเอกสารใบเสร็จรับเงิน โดยขนาดไฟล์ไม่เกิน 3MB และรองรับสกุลไฟล์
        JPEG, PDF, TIF
        <div
          style={{
            color: "#FF0000"
          }}
        >
          *กรณียังไม่มีใบเสร็จรับเงิน สามารถแนบภายหลังได้
        </div>
      </div>
    ),
    action: node => {}
  },
  {
    selector: "#box-3",
    content: ({ goTo, inDOM }) => (
      <div>
        คลิก
        <span
          style={{
            marginLeft: "5px",
            marginRight: "5px"
          }}
        >
          <button type="button" class="btn btn--transparent tour-btnUpload">
            <ContentGenerator content="Browse Files" />
          </button>
        </span>
        เพื่อแนบเอกสารใบส่งสินค้าได้จำนวนสูงสุด 5 ไฟล์ (ถ้ามี)
      </div>
    ),
    action: node => {}
  },
  {
    selector: "#box-4",
    content: ({ goTo, inDOM }) => (
      <div>
        คลิกที่
        <span
          style={{
            marginLeft: "5px",
            marginRight: "5px"
          }}
        >
          <button type="button" class="btn btn--transparent tour-btnUpload">
            <ContentGenerator content="Browse Files" />
          </button>
        </span>
        เพื่อแนบเอกสารอื่น ๆ เพิ่มเติม จำนวนสูงสุด 5 ไฟล์ (ถ้ามี)
      </div>
    ),
    action: node => {}
  },
  {
    selector: "#uploaded-list-section",
    content: ({ goTo, inDOM }) => (
      <div>ไฟล์แนบที่อัพโหลดสำเร็จแล้ว จะแสดงในช่องนี้</div>
    ),
    action: node => {}
  },
  {
    selector: ".addBtnPanel",
    content: ({ goTo, inDOM }) => (
      <div>
        คลิก
        <span
          style={{
            marginLeft: "5px",
            marginRight: "5px"
          }}
        >
          <button type="button" class="btn btn-wide">
            <ContentGenerator content="Next" />
          </button>
        </span>
        เพื่อดำเนินการต่อ
      </div>
    ),
    action: node => {}
  }
];
export const CREATE_INVOICE_STEP4 = [
  {
    selector: ".vendorAndCompany",
    content: ({ goTo, inDOM }) => <div>ตรวจสอบข้อมูลบริษัทคู่ธุรกิจ</div>,
    action: node => {}
  },
  {
    selector: ".vendor-branch",
    content: ({ goTo, inDOM }) => (
      <div>
        ในกรณีที่ผู้ขายมีหลายสาขา
        สามารถเลือกเปลี่ยนสาขาที่ต้องการออกใบกำกับภาษีได้
        <div>(โดยค่าเริ่มต้นที่ระบุในระบบ จะมาจากใบสั่งซื้อ)</div>
      </div>
    ),
    action: node => {}
  },
  {
    selector: ".paymentInfo",
    content: ({ goTo, inDOM }) => (
      <div>ตรวจสอบรายละเอียด และความถูกต้องของใบกำกับภาษี</div>
    ),
    action: node => {}
  },
  {
    selector: ".itemsInfo",
    content: ({ goTo, inDOM }) => (
      <div>ตรวจสอบรายละเอียด และความถูกต้องของใบกำกับภาษี</div>
    ),
    action: node => {}
  },
  {
    selector: ".addBtnPanel",
    content: ({ goTo, inDOM }) => (
      <div>
        คลิก
        <span
          style={{
            marginLeft: "5px",
            marginRight: "5px"
          }}
        >
          <button type="button" class="btn btn-wide">
            <ContentGenerator content="Submit" />
          </button>
        </span>
        เพื่อสร้างใบกำกับภาษี
      </div>
    ),
    action: node => {}
  }
];

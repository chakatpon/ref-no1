import { REFERENCE_TYPE } from "~/components/request/config";
import _ from "lodash";
import { toBigNumber } from "~/helpers/app";
export default class Index {
  SetFormatDataStepTwo = (Item, stepOneProp, index) => {
    const { purchaseOrder, invoice } = REFERENCE_TYPE;
    let datas = {};
    if (!_.isEmpty(Item)) {
      switch (stepOneProp.referenceType) {
        case purchaseOrder.value: {
          let subTotal = _.has(Item, "subTotal")
            ? toBigNumber(Item.subTotal).toNumber()
            : _.has(Item, "poItemUnitPrice") && _.has(Item, "quantity.initial")
            ? toBigNumber(Item.poItemUnitPrice)
                .multipliedBy(toBigNumber(Item.quantity.initial))
                .toNumber()
            : 0;
          let vatRate = _.has(Item, "vatRate")
            ? toBigNumber(Item.vatRate).toNumber()
            : _.has(Item, "taxRate")
            ? toBigNumber(Item.taxRate).toNumber()
            : 0;
          let vatTotal = toBigNumber(subTotal)
            .multipliedBy(toBigNumber(vatRate).dividedBy(100))
            .toNumber();
          let total = toBigNumber(subTotal)
            .plus(vatTotal)
            .toNumber();
          return {
            buyer: _.has(Item, "buyer")
              ? Item.buyer
              : !!stepOneProp.buyer
              ? stepOneProp.buyer
              : null,
            seller: _.has(Item, "seller")
              ? Item.seller
              : !!stepOneProp.seller
              ? stepOneProp.seller
              : null,
            bank: null,

            description: _.has(Item, "description")
              ? Item.description
              : _.has(Item, "materialDescription")
              ? Item.materialDescription
              : null,
            externalId: index + 1,
            referenceItemNumber: _.has(Item, "referenceItemNumber")
              ? Item.referenceItemNumber
              : _.has(Item, "externalId")
              ? Item.externalId
              : 0,
            referenceItemLinearId: _.has(Item, "referenceItemLinearId")
              ? Item.referenceItemLinearId
              : _.has(Item, "linearId")
              ? Item.linearId
              : null,

            site: _.has(Item, "site") ? Item.site : null,
            siteDescription: _.has(Item, "siteDescription")
              ? Item.siteDescription
              : null,
            section: _.has(Item, "section") ? Item.section : null,
            sectionDescription: _.has(Item, "sectionDescription")
              ? Item.sectionDescription
              : null,

            currency: _.has(Item, "currency")
              ? Item.currency
              : _.has(Item, "poItemUnitPriceCurrency")
              ? Item.poItemUnitPriceCurrency
              : null,
            quantity: {
              consumed: 0,
              initial:
                _.has(Item, "quantity") && !_.isObject(Item.quantity)
                  ? toBigNumber(Item.quantity).toNumber()
                  : _.has(Item, "quantity.initial")
                  ? toBigNumber(Item.quantity.initial).toNumber()
                  : null,
              remaining:
                _.has(Item, "quantity") && !_.isObject(Item.quantity)
                  ? toBigNumber(Item.quantity).toNumber()
                  : _.has(Item, "quantity.remaining")
                  ? toBigNumber(Item.quantity.initial).toNumber()
                  : null,
              unit: _.has(Item, "unitDescription")
                ? Item.unitDescription
                : _.has(Item, "quantity.unit")
                ? Item.quantity.unit
                : null
            },
            unitDescription: _.has(Item, "unitDescription")
              ? Item.unitDescription
              : _.has(Item, "quantity.unit")
              ? Item.quantity.unit
              : null,
            unitPrice: _.has(Item, "unitPrice")
              ? toBigNumber(Item.unitPrice).toNumber()
              : _.has(Item, "poItemUnitPrice")
              ? toBigNumber(Item.poItemUnitPrice).toNumber()
              : null,

            vatCode: _.has(Item, "vatCode")
              ? Item.vatCode
              : _.has(Item, "taxCode")
              ? Item.taxCode
              : null,
            vatRate: vatRate,
            subTotal: subTotal,
            vatTotal: vatTotal,
            total: total,

            withholdingTaxRate: null,
            withholdingTaxFormType: null,
            withholdingTaxPayType: null,
            withholdingTaxRemark: null,
            withholdingTaxIncomeType: _.has(Item, "withholdingTaxIncomeType")
              ? Item.withholdingTaxIncomeType
              : null,
            withholdingTaxCode: _.has(Item, "withholdingTaxCode")
              ? Item.withholdingTaxCode
              : null,
            withholdingTaxAmount: null,

            referenceField1: _.has(Item, "referenceField1")
              ? Item.referenceField1
              : null,
            referenceField2: _.has(Item, "referenceField2")
              ? Item.referenceField2
              : null,
            referenceField3: _.has(Item, "referenceField3")
              ? Item.referenceField3
              : null,
            referenceField4: _.has(Item, "referenceField4")
              ? Item.referenceField4
              : null,
            referenceField5: _.has(Item, "referenceField5")
              ? Item.referenceField5
              : null,
            customisedFields: _.has(Item, "customisedFields")
              ? Item.customisedFields
              : {},
            customisedFieldsUpdatedDate: _.has(
              Item,
              "customisedFieldsUpdatedDate"
            )
              ? Item.customisedFieldsUpdatedDate
              : null
          };

          break;
        }
        case invoice.value: {
          let subTotal = _.has(Item, "subTotal")
            ? toBigNumber(Item.subTotal).toNumber()
            : _.has(Item, "itemSubTotal")
            ? toBigNumber(Item.itemSubTotal).toNumber()
            : 0;

          let vatRate = _.has(Item, "vatRate")
            ? toBigNumber(Item.vatRate).toNumber()
            : _.has(Item, "vatRate")
            ? toBigNumber(Item.vatRate).toNumber()
            : 0;
          let vatTotal = toBigNumber(subTotal)
            .multipliedBy(toBigNumber(vatRate).dividedBy(100))
            .toNumber();
          let total = toBigNumber(subTotal)
            .plus(vatTotal)
            .toNumber();
          return {
            buyer: _.has(Item, "buyer")
              ? Item.buyer
              : !!stepOneProp.buyer
              ? stepOneProp.buyer
              : null,
            seller: _.has(Item, "seller")
              ? Item.seller
              : !!stepOneProp.seller
              ? stepOneProp.seller
              : null,
            bank: _.has(Item, "bank ") ? Item.bank : null,

            description: _.has(Item, "description")
              ? Item.description
              : _.has(Item, "materialDescription")
              ? Item.materialDescription
              : null,
            externalId: index + 1,
            referenceItemNumber: _.has(Item, "referenceItemNumber")
              ? Item.referenceItemNumber
              : _.has(Item, "externalId")
              ? Item.externalId
              : 0,
            referenceItemLinearId: _.has(Item, "referenceItemLinearId")
              ? Item.referenceItemLinearId
              : _.has(Item, "linearId")
              ? Item.linearId
              : null,

            site: _.has(Item, "site") ? Item.site : null,
            siteDescription: _.has(Item, "siteDescription")
              ? Item.siteDescription
              : null,
            section: _.has(Item, "section") ? Item.section : null,
            sectionDescription: _.has(Item, "sectionDescription")
              ? Item.sectionDescription
              : null,

            currency: _.has(Item, "currency") ? Item.currency : null,
            quantity: {
              consumed: 0,
              initial:
                _.has(Item, "quantity") && !_.isObject(Item.quantity)
                  ? toBigNumber(Item.quantity).toNumber()
                  : _.has(Item, "quantity.initial")
                  ? toBigNumber(Item.quantity.initial).toNumber()
                  : null,
              remaining:
                _.has(Item, "quantity") && !_.isObject(Item.quantity)
                  ? toBigNumber(Item.quantity).toNumber()
                  : _.has(Item, "quantity.remaining")
                  ? toBigNumber(Item.quantity.initial).toNumber()
                  : null,
              unit: _.has(Item, "unitDescription")
                ? Item.unitDescription
                : _.has(Item, "quantity.unit")
                ? Item.quantity.unit
                : null
            },
            unitDescription: _.has(Item, "unitDescription")
              ? Item.unitDescription
              : _.has(Item, "quantity.unit")
              ? Item.quantity.unit
              : null,
            unitPrice: _.has(Item, "unitPrice")
              ? toBigNumber(Item.unitPrice).toNumber()
              : null,

            vatCode: _.has(Item, "vatCode")
              ? Item.vatCode
              : _.has(Item, "taxCode")
              ? Item.taxCode
              : null,

            vatRate: vatRate,
            subTotal: subTotal,
            vatTotal: vatTotal,
            total: total,

            withholdingTaxRate: _.has(Item, "withholdingTaxRate")
              ? Item.withholdingTaxRate
              : null,
            withholdingTaxFormType: _.has(Item, "withholdingTaxFormType")
              ? Item.withholdingTaxFormType
              : null,
            withholdingTaxPayType: _.has(Item, "withholdingTaxPayType")
              ? Item.withholdingTaxPayType
              : null,
            withholdingTaxRemark: _.has(Item, "withholdingTaxRemark")
              ? Item.withholdingTaxRemark
              : null,
            withholdingTaxIncomeType: _.has(Item, "withholdingTaxIncomeType")
              ? Item.withholdingTaxIncomeType
              : null,
            withholdingTaxCode: _.has(Item, "withholdingTaxCode")
              ? Item.withholdingTaxCode
              : null,
            withholdingTaxAmount: null,

            referenceField1: _.has(Item, "referenceField1")
              ? Item.referenceField1
              : null,
            referenceField2: _.has(Item, "referenceField2")
              ? Item.referenceField2
              : null,
            referenceField3: _.has(Item, "referenceField3")
              ? Item.referenceField3
              : null,
            referenceField4: _.has(Item, "referenceField4")
              ? Item.referenceField4
              : null,
            referenceField5: _.has(Item, "referenceField5")
              ? Item.referenceField5
              : null,
            customisedFields: _.has(Item, "customisedFields")
              ? Item.customisedFields
              : {},
            customisedFieldsUpdatedDate: _.has(
              Item,
              "customisedFieldsUpdatedDate"
            )
              ? Item.customisedFieldsUpdatedDate
              : null
          };
          break;
        }
        default: {
          let subTotal = _.has(Item, "subTotal")
            ? toBigNumber(Item.subTotal).toNumber()
            : 0;
          let vatRate = _.has(Item, "vatRate")
            ? toBigNumber(Item.vatRate).toNumber()
            : 0;
          let vatTotal = toBigNumber(subTotal)
            .multipliedBy(toBigNumber(vatRate).dividedBy(100))
            .toNumber();
          let total = toBigNumber(subTotal)
            .plus(vatTotal)
            .toNumber();

          return {
            buyer: !!stepOneProp.buyer ? stepOneProp.buyer : null,
            seller: !!stepOneProp.seller ? stepOneProp.seller : null,
            bank: _.has(Item, "bank") ? Item.bank : null,

            description: _.has(Item, "description") ? Item.description : null,
            externalId: index + 1,
            referenceItemNumber: _.has(Item, "referenceItemNumber")
              ? Item.referenceItemNumber
              : null,
            referenceItemLinearId: _.has(Item, "referenceItemLinearId")
              ? Item.referenceItemLinearId
              : null,

            site: _.has(Item, "site") ? Item.site : null,
            siteDescription: _.has(Item, "siteDescription")
              ? Item.siteDescription
              : null,
            section: _.has(Item, "section") ? Item.section : null,
            sectionDescription: _.has(Item, "sectionDescription")
              ? Item.sectionDescription
              : null,

            currency: _.has(Item, "currency") ? Item.currency : null,
            quantity: {
              consumed: 0,
              initial:
                _.has(Item, "quantity") && !_.isObject(Item.quantity)
                  ? toBigNumber(Item.quantity).toNumber()
                  : _.has(Item, "quantity.initial")
                  ? toBigNumber(Item.quantity.initial).toNumber()
                  : null,
              remaining:
                _.has(Item, "quantity") && !_.isObject(Item.quantity)
                  ? toBigNumber(Item.quantity).toNumber()
                  : _.has(Item, "quantity.remaining")
                  ? toBigNumber(Item.quantity.initial).toNumber()
                  : null,
              unit: _.has(Item, "unitDescription") ? Item.unitDescription : null
            },
            unitDescription: _.has(Item, "unitDescription")
              ? Item.unitDescription
              : null,
            unitPrice: _.has(Item, "unitPrice")
              ? toBigNumber(Item.unitPrice).toNumber()
              : null,

            vatCode: _.has(Item, "vatCode") ? Item.vatCode : null,
            vatRate: vatRate,
            subTotal: subTotal,
            vatTotal: vatTotal,
            total: total,

            withholdingTaxRate: _.has(Item, "withholdingTaxRate")
              ? Item.withholdingTaxRate
              : null,
            withholdingTaxFormType: _.has(Item, "withholdingTaxFormType")
              ? Item.withholdingTaxFormType
              : null,
            withholdingTaxPayType: _.has(Item, "withholdingTaxPayType")
              ? Item.withholdingTaxPayType
              : null,
            withholdingTaxRemark: _.has(Item, "withholdingTaxRemark")
              ? Item.withholdingTaxRemark
              : null,
            withholdingTaxIncomeType: _.has(Item, "withholdingTaxIncomeType")
              ? Item.withholdingTaxIncomeType
              : null,
            withholdingTaxCode: _.has(Item, "withholdingTaxCode")
              ? Item.withholdingTaxCode
              : null,
            withholdingTaxAmount: null,

            referenceField1: _.has(Item, "referenceField1")
              ? Item.referenceField1
              : null,
            referenceField2: _.has(Item, "referenceField2")
              ? Item.referenceField2
              : null,
            referenceField3: _.has(Item, "referenceField3")
              ? Item.referenceField3
              : null,
            referenceField4: _.has(Item, "referenceField4")
              ? Item.referenceField4
              : null,
            referenceField5: _.has(Item, "referenceField5")
              ? Item.referenceField5
              : null,
            customisedFields: _.has(Item, "customisedFields")
              ? Item.customisedFields
              : {},
            customisedFieldsUpdatedDate: _.has(
              Item,
              "customisedFieldsUpdatedDate"
            )
              ? Item.customisedFieldsUpdatedDate
              : null
          };
        }
      }
    }

    return datas;
  };
}

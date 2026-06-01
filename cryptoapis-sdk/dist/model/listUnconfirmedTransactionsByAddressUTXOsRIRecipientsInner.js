"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListUnconfirmedTransactionsByAddressUTXOsRIRecipientsInner = void 0;
var ListUnconfirmedTransactionsByAddressUTXOsRIRecipientsInner = (function () {
    function ListUnconfirmedTransactionsByAddressUTXOsRIRecipientsInner() {
    }
    ListUnconfirmedTransactionsByAddressUTXOsRIRecipientsInner.getAttributeTypeMap = function () {
        return ListUnconfirmedTransactionsByAddressUTXOsRIRecipientsInner.attributeTypeMap;
    };
    ListUnconfirmedTransactionsByAddressUTXOsRIRecipientsInner.discriminator = undefined;
    ListUnconfirmedTransactionsByAddressUTXOsRIRecipientsInner.attributeTypeMap = [
        {
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "ListUnconfirmedTransactionsByAddressUTXOsRIRecipientsInnerValue"
        }
    ];
    return ListUnconfirmedTransactionsByAddressUTXOsRIRecipientsInner;
}());
exports.ListUnconfirmedTransactionsByAddressUTXOsRIRecipientsInner = ListUnconfirmedTransactionsByAddressUTXOsRIRecipientsInner;
//# sourceMappingURL=listUnconfirmedTransactionsByAddressUTXOsRIRecipientsInner.js.map
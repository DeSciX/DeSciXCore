"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressUTXOsRIRecipientsInner = void 0;
var ListConfirmedTransactionsByAddressUTXOsRIRecipientsInner = (function () {
    function ListConfirmedTransactionsByAddressUTXOsRIRecipientsInner() {
    }
    ListConfirmedTransactionsByAddressUTXOsRIRecipientsInner.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressUTXOsRIRecipientsInner.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressUTXOsRIRecipientsInner.discriminator = undefined;
    ListConfirmedTransactionsByAddressUTXOsRIRecipientsInner.attributeTypeMap = [
        {
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "value",
            "baseName": "value",
            "type": "ListConfirmedTransactionsByAddressUTXOsRIRecipientsInnerValue"
        }
    ];
    return ListConfirmedTransactionsByAddressUTXOsRIRecipientsInner;
}());
exports.ListConfirmedTransactionsByAddressUTXOsRIRecipientsInner = ListConfirmedTransactionsByAddressUTXOsRIRecipientsInner;
//# sourceMappingURL=listConfirmedTransactionsByAddressUTXOsRIRecipientsInner.js.map
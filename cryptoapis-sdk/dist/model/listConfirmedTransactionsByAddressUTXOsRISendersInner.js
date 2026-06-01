"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressUTXOsRISendersInner = void 0;
var ListConfirmedTransactionsByAddressUTXOsRISendersInner = (function () {
    function ListConfirmedTransactionsByAddressUTXOsRISendersInner() {
    }
    ListConfirmedTransactionsByAddressUTXOsRISendersInner.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressUTXOsRISendersInner.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressUTXOsRISendersInner.discriminator = undefined;
    ListConfirmedTransactionsByAddressUTXOsRISendersInner.attributeTypeMap = [
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
    return ListConfirmedTransactionsByAddressUTXOsRISendersInner;
}());
exports.ListConfirmedTransactionsByAddressUTXOsRISendersInner = ListConfirmedTransactionsByAddressUTXOsRISendersInner;
//# sourceMappingURL=listConfirmedTransactionsByAddressUTXOsRISendersInner.js.map
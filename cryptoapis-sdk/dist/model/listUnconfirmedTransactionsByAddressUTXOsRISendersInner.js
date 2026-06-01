"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListUnconfirmedTransactionsByAddressUTXOsRISendersInner = void 0;
var ListUnconfirmedTransactionsByAddressUTXOsRISendersInner = (function () {
    function ListUnconfirmedTransactionsByAddressUTXOsRISendersInner() {
    }
    ListUnconfirmedTransactionsByAddressUTXOsRISendersInner.getAttributeTypeMap = function () {
        return ListUnconfirmedTransactionsByAddressUTXOsRISendersInner.attributeTypeMap;
    };
    ListUnconfirmedTransactionsByAddressUTXOsRISendersInner.discriminator = undefined;
    ListUnconfirmedTransactionsByAddressUTXOsRISendersInner.attributeTypeMap = [
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
    return ListUnconfirmedTransactionsByAddressUTXOsRISendersInner;
}());
exports.ListUnconfirmedTransactionsByAddressUTXOsRISendersInner = ListUnconfirmedTransactionsByAddressUTXOsRISendersInner;
//# sourceMappingURL=listUnconfirmedTransactionsByAddressUTXOsRISendersInner.js.map
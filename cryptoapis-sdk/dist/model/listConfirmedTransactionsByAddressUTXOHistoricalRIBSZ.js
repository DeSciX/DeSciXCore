"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressUTXOHistoricalRIBSZ = void 0;
var ListConfirmedTransactionsByAddressUTXOHistoricalRIBSZ = (function () {
    function ListConfirmedTransactionsByAddressUTXOHistoricalRIBSZ() {
    }
    ListConfirmedTransactionsByAddressUTXOHistoricalRIBSZ.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressUTXOHistoricalRIBSZ.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressUTXOHistoricalRIBSZ.discriminator = undefined;
    ListConfirmedTransactionsByAddressUTXOHistoricalRIBSZ.attributeTypeMap = [
        {
            "name": "expiryHeight",
            "baseName": "expiryHeight",
            "type": "number"
        },
        {
            "name": "overwintered",
            "baseName": "overwintered",
            "type": "boolean"
        },
        {
            "name": "valueBalance",
            "baseName": "valueBalance",
            "type": "ListConfirmedTransactionsByAddressUTXOHistoricalRIBSZValueBalance"
        }
    ];
    return ListConfirmedTransactionsByAddressUTXOHistoricalRIBSZ;
}());
exports.ListConfirmedTransactionsByAddressUTXOHistoricalRIBSZ = ListConfirmedTransactionsByAddressUTXOHistoricalRIBSZ;
//# sourceMappingURL=listConfirmedTransactionsByAddressUTXOHistoricalRIBSZ.js.map
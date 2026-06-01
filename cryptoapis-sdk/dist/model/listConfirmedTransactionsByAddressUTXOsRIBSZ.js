"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListConfirmedTransactionsByAddressUTXOsRIBSZ = void 0;
var ListConfirmedTransactionsByAddressUTXOsRIBSZ = (function () {
    function ListConfirmedTransactionsByAddressUTXOsRIBSZ() {
    }
    ListConfirmedTransactionsByAddressUTXOsRIBSZ.getAttributeTypeMap = function () {
        return ListConfirmedTransactionsByAddressUTXOsRIBSZ.attributeTypeMap;
    };
    ListConfirmedTransactionsByAddressUTXOsRIBSZ.discriminator = undefined;
    ListConfirmedTransactionsByAddressUTXOsRIBSZ.attributeTypeMap = [
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
            "type": "ListConfirmedTransactionsByAddressUTXOsRIBSZValueBalance"
        },
        {
            "name": "versionGroupId",
            "baseName": "versionGroupId",
            "type": "string"
        }
    ];
    return ListConfirmedTransactionsByAddressUTXOsRIBSZ;
}());
exports.ListConfirmedTransactionsByAddressUTXOsRIBSZ = ListConfirmedTransactionsByAddressUTXOsRIBSZ;
//# sourceMappingURL=listConfirmedTransactionsByAddressUTXOsRIBSZ.js.map
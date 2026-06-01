"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListUnconfirmedTransactionsByAddressUTXOsRIBSZ = void 0;
var ListUnconfirmedTransactionsByAddressUTXOsRIBSZ = (function () {
    function ListUnconfirmedTransactionsByAddressUTXOsRIBSZ() {
    }
    ListUnconfirmedTransactionsByAddressUTXOsRIBSZ.getAttributeTypeMap = function () {
        return ListUnconfirmedTransactionsByAddressUTXOsRIBSZ.attributeTypeMap;
    };
    ListUnconfirmedTransactionsByAddressUTXOsRIBSZ.discriminator = undefined;
    ListUnconfirmedTransactionsByAddressUTXOsRIBSZ.attributeTypeMap = [
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
            "type": "ListUnconfirmedTransactionsByAddressUTXOsRIBSZValueBalance"
        },
        {
            "name": "versionGroupId",
            "baseName": "versionGroupId",
            "type": "string"
        }
    ];
    return ListUnconfirmedTransactionsByAddressUTXOsRIBSZ;
}());
exports.ListUnconfirmedTransactionsByAddressUTXOsRIBSZ = ListUnconfirmedTransactionsByAddressUTXOsRIBSZ;
//# sourceMappingURL=listUnconfirmedTransactionsByAddressUTXOsRIBSZ.js.map
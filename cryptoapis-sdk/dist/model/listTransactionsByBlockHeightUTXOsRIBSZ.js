"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHeightUTXOsRIBSZ = void 0;
var ListTransactionsByBlockHeightUTXOsRIBSZ = (function () {
    function ListTransactionsByBlockHeightUTXOsRIBSZ() {
    }
    ListTransactionsByBlockHeightUTXOsRIBSZ.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHeightUTXOsRIBSZ.attributeTypeMap;
    };
    ListTransactionsByBlockHeightUTXOsRIBSZ.discriminator = undefined;
    ListTransactionsByBlockHeightUTXOsRIBSZ.attributeTypeMap = [
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
            "type": "ListTransactionsByBlockHeightUTXOsRIBSZValueBalance"
        },
        {
            "name": "versionGroupId",
            "baseName": "versionGroupId",
            "type": "string"
        }
    ];
    return ListTransactionsByBlockHeightUTXOsRIBSZ;
}());
exports.ListTransactionsByBlockHeightUTXOsRIBSZ = ListTransactionsByBlockHeightUTXOsRIBSZ;
//# sourceMappingURL=listTransactionsByBlockHeightUTXOsRIBSZ.js.map
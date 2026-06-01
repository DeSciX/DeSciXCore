"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListTransactionsByBlockHashUTXOsRIBSZ = void 0;
var ListTransactionsByBlockHashUTXOsRIBSZ = (function () {
    function ListTransactionsByBlockHashUTXOsRIBSZ() {
    }
    ListTransactionsByBlockHashUTXOsRIBSZ.getAttributeTypeMap = function () {
        return ListTransactionsByBlockHashUTXOsRIBSZ.attributeTypeMap;
    };
    ListTransactionsByBlockHashUTXOsRIBSZ.discriminator = undefined;
    ListTransactionsByBlockHashUTXOsRIBSZ.attributeTypeMap = [
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
            "type": "ListTransactionsByBlockHashUTXOsRIBSZValueBalance"
        },
        {
            "name": "versionGroupId",
            "baseName": "versionGroupId",
            "type": "string"
        }
    ];
    return ListTransactionsByBlockHashUTXOsRIBSZ;
}());
exports.ListTransactionsByBlockHashUTXOsRIBSZ = ListTransactionsByBlockHashUTXOsRIBSZ;
//# sourceMappingURL=listTransactionsByBlockHashUTXOsRIBSZ.js.map
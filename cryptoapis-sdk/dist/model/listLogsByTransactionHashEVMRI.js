"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ListLogsByTransactionHashEVMRI = void 0;
var ListLogsByTransactionHashEVMRI = (function () {
    function ListLogsByTransactionHashEVMRI() {
    }
    ListLogsByTransactionHashEVMRI.getAttributeTypeMap = function () {
        return ListLogsByTransactionHashEVMRI.attributeTypeMap;
    };
    ListLogsByTransactionHashEVMRI.discriminator = undefined;
    ListLogsByTransactionHashEVMRI.attributeTypeMap = [
        {
            "name": "address",
            "baseName": "address",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "string"
        },
        {
            "name": "isRemoved",
            "baseName": "isRemoved",
            "type": "boolean"
        },
        {
            "name": "name",
            "baseName": "name",
            "type": "string"
        },
        {
            "name": "topics",
            "baseName": "topics",
            "type": "Array<string>"
        }
    ];
    return ListLogsByTransactionHashEVMRI;
}());
exports.ListLogsByTransactionHashEVMRI = ListLogsByTransactionHashEVMRI;
//# sourceMappingURL=listLogsByTransactionHashEVMRI.js.map
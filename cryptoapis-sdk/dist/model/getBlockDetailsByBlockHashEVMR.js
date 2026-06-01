"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHashEVMR = void 0;
var GetBlockDetailsByBlockHashEVMR = (function () {
    function GetBlockDetailsByBlockHashEVMR() {
    }
    GetBlockDetailsByBlockHashEVMR.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHashEVMR.attributeTypeMap;
    };
    GetBlockDetailsByBlockHashEVMR.discriminator = undefined;
    GetBlockDetailsByBlockHashEVMR.attributeTypeMap = [
        {
            "name": "apiVersion",
            "baseName": "apiVersion",
            "type": "string"
        },
        {
            "name": "requestId",
            "baseName": "requestId",
            "type": "string"
        },
        {
            "name": "context",
            "baseName": "context",
            "type": "string"
        },
        {
            "name": "data",
            "baseName": "data",
            "type": "GetBlockDetailsByBlockHashEVMRData"
        }
    ];
    return GetBlockDetailsByBlockHashEVMR;
}());
exports.GetBlockDetailsByBlockHashEVMR = GetBlockDetailsByBlockHashEVMR;
//# sourceMappingURL=getBlockDetailsByBlockHashEVMR.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHeightEVMR = void 0;
var GetBlockDetailsByBlockHeightEVMR = (function () {
    function GetBlockDetailsByBlockHeightEVMR() {
    }
    GetBlockDetailsByBlockHeightEVMR.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHeightEVMR.attributeTypeMap;
    };
    GetBlockDetailsByBlockHeightEVMR.discriminator = undefined;
    GetBlockDetailsByBlockHeightEVMR.attributeTypeMap = [
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
            "type": "GetBlockDetailsByBlockHeightEVMRData"
        }
    ];
    return GetBlockDetailsByBlockHeightEVMR;
}());
exports.GetBlockDetailsByBlockHeightEVMR = GetBlockDetailsByBlockHeightEVMR;
//# sourceMappingURL=getBlockDetailsByBlockHeightEVMR.js.map
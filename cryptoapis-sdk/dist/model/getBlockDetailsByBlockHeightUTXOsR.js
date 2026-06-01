"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHeightUTXOsR = void 0;
var GetBlockDetailsByBlockHeightUTXOsR = (function () {
    function GetBlockDetailsByBlockHeightUTXOsR() {
    }
    GetBlockDetailsByBlockHeightUTXOsR.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHeightUTXOsR.attributeTypeMap;
    };
    GetBlockDetailsByBlockHeightUTXOsR.discriminator = undefined;
    GetBlockDetailsByBlockHeightUTXOsR.attributeTypeMap = [
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
            "type": "GetBlockDetailsByBlockHeightUTXOsRData"
        }
    ];
    return GetBlockDetailsByBlockHeightUTXOsR;
}());
exports.GetBlockDetailsByBlockHeightUTXOsR = GetBlockDetailsByBlockHeightUTXOsR;
//# sourceMappingURL=getBlockDetailsByBlockHeightUTXOsR.js.map
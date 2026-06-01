"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHashUTXOsR = void 0;
var GetBlockDetailsByBlockHashUTXOsR = (function () {
    function GetBlockDetailsByBlockHashUTXOsR() {
    }
    GetBlockDetailsByBlockHashUTXOsR.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHashUTXOsR.attributeTypeMap;
    };
    GetBlockDetailsByBlockHashUTXOsR.discriminator = undefined;
    GetBlockDetailsByBlockHashUTXOsR.attributeTypeMap = [
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
            "type": "GetBlockDetailsByBlockHashUTXOsRData"
        }
    ];
    return GetBlockDetailsByBlockHashUTXOsR;
}());
exports.GetBlockDetailsByBlockHashUTXOsR = GetBlockDetailsByBlockHashUTXOsR;
//# sourceMappingURL=getBlockDetailsByBlockHashUTXOsR.js.map
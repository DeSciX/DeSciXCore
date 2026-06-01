"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLastMinedBlockUTXOsR = void 0;
var GetLastMinedBlockUTXOsR = (function () {
    function GetLastMinedBlockUTXOsR() {
    }
    GetLastMinedBlockUTXOsR.getAttributeTypeMap = function () {
        return GetLastMinedBlockUTXOsR.attributeTypeMap;
    };
    GetLastMinedBlockUTXOsR.discriminator = undefined;
    GetLastMinedBlockUTXOsR.attributeTypeMap = [
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
            "type": "GetLastMinedBlockUTXOsRData"
        }
    ];
    return GetLastMinedBlockUTXOsR;
}());
exports.GetLastMinedBlockUTXOsR = GetLastMinedBlockUTXOsR;
//# sourceMappingURL=getLastMinedBlockUTXOsR.js.map
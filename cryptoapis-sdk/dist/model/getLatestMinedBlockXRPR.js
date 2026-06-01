"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLatestMinedBlockXRPR = void 0;
var GetLatestMinedBlockXRPR = (function () {
    function GetLatestMinedBlockXRPR() {
    }
    GetLatestMinedBlockXRPR.getAttributeTypeMap = function () {
        return GetLatestMinedBlockXRPR.attributeTypeMap;
    };
    GetLatestMinedBlockXRPR.discriminator = undefined;
    GetLatestMinedBlockXRPR.attributeTypeMap = [
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
            "type": "GetLatestMinedBlockXRPRData"
        }
    ];
    return GetLatestMinedBlockXRPR;
}());
exports.GetLatestMinedBlockXRPR = GetLatestMinedBlockXRPR;
//# sourceMappingURL=getLatestMinedBlockXRPR.js.map
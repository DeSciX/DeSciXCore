"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLatestMinedBlockXRP400Response = void 0;
var GetLatestMinedBlockXRP400Response = (function () {
    function GetLatestMinedBlockXRP400Response() {
    }
    GetLatestMinedBlockXRP400Response.getAttributeTypeMap = function () {
        return GetLatestMinedBlockXRP400Response.attributeTypeMap;
    };
    GetLatestMinedBlockXRP400Response.discriminator = undefined;
    GetLatestMinedBlockXRP400Response.attributeTypeMap = [
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
            "name": "error",
            "baseName": "error",
            "type": "GetLatestMinedBlockXRPE400"
        }
    ];
    return GetLatestMinedBlockXRP400Response;
}());
exports.GetLatestMinedBlockXRP400Response = GetLatestMinedBlockXRP400Response;
//# sourceMappingURL=getLatestMinedBlockXRP400Response.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLatestMinedBlockXRP401Response = void 0;
var GetLatestMinedBlockXRP401Response = (function () {
    function GetLatestMinedBlockXRP401Response() {
    }
    GetLatestMinedBlockXRP401Response.getAttributeTypeMap = function () {
        return GetLatestMinedBlockXRP401Response.attributeTypeMap;
    };
    GetLatestMinedBlockXRP401Response.discriminator = undefined;
    GetLatestMinedBlockXRP401Response.attributeTypeMap = [
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
            "type": "GetLatestMinedBlockXRPE401"
        }
    ];
    return GetLatestMinedBlockXRP401Response;
}());
exports.GetLatestMinedBlockXRP401Response = GetLatestMinedBlockXRP401Response;
//# sourceMappingURL=getLatestMinedBlockXRP401Response.js.map
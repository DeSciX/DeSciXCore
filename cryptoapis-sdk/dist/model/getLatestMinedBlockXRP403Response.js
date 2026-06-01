"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLatestMinedBlockXRP403Response = void 0;
var GetLatestMinedBlockXRP403Response = (function () {
    function GetLatestMinedBlockXRP403Response() {
    }
    GetLatestMinedBlockXRP403Response.getAttributeTypeMap = function () {
        return GetLatestMinedBlockXRP403Response.attributeTypeMap;
    };
    GetLatestMinedBlockXRP403Response.discriminator = undefined;
    GetLatestMinedBlockXRP403Response.attributeTypeMap = [
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
            "type": "GetLatestMinedBlockXRPE403"
        }
    ];
    return GetLatestMinedBlockXRP403Response;
}());
exports.GetLatestMinedBlockXRP403Response = GetLatestMinedBlockXRP403Response;
//# sourceMappingURL=getLatestMinedBlockXRP403Response.js.map
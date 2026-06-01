"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetLastMinedBlockEVMR = void 0;
var GetLastMinedBlockEVMR = (function () {
    function GetLastMinedBlockEVMR() {
    }
    GetLastMinedBlockEVMR.getAttributeTypeMap = function () {
        return GetLastMinedBlockEVMR.attributeTypeMap;
    };
    GetLastMinedBlockEVMR.discriminator = undefined;
    GetLastMinedBlockEVMR.attributeTypeMap = [
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
            "type": "GetLastMinedBlockEVMRData"
        }
    ];
    return GetLastMinedBlockEVMR;
}());
exports.GetLastMinedBlockEVMR = GetLastMinedBlockEVMR;
//# sourceMappingURL=getLastMinedBlockEVMR.js.map
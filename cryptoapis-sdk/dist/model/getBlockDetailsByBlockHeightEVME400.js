"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHeightEVME400 = void 0;
var GetBlockDetailsByBlockHeightEVME400 = (function () {
    function GetBlockDetailsByBlockHeightEVME400() {
    }
    GetBlockDetailsByBlockHeightEVME400.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHeightEVME400.attributeTypeMap;
    };
    GetBlockDetailsByBlockHeightEVME400.discriminator = undefined;
    GetBlockDetailsByBlockHeightEVME400.attributeTypeMap = [
        {
            "name": "code",
            "baseName": "code",
            "type": "string"
        },
        {
            "name": "message",
            "baseName": "message",
            "type": "string"
        },
        {
            "name": "details",
            "baseName": "details",
            "type": "Array<BannedIpAddressDetailsInner>"
        }
    ];
    return GetBlockDetailsByBlockHeightEVME400;
}());
exports.GetBlockDetailsByBlockHeightEVME400 = GetBlockDetailsByBlockHeightEVME400;
//# sourceMappingURL=getBlockDetailsByBlockHeightEVME400.js.map
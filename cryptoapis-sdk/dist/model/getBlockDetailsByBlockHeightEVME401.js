"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHeightEVME401 = void 0;
var GetBlockDetailsByBlockHeightEVME401 = (function () {
    function GetBlockDetailsByBlockHeightEVME401() {
    }
    GetBlockDetailsByBlockHeightEVME401.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHeightEVME401.attributeTypeMap;
    };
    GetBlockDetailsByBlockHeightEVME401.discriminator = undefined;
    GetBlockDetailsByBlockHeightEVME401.attributeTypeMap = [
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
    return GetBlockDetailsByBlockHeightEVME401;
}());
exports.GetBlockDetailsByBlockHeightEVME401 = GetBlockDetailsByBlockHeightEVME401;
//# sourceMappingURL=getBlockDetailsByBlockHeightEVME401.js.map
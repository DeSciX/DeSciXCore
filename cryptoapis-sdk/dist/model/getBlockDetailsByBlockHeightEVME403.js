"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHeightEVME403 = void 0;
var GetBlockDetailsByBlockHeightEVME403 = (function () {
    function GetBlockDetailsByBlockHeightEVME403() {
    }
    GetBlockDetailsByBlockHeightEVME403.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHeightEVME403.attributeTypeMap;
    };
    GetBlockDetailsByBlockHeightEVME403.discriminator = undefined;
    GetBlockDetailsByBlockHeightEVME403.attributeTypeMap = [
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
    return GetBlockDetailsByBlockHeightEVME403;
}());
exports.GetBlockDetailsByBlockHeightEVME403 = GetBlockDetailsByBlockHeightEVME403;
//# sourceMappingURL=getBlockDetailsByBlockHeightEVME403.js.map
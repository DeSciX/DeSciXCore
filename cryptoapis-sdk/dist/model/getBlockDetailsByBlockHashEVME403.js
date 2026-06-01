"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetBlockDetailsByBlockHashEVME403 = void 0;
var GetBlockDetailsByBlockHashEVME403 = (function () {
    function GetBlockDetailsByBlockHashEVME403() {
    }
    GetBlockDetailsByBlockHashEVME403.getAttributeTypeMap = function () {
        return GetBlockDetailsByBlockHashEVME403.attributeTypeMap;
    };
    GetBlockDetailsByBlockHashEVME403.discriminator = undefined;
    GetBlockDetailsByBlockHashEVME403.attributeTypeMap = [
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
    return GetBlockDetailsByBlockHashEVME403;
}());
exports.GetBlockDetailsByBlockHashEVME403 = GetBlockDetailsByBlockHashEVME403;
//# sourceMappingURL=getBlockDetailsByBlockHashEVME403.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VerifyAddressR = void 0;
var VerifyAddressR = (function () {
    function VerifyAddressR() {
    }
    VerifyAddressR.getAttributeTypeMap = function () {
        return VerifyAddressR.attributeTypeMap;
    };
    VerifyAddressR.discriminator = undefined;
    VerifyAddressR.attributeTypeMap = [
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
            "type": "VerifyAddressRData"
        }
    ];
    return VerifyAddressR;
}());
exports.VerifyAddressR = VerifyAddressR;
//# sourceMappingURL=verifyAddressR.js.map
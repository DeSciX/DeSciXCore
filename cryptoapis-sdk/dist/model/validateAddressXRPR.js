"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateAddressXRPR = void 0;
var ValidateAddressXRPR = (function () {
    function ValidateAddressXRPR() {
    }
    ValidateAddressXRPR.getAttributeTypeMap = function () {
        return ValidateAddressXRPR.attributeTypeMap;
    };
    ValidateAddressXRPR.discriminator = undefined;
    ValidateAddressXRPR.attributeTypeMap = [
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
            "type": "ValidateAddressXRPRData"
        }
    ];
    return ValidateAddressXRPR;
}());
exports.ValidateAddressXRPR = ValidateAddressXRPR;
//# sourceMappingURL=validateAddressXRPR.js.map
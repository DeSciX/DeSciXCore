"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateAddressEVMR = void 0;
var ValidateAddressEVMR = (function () {
    function ValidateAddressEVMR() {
    }
    ValidateAddressEVMR.getAttributeTypeMap = function () {
        return ValidateAddressEVMR.attributeTypeMap;
    };
    ValidateAddressEVMR.discriminator = undefined;
    ValidateAddressEVMR.attributeTypeMap = [
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
            "type": "ValidateAddressEVMRData"
        }
    ];
    return ValidateAddressEVMR;
}());
exports.ValidateAddressEVMR = ValidateAddressEVMR;
//# sourceMappingURL=validateAddressEVMR.js.map
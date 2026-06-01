"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateAddressEVM400Response = void 0;
var ValidateAddressEVM400Response = (function () {
    function ValidateAddressEVM400Response() {
    }
    ValidateAddressEVM400Response.getAttributeTypeMap = function () {
        return ValidateAddressEVM400Response.attributeTypeMap;
    };
    ValidateAddressEVM400Response.discriminator = undefined;
    ValidateAddressEVM400Response.attributeTypeMap = [
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
            "type": "ValidateAddressEVME400"
        }
    ];
    return ValidateAddressEVM400Response;
}());
exports.ValidateAddressEVM400Response = ValidateAddressEVM400Response;
//# sourceMappingURL=validateAddressEVM400Response.js.map
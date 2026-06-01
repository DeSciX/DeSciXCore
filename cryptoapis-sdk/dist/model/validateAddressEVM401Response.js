"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateAddressEVM401Response = void 0;
var ValidateAddressEVM401Response = (function () {
    function ValidateAddressEVM401Response() {
    }
    ValidateAddressEVM401Response.getAttributeTypeMap = function () {
        return ValidateAddressEVM401Response.attributeTypeMap;
    };
    ValidateAddressEVM401Response.discriminator = undefined;
    ValidateAddressEVM401Response.attributeTypeMap = [
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
            "type": "ValidateAddressEVME401"
        }
    ];
    return ValidateAddressEVM401Response;
}());
exports.ValidateAddressEVM401Response = ValidateAddressEVM401Response;
//# sourceMappingURL=validateAddressEVM401Response.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateAddressEVM403Response = void 0;
var ValidateAddressEVM403Response = (function () {
    function ValidateAddressEVM403Response() {
    }
    ValidateAddressEVM403Response.getAttributeTypeMap = function () {
        return ValidateAddressEVM403Response.attributeTypeMap;
    };
    ValidateAddressEVM403Response.discriminator = undefined;
    ValidateAddressEVM403Response.attributeTypeMap = [
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
            "type": "ValidateAddressEVME403"
        }
    ];
    return ValidateAddressEVM403Response;
}());
exports.ValidateAddressEVM403Response = ValidateAddressEVM403Response;
//# sourceMappingURL=validateAddressEVM403Response.js.map
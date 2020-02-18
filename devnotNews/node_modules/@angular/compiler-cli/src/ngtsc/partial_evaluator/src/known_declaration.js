/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/src/ngtsc/partial_evaluator/src/known_declaration", ["require", "exports", "@angular/compiler-cli/src/ngtsc/reflection/src/host", "@angular/compiler-cli/src/ngtsc/partial_evaluator/src/builtin"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var host_1 = require("@angular/compiler-cli/src/ngtsc/reflection/src/host");
    var builtin_1 = require("@angular/compiler-cli/src/ngtsc/partial_evaluator/src/builtin");
    /** Resolved value for the JavaScript global `Object` declaration .*/
    exports.jsGlobalObjectValue = new Map([['assign', new builtin_1.ObjectAssignBuiltinFn()]]);
    /**
     * Resolves the specified known declaration to a resolved value. For example,
     * the known JavaScript global `Object` will resolve to a `Map` that provides the
     * `assign` method with a builtin function. This enables evaluation of `Object.assign`.
     */
    function resolveKnownDeclaration(decl) {
        switch (decl) {
            case host_1.KnownDeclaration.JsGlobalObject:
                return exports.jsGlobalObjectValue;
            default:
                throw new Error("Cannot resolve known declaration. Received: " + host_1.KnownDeclaration[decl] + ".");
        }
    }
    exports.resolveKnownDeclaration = resolveKnownDeclaration;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoia25vd25fZGVjbGFyYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvc3JjL25ndHNjL3BhcnRpYWxfZXZhbHVhdG9yL3NyYy9rbm93bl9kZWNsYXJhdGlvbi50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7Ozs7O0dBTUc7Ozs7Ozs7Ozs7OztJQUVILDRFQUEyRDtJQUUzRCx5RkFBZ0Q7SUFHaEQscUVBQXFFO0lBQ3hELFFBQUEsbUJBQW1CLEdBQUcsSUFBSSxHQUFHLENBQUMsQ0FBQyxDQUFDLFFBQVEsRUFBRSxJQUFJLCtCQUFxQixFQUFFLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFFdEY7Ozs7T0FJRztJQUNILFNBQWdCLHVCQUF1QixDQUFDLElBQXNCO1FBQzVELFFBQVEsSUFBSSxFQUFFO1lBQ1osS0FBSyx1QkFBZ0IsQ0FBQyxjQUFjO2dCQUNsQyxPQUFPLDJCQUFtQixDQUFDO1lBQzdCO2dCQUNFLE1BQU0sSUFBSSxLQUFLLENBQUMsaURBQStDLHVCQUFnQixDQUFDLElBQUksQ0FBQyxNQUFHLENBQUMsQ0FBQztTQUM3RjtJQUNILENBQUM7SUFQRCwwREFPQyIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cblxuaW1wb3J0IHtLbm93bkRlY2xhcmF0aW9ufSBmcm9tICcuLi8uLi9yZWZsZWN0aW9uL3NyYy9ob3N0JztcblxuaW1wb3J0IHtPYmplY3RBc3NpZ25CdWlsdGluRm59IGZyb20gJy4vYnVpbHRpbic7XG5pbXBvcnQge1Jlc29sdmVkVmFsdWV9IGZyb20gJy4vcmVzdWx0JztcblxuLyoqIFJlc29sdmVkIHZhbHVlIGZvciB0aGUgSmF2YVNjcmlwdCBnbG9iYWwgYE9iamVjdGAgZGVjbGFyYXRpb24gLiovXG5leHBvcnQgY29uc3QganNHbG9iYWxPYmplY3RWYWx1ZSA9IG5ldyBNYXAoW1snYXNzaWduJywgbmV3IE9iamVjdEFzc2lnbkJ1aWx0aW5GbigpXV0pO1xuXG4vKipcbiAqIFJlc29sdmVzIHRoZSBzcGVjaWZpZWQga25vd24gZGVjbGFyYXRpb24gdG8gYSByZXNvbHZlZCB2YWx1ZS4gRm9yIGV4YW1wbGUsXG4gKiB0aGUga25vd24gSmF2YVNjcmlwdCBnbG9iYWwgYE9iamVjdGAgd2lsbCByZXNvbHZlIHRvIGEgYE1hcGAgdGhhdCBwcm92aWRlcyB0aGVcbiAqIGBhc3NpZ25gIG1ldGhvZCB3aXRoIGEgYnVpbHRpbiBmdW5jdGlvbi4gVGhpcyBlbmFibGVzIGV2YWx1YXRpb24gb2YgYE9iamVjdC5hc3NpZ25gLlxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVzb2x2ZUtub3duRGVjbGFyYXRpb24oZGVjbDogS25vd25EZWNsYXJhdGlvbik6IFJlc29sdmVkVmFsdWUge1xuICBzd2l0Y2ggKGRlY2wpIHtcbiAgICBjYXNlIEtub3duRGVjbGFyYXRpb24uSnNHbG9iYWxPYmplY3Q6XG4gICAgICByZXR1cm4ganNHbG9iYWxPYmplY3RWYWx1ZTtcbiAgICBkZWZhdWx0OlxuICAgICAgdGhyb3cgbmV3IEVycm9yKGBDYW5ub3QgcmVzb2x2ZSBrbm93biBkZWNsYXJhdGlvbi4gUmVjZWl2ZWQ6ICR7S25vd25EZWNsYXJhdGlvbltkZWNsXX0uYCk7XG4gIH1cbn1cbiJdfQ==
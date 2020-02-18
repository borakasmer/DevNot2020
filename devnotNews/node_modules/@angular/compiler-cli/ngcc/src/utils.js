(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/ngcc/src/utils", ["require", "exports", "tslib", "typescript", "@angular/compiler-cli/src/ngtsc/file_system"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    /**
     * @license
     * Copyright Google Inc. All Rights Reserved.
     *
     * Use of this source code is governed by an MIT-style license that can be
     * found in the LICENSE file at https://angular.io/license
     */
    var ts = require("typescript");
    var file_system_1 = require("@angular/compiler-cli/src/ngtsc/file_system");
    function getOriginalSymbol(checker) {
        return function (symbol) {
            return ts.SymbolFlags.Alias & symbol.flags ? checker.getAliasedSymbol(symbol) : symbol;
        };
    }
    exports.getOriginalSymbol = getOriginalSymbol;
    function isDefined(value) {
        return (value !== undefined) && (value !== null);
    }
    exports.isDefined = isDefined;
    function getNameText(name) {
        return ts.isIdentifier(name) || ts.isLiteralExpression(name) ? name.text : name.getText();
    }
    exports.getNameText = getNameText;
    /**
     * Parse down the AST and capture all the nodes that satisfy the test.
     * @param node The start node.
     * @param test The function that tests whether a node should be included.
     * @returns a collection of nodes that satisfy the test.
     */
    function findAll(node, test) {
        var nodes = [];
        findAllVisitor(node);
        return nodes;
        function findAllVisitor(n) {
            if (test(n)) {
                nodes.push(n);
            }
            else {
                n.forEachChild(function (child) { return findAllVisitor(child); });
            }
        }
    }
    exports.findAll = findAll;
    /**
     * Does the given declaration have a name which is an identifier?
     * @param declaration The declaration to test.
     * @returns true if the declaration has an identifier for a name.
     */
    function hasNameIdentifier(declaration) {
        var namedDeclaration = declaration;
        return namedDeclaration.name !== undefined && ts.isIdentifier(namedDeclaration.name);
    }
    exports.hasNameIdentifier = hasNameIdentifier;
    /**
     * Test whether a path is "relative".
     *
     * Relative paths start with `/`, `./` or `../`; or are simply `.` or `..`.
     */
    function isRelativePath(path) {
        return /^\/|^\.\.?($|\/)/.test(path);
    }
    exports.isRelativePath = isRelativePath;
    /**
     * A `Map`-like object that can compute and memoize a missing value for any key.
     *
     * The computed values are memoized, so the factory function is not called more than once per key.
     * This is useful for storing values that are expensive to compute and may be used multiple times.
     */
    // NOTE:
    // Ideally, this class should extend `Map`, but that causes errors in ES5 transpiled code:
    // `TypeError: Constructor Map requires 'new'`
    var FactoryMap = /** @class */ (function () {
        function FactoryMap(factory, entries) {
            this.factory = factory;
            this.internalMap = new Map(entries);
        }
        FactoryMap.prototype.get = function (key) {
            if (!this.internalMap.has(key)) {
                this.internalMap.set(key, this.factory(key));
            }
            return this.internalMap.get(key);
        };
        FactoryMap.prototype.set = function (key, value) { this.internalMap.set(key, value); };
        return FactoryMap;
    }());
    exports.FactoryMap = FactoryMap;
    /**
     * Attempt to resolve a `path` to a file by appending the provided `postFixes`
     * to the `path` and checking if the file exists on disk.
     * @returns An absolute path to the first matching existing file, or `null` if none exist.
     */
    function resolveFileWithPostfixes(fs, path, postFixes) {
        var e_1, _a;
        try {
            for (var postFixes_1 = tslib_1.__values(postFixes), postFixes_1_1 = postFixes_1.next(); !postFixes_1_1.done; postFixes_1_1 = postFixes_1.next()) {
                var postFix = postFixes_1_1.value;
                var testPath = file_system_1.absoluteFrom(path + postFix);
                if (fs.exists(testPath) && fs.stat(testPath).isFile()) {
                    return testPath;
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (postFixes_1_1 && !postFixes_1_1.done && (_a = postFixes_1.return)) _a.call(postFixes_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
        return null;
    }
    exports.resolveFileWithPostfixes = resolveFileWithPostfixes;
    /**
     * An identifier may become repeated when bundling multiple source files into a single bundle, so
     * bundlers have a strategy of suffixing non-unique identifiers with a suffix like $2. This function
     * strips off such suffixes, so that ngcc deals with the canonical name of an identifier.
     * @param value The value to strip any suffix of, if applicable.
     * @returns The canonical representation of the value, without any suffix.
     */
    function stripDollarSuffix(value) {
        return value.replace(/\$\d+$/, '');
    }
    exports.stripDollarSuffix = stripDollarSuffix;
    function stripExtension(fileName) {
        return fileName.replace(/\..+$/, '');
    }
    exports.stripExtension = stripExtension;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi8uLi8uLi8uLi9wYWNrYWdlcy9jb21waWxlci1jbGkvbmdjYy9zcmMvdXRpbHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7O0lBQUE7Ozs7OztPQU1HO0lBQ0gsK0JBQWlDO0lBQ2pDLDJFQUFxRjtJQXdCckYsU0FBZ0IsaUJBQWlCLENBQUMsT0FBdUI7UUFDdkQsT0FBTyxVQUFTLE1BQWlCO1lBQy9CLE9BQU8sRUFBRSxDQUFDLFdBQVcsQ0FBQyxLQUFLLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLENBQUMsT0FBTyxDQUFDLGdCQUFnQixDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQyxNQUFNLENBQUM7UUFDekYsQ0FBQyxDQUFDO0lBQ0osQ0FBQztJQUpELDhDQUlDO0lBRUQsU0FBZ0IsU0FBUyxDQUFJLEtBQTJCO1FBQ3RELE9BQU8sQ0FBQyxLQUFLLEtBQUssU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLEtBQUssSUFBSSxDQUFDLENBQUM7SUFDbkQsQ0FBQztJQUZELDhCQUVDO0lBRUQsU0FBZ0IsV0FBVyxDQUFDLElBQXNDO1FBQ2hFLE9BQU8sRUFBRSxDQUFDLFlBQVksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLENBQUMsbUJBQW1CLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUUsQ0FBQztJQUM1RixDQUFDO0lBRkQsa0NBRUM7SUFFRDs7Ozs7T0FLRztJQUNILFNBQWdCLE9BQU8sQ0FBSSxJQUFhLEVBQUUsSUFBNEM7UUFDcEYsSUFBTSxLQUFLLEdBQVEsRUFBRSxDQUFDO1FBQ3RCLGNBQWMsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNyQixPQUFPLEtBQUssQ0FBQztRQUViLFNBQVMsY0FBYyxDQUFDLENBQVU7WUFDaEMsSUFBSSxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUU7Z0JBQ1gsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQzthQUNmO2lCQUFNO2dCQUNMLENBQUMsQ0FBQyxZQUFZLENBQUMsVUFBQSxLQUFLLElBQUksT0FBQSxjQUFjLENBQUMsS0FBSyxDQUFDLEVBQXJCLENBQXFCLENBQUMsQ0FBQzthQUNoRDtRQUNILENBQUM7SUFDSCxDQUFDO0lBWkQsMEJBWUM7SUFFRDs7OztPQUlHO0lBQ0gsU0FBZ0IsaUJBQWlCLENBQUMsV0FBMkI7UUFFM0QsSUFBTSxnQkFBZ0IsR0FBb0MsV0FBVyxDQUFDO1FBQ3RFLE9BQU8sZ0JBQWdCLENBQUMsSUFBSSxLQUFLLFNBQVMsSUFBSSxFQUFFLENBQUMsWUFBWSxDQUFDLGdCQUFnQixDQUFDLElBQUksQ0FBQyxDQUFDO0lBQ3ZGLENBQUM7SUFKRCw4Q0FJQztJQU9EOzs7O09BSUc7SUFDSCxTQUFnQixjQUFjLENBQUMsSUFBWTtRQUN6QyxPQUFPLGtCQUFrQixDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBRkQsd0NBRUM7SUFFRDs7Ozs7T0FLRztJQUNILFFBQVE7SUFDUiwwRkFBMEY7SUFDMUYsOENBQThDO0lBQzlDO1FBR0Usb0JBQW9CLE9BQXNCLEVBQUUsT0FBeUM7WUFBakUsWUFBTyxHQUFQLE9BQU8sQ0FBZTtZQUN4QyxJQUFJLENBQUMsV0FBVyxHQUFHLElBQUksR0FBRyxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3RDLENBQUM7UUFFRCx3QkFBRyxHQUFILFVBQUksR0FBTTtZQUNSLElBQUksQ0FBQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxHQUFHLENBQUMsRUFBRTtnQkFDOUIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsR0FBRyxFQUFFLElBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQzthQUM5QztZQUVELE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFHLENBQUM7UUFDckMsQ0FBQztRQUVELHdCQUFHLEdBQUgsVUFBSSxHQUFNLEVBQUUsS0FBUSxJQUFVLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLEdBQUcsRUFBRSxLQUFLLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDbkUsaUJBQUM7SUFBRCxDQUFDLEFBaEJELElBZ0JDO0lBaEJZLGdDQUFVO0lBa0J2Qjs7OztPQUlHO0lBQ0gsU0FBZ0Isd0JBQXdCLENBQ3BDLEVBQWMsRUFBRSxJQUFvQixFQUFFLFNBQW1COzs7WUFDM0QsS0FBc0IsSUFBQSxjQUFBLGlCQUFBLFNBQVMsQ0FBQSxvQ0FBQSwyREFBRTtnQkFBNUIsSUFBTSxPQUFPLHNCQUFBO2dCQUNoQixJQUFNLFFBQVEsR0FBRywwQkFBWSxDQUFDLElBQUksR0FBRyxPQUFPLENBQUMsQ0FBQztnQkFDOUMsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDLFFBQVEsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLENBQUMsTUFBTSxFQUFFLEVBQUU7b0JBQ3JELE9BQU8sUUFBUSxDQUFDO2lCQUNqQjthQUNGOzs7Ozs7Ozs7UUFDRCxPQUFPLElBQUksQ0FBQztJQUNkLENBQUM7SUFURCw0REFTQztJQUVEOzs7Ozs7T0FNRztJQUNILFNBQWdCLGlCQUFpQixDQUFDLEtBQWE7UUFDN0MsT0FBTyxLQUFLLENBQUMsT0FBTyxDQUFDLFFBQVEsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUNyQyxDQUFDO0lBRkQsOENBRUM7SUFFRCxTQUFnQixjQUFjLENBQUMsUUFBZ0I7UUFDN0MsT0FBTyxRQUFRLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxFQUFFLENBQUMsQ0FBQztJQUN2QyxDQUFDO0lBRkQsd0NBRUMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBsaWNlbnNlXG4gKiBDb3B5cmlnaHQgR29vZ2xlIEluYy4gQWxsIFJpZ2h0cyBSZXNlcnZlZC5cbiAqXG4gKiBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhbiBNSVQtc3R5bGUgbGljZW5zZSB0aGF0IGNhbiBiZVxuICogZm91bmQgaW4gdGhlIExJQ0VOU0UgZmlsZSBhdCBodHRwczovL2FuZ3VsYXIuaW8vbGljZW5zZVxuICovXG5pbXBvcnQgKiBhcyB0cyBmcm9tICd0eXBlc2NyaXB0JztcbmltcG9ydCB7QWJzb2x1dGVGc1BhdGgsIEZpbGVTeXN0ZW0sIGFic29sdXRlRnJvbX0gZnJvbSAnLi4vLi4vc3JjL25ndHNjL2ZpbGVfc3lzdGVtJztcblxuLyoqXG4gKiBBIGxpc3QgKGBBcnJheWApIG9mIHBhcnRpYWxseSBvcmRlcmVkIGBUYCBpdGVtcy5cbiAqXG4gKiBUaGUgaXRlbXMgaW4gdGhlIGxpc3QgYXJlIHBhcnRpYWxseSBvcmRlcmVkIGluIHRoZSBzZW5zZSB0aGF0IGFueSBlbGVtZW50IGhhcyBlaXRoZXIgdGhlIHNhbWUgb3JcbiAqIGhpZ2hlciBwcmVjZWRlbmNlIHRoYW4gYW55IGVsZW1lbnQgd2hpY2ggYXBwZWFycyBsYXRlciBpbiB0aGUgbGlzdC4gV2hhdCBcImhpZ2hlciBwcmVjZWRlbmNlXCJcbiAqIG1lYW5zIGFuZCBob3cgaXQgaXMgZGV0ZXJtaW5lZCBpcyBpbXBsZW1lbnRhdGlvbi1kZXBlbmRlbnQuXG4gKlxuICogU2VlIFtQYXJ0aWFsbHlPcmRlcmVkU2V0XShodHRwczovL2VuLndpa2lwZWRpYS5vcmcvd2lraS9QYXJ0aWFsbHlfb3JkZXJlZF9zZXQpIGZvciBtb3JlIGRldGFpbHMuXG4gKiAoUmVmcmFpbmluZyBmcm9tIHVzaW5nIHRoZSB0ZXJtIFwic2V0XCIgaGVyZSwgdG8gYXZvaWQgY29uZnVzaW9uIHdpdGggSmF2YVNjcmlwdCdzXG4gKiBbU2V0XShodHRwczovL2RldmVsb3Blci5tb3ppbGxhLm9yZy9kb2NzL1dlYi9KYXZhU2NyaXB0L1JlZmVyZW5jZS9HbG9iYWxfT2JqZWN0cy9TZXQpLilcbiAqXG4gKiBOT1RFOiBBIHBsYWluIGBBcnJheTxUPmAgaXMgbm90IGFzc2lnbmFibGUgdG8gYSBgUGFydGlhbGx5T3JkZXJlZExpc3Q8VD5gLCBidXQgYVxuICogICAgICAgYFBhcnRpYWxseU9yZGVyZWRMaXN0PFQ+YCBpcyBhc3NpZ25hYmxlIHRvIGFuIGBBcnJheTxUPmAuXG4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUGFydGlhbGx5T3JkZXJlZExpc3Q8VD4gZXh0ZW5kcyBBcnJheTxUPiB7XG4gIF9wYXJ0aWFsbHlPcmRlcmVkOiB0cnVlO1xuXG4gIG1hcDxVPihjYWxsYmFja2ZuOiAodmFsdWU6IFQsIGluZGV4OiBudW1iZXIsIGFycmF5OiBQYXJ0aWFsbHlPcmRlcmVkTGlzdDxUPikgPT4gVSwgdGhpc0FyZz86IGFueSk6XG4gICAgICBQYXJ0aWFsbHlPcmRlcmVkTGlzdDxVPjtcbiAgc2xpY2UoLi4uYXJnczogUGFyYW1ldGVyczxBcnJheTxUPlsnc2xpY2UnXT4pOiBQYXJ0aWFsbHlPcmRlcmVkTGlzdDxUPjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldE9yaWdpbmFsU3ltYm9sKGNoZWNrZXI6IHRzLlR5cGVDaGVja2VyKTogKHN5bWJvbDogdHMuU3ltYm9sKSA9PiB0cy5TeW1ib2wge1xuICByZXR1cm4gZnVuY3Rpb24oc3ltYm9sOiB0cy5TeW1ib2wpIHtcbiAgICByZXR1cm4gdHMuU3ltYm9sRmxhZ3MuQWxpYXMgJiBzeW1ib2wuZmxhZ3MgPyBjaGVja2VyLmdldEFsaWFzZWRTeW1ib2woc3ltYm9sKSA6IHN5bWJvbDtcbiAgfTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRGVmaW5lZDxUPih2YWx1ZTogVCB8IHVuZGVmaW5lZCB8IG51bGwpOiB2YWx1ZSBpcyBUIHtcbiAgcmV0dXJuICh2YWx1ZSAhPT0gdW5kZWZpbmVkKSAmJiAodmFsdWUgIT09IG51bGwpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0TmFtZVRleHQobmFtZTogdHMuUHJvcGVydHlOYW1lIHwgdHMuQmluZGluZ05hbWUpOiBzdHJpbmcge1xuICByZXR1cm4gdHMuaXNJZGVudGlmaWVyKG5hbWUpIHx8IHRzLmlzTGl0ZXJhbEV4cHJlc3Npb24obmFtZSkgPyBuYW1lLnRleHQgOiBuYW1lLmdldFRleHQoKTtcbn1cblxuLyoqXG4gKiBQYXJzZSBkb3duIHRoZSBBU1QgYW5kIGNhcHR1cmUgYWxsIHRoZSBub2RlcyB0aGF0IHNhdGlzZnkgdGhlIHRlc3QuXG4gKiBAcGFyYW0gbm9kZSBUaGUgc3RhcnQgbm9kZS5cbiAqIEBwYXJhbSB0ZXN0IFRoZSBmdW5jdGlvbiB0aGF0IHRlc3RzIHdoZXRoZXIgYSBub2RlIHNob3VsZCBiZSBpbmNsdWRlZC5cbiAqIEByZXR1cm5zIGEgY29sbGVjdGlvbiBvZiBub2RlcyB0aGF0IHNhdGlzZnkgdGhlIHRlc3QuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmaW5kQWxsPFQ+KG5vZGU6IHRzLk5vZGUsIHRlc3Q6IChub2RlOiB0cy5Ob2RlKSA9PiBub2RlIGlzIHRzLk5vZGUgJiBUKTogVFtdIHtcbiAgY29uc3Qgbm9kZXM6IFRbXSA9IFtdO1xuICBmaW5kQWxsVmlzaXRvcihub2RlKTtcbiAgcmV0dXJuIG5vZGVzO1xuXG4gIGZ1bmN0aW9uIGZpbmRBbGxWaXNpdG9yKG46IHRzLk5vZGUpIHtcbiAgICBpZiAodGVzdChuKSkge1xuICAgICAgbm9kZXMucHVzaChuKTtcbiAgICB9IGVsc2Uge1xuICAgICAgbi5mb3JFYWNoQ2hpbGQoY2hpbGQgPT4gZmluZEFsbFZpc2l0b3IoY2hpbGQpKTtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBEb2VzIHRoZSBnaXZlbiBkZWNsYXJhdGlvbiBoYXZlIGEgbmFtZSB3aGljaCBpcyBhbiBpZGVudGlmaWVyP1xuICogQHBhcmFtIGRlY2xhcmF0aW9uIFRoZSBkZWNsYXJhdGlvbiB0byB0ZXN0LlxuICogQHJldHVybnMgdHJ1ZSBpZiB0aGUgZGVjbGFyYXRpb24gaGFzIGFuIGlkZW50aWZpZXIgZm9yIGEgbmFtZS5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGhhc05hbWVJZGVudGlmaWVyKGRlY2xhcmF0aW9uOiB0cy5EZWNsYXJhdGlvbik6IGRlY2xhcmF0aW9uIGlzIHRzLkRlY2xhcmF0aW9uJlxuICAgIHtuYW1lOiB0cy5JZGVudGlmaWVyfSB7XG4gIGNvbnN0IG5hbWVkRGVjbGFyYXRpb246IHRzLkRlY2xhcmF0aW9uJntuYW1lPzogdHMuTm9kZX0gPSBkZWNsYXJhdGlvbjtcbiAgcmV0dXJuIG5hbWVkRGVjbGFyYXRpb24ubmFtZSAhPT0gdW5kZWZpbmVkICYmIHRzLmlzSWRlbnRpZmllcihuYW1lZERlY2xhcmF0aW9uLm5hbWUpO1xufVxuXG5leHBvcnQgdHlwZSBQYXRoTWFwcGluZ3MgPSB7XG4gIGJhc2VVcmw6IHN0cmluZyxcbiAgcGF0aHM6IHtba2V5OiBzdHJpbmddOiBzdHJpbmdbXX1cbn07XG5cbi8qKlxuICogVGVzdCB3aGV0aGVyIGEgcGF0aCBpcyBcInJlbGF0aXZlXCIuXG4gKlxuICogUmVsYXRpdmUgcGF0aHMgc3RhcnQgd2l0aCBgL2AsIGAuL2Agb3IgYC4uL2A7IG9yIGFyZSBzaW1wbHkgYC5gIG9yIGAuLmAuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpc1JlbGF0aXZlUGF0aChwYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgcmV0dXJuIC9eXFwvfF5cXC5cXC4/KCR8XFwvKS8udGVzdChwYXRoKTtcbn1cblxuLyoqXG4gKiBBIGBNYXBgLWxpa2Ugb2JqZWN0IHRoYXQgY2FuIGNvbXB1dGUgYW5kIG1lbW9pemUgYSBtaXNzaW5nIHZhbHVlIGZvciBhbnkga2V5LlxuICpcbiAqIFRoZSBjb21wdXRlZCB2YWx1ZXMgYXJlIG1lbW9pemVkLCBzbyB0aGUgZmFjdG9yeSBmdW5jdGlvbiBpcyBub3QgY2FsbGVkIG1vcmUgdGhhbiBvbmNlIHBlciBrZXkuXG4gKiBUaGlzIGlzIHVzZWZ1bCBmb3Igc3RvcmluZyB2YWx1ZXMgdGhhdCBhcmUgZXhwZW5zaXZlIHRvIGNvbXB1dGUgYW5kIG1heSBiZSB1c2VkIG11bHRpcGxlIHRpbWVzLlxuICovXG4vLyBOT1RFOlxuLy8gSWRlYWxseSwgdGhpcyBjbGFzcyBzaG91bGQgZXh0ZW5kIGBNYXBgLCBidXQgdGhhdCBjYXVzZXMgZXJyb3JzIGluIEVTNSB0cmFuc3BpbGVkIGNvZGU6XG4vLyBgVHlwZUVycm9yOiBDb25zdHJ1Y3RvciBNYXAgcmVxdWlyZXMgJ25ldydgXG5leHBvcnQgY2xhc3MgRmFjdG9yeU1hcDxLLCBWPiB7XG4gIHByaXZhdGUgaW50ZXJuYWxNYXA6IE1hcDxLLCBWPjtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGZhY3Rvcnk6IChrZXk6IEspID0+IFYsIGVudHJpZXM/OiByZWFkb25seShyZWFkb25seVtLLCBWXSlbXXxudWxsKSB7XG4gICAgdGhpcy5pbnRlcm5hbE1hcCA9IG5ldyBNYXAoZW50cmllcyk7XG4gIH1cblxuICBnZXQoa2V5OiBLKTogViB7XG4gICAgaWYgKCF0aGlzLmludGVybmFsTWFwLmhhcyhrZXkpKSB7XG4gICAgICB0aGlzLmludGVybmFsTWFwLnNldChrZXksIHRoaXMuZmFjdG9yeShrZXkpKTtcbiAgICB9XG5cbiAgICByZXR1cm4gdGhpcy5pbnRlcm5hbE1hcC5nZXQoa2V5KSAhO1xuICB9XG5cbiAgc2V0KGtleTogSywgdmFsdWU6IFYpOiB2b2lkIHsgdGhpcy5pbnRlcm5hbE1hcC5zZXQoa2V5LCB2YWx1ZSk7IH1cbn1cblxuLyoqXG4gKiBBdHRlbXB0IHRvIHJlc29sdmUgYSBgcGF0aGAgdG8gYSBmaWxlIGJ5IGFwcGVuZGluZyB0aGUgcHJvdmlkZWQgYHBvc3RGaXhlc2BcbiAqIHRvIHRoZSBgcGF0aGAgYW5kIGNoZWNraW5nIGlmIHRoZSBmaWxlIGV4aXN0cyBvbiBkaXNrLlxuICogQHJldHVybnMgQW4gYWJzb2x1dGUgcGF0aCB0byB0aGUgZmlyc3QgbWF0Y2hpbmcgZXhpc3RpbmcgZmlsZSwgb3IgYG51bGxgIGlmIG5vbmUgZXhpc3QuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlRmlsZVdpdGhQb3N0Zml4ZXMoXG4gICAgZnM6IEZpbGVTeXN0ZW0sIHBhdGg6IEFic29sdXRlRnNQYXRoLCBwb3N0Rml4ZXM6IHN0cmluZ1tdKTogQWJzb2x1dGVGc1BhdGh8bnVsbCB7XG4gIGZvciAoY29uc3QgcG9zdEZpeCBvZiBwb3N0Rml4ZXMpIHtcbiAgICBjb25zdCB0ZXN0UGF0aCA9IGFic29sdXRlRnJvbShwYXRoICsgcG9zdEZpeCk7XG4gICAgaWYgKGZzLmV4aXN0cyh0ZXN0UGF0aCkgJiYgZnMuc3RhdCh0ZXN0UGF0aCkuaXNGaWxlKCkpIHtcbiAgICAgIHJldHVybiB0ZXN0UGF0aDtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIG51bGw7XG59XG5cbi8qKlxuICogQW4gaWRlbnRpZmllciBtYXkgYmVjb21lIHJlcGVhdGVkIHdoZW4gYnVuZGxpbmcgbXVsdGlwbGUgc291cmNlIGZpbGVzIGludG8gYSBzaW5nbGUgYnVuZGxlLCBzb1xuICogYnVuZGxlcnMgaGF2ZSBhIHN0cmF0ZWd5IG9mIHN1ZmZpeGluZyBub24tdW5pcXVlIGlkZW50aWZpZXJzIHdpdGggYSBzdWZmaXggbGlrZSAkMi4gVGhpcyBmdW5jdGlvblxuICogc3RyaXBzIG9mZiBzdWNoIHN1ZmZpeGVzLCBzbyB0aGF0IG5nY2MgZGVhbHMgd2l0aCB0aGUgY2Fub25pY2FsIG5hbWUgb2YgYW4gaWRlbnRpZmllci5cbiAqIEBwYXJhbSB2YWx1ZSBUaGUgdmFsdWUgdG8gc3RyaXAgYW55IHN1ZmZpeCBvZiwgaWYgYXBwbGljYWJsZS5cbiAqIEByZXR1cm5zIFRoZSBjYW5vbmljYWwgcmVwcmVzZW50YXRpb24gb2YgdGhlIHZhbHVlLCB3aXRob3V0IGFueSBzdWZmaXguXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBzdHJpcERvbGxhclN1ZmZpeCh2YWx1ZTogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHZhbHVlLnJlcGxhY2UoL1xcJFxcZCskLywgJycpO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gc3RyaXBFeHRlbnNpb24oZmlsZU5hbWU6IHN0cmluZyk6IHN0cmluZyB7XG4gIHJldHVybiBmaWxlTmFtZS5yZXBsYWNlKC9cXC4uKyQvLCAnJyk7XG59XG4iXX0=
(function (factory) {
    if (typeof module === "object" && typeof module.exports === "object") {
        var v = factory(require, exports);
        if (v !== undefined) module.exports = v;
    }
    else if (typeof define === "function" && define.amd) {
        define("@angular/compiler-cli/src/ngtsc/file_system/src/cached_file_system", ["require", "exports", "tslib"], factory);
    }
})(function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    var tslib_1 = require("tslib");
    /**
     * A wrapper around `FileSystem` that caches hits to `exists()` and
     * `readFile()` to improve performance.
     *
     * Be aware that any changes to the file system from outside of this
     * class could break the cache, leaving it with stale values.
     */
    var CachedFileSystem = /** @class */ (function () {
        function CachedFileSystem(delegate) {
            this.delegate = delegate;
            this.existsCache = new Map();
            this.readFileCache = new Map();
        }
        CachedFileSystem.prototype.exists = function (path) {
            if (!this.existsCache.has(path)) {
                this.existsCache.set(path, this.delegate.exists(path));
            }
            return this.existsCache.get(path);
        };
        CachedFileSystem.prototype.readFile = function (path) {
            if (!this.readFileCache.has(path)) {
                try {
                    if (this.lstat(path).isSymbolicLink()) {
                        // don't cache the value of a symbolic link
                        return this.delegate.readFile(path);
                    }
                    this.readFileCache.set(path, this.delegate.readFile(path));
                }
                catch (e) {
                    this.readFileCache.set(path, e);
                }
            }
            var result = this.readFileCache.get(path);
            if (typeof result === 'string') {
                return result;
            }
            else {
                throw result;
            }
        };
        CachedFileSystem.prototype.writeFile = function (path, data, exclusive) {
            this.delegate.writeFile(path, data, exclusive);
            this.readFileCache.set(path, data);
            this.existsCache.set(path, true);
        };
        CachedFileSystem.prototype.removeFile = function (path) {
            this.delegate.removeFile(path);
            this.readFileCache.delete(path);
            this.existsCache.set(path, false);
        };
        CachedFileSystem.prototype.symlink = function (target, path) {
            this.delegate.symlink(target, path);
            this.existsCache.set(path, true);
        };
        CachedFileSystem.prototype.copyFile = function (from, to) {
            this.delegate.copyFile(from, to);
            this.existsCache.set(to, true);
        };
        CachedFileSystem.prototype.moveFile = function (from, to) {
            this.delegate.moveFile(from, to);
            this.existsCache.set(from, false);
            this.existsCache.set(to, true);
            if (this.readFileCache.has(from)) {
                this.readFileCache.set(to, this.readFileCache.get(from));
                this.readFileCache.delete(from);
            }
            else {
                this.readFileCache.delete(to);
            }
        };
        CachedFileSystem.prototype.ensureDir = function (path) {
            this.delegate.ensureDir(path);
            while (!this.isRoot(path)) {
                this.existsCache.set(path, true);
                path = this.dirname(path);
            }
        };
        CachedFileSystem.prototype.removeDeep = function (path) {
            var e_1, _a, e_2, _b;
            this.delegate.removeDeep(path);
            try {
                // Clear out this directory and all its children from the `exists` cache.
                for (var _c = tslib_1.__values(this.existsCache.keys()), _d = _c.next(); !_d.done; _d = _c.next()) {
                    var p = _d.value;
                    if (p.startsWith(path)) {
                        this.existsCache.set(p, false);
                    }
                }
            }
            catch (e_1_1) { e_1 = { error: e_1_1 }; }
            finally {
                try {
                    if (_d && !_d.done && (_a = _c.return)) _a.call(_c);
                }
                finally { if (e_1) throw e_1.error; }
            }
            try {
                // Clear out this directory and all its children from the `readFile` cache.
                for (var _e = tslib_1.__values(this.readFileCache.keys()), _f = _e.next(); !_f.done; _f = _e.next()) {
                    var p = _f.value;
                    if (p.startsWith(path)) {
                        this.readFileCache.delete(p);
                    }
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_f && !_f.done && (_b = _e.return)) _b.call(_e);
                }
                finally { if (e_2) throw e_2.error; }
            }
        };
        CachedFileSystem.prototype.lstat = function (path) {
            var stat = this.delegate.lstat(path);
            // if the `path` does not exist then `lstat` will thrown an error.
            this.existsCache.set(path, true);
            return stat;
        };
        CachedFileSystem.prototype.stat = function (path) {
            var stat = this.delegate.stat(path);
            // if the `path` does not exist then `stat` will thrown an error.
            this.existsCache.set(path, true);
            return stat;
        };
        // The following methods simply call through to the delegate.
        CachedFileSystem.prototype.readdir = function (path) { return this.delegate.readdir(path); };
        CachedFileSystem.prototype.pwd = function () { return this.delegate.pwd(); };
        CachedFileSystem.prototype.chdir = function (path) { this.delegate.chdir(path); };
        CachedFileSystem.prototype.extname = function (path) { return this.delegate.extname(path); };
        CachedFileSystem.prototype.isCaseSensitive = function () { return this.delegate.isCaseSensitive(); };
        CachedFileSystem.prototype.isRoot = function (path) { return this.delegate.isRoot(path); };
        CachedFileSystem.prototype.isRooted = function (path) { return this.delegate.isRooted(path); };
        CachedFileSystem.prototype.resolve = function () {
            var _a;
            var paths = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                paths[_i] = arguments[_i];
            }
            return (_a = this.delegate).resolve.apply(_a, tslib_1.__spread(paths));
        };
        CachedFileSystem.prototype.dirname = function (file) { return this.delegate.dirname(file); };
        CachedFileSystem.prototype.join = function (basePath) {
            var _a;
            var paths = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                paths[_i - 1] = arguments[_i];
            }
            return (_a = this.delegate).join.apply(_a, tslib_1.__spread([basePath], paths));
        };
        CachedFileSystem.prototype.relative = function (from, to) {
            return this.delegate.relative(from, to);
        };
        CachedFileSystem.prototype.basename = function (filePath, extension) {
            return this.delegate.basename(filePath, extension);
        };
        CachedFileSystem.prototype.realpath = function (filePath) { return this.delegate.realpath(filePath); };
        CachedFileSystem.prototype.getDefaultLibLocation = function () { return this.delegate.getDefaultLibLocation(); };
        CachedFileSystem.prototype.normalize = function (path) { return this.delegate.normalize(path); };
        return CachedFileSystem;
    }());
    exports.CachedFileSystem = CachedFileSystem;
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY2FjaGVkX2ZpbGVfc3lzdGVtLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vLi4vcGFja2FnZXMvY29tcGlsZXItY2xpL3NyYy9uZ3RzYy9maWxlX3N5c3RlbS9zcmMvY2FjaGVkX2ZpbGVfc3lzdGVtLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7OztJQVVBOzs7Ozs7T0FNRztJQUNIO1FBSUUsMEJBQW9CLFFBQW9CO1lBQXBCLGFBQVEsR0FBUixRQUFRLENBQVk7WUFIaEMsZ0JBQVcsR0FBRyxJQUFJLEdBQUcsRUFBMkIsQ0FBQztZQUNqRCxrQkFBYSxHQUFHLElBQUksR0FBRyxFQUF1QixDQUFDO1FBRVosQ0FBQztRQUU1QyxpQ0FBTSxHQUFOLFVBQU8sSUFBb0I7WUFDekIsSUFBSSxDQUFDLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxFQUFFO2dCQUMvQixJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQzthQUN4RDtZQUNELE9BQU8sSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFHLENBQUM7UUFDdEMsQ0FBQztRQUVELG1DQUFRLEdBQVIsVUFBUyxJQUFvQjtZQUMzQixJQUFJLENBQUMsSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ2pDLElBQUk7b0JBQ0YsSUFBSSxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLGNBQWMsRUFBRSxFQUFFO3dCQUNyQywyQ0FBMkM7d0JBQzNDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxDQUFDLENBQUM7cUJBQ3JDO29CQUNELElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsUUFBUSxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2lCQUM1RDtnQkFBQyxPQUFPLENBQUMsRUFBRTtvQkFDVixJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsQ0FBQyxDQUFDLENBQUM7aUJBQ2pDO2FBQ0Y7WUFDRCxJQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM1QyxJQUFJLE9BQU8sTUFBTSxLQUFLLFFBQVEsRUFBRTtnQkFDOUIsT0FBTyxNQUFNLENBQUM7YUFDZjtpQkFBTTtnQkFDTCxNQUFNLE1BQU0sQ0FBQzthQUNkO1FBQ0gsQ0FBQztRQUVELG9DQUFTLEdBQVQsVUFBVSxJQUFvQixFQUFFLElBQVksRUFBRSxTQUFtQjtZQUMvRCxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsSUFBSSxFQUFFLFNBQVMsQ0FBQyxDQUFDO1lBQy9DLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNuQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbkMsQ0FBQztRQUVELHFDQUFVLEdBQVYsVUFBVyxJQUFvQjtZQUM3QixJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUMvQixJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUNoQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7UUFDcEMsQ0FBQztRQUVELGtDQUFPLEdBQVAsVUFBUSxNQUFzQixFQUFFLElBQW9CO1lBQ2xELElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLE1BQU0sRUFBRSxJQUFJLENBQUMsQ0FBQztZQUNwQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDbkMsQ0FBQztRQUVELG1DQUFRLEdBQVIsVUFBUyxJQUFvQixFQUFFLEVBQWtCO1lBQy9DLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztZQUNqQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxFQUFFLEVBQUUsSUFBSSxDQUFDLENBQUM7UUFDakMsQ0FBQztRQUVELG1DQUFRLEdBQVIsVUFBUyxJQUFvQixFQUFFLEVBQWtCO1lBQy9DLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksRUFBRSxFQUFFLENBQUMsQ0FBQztZQUVqQyxJQUFJLENBQUMsV0FBVyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxDQUFDLENBQUM7WUFDbEMsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBRS9CLElBQUksSUFBSSxDQUFDLGFBQWEsQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ2hDLElBQUksQ0FBQyxhQUFhLENBQUMsR0FBRyxDQUFDLEVBQUUsRUFBRSxJQUFJLENBQUMsYUFBYSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDO2dCQUN6RCxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUNqQztpQkFBTTtnQkFDTCxJQUFJLENBQUMsYUFBYSxDQUFDLE1BQU0sQ0FBQyxFQUFFLENBQUMsQ0FBQzthQUMvQjtRQUNILENBQUM7UUFFRCxvQ0FBUyxHQUFULFVBQVUsSUFBb0I7WUFDNUIsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLENBQUM7WUFDOUIsT0FBTyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUU7Z0JBQ3pCLElBQUksQ0FBQyxXQUFXLENBQUMsR0FBRyxDQUFDLElBQUksRUFBRSxJQUFJLENBQUMsQ0FBQztnQkFDakMsSUFBSSxHQUFHLElBQUksQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDM0I7UUFDSCxDQUFDO1FBRUQscUNBQVUsR0FBVixVQUFXLElBQW9COztZQUM3QixJQUFJLENBQUMsUUFBUSxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsQ0FBQzs7Z0JBRS9CLHlFQUF5RTtnQkFDekUsS0FBZ0IsSUFBQSxLQUFBLGlCQUFBLElBQUksQ0FBQyxXQUFXLENBQUMsSUFBSSxFQUFFLENBQUEsZ0JBQUEsNEJBQUU7b0JBQXBDLElBQU0sQ0FBQyxXQUFBO29CQUNWLElBQUksQ0FBQyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRTt3QkFDdEIsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO3FCQUNoQztpQkFDRjs7Ozs7Ozs7OztnQkFFRCwyRUFBMkU7Z0JBQzNFLEtBQWdCLElBQUEsS0FBQSxpQkFBQSxJQUFJLENBQUMsYUFBYSxDQUFDLElBQUksRUFBRSxDQUFBLGdCQUFBLDRCQUFFO29CQUF0QyxJQUFNLENBQUMsV0FBQTtvQkFDVixJQUFJLENBQUMsQ0FBQyxVQUFVLENBQUMsSUFBSSxDQUFDLEVBQUU7d0JBQ3RCLElBQUksQ0FBQyxhQUFhLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO3FCQUM5QjtpQkFDRjs7Ozs7Ozs7O1FBQ0gsQ0FBQztRQUdELGdDQUFLLEdBQUwsVUFBTSxJQUFvQjtZQUN4QixJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN2QyxrRUFBa0U7WUFDbEUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2pDLE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQztRQUVELCtCQUFJLEdBQUosVUFBSyxJQUFvQjtZQUN2QixJQUFNLElBQUksR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUN0QyxpRUFBaUU7WUFDakUsSUFBSSxDQUFDLFdBQVcsQ0FBQyxHQUFHLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxDQUFDO1lBQ2pDLE9BQU8sSUFBSSxDQUFDO1FBQ2QsQ0FBQztRQUVELDZEQUE2RDtRQUM3RCxrQ0FBTyxHQUFQLFVBQVEsSUFBb0IsSUFBbUIsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDcEYsOEJBQUcsR0FBSCxjQUF3QixPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsR0FBRyxFQUFFLENBQUMsQ0FBQyxDQUFDO1FBQ3JELGdDQUFLLEdBQUwsVUFBTSxJQUFvQixJQUFVLElBQUksQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNoRSxrQ0FBTyxHQUFQLFVBQVEsSUFBZ0MsSUFBWSxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN6RiwwQ0FBZSxHQUFmLGNBQTZCLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxlQUFlLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDdEUsaUNBQU0sR0FBTixVQUFPLElBQW9CLElBQWEsT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDNUUsbUNBQVEsR0FBUixVQUFTLElBQVksSUFBYSxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUN4RSxrQ0FBTyxHQUFQOztZQUFRLGVBQWtCO2lCQUFsQixVQUFrQixFQUFsQixxQkFBa0IsRUFBbEIsSUFBa0I7Z0JBQWxCLDBCQUFrQjs7WUFBb0IsT0FBTyxDQUFBLEtBQUEsSUFBSSxDQUFDLFFBQVEsQ0FBQSxDQUFDLE9BQU8sNEJBQUksS0FBSyxHQUFFO1FBQUMsQ0FBQztRQUN2RixrQ0FBTyxHQUFQLFVBQThCLElBQU8sSUFBTyxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUNqRiwrQkFBSSxHQUFKLFVBQTJCLFFBQVc7O1lBQUUsZUFBa0I7aUJBQWxCLFVBQWtCLEVBQWxCLHFCQUFrQixFQUFsQixJQUFrQjtnQkFBbEIsOEJBQWtCOztZQUN4RCxPQUFPLENBQUEsS0FBQSxJQUFJLENBQUMsUUFBUSxDQUFBLENBQUMsSUFBSSw2QkFBQyxRQUFRLEdBQUssS0FBSyxHQUFFO1FBQ2hELENBQUM7UUFDRCxtQ0FBUSxHQUFSLFVBQStCLElBQU8sRUFBRSxFQUFLO1lBQzNDLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsSUFBSSxFQUFFLEVBQUUsQ0FBQyxDQUFDO1FBQzFDLENBQUM7UUFDRCxtQ0FBUSxHQUFSLFVBQVMsUUFBZ0IsRUFBRSxTQUE0QjtZQUNyRCxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLFFBQVEsRUFBRSxTQUFTLENBQUMsQ0FBQztRQUNyRCxDQUFDO1FBQ0QsbUNBQVEsR0FBUixVQUFTLFFBQXdCLElBQW9CLE9BQU8sSUFBSSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO1FBQy9GLGdEQUFxQixHQUFyQixjQUEwQyxPQUFPLElBQUksQ0FBQyxRQUFRLENBQUMscUJBQXFCLEVBQUUsQ0FBQyxDQUFDLENBQUM7UUFDekYsb0NBQVMsR0FBVCxVQUFnQyxJQUFPLElBQU8sT0FBTyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7UUFDdkYsdUJBQUM7SUFBRCxDQUFDLEFBcElELElBb0lDO0lBcElZLDRDQUFnQiIsInNvdXJjZXNDb250ZW50IjpbIi8qKlxuICogQGxpY2Vuc2VcbiAqIENvcHlyaWdodCBHb29nbGUgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuICpcbiAqIFVzZSBvZiB0aGlzIHNvdXJjZSBjb2RlIGlzIGdvdmVybmVkIGJ5IGFuIE1JVC1zdHlsZSBsaWNlbnNlIHRoYXQgY2FuIGJlXG4gKiBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlIGF0IGh0dHBzOi8vYW5ndWxhci5pby9saWNlbnNlXG4gKi9cbmltcG9ydCB7QWJzb2x1dGVGc1BhdGgsIEZpbGVTdGF0cywgRmlsZVN5c3RlbSwgUGF0aFNlZ21lbnQsIFBhdGhTdHJpbmd9IGZyb20gJy4vdHlwZXMnO1xuXG5cbi8qKlxuICogQSB3cmFwcGVyIGFyb3VuZCBgRmlsZVN5c3RlbWAgdGhhdCBjYWNoZXMgaGl0cyB0byBgZXhpc3RzKClgIGFuZFxuICogYHJlYWRGaWxlKClgIHRvIGltcHJvdmUgcGVyZm9ybWFuY2UuXG4gKlxuICogQmUgYXdhcmUgdGhhdCBhbnkgY2hhbmdlcyB0byB0aGUgZmlsZSBzeXN0ZW0gZnJvbSBvdXRzaWRlIG9mIHRoaXNcbiAqIGNsYXNzIGNvdWxkIGJyZWFrIHRoZSBjYWNoZSwgbGVhdmluZyBpdCB3aXRoIHN0YWxlIHZhbHVlcy5cbiAqL1xuZXhwb3J0IGNsYXNzIENhY2hlZEZpbGVTeXN0ZW0gaW1wbGVtZW50cyBGaWxlU3lzdGVtIHtcbiAgcHJpdmF0ZSBleGlzdHNDYWNoZSA9IG5ldyBNYXA8QWJzb2x1dGVGc1BhdGgsIGJvb2xlYW4+KCk7XG4gIHByaXZhdGUgcmVhZEZpbGVDYWNoZSA9IG5ldyBNYXA8QWJzb2x1dGVGc1BhdGgsIGFueT4oKTtcblxuICBjb25zdHJ1Y3Rvcihwcml2YXRlIGRlbGVnYXRlOiBGaWxlU3lzdGVtKSB7fVxuXG4gIGV4aXN0cyhwYXRoOiBBYnNvbHV0ZUZzUGF0aCk6IGJvb2xlYW4ge1xuICAgIGlmICghdGhpcy5leGlzdHNDYWNoZS5oYXMocGF0aCkpIHtcbiAgICAgIHRoaXMuZXhpc3RzQ2FjaGUuc2V0KHBhdGgsIHRoaXMuZGVsZWdhdGUuZXhpc3RzKHBhdGgpKTtcbiAgICB9XG4gICAgcmV0dXJuIHRoaXMuZXhpc3RzQ2FjaGUuZ2V0KHBhdGgpICE7XG4gIH1cblxuICByZWFkRmlsZShwYXRoOiBBYnNvbHV0ZUZzUGF0aCk6IHN0cmluZyB7XG4gICAgaWYgKCF0aGlzLnJlYWRGaWxlQ2FjaGUuaGFzKHBhdGgpKSB7XG4gICAgICB0cnkge1xuICAgICAgICBpZiAodGhpcy5sc3RhdChwYXRoKS5pc1N5bWJvbGljTGluaygpKSB7XG4gICAgICAgICAgLy8gZG9uJ3QgY2FjaGUgdGhlIHZhbHVlIG9mIGEgc3ltYm9saWMgbGlua1xuICAgICAgICAgIHJldHVybiB0aGlzLmRlbGVnYXRlLnJlYWRGaWxlKHBhdGgpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMucmVhZEZpbGVDYWNoZS5zZXQocGF0aCwgdGhpcy5kZWxlZ2F0ZS5yZWFkRmlsZShwYXRoKSk7XG4gICAgICB9IGNhdGNoIChlKSB7XG4gICAgICAgIHRoaXMucmVhZEZpbGVDYWNoZS5zZXQocGF0aCwgZSk7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IHJlc3VsdCA9IHRoaXMucmVhZEZpbGVDYWNoZS5nZXQocGF0aCk7XG4gICAgaWYgKHR5cGVvZiByZXN1bHQgPT09ICdzdHJpbmcnKSB7XG4gICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH0gZWxzZSB7XG4gICAgICB0aHJvdyByZXN1bHQ7XG4gICAgfVxuICB9XG5cbiAgd3JpdGVGaWxlKHBhdGg6IEFic29sdXRlRnNQYXRoLCBkYXRhOiBzdHJpbmcsIGV4Y2x1c2l2ZT86IGJvb2xlYW4pOiB2b2lkIHtcbiAgICB0aGlzLmRlbGVnYXRlLndyaXRlRmlsZShwYXRoLCBkYXRhLCBleGNsdXNpdmUpO1xuICAgIHRoaXMucmVhZEZpbGVDYWNoZS5zZXQocGF0aCwgZGF0YSk7XG4gICAgdGhpcy5leGlzdHNDYWNoZS5zZXQocGF0aCwgdHJ1ZSk7XG4gIH1cblxuICByZW1vdmVGaWxlKHBhdGg6IEFic29sdXRlRnNQYXRoKTogdm9pZCB7XG4gICAgdGhpcy5kZWxlZ2F0ZS5yZW1vdmVGaWxlKHBhdGgpO1xuICAgIHRoaXMucmVhZEZpbGVDYWNoZS5kZWxldGUocGF0aCk7XG4gICAgdGhpcy5leGlzdHNDYWNoZS5zZXQocGF0aCwgZmFsc2UpO1xuICB9XG5cbiAgc3ltbGluayh0YXJnZXQ6IEFic29sdXRlRnNQYXRoLCBwYXRoOiBBYnNvbHV0ZUZzUGF0aCk6IHZvaWQge1xuICAgIHRoaXMuZGVsZWdhdGUuc3ltbGluayh0YXJnZXQsIHBhdGgpO1xuICAgIHRoaXMuZXhpc3RzQ2FjaGUuc2V0KHBhdGgsIHRydWUpO1xuICB9XG5cbiAgY29weUZpbGUoZnJvbTogQWJzb2x1dGVGc1BhdGgsIHRvOiBBYnNvbHV0ZUZzUGF0aCk6IHZvaWQge1xuICAgIHRoaXMuZGVsZWdhdGUuY29weUZpbGUoZnJvbSwgdG8pO1xuICAgIHRoaXMuZXhpc3RzQ2FjaGUuc2V0KHRvLCB0cnVlKTtcbiAgfVxuXG4gIG1vdmVGaWxlKGZyb206IEFic29sdXRlRnNQYXRoLCB0bzogQWJzb2x1dGVGc1BhdGgpOiB2b2lkIHtcbiAgICB0aGlzLmRlbGVnYXRlLm1vdmVGaWxlKGZyb20sIHRvKTtcblxuICAgIHRoaXMuZXhpc3RzQ2FjaGUuc2V0KGZyb20sIGZhbHNlKTtcbiAgICB0aGlzLmV4aXN0c0NhY2hlLnNldCh0bywgdHJ1ZSk7XG5cbiAgICBpZiAodGhpcy5yZWFkRmlsZUNhY2hlLmhhcyhmcm9tKSkge1xuICAgICAgdGhpcy5yZWFkRmlsZUNhY2hlLnNldCh0bywgdGhpcy5yZWFkRmlsZUNhY2hlLmdldChmcm9tKSk7XG4gICAgICB0aGlzLnJlYWRGaWxlQ2FjaGUuZGVsZXRlKGZyb20pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnJlYWRGaWxlQ2FjaGUuZGVsZXRlKHRvKTtcbiAgICB9XG4gIH1cblxuICBlbnN1cmVEaXIocGF0aDogQWJzb2x1dGVGc1BhdGgpOiB2b2lkIHtcbiAgICB0aGlzLmRlbGVnYXRlLmVuc3VyZURpcihwYXRoKTtcbiAgICB3aGlsZSAoIXRoaXMuaXNSb290KHBhdGgpKSB7XG4gICAgICB0aGlzLmV4aXN0c0NhY2hlLnNldChwYXRoLCB0cnVlKTtcbiAgICAgIHBhdGggPSB0aGlzLmRpcm5hbWUocGF0aCk7XG4gICAgfVxuICB9XG5cbiAgcmVtb3ZlRGVlcChwYXRoOiBBYnNvbHV0ZUZzUGF0aCk6IHZvaWQge1xuICAgIHRoaXMuZGVsZWdhdGUucmVtb3ZlRGVlcChwYXRoKTtcblxuICAgIC8vIENsZWFyIG91dCB0aGlzIGRpcmVjdG9yeSBhbmQgYWxsIGl0cyBjaGlsZHJlbiBmcm9tIHRoZSBgZXhpc3RzYCBjYWNoZS5cbiAgICBmb3IgKGNvbnN0IHAgb2YgdGhpcy5leGlzdHNDYWNoZS5rZXlzKCkpIHtcbiAgICAgIGlmIChwLnN0YXJ0c1dpdGgocGF0aCkpIHtcbiAgICAgICAgdGhpcy5leGlzdHNDYWNoZS5zZXQocCwgZmFsc2UpO1xuICAgICAgfVxuICAgIH1cblxuICAgIC8vIENsZWFyIG91dCB0aGlzIGRpcmVjdG9yeSBhbmQgYWxsIGl0cyBjaGlsZHJlbiBmcm9tIHRoZSBgcmVhZEZpbGVgIGNhY2hlLlxuICAgIGZvciAoY29uc3QgcCBvZiB0aGlzLnJlYWRGaWxlQ2FjaGUua2V5cygpKSB7XG4gICAgICBpZiAocC5zdGFydHNXaXRoKHBhdGgpKSB7XG4gICAgICAgIHRoaXMucmVhZEZpbGVDYWNoZS5kZWxldGUocCk7XG4gICAgICB9XG4gICAgfVxuICB9XG5cblxuICBsc3RhdChwYXRoOiBBYnNvbHV0ZUZzUGF0aCk6IEZpbGVTdGF0cyB7XG4gICAgY29uc3Qgc3RhdCA9IHRoaXMuZGVsZWdhdGUubHN0YXQocGF0aCk7XG4gICAgLy8gaWYgdGhlIGBwYXRoYCBkb2VzIG5vdCBleGlzdCB0aGVuIGBsc3RhdGAgd2lsbCB0aHJvd24gYW4gZXJyb3IuXG4gICAgdGhpcy5leGlzdHNDYWNoZS5zZXQocGF0aCwgdHJ1ZSk7XG4gICAgcmV0dXJuIHN0YXQ7XG4gIH1cblxuICBzdGF0KHBhdGg6IEFic29sdXRlRnNQYXRoKTogRmlsZVN0YXRzIHtcbiAgICBjb25zdCBzdGF0ID0gdGhpcy5kZWxlZ2F0ZS5zdGF0KHBhdGgpO1xuICAgIC8vIGlmIHRoZSBgcGF0aGAgZG9lcyBub3QgZXhpc3QgdGhlbiBgc3RhdGAgd2lsbCB0aHJvd24gYW4gZXJyb3IuXG4gICAgdGhpcy5leGlzdHNDYWNoZS5zZXQocGF0aCwgdHJ1ZSk7XG4gICAgcmV0dXJuIHN0YXQ7XG4gIH1cblxuICAvLyBUaGUgZm9sbG93aW5nIG1ldGhvZHMgc2ltcGx5IGNhbGwgdGhyb3VnaCB0byB0aGUgZGVsZWdhdGUuXG4gIHJlYWRkaXIocGF0aDogQWJzb2x1dGVGc1BhdGgpOiBQYXRoU2VnbWVudFtdIHsgcmV0dXJuIHRoaXMuZGVsZWdhdGUucmVhZGRpcihwYXRoKTsgfVxuICBwd2QoKTogQWJzb2x1dGVGc1BhdGggeyByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5wd2QoKTsgfVxuICBjaGRpcihwYXRoOiBBYnNvbHV0ZUZzUGF0aCk6IHZvaWQgeyB0aGlzLmRlbGVnYXRlLmNoZGlyKHBhdGgpOyB9XG4gIGV4dG5hbWUocGF0aDogQWJzb2x1dGVGc1BhdGh8UGF0aFNlZ21lbnQpOiBzdHJpbmcgeyByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5leHRuYW1lKHBhdGgpOyB9XG4gIGlzQ2FzZVNlbnNpdGl2ZSgpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuZGVsZWdhdGUuaXNDYXNlU2Vuc2l0aXZlKCk7IH1cbiAgaXNSb290KHBhdGg6IEFic29sdXRlRnNQYXRoKTogYm9vbGVhbiB7IHJldHVybiB0aGlzLmRlbGVnYXRlLmlzUm9vdChwYXRoKTsgfVxuICBpc1Jvb3RlZChwYXRoOiBzdHJpbmcpOiBib29sZWFuIHsgcmV0dXJuIHRoaXMuZGVsZWdhdGUuaXNSb290ZWQocGF0aCk7IH1cbiAgcmVzb2x2ZSguLi5wYXRoczogc3RyaW5nW10pOiBBYnNvbHV0ZUZzUGF0aCB7IHJldHVybiB0aGlzLmRlbGVnYXRlLnJlc29sdmUoLi4ucGF0aHMpOyB9XG4gIGRpcm5hbWU8VCBleHRlbmRzIFBhdGhTdHJpbmc+KGZpbGU6IFQpOiBUIHsgcmV0dXJuIHRoaXMuZGVsZWdhdGUuZGlybmFtZShmaWxlKTsgfVxuICBqb2luPFQgZXh0ZW5kcyBQYXRoU3RyaW5nPihiYXNlUGF0aDogVCwgLi4ucGF0aHM6IHN0cmluZ1tdKTogVCB7XG4gICAgcmV0dXJuIHRoaXMuZGVsZWdhdGUuam9pbihiYXNlUGF0aCwgLi4ucGF0aHMpO1xuICB9XG4gIHJlbGF0aXZlPFQgZXh0ZW5kcyBQYXRoU3RyaW5nPihmcm9tOiBULCB0bzogVCk6IFBhdGhTZWdtZW50IHtcbiAgICByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5yZWxhdGl2ZShmcm9tLCB0byk7XG4gIH1cbiAgYmFzZW5hbWUoZmlsZVBhdGg6IHN0cmluZywgZXh0ZW5zaW9uPzogc3RyaW5nfHVuZGVmaW5lZCk6IFBhdGhTZWdtZW50IHtcbiAgICByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5iYXNlbmFtZShmaWxlUGF0aCwgZXh0ZW5zaW9uKTtcbiAgfVxuICByZWFscGF0aChmaWxlUGF0aDogQWJzb2x1dGVGc1BhdGgpOiBBYnNvbHV0ZUZzUGF0aCB7IHJldHVybiB0aGlzLmRlbGVnYXRlLnJlYWxwYXRoKGZpbGVQYXRoKTsgfVxuICBnZXREZWZhdWx0TGliTG9jYXRpb24oKTogQWJzb2x1dGVGc1BhdGggeyByZXR1cm4gdGhpcy5kZWxlZ2F0ZS5nZXREZWZhdWx0TGliTG9jYXRpb24oKTsgfVxuICBub3JtYWxpemU8VCBleHRlbmRzIFBhdGhTdHJpbmc+KHBhdGg6IFQpOiBUIHsgcmV0dXJuIHRoaXMuZGVsZWdhdGUubm9ybWFsaXplKHBhdGgpOyB9XG59XG4iXX0=
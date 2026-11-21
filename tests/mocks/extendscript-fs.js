/* ExtendScript File / Folder mock backed by the real file system (Node fs).
 * Used to exercise Store.FileAdapter (atomic save, backup, recovery). */
'use strict';
const fs = require('fs');
const path = require('path');

function install(sandbox, root) {
  fs.mkdirSync(root, { recursive: true });
  class Folder {
    constructor(p) { this.fullName = String(p); this.fsName = this.fullName; this.name = path.basename(this.fullName); }
    get exists() { return fs.existsSync(this.fullName) && fs.statSync(this.fullName).isDirectory(); }
    create() { try { fs.mkdirSync(this.fullName, { recursive: true }); return true; } catch (e) { return false; } }
    execute() { return true; }
  }
  Folder.userData = new Folder(root);
  Folder.temp = new Folder(root);
  class File {
    constructor(p) { this.fullName = String(p); this.fsName = this.fullName; this.name = path.basename(this.fullName); this.encoding = 'UTF-8'; this._mode = null; this._buf = ''; }
    get exists() { return fs.existsSync(this.fullName) && fs.statSync(this.fullName).isFile(); }
    get length() { return this.exists ? fs.statSync(this.fullName).size : 0; }
    open(mode) {
      if (File.readOnly && mode !== 'r') { return false; }
      if (mode === 'r' && !this.exists) { return false; }
      this._mode = mode; this._buf = mode === 'r' ? fs.readFileSync(this.fullName, 'utf8') : ''; return true;
    }
    read() { return this._buf; }
    write(t) { if (File.failWrite) { return false; } this._buf += String(t); return true; }
    close() { if (this._mode === 'w') { fs.writeFileSync(this.fullName, this._buf, 'utf8'); } this._mode = null; return true; }
    remove() { try { fs.unlinkSync(this.fullName); return true; } catch (e) { return false; } }
    copy(to) { try { fs.copyFileSync(this.fullName, String(to)); return true; } catch (e) { return false; } }
    rename(n) { try { fs.renameSync(this.fullName, path.join(path.dirname(this.fullName), n)); return true; } catch (e) { return false; } }
  }
  sandbox.File = File;
  sandbox.Folder = Folder;
  return { File, Folder };
}
module.exports = { install };

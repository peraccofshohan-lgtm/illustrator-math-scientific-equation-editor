/* ==========================================================================
 * Module 99 - Footer: public surface + entry point
 * ========================================================================== */
MSEE.U = U; MSEE.JSONX = JSONX; MSEE.Errors = Errors; MSEE.ErrorKind = ErrorKind; MSEE.MathError = MathError; MSEE.Log = Log;
MSEE.MathData = MathData; MSEE.Symbols = Symbols; MSEE.Elements = Elements; MSEE.AST = AST; MSEE.Lexer = Lexer;
MSEE.Parser = Parser; MSEE.Serializer = Serializer; MSEE.Semantics = Semantics; MSEE.Editor = Editor; MSEE.Chem = Chem;
if (typeof Layout !== 'undefined') { MSEE.Layout = Layout; }
if (typeof Fonts !== 'undefined') { MSEE.Fonts = Fonts; }
if (typeof Formatting !== 'undefined') { MSEE.Formatting = Formatting; }
if (typeof Renderer !== 'undefined') { MSEE.Renderer = Renderer; }
if (typeof Templates !== 'undefined') { MSEE.Templates = Templates; }
if (typeof Store !== 'undefined') { MSEE.Store = Store; }
if (typeof History !== 'undefined') { MSEE.History = History; }
if (typeof Model !== 'undefined') { MSEE.Model = Model; }
if (typeof PreviewRenderer !== 'undefined') { MSEE.PreviewRenderer = PreviewRenderer; }
if (typeof UI !== 'undefined') { MSEE.UI = UI; }

if (MSEE.TEST_MODE) {
    GLOBAL.MSEE = MSEE;
} else if (typeof UI !== 'undefined') {
    UI.launch();
}

}(this));

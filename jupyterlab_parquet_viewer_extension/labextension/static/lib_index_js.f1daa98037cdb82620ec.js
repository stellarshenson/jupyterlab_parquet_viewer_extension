"use strict";
(self["webpackChunkjupyterlab_parquet_viewer_extension"] = self["webpackChunkjupyterlab_parquet_viewer_extension"] || []).push([["lib_index_js"],{

/***/ "./lib/document.js":
/*!*************************!*\
  !*** ./lib/document.js ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ParquetDocument: () => (/* binding */ ParquetDocument)
/* harmony export */ });
/* harmony import */ var _jupyterlab_docregistry__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/docregistry */ "webpack/sharing/consume/default/@jupyterlab/docregistry");
/* harmony import */ var _jupyterlab_docregistry__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_docregistry__WEBPACK_IMPORTED_MODULE_0__);

/**
 * A document widget for Parquet files
 */
class ParquetDocument extends _jupyterlab_docregistry__WEBPACK_IMPORTED_MODULE_0__.DocumentWidget {
    constructor(options) {
        super(options);
    }
}


/***/ }),

/***/ "./lib/index.js":
/*!**********************!*\
  !*** ./lib/index.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/* harmony import */ var _jupyterlab_docregistry__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/docregistry */ "webpack/sharing/consume/default/@jupyterlab/docregistry");
/* harmony import */ var _jupyterlab_docregistry__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_docregistry__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _widget__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./widget */ "./lib/widget.js");
/* harmony import */ var _document__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./document */ "./lib/document.js");



/**
 * A widget factory for Parquet files
 */
class ParquetWidgetFactory extends _jupyterlab_docregistry__WEBPACK_IMPORTED_MODULE_0__.ABCWidgetFactory {
    /**
     * Create a new widget given a context
     */
    createNewWidget(context) {
        const content = new _widget__WEBPACK_IMPORTED_MODULE_1__.ParquetViewer(context.path);
        const widget = new _document__WEBPACK_IMPORTED_MODULE_2__.ParquetDocument({ content, context });
        widget.title.label = context.path.split('/').pop() || 'Parquet File';
        return widget;
    }
}
/**
 * Initialization data for the jupyterlab_parquet_viewer_extension extension.
 */
const plugin = {
    id: 'jupyterlab_parquet_viewer_extension:plugin',
    description: 'Jupyterlab extension to allow simple browsing of the parquet files with basic data filtering capabilities',
    autoStart: true,
    requires: [],
    activate: (app) => {
        console.log('JupyterLab extension jupyterlab_parquet_viewer_extension is activated!');
        const { docRegistry } = app;
        // Register the file type - mark as binary to prevent text loading
        try {
            docRegistry.addFileType({
                name: 'parquet',
                displayName: 'Parquet',
                extensions: ['.parquet'],
                mimeTypes: ['application/x-parquet'],
                iconClass: 'jp-MaterialIcon jp-SpreadsheetIcon',
                contentType: 'file',
                fileFormat: 'base64'
            });
            console.log('Parquet file type registered with base64 format');
        }
        catch (e) {
            console.warn('Parquet file type already registered', e);
        }
        // Create widget factory - use base64 model to handle binary files
        const factory = new ParquetWidgetFactory({
            name: 'Parquet Viewer',
            modelName: 'base64',
            fileTypes: ['parquet'],
            defaultFor: ['parquet'],
            defaultRendered: ['parquet'],
            readOnly: true
        });
        // Register the factory
        docRegistry.addWidgetFactory(factory);
        console.log('Parquet viewer factory registered with base64 model');
    }
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (plugin);


/***/ }),

/***/ "./lib/request.js":
/*!************************!*\
  !*** ./lib/request.js ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   requestAPI: () => (/* binding */ requestAPI)
/* harmony export */ });
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/coreutils */ "webpack/sharing/consume/default/@jupyterlab/coreutils");
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/services */ "webpack/sharing/consume/default/@jupyterlab/services");
/* harmony import */ var _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__);


/**
 * Call the server extension
 *
 * @param endPoint API REST end point for the extension
 * @param init Initial values for the request
 * @returns The response body interpreted as JSON
 */
async function requestAPI(endPoint = '', init = {}) {
    // Make request to Jupyter API
    const settings = _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__.ServerConnection.makeSettings();
    const requestUrl = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_0__.URLExt.join(settings.baseUrl, 'jupyterlab-parquet-viewer-extension', // our server extension's API namespace
    endPoint);
    let response;
    try {
        response = await _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__.ServerConnection.makeRequest(requestUrl, init, settings);
    }
    catch (error) {
        throw new _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__.ServerConnection.NetworkError(error);
    }
    let data = await response.text();
    if (data.length > 0) {
        try {
            data = JSON.parse(data);
        }
        catch (error) {
            console.log('Not a JSON response body.', response);
        }
    }
    if (!response.ok) {
        throw new _jupyterlab_services__WEBPACK_IMPORTED_MODULE_1__.ServerConnection.ResponseError(response, data.message || data);
    }
    return data;
}


/***/ }),

/***/ "./lib/widget.js":
/*!***********************!*\
  !*** ./lib/widget.js ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   ParquetViewer: () => (/* binding */ ParquetViewer)
/* harmony export */ });
/* harmony import */ var _lumino_widgets__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @lumino/widgets */ "webpack/sharing/consume/default/@lumino/widgets");
/* harmony import */ var _lumino_widgets__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_lumino_widgets__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _request__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./request */ "./lib/request.js");


/**
 * Parquet viewer widget
 */
class ParquetViewer extends _lumino_widgets__WEBPACK_IMPORTED_MODULE_0__.Widget {
    constructor(filePath) {
        super();
        this._columns = [];
        this._data = [];
        this._totalRows = 0;
        this._currentOffset = 0;
        this._limit = 500;
        this._loading = false;
        this._hasMore = true;
        this._filters = {};
        this._filePath = filePath;
        this.addClass('jp-ParquetViewer');
        // Create main container
        this._tableContainer = document.createElement('div');
        this._tableContainer.className = 'jp-ParquetViewer-container';
        // Create table
        this._table = document.createElement('table');
        this._table.className = 'jp-ParquetViewer-table';
        this._thead = document.createElement('thead');
        this._thead.className = 'jp-ParquetViewer-thead';
        this._tbody = document.createElement('tbody');
        this._tbody.className = 'jp-ParquetViewer-tbody';
        // Create filter row
        this._filterRow = document.createElement('tr');
        this._filterRow.className = 'jp-ParquetViewer-filterRow';
        // Create header row
        this._headerRow = document.createElement('tr');
        this._headerRow.className = 'jp-ParquetViewer-headerRow';
        this._thead.appendChild(this._filterRow);
        this._thead.appendChild(this._headerRow);
        this._table.appendChild(this._thead);
        this._table.appendChild(this._tbody);
        this._tableContainer.appendChild(this._table);
        // Create status bar
        this._statusBar = document.createElement('div');
        this._statusBar.className = 'jp-ParquetViewer-statusBar';
        this._tableContainer.appendChild(this._statusBar);
        this.node.appendChild(this._tableContainer);
        // Set up scroll listener for progressive loading
        this._tableContainer.addEventListener('scroll', () => {
            this._onScroll();
        });
        // Initialize
        this._initialize();
    }
    /**
     * Initialize the viewer by loading metadata and initial data
     */
    async _initialize() {
        try {
            await this._loadMetadata();
            await this._loadData(true);
        }
        catch (error) {
            this._showError(`Failed to load file: ${error}`);
        }
    }
    /**
     * Load file metadata (columns, types, row count)
     */
    async _loadMetadata() {
        const response = await (0,_request__WEBPACK_IMPORTED_MODULE_1__.requestAPI)('metadata', {
            method: 'POST',
            body: JSON.stringify({ path: this._filePath })
        });
        this._columns = response.columns;
        this._totalRows = response.totalRows;
        this._renderHeaders();
    }
    /**
     * Load data from server
     */
    async _loadData(reset = false) {
        if (this._loading) {
            return;
        }
        this._loading = true;
        this._updateStatusBar('Loading...');
        try {
            if (reset) {
                this._currentOffset = 0;
                this._data = [];
                this._tbody.innerHTML = '';
            }
            const response = await (0,_request__WEBPACK_IMPORTED_MODULE_1__.requestAPI)('data', {
                method: 'POST',
                body: JSON.stringify({
                    path: this._filePath,
                    offset: this._currentOffset,
                    limit: this._limit,
                    filters: this._filters
                })
            });
            this._data = this._data.concat(response.data);
            this._hasMore = response.hasMore;
            this._currentOffset += response.data.length;
            if (reset) {
                this._totalRows = response.totalRows;
            }
            this._renderData(response.data);
            this._updateStatusBar();
        }
        catch (error) {
            this._showError(`Failed to load data: ${error}`);
        }
        finally {
            this._loading = false;
        }
    }
    /**
     * Render table headers with filter inputs
     */
    _renderHeaders() {
        this._filterRow.innerHTML = '';
        this._headerRow.innerHTML = '';
        this._columns.forEach(col => {
            // Create filter cell
            const filterCell = document.createElement('th');
            filterCell.className = 'jp-ParquetViewer-filterCell';
            const filterInput = document.createElement('input');
            filterInput.type = 'text';
            filterInput.className = 'jp-ParquetViewer-filterInput';
            filterInput.placeholder = this._getFilterPlaceholder(col.type);
            filterInput.dataset.columnName = col.name;
            filterInput.dataset.columnType = col.type;
            filterInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') {
                    this._applyFilter(col.name, filterInput.value, col.type);
                }
            });
            filterCell.appendChild(filterInput);
            this._filterRow.appendChild(filterCell);
            // Create header cell with column name and type
            const headerCell = document.createElement('th');
            headerCell.className = 'jp-ParquetViewer-headerCell';
            const nameSpan = document.createElement('div');
            nameSpan.className = 'jp-ParquetViewer-columnName';
            nameSpan.textContent = col.name;
            const typeSpan = document.createElement('div');
            typeSpan.className = 'jp-ParquetViewer-columnType';
            typeSpan.textContent = col.type;
            headerCell.appendChild(nameSpan);
            headerCell.appendChild(typeSpan);
            this._headerRow.appendChild(headerCell);
        });
    }
    /**
     * Render data rows
     */
    _renderData(rows) {
        rows.forEach(row => {
            const tr = document.createElement('tr');
            tr.className = 'jp-ParquetViewer-row';
            this._columns.forEach(col => {
                const td = document.createElement('td');
                td.className = 'jp-ParquetViewer-cell';
                const value = row[col.name];
                td.textContent = value !== null && value !== undefined ? String(value) : '';
                tr.appendChild(td);
            });
            this._tbody.appendChild(tr);
        });
    }
    /**
     * Apply filter to a column
     */
    _applyFilter(columnName, value, columnType) {
        if (!value.trim()) {
            // Remove filter if empty
            delete this._filters[columnName];
        }
        else {
            const isNumeric = this._isNumericType(columnType);
            if (isNumeric) {
                // Parse numerical filter with operator
                const match = value.match(/^([><=]+)?\s*(.+)$/);
                if (match) {
                    const operator = match[1] || '=';
                    const numValue = match[2].trim();
                    this._filters[columnName] = {
                        type: 'number',
                        value: numValue,
                        operator: operator
                    };
                }
            }
            else {
                // Text filter
                this._filters[columnName] = {
                    type: 'text',
                    value: value
                };
            }
        }
        // Reload data with filters
        this._loadData(true);
    }
    /**
     * Check if column type is numeric
     */
    _isNumericType(type) {
        const numericTypes = ['int', 'float', 'double', 'decimal', 'int8', 'int16', 'int32', 'int64', 'uint8', 'uint16', 'uint32', 'uint64'];
        return numericTypes.some(t => type.toLowerCase().includes(t));
    }
    /**
     * Get filter placeholder based on column type
     */
    _getFilterPlaceholder(type) {
        if (this._isNumericType(type)) {
            return '=, >, <, >=, <=';
        }
        return 'Filter text...';
    }
    /**
     * Handle scroll event for progressive loading
     */
    _onScroll() {
        const container = this._tableContainer;
        const scrollPosition = container.scrollTop + container.clientHeight;
        const scrollHeight = container.scrollHeight;
        // Load more when scrolled to within 200px of bottom
        if (scrollPosition >= scrollHeight - 200 && this._hasMore && !this._loading) {
            this._loadData(false);
        }
    }
    /**
     * Update status bar
     */
    _updateStatusBar(message) {
        if (message) {
            this._statusBar.textContent = message;
        }
        else {
            const filterCount = Object.keys(this._filters).length;
            const filterText = filterCount > 0 ? ` (${filterCount} filter${filterCount > 1 ? 's' : ''} active)` : '';
            this._statusBar.textContent = `Showing ${this._data.length} of ${this._totalRows} rows${filterText}`;
        }
    }
    /**
     * Show error message
     */
    _showError(message) {
        this._tbody.innerHTML = '';
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        td.colSpan = this._columns.length || 1;
        td.className = 'jp-ParquetViewer-error';
        td.textContent = message;
        tr.appendChild(td);
        this._tbody.appendChild(tr);
    }
    /**
     * Dispose of the widget
     */
    dispose() {
        this._tableContainer.removeEventListener('scroll', this._onScroll);
        super.dispose();
    }
}


/***/ })

}]);
//# sourceMappingURL=lib_index_js.f1daa98037cdb82620ec.js.map